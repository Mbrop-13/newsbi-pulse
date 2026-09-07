import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function requireAdmin() {
  const supabaseServer = await createClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };

  const serviceClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: adminCheck } = await serviceClient
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminCheck || adminCheck.role !== "admin") {
    return { error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) };
  }

  return { serviceClient, user };
}

/** Lista todos los usuarios de Auth (paginado). */
async function listAllAuthUsers(serviceClient: ReturnType<typeof createSupabaseClient>) {
  const all: any[] = [];
  let page = 1;
  const perPage = 200;
  // Tope de seguridad: 50 páginas × 200 = 10k usuarios
  while (page <= 50) {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error("Error fetching users from Auth: " + error.message);
    const batch = data?.users || [];
    all.push(...batch);
    if (batch.length < perPage) break;
    page++;
  }
  return all;
}

function dayKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth && auth.error) return auth.error;
    const serviceClient = auth.serviceClient!;

    const url = new URL(req.url);
    const includeAnalytics = url.searchParams.get("analytics") !== "0";

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const sevenDaysAgo = new Date(now - 7 * dayMs).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * dayMs).toISOString();
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";

    // Helper: query opcional (tabla puede no existir)
    const safeSelect = async <T,>(fn: () => PromiseLike<{ data: T | null; error: any }>): Promise<T | null> => {
      try {
        const { data, error } = await fn();
        if (error) {
          console.warn("[admin/users] optional query:", error.message);
          return null;
        }
        return data;
      } catch (e: any) {
        console.warn("[admin/users] optional query failed:", e?.message);
        return null;
      }
    };

    // ── Auth users + tables (opcionales en paralelo) ──
    const authUsers = await listAllAuthUsers(serviceClient);

    const [
      subscriptions,
      adminUsers,
      monthlyUsage,
      lifetimeUsage,
      weeklyLogs,
      openTickets,
      orgMembers,
    ] = await Promise.all([
      safeSelect(() => serviceClient.from("subscriptions").select("*")),
      safeSelect(() => serviceClient.from("admin_users").select("*")),
      safeSelect(() =>
        serviceClient
          .from("monthly_usage")
          .select("user_id, ai_tokens, ai_messages, tts_audios")
          .eq("month", currentMonth)
      ),
      safeSelect(() =>
        serviceClient.from("lifetime_usage").select("user_id, ai_tokens_total")
      ),
      safeSelect(() =>
        serviceClient
          .from("token_usage_logs")
          .select("user_id, tokens, created_at")
          .gte("created_at", sevenDaysAgo)
      ),
      safeSelect(() =>
        serviceClient
          .from("support_tickets")
          .select("user_id, status, id")
          .in("status", ["open", "pending", "in_progress", "waiting"])
      ),
      safeSelect(() =>
        serviceClient
          .from("organization_members")
          .select("user_id, organization_id, role, status")
          .eq("status", "active")
      ),
    ]);

    const subByUser = new Map((subscriptions || []).map((s: any) => [s.user_id, s]));
    const adminByUser = new Map((adminUsers || []).map((a: any) => [a.user_id, a]));
    const monthlyByUser = new Map((monthlyUsage || []).map((m: any) => [m.user_id, m]));
    const lifetimeByUser = new Map((lifetimeUsage || []).map((l: any) => [l.user_id, l]));
    const orgByUser = new Map<string, { organization_id: string; role: string }>();
    for (const m of orgMembers || []) {
      if (!orgByUser.has(m.user_id)) {
        orgByUser.set(m.user_id, { organization_id: m.organization_id, role: m.role });
      }
    }

    // Tokens semanales por usuario
    const weeklyTokensByUser = new Map<string, number>();
    for (const log of weeklyLogs || []) {
      const uid = log.user_id as string;
      weeklyTokensByUser.set(uid, (weeklyTokensByUser.get(uid) || 0) + (log.tokens || 0));
    }

    // Tickets abiertos por usuario
    const openTicketsByUser = new Map<string, number>();
    for (const t of openTickets || []) {
      openTicketsByUser.set(t.user_id, (openTicketsByUser.get(t.user_id) || 0) + 1);
    }

    const enrichedUsers = authUsers.map((u) => {
      const sub = subByUser.get(u.id);
      const adm = adminByUser.get(u.id);
      const monthly = monthlyByUser.get(u.id);
      const lifetime = lifetimeByUser.get(u.id);
      const isAdmin = adm?.role === "admin";
      const plan = isAdmin ? "admin" : sub?.tier || "free";
      const lastSignIn = u.last_sign_in_at || null;
      const lastSignInMs = lastSignIn ? new Date(lastSignIn).getTime() : 0;
      const createdMs = new Date(u.created_at).getTime();

      const daysSinceSignIn = lastSignInMs
        ? Math.floor((now - lastSignInMs) / dayMs)
        : null;
      const daysSinceSignup = Math.floor((now - createdMs) / dayMs);

      let activity: "active" | "warm" | "cold" | "never" = "never";
      if (lastSignInMs) {
        if (daysSinceSignIn! <= 7) activity = "active";
        else if (daysSinceSignIn! <= 30) activity = "warm";
        else activity = "cold";
      }

      const monthlyTokens = Number(monthly?.ai_tokens) || 0;
      const lifetimeTokens = Number(lifetime?.ai_tokens_total) || 0;
      const weeklyTokens = weeklyTokensByUser.get(u.id) || 0;
      return {
        id: u.id,
        email: u.email || "",
        name: u.user_metadata?.full_name || u.user_metadata?.name || "Sin nombre",
        avatar: u.user_metadata?.avatar_url || null,
        provider:
          u.app_metadata?.provider ||
          (Array.isArray(u.identities) && u.identities[0]?.provider) ||
          "email",
        createdAt: u.created_at,
        lastSignIn,
        emailConfirmed: !!u.email_confirmed_at,
        plan,
        subStatus: sub?.status || "none",
        periodEnd: sub?.current_period_end || null,
        isAdmin,
        activity,
        daysSinceSignIn,
        daysSinceSignup,
        usage: {
          monthlyTokens,
          lifetimeTokens,
          weeklyTokens,
          aiMessages: Number(monthly?.ai_messages) || 0,
        },
        openTickets: openTicketsByUser.get(u.id) || 0,
        org: orgByUser.get(u.id) || null,
      };
    });

    enrichedUsers.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // ── Analytics agregados ──
    let analytics: Record<string, unknown> | null = null;
    if (includeAnalytics) {
      const payingPlans = new Set(["pro", "max", "ultra", "ultra_x20"]);
      const signups7d = enrichedUsers.filter((u) => u.daysSinceSignup <= 7).length;
      const signups30d = enrichedUsers.filter((u) => u.daysSinceSignup <= 30).length;
      const active7d = enrichedUsers.filter((u) => u.activity === "active").length;
      const warm30d = enrichedUsers.filter((u) => u.activity === "warm").length;
      const cold = enrichedUsers.filter((u) => u.activity === "cold").length;
      const never = enrichedUsers.filter((u) => u.activity === "never").length;
      const paying = enrichedUsers.filter(
        (u) => payingPlans.has(u.plan) && !u.isAdmin
      );
      const free = enrichedUsers.filter((u) => u.plan === "free" && !u.isAdmin);

      const byPlan: Record<string, number> = {
        free: 0,
        pro: 0,
        max: 0,
        ultra: 0,
        ultra_x20: 0,
        admin: 0,
      };
      for (const u of enrichedUsers) {
        const key = byPlan[u.plan] !== undefined ? u.plan : "free";
        byPlan[key] = (byPlan[key] || 0) + 1;
      }

      // Signups por día (14 días)
      const signupsByDay: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * dayMs);
        signupsByDay[d.toISOString().slice(0, 10)] = 0;
      }
      for (const u of enrichedUsers) {
        const k = dayKey(u.createdAt);
        if (k && signupsByDay[k] !== undefined) signupsByDay[k]++;
      }

      // Active logins por día (aproximado: last_sign_in en ese día — subestima, útil como señal)
      const loginsByDay: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * dayMs);
        loginsByDay[d.toISOString().slice(0, 10)] = 0;
      }
      for (const u of enrichedUsers) {
        const k = dayKey(u.lastSignIn);
        if (k && loginsByDay[k] !== undefined) loginsByDay[k]++;
      }

      const totalWeeklyTokens = enrichedUsers.reduce(
        (s, u) => s + u.usage.weeklyTokens,
        0
      );
      const totalMonthlyTokens = enrichedUsers.reduce(
        (s, u) => s + u.usage.monthlyTokens,
        0
      );
      const totalLifetimeTokens = enrichedUsers.reduce(
        (s, u) => s + u.usage.lifetimeTokens,
        0
      );

      // Top consumidores (semana / mes / lifetime free)
      const topWeekly = [...enrichedUsers]
        .filter((u) => u.usage.weeklyTokens > 0)
        .sort((a, b) => b.usage.weeklyTokens - a.usage.weeklyTokens)
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          plan: u.plan,
          tokens: u.usage.weeklyTokens,
        }));

      const topMonthly = [...enrichedUsers]
        .filter((u) => u.usage.monthlyTokens > 0 || u.usage.lifetimeTokens > 0)
        .sort(
          (a, b) =>
            Math.max(b.usage.monthlyTokens, b.usage.lifetimeTokens) -
            Math.max(a.usage.monthlyTokens, a.usage.lifetimeTokens)
        )
        .slice(0, 10)
        .map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          plan: u.plan,
          tokens: Math.max(u.usage.monthlyTokens, u.usage.lifetimeTokens),
          weeklyTokens: u.usage.weeklyTokens,
        }));

      const recentSignups = enrichedUsers.slice(0, 12).map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        plan: u.plan,
        createdAt: u.createdAt,
        lastSignIn: u.lastSignIn,
        activity: u.activity,
        provider: u.provider,
      }));

      // Churn-ish: paid canceled/expired
      const canceledSubs = (subscriptions || []).filter((s: any) =>
        ["canceled", "expired", "past_due"].includes(s.status)
      );

      const conversionRate =
        free.length + paying.length > 0
          ? (paying.length / (free.length + paying.length)) * 100
          : 0;

      analytics = {
        totals: {
          users: enrichedUsers.length,
          free: free.length,
          paying: paying.length,
          admins: enrichedUsers.filter((u) => u.isAdmin).length,
          signups7d,
          signups30d,
          active7d,
          warm30d,
          cold,
          never,
          openTickets: openTickets?.length || 0,
          conversionRate: Math.round(conversionRate * 100) / 100,
          canceledOrPastDue: canceledSubs.length,
        },
        byPlan,
        signupsByDay,
        loginsByDay,
        tokens: {
          weekly: totalWeeklyTokens,
          monthly: totalMonthlyTokens,
          lifetime: totalLifetimeTokens,
        },
        topWeekly,
        topMonthly,
        recentSignups,
      };
    }

    return NextResponse.json({ users: enrichedUsers, analytics });
  } catch (error: any) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
