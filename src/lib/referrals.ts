import { createServiceClient } from "@/lib/supabase";
import type { PlanTier } from "@/lib/plan-limits";
import { BASE_REWARD_DAYS, REFERRAL_MILESTONES } from "@/lib/referral-config";
export { BASE_REWARD_DAYS, REFERRAL_MILESTONES } from "@/lib/referral-config";

/**
 * Programa de Referidos — helpers de servidor.
 * Todo se ejecuta con el service-role client (bypassa RLS) desde endpoints
 * de servidor / webhook. Idempotente: seguro de llamar repetidas veces.
 *
 * Mecánica gamificada: cada referido que PAGA otorga +BASE_REWARD_DAYS,
 * y al cruzar ciertos umbrales (milestones) se otorgan días extra + badge.
 */

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L

function generateCode(len = 7): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

export interface ReferralStats {
  code: string;
  invited: number; // total de referidos (cualificados + pendientes)
  qualified: number; // pagaron
  pending: number; // se registraron pero no han pagado
  daysEarned: number; // suma de días de recompensa
  currentMilestone: { threshold: number; days: number; badge: string } | null;
  nextMilestone: { threshold: number; days: number; badge: string } | null;
  progress: number; // qualified actuales hacia el siguiente milestone
  badges: string[];
  referrals: {
    id: string;
    label: string; // email enmascarado
    status: "pending" | "qualified";
    signupAt: string | null;
    qualifiedAt: string | null;
  }[];
}

/** Enmascara un email: "ana@x.com" -> "a***@x.com". */
function maskEmail(email: string | null | undefined): string {
  if (!email) return "Usuario";
  const [name, domain] = email.split("@");
  if (!domain) return email.slice(0, 1) + "***";
  const first = name.slice(0, 1);
  return `${first}${"*".repeat(Math.max(2, name.length - 1))}@${domain}`;
}

/**
 * Devuelve (o crea) el código de referido del usuario.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const sb = createServiceClient();

  const { data: existing } = await sb
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.code) return existing.code;

  // Genera uno único (reintenta si colisiona).
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const { error } = await sb
      .from("referral_codes")
      .upsert({ user_id: userId, code }, { onConflict: "user_id" });
    if (!error) return code;
    if (error && !String(error.message).toLowerCase().includes("unique")) {
      console.error("[referrals] create code error:", error.message);
      break;
    }
  }
  // Fallback: leer de nuevo (otra request pudo insertarlo).
  const { data: retry } = await sb
    .from("referral_codes")
    .select("code")
    .eq("user_id", userId)
    .maybeSingle();
  return retry?.code || "";
}

/**
 * Estadísticas completas para la página /referidos.
 * Devuelve valores vacíos si las tablas aún no existen (pre-migración).
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const sb = createServiceClient();
  const code = await getOrCreateReferralCode(userId);

  const empty: ReferralStats = {
    code,
    invited: 0,
    qualified: 0,
    pending: 0,
    daysEarned: 0,
    currentMilestone: null,
    nextMilestone: REFERRAL_MILESTONES[0] ?? null,
    progress: 0,
    badges: [],
    referrals: [],
  };
  if (!code) return empty;

  // Referrals del usuario como referrer.
  const { data: refs, error: refsErr } = await sb
    .from("referrals")
    .select("id, referred_id, status, signup_at, qualified_at")
    .eq("referrer_id", userId)
    .order("signup_at", { ascending: false })
    .limit(50);
  if (refsErr) {
    // Tabla inexistente u otro error: devolver estado vacío.
    console.warn("[referrals] stats referrals error:", refsErr.message);
    return empty;
  }

  const list = (refs ?? []) as {
    id: string; referred_id: string; status: "pending" | "qualified";
    signup_at: string | null; qualified_at: string | null;
  }[];

  const qualifiedCount = list.filter((r) => r.status === "qualified").length;

  // Recompensas (ledger).
  const { data: rewards, error: rewErr } = await sb
    .from("referral_rewards")
    .select("days_granted, milestone, badge")
    .eq("user_id", userId);
  const daysEarned = rewards?.reduce((acc, r) => acc + (r.days_granted || 0), 0) ?? 0;
  const claimedMilestones = new Set(
    (rewards ?? []).map((r) => r.milestone).filter((m): m is number => m != null)
  );
  const badges = Array.from(
    new Set((rewards ?? []).map((r) => r.badge).filter((b): b is string => !!b))
  );

  // Resuelve el milestone actual y el siguiente.
  let currentMilestone: ReferralStats["currentMilestone"] = null;
  let nextMilestone: ReferralStats["nextMilestone"] = REFERRAL_MILESTONES[0] ?? null;
  for (let i = 0; i < REFERRAL_MILESTONES.length; i++) {
    const m = REFERRAL_MILESTONES[i];
    if (qualifiedCount >= m.threshold) {
      currentMilestone = m;
      nextMilestone = REFERRAL_MILESTONES[i + 1] ?? null;
    }
  }
  const progress = nextMilestone
    ? Math.max(0, qualifiedCount - (currentMilestone?.threshold ?? 0))
    : 0;

  // Emails enmascarados de los referidos (admin API, lista pequeña).
  const labels: Record<string, string> = {};
  await Promise.all(
    list.map(async (r) => {
      try {
        const { data } = await sb.auth.admin.getUserById(r.referred_id);
        labels[r.id] = maskEmail(data?.user?.email);
      } catch {
        labels[r.id] = "Usuario";
      }
    })
  );

  return {
    code,
    invited: list.length,
    qualified: qualifiedCount,
    pending: list.length - qualifiedCount,
    daysEarned,
    currentMilestone,
    nextMilestone,
    progress,
    badges,
    referrals: list.map((r) => ({
      id: r.id,
      label: labels[r.id] ?? "Usuario",
      status: r.status,
      signupAt: r.signup_at,
      qualifiedAt: r.qualified_at,
    })),
  };
}

/**
 * Vincula un usuario recién registrado con su referrer (desde la cookie mav_ref).
 * Idempotente: si ya existe un referral para el referred_id, no hace nada.
 * No permite auto-referencia.
 */
export async function attachReferrerOnSignup(
  newUserId: string,
  refCode: string
): Promise<void> {
  if (!refCode) return;
  const sb = createServiceClient();

  // ¿Ya fue referido por alguien? (idempotencia)
  const { data: existing } = await sb
    .from("referrals")
    .select("id")
    .eq("referred_id", newUserId)
    .maybeSingle();
  if (existing) return;

  // Resuelve el código al referrer.
  const { data: codeRow } = await sb
    .from("referral_codes")
    .select("user_id")
    .eq("code", refCode.toUpperCase())
    .maybeSingle();
  if (!codeRow?.user_id) return;

  // Sin auto-referencia.
  if (codeRow.user_id === newUserId) return;

  const { error } = await sb.from("referrals").insert({
    referrer_id: codeRow.user_id,
    referred_id: newUserId,
    status: "pending",
  });
  if (error && !String(error.message).toLowerCase().includes("unique")) {
    console.error("[referrals] attach error:", error.message);
  }
}

/**
 * Otorga días de plan a un usuario.
 * - Si tiene suscripción activa: extiende current_period_end.
 * - Si no (free / expirada): crea un Pro trial por los días otorgados.
 */
export async function grantDays(userId: string, days: number): Promise<void> {
  if (days <= 0) return;
  const sb = createServiceClient();

  const { data: sub } = await sb
    .from("subscriptions")
    .select("current_period_end, status, tier, payment_provider")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  const existingEnd = sub?.current_period_end ? new Date(sub.current_period_end) : null;
  const base = existingEnd && existingEnd > now ? existingEnd : now;
  const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  const { error } = await sb.from("subscriptions").upsert(
    {
      user_id: userId,
      tier: (sub?.tier as PlanTier) || "pro",
      status: "active",
      payment_provider: sub?.payment_provider || "referral",
      current_period_start: sub ? undefined : now.toISOString(),
      current_period_end: newEnd.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (error) console.error("[referrals] grantDays error:", error.message);
}

/**
 * Cualifica el referido cuando PAGA y otorga las recompensas (base + milestones).
 * Idempotente: si el referral ya está cualificado, no hace nada.
 * Seguro de llamar desde el webhook de MercadoPago para cualquier usuario.
 */
export async function grantReferralReward(referredUserId: string): Promise<void> {
  const sb = createServiceClient();

  const { data: referral } = await sb
    .from("referrals")
    .select("id, referrer_id, status, reward_granted")
    .eq("referred_id", referredUserId)
    .maybeSingle();
  if (!referral || referral.status === "qualified") return;

  const referrerId: string = referral.referrer_id;

  // Marca cualificado.
  const { error: markErr } = await sb
    .from("referrals")
    .update({ status: "qualified", qualified_at: new Date().toISOString(), reward_granted: true })
    .eq("id", referral.id);
  if (markErr) {
    console.error("[referrals] qualify mark error:", markErr.message);
    return;
  }

  // Cuenta cualificados del referrer (incluye este).
  const { data: allRef } = await sb
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrerId)
    .eq("status", "qualified");
  const qualifiedCount = allRef?.length ?? 1;

  // 1) Recompensa base (si no fue otorgada ya para este referral).
  const { data: baseExisting } = await sb
    .from("referral_rewards")
    .select("id")
    .eq("referral_id", referral.id)
    .eq("type", "base")
    .maybeSingle();
  if (!baseExisting) {
    await sb.from("referral_rewards").insert({
      user_id: referrerId,
      referral_id: referral.id,
      type: "base",
      days_granted: BASE_REWARD_DAYS,
    });
    await grantDays(referrerId, BASE_REWARD_DAYS);
  }

  // 2) Milestones: otorga los que se acaben de cruzar y no estén reclamados.
  for (const m of REFERRAL_MILESTONES) {
    if (qualifiedCount < m.threshold) continue;
    const { data: mileExisting } = await sb
      .from("referral_rewards")
      .select("id")
      .eq("user_id", referrerId)
      .eq("type", "milestone")
      .eq("milestone", m.threshold)
      .maybeSingle();
    if (mileExisting) continue;

    await sb.from("referral_rewards").insert({
      user_id: referrerId,
      referral_id: referral.id,
      type: "milestone",
      days_granted: m.days,
      milestone: m.threshold,
      badge: m.badge,
    });
    await grantDays(referrerId, m.days);
    console.log(`[referrals] 🎁 ${referrerId} reached milestone ${m.threshold} (+${m.days}d, ${m.badge})`);
  }
}
