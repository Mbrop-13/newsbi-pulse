import { createClient } from "@supabase/supabase-js";
import { PlanTier, getPlanConfig, enterpriseToTier, type EnterprisePlan } from "@/lib/plan-limits";
import type { UserOrgMembership } from "@/lib/types";
import { hashIp } from "@/lib/ip-hash";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type FeatureType = "ai_message" | "tts_audio" | "price_alert" | "portfolio_asset";

interface LimitCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: PlanTier;
  upgradeRequired?: PlanTier;
}

/**
 * Obtiene la membresía organizacional activa del usuario (si existe).
 * Devuelve la org con mejor plan si pertenece a varias.
 */
export async function getUserOrg(userId: string): Promise<UserOrgMembership | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) return null;

  try {
    // 1. Buscar membresías activas
    const { data: memberships, error: mErr } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, status, joined_at")
      .eq("user_id", userId)
      .eq("status", "active");

    if (mErr || !memberships || memberships.length === 0) return null;

    const orgIds = memberships.map((m) => m.organization_id);

    // 2. Fetch organizaciones + suscripciones en paralelo
    const [{ data: orgs }, { data: subs }, { count: activeCount }] = await Promise.all([
      supabase.from("organizations").select("*").in("id", orgIds),
      supabase.from("organization_subscriptions").select("*").in("organization_id", orgIds),
      supabase.from("organization_members")
        .select("*", { count: "exact", head: true })
        .in("organization_id", orgIds)
        .eq("status", "active"),
    ]);

    if (!orgs || orgs.length === 0) return null;

    // 3. Elegir la org con mejor plan vigente
    const planRank: Record<EnterprisePlan, number> = { team: 1, business: 2, enterprise: 3 };

    const candidates = orgs
      .map((org) => {
        const membership = memberships.find((m) => m.organization_id === org.id)!;
        const sub = subs?.find((s) => s.organization_id === org.id) ?? null;
        const isOrgActive = org.status === "active" || org.status === "trial";
        const subActive = sub && (sub.status === "active" || sub.status === "trial");

        // Verificar vigencia de periodo (con 3 días de gracia)
        let periodOk = true;
        const periodEnd = sub?.current_period_end ?? org.current_period_end;
        if (periodEnd) {
          const end = new Date(periodEnd);
          end.setDate(end.getDate() + 3);
          periodOk = new Date() <= end;
        }

        return {
          org,
          role: membership.role as UserOrgMembership["role"],
          member: membership as UserOrgMembership["member"],
          subscription: sub as UserOrgMembership["subscription"],
          activeMemberCount: activeCount ?? 0,
          viable: (isOrgActive || subActive) && periodOk,
          rank: planRank[(sub?.plan ?? org.plan) as EnterprisePlan] ?? 0,
        };
      })
      .filter((c) => c.viable)
      .sort((a, b) => b.rank - a.rank);

    if (candidates.length === 0) return null;

    const best = candidates[0];
    return {
      org: best.org as UserOrgMembership["org"],
      role: best.role,
      member: best.member,
      subscription: best.subscription,
      activeMemberCount: best.activeMemberCount,
    };
  } catch (err) {
    console.warn("[getUserOrg] Error:", err);
    return null;
  }
}

/**
 * Get the user's current subscription tier (incluye herencia organizacional)
 */
export async function getUserTier(userId: string): Promise<PlanTier> {
  // If not a valid UUID format, immediately fallback to "free" (e.g. for guest users)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!userId || !uuidRegex.test(userId)) {
    return "free";
  }

  // Check if the user is an admin first
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminRow && adminRow.role === "admin") {
    return "ultra";
  }

  // ── Herencia organizacional ──
  const orgMembership = await getUserOrg(userId);
  if (orgMembership?.subscription) {
    const plan = (orgMembership.subscription.plan ?? orgMembership.org.plan) as EnterprisePlan;
    return enterpriseToTier(plan);
  } else if (orgMembership?.org) {
    // Org activa sin sub explícita: usar plan de la org
    const plan = orgMembership.org.plan as EnterprisePlan;
    return enterpriseToTier(plan);
  }

  // ── Suscripción individual ──
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (!data || data.status === "expired" || data.status === "canceled") {
    return "free";
  }

  // Comprobación profesional estricta: verificar si el periodo de pago expiró
  // Damos 3 días de gracia (72 horas) para compensar demoras en webhooks o reintentos de pago
  if (data.current_period_end) {
    const periodEnd = new Date(data.current_period_end);
    periodEnd.setDate(periodEnd.getDate() + 3); // +3 días de gracia
    
    if (new Date() > periodEnd) {
      // Expirado
      return "free";
    }
  }
  
  return (data.tier as PlanTier) || "free";
}

/**
 * Check if a user can perform an action based on their plan limits
 */
export async function checkLimit(userId: string, feature: FeatureType): Promise<LimitCheckResult> {
  const tier = await getUserTier(userId);
  const config = getPlanConfig(tier);
  
  switch (feature) {
    case "ai_message":
      return checkAiMessageLimit(userId, tier);
    case "tts_audio":
      return checkTtsAudioLimit(userId, tier);
    case "price_alert":
      return checkAlertLimit(userId, tier);
    case "portfolio_asset":
      return checkPortfolioLimit(userId, tier);
    default:
      return { allowed: true, remaining: -1, limit: -1, tier };
  }
}

/**
 * Increment usage counter after an action is performed
 *
 * ASVS 4.3.3 — usa RPC atómicas (INSERT ... ON CONFLICT DO UPDATE SET x = x + 1)
 * en lugar del patrón read-then-write previo, que era vulnerable a TOCTOU:
 * dos requests concurrentes leían el mismo N y ambas escribían N+1, perdiendo
 * un incremento y permitiendo bypass de cuota.
 *
 * Fallback graceful: si la RPC no existe aún (migración no aplicada), usa el
 * patrón anterior para no romper el servicio, pero loguea el warning.
 */
export async function incrementUsage(userId: string, feature: "ai_message" | "tts_audio"): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const isGuest = userId.startsWith("guest-");

  if (feature === "ai_message") {
    if (isGuest) {
      // Guests: identidad por IP hasheada (M-14). service_role obligatorio.
      // El userId llega como "guest-<algo>"; extraer el hash IP subyacente.
      const ipHash = resolveGuestIpHash(userId);
      try {
        const { error } = await supabase.rpc("increment_guest_ai_message", { p_ip_hash: ipHash });
        if (!error) return;
        // RPC no existe o falló — fallback legacy con IP hasheada
        if (!isPostgresFunctionMissingError(error)) throw error;
        console.warn("[incrementUsage] RPC increment_guest_ai_message no disponible, usando fallback");
        await legacyGuestIncrement(ipHash, "ai_messages_total", 1);
      } catch (err) {
        console.warn("[incrementUsage] Failed guest AI increment:", err);
      }
      return;
    }

    try {
      // Mensual: RPC atómica
      const { error: mErr } = await supabase.rpc("increment_monthly_ai", {
        p_user_id: userId,
        p_month: currentMonth,
      });
      if (mErr && !isPostgresFunctionMissingError(mErr)) throw mErr;
      if (mErr) console.warn("[incrementUsage] RPC increment_monthly_ai no disponible, usando fallback");

      // Lifetime: RPC atómica
      const { error: lErr } = await supabase.rpc("increment_lifetime_ai", { p_user_id: userId });
      if (lErr && !isPostgresFunctionMissingError(lErr)) throw lErr;

      // Si las RPC fallaron por no existir, fallback legacy
      if (mErr || lErr) {
        await legacyMonthlyIncrement(userId, currentMonth, "ai_messages", 1);
        if (lErr) await legacyLifetimeIncrement(userId, "ai_messages_total", 1);
      }
    } catch (err) {
      console.warn("[incrementUsage] Failed AI increment (RPC path):", err);
    }
  }

  if (feature === "tts_audio") {
    if (isGuest) return; // Guests do not support TTS audio usage tracking

    try {
      const { error: mErr } = await supabase.rpc("increment_monthly_tts", {
        p_user_id: userId,
        p_month: currentMonth,
      });
      if (mErr && !isPostgresFunctionMissingError(mErr)) throw mErr;
      if (mErr) console.warn("[incrementUsage] RPC increment_monthly_tts no disponible, usando fallback");

      const { error: dErr } = await supabase.rpc("increment_daily_tts", {
        p_user_id: userId,
        p_date: today,
      });
      if (dErr && !isPostgresFunctionMissingError(dErr)) throw dErr;

      if (mErr || dErr) {
        if (mErr) await legacyMonthlyIncrement(userId, currentMonth, "tts_audios", 1);
        if (dErr) await legacyDailyIncrement(userId, today, 1);
      }
    } catch (err) {
      console.warn("[incrementUsage] Failed TTS increment (RPC path):", err);
    }
  }
}

// ── Helpers de detección y fallback legacy ──

/** Detecta errores donde la RPC simplemente no existe aún (migración no aplicada). */
function isPostgresFunctionMissingError(err: any): boolean {
  const msg = (err?.message || "").toLowerCase();
  return msg.includes("could not find the function") ||
         msg.includes("function") && msg.includes("does not exist") ||
         msg.includes("p_user_id") && msg.includes("does not exist") ||
         err?.code === "42883"; // undefined_function
}

/**
 * Extrae el hash IP de un identificador guest ("guest-<hash>").
 * Si el ID no trae hash (formato legacy con IP en claro), lo hashea al vuelo.
 */
function resolveGuestIpHash(guestId: string): string {
  // Aceptamos formatos: "guest-<sha256hex>" o "guest-<ip-plano-legacy>"
  const raw = guestId.startsWith("guest-") ? guestId.slice("guest-".length) : guestId;
  // Un sha256 tiene 64 hex chars. Si raw ya es eso, lo usamos tal cual.
  if (/^[0-9a-f]{64}$/i.test(raw)) return raw;
  // Sino, es IP legacy en claro → hashear
  return hashIp(raw);
}

async function legacyGuestIncrement(ipHash: string, column: string, delta: number): Promise<void> {
  const { data: existing } = await supabase
    .from("guest_usage")
    .select(column)
    .eq("ip_address", ipHash)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("guest_usage")
      .update({ [column]: (existing[column] || 0) + delta, updated_at: new Date().toISOString() })
      .eq("ip_address", ipHash);
  } else {
    await supabase
      .from("guest_usage")
      .insert({ ip_address: ipHash, [column]: delta, updated_at: new Date().toISOString() });
  }
}

async function legacyMonthlyIncrement(userId: string, month: string, column: string, delta: number): Promise<void> {
  const { data: existing } = await supabase
    .from("monthly_usage")
    .select(column)
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("monthly_usage")
      .update({ [column]: (existing[column] || 0) + delta })
      .eq("user_id", userId)
      .eq("month", month);
  } else {
    await supabase
      .from("monthly_usage")
      .insert({ user_id: userId, month, [column]: delta });
  }
}

async function legacyLifetimeIncrement(userId: string, column: string, delta: number): Promise<void> {
  const { data: existing } = await supabase
    .from("lifetime_usage")
    .select(column)
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("lifetime_usage")
      .update({ [column]: (existing[column] || 0) + delta })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("lifetime_usage")
      .insert({ user_id: userId, [column]: delta });
  }
}

async function legacyDailyIncrement(userId: string, date: string, delta: number): Promise<void> {
  const { data: existing } = await supabase
    .from("daily_usage")
    .select("tts_audios")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("daily_usage")
      .update({ tts_audios: (existing.tts_audios || 0) + delta })
      .eq("user_id", userId)
      .eq("date", date);
  } else {
    await supabase
      .from("daily_usage")
      .insert({ user_id: userId, date, tts_audios: delta });
  }
}

// ── Internal checks ──

async function checkAiMessageLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  const isGuest = userId.startsWith("guest-");
  
  if (tier === "free") {
    // Free tier: lifetime limit
    let used = 0;
    if (isGuest) {
      try {
        const ipHash = resolveGuestIpHash(userId);
        const { data, error } = await supabase
          .from("guest_usage")
          .select("ai_messages_total")
          .eq("ip_address", ipHash)
          .maybeSingle();
        if (!error && data) {
          used = data.ai_messages_total || 0;
        }
      } catch (err) {
        console.warn("[checkAiMessageLimit] Failed to query guest_usage:", err);
      }
    } else {
      const { data } = await supabase
        .from("lifetime_usage")
        .select("ai_messages_total")
        .eq("user_id", userId)
        .maybeSingle();
      used = data?.ai_messages_total || 0;
    }

    const limit = config.aiLifetimeMessages;
    
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
      tier,
      upgradeRequired: used >= limit ? "pro" : undefined,
    };
  }
  
  // Paid tiers: monthly limit
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data } = await supabase
    .from("monthly_usage")
    .select("ai_messages")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();
  
  const used = data?.ai_messages || 0;
  const limit = config.aiMessagesPerMonth;
  
  if (limit === -1) {
    return { allowed: true, remaining: 999, limit: -1, tier };
  }
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    tier,
    upgradeRequired: used >= limit ? (tier === "pro" ? "max" : tier === "max" ? "ultra" : tier === "ultra" ? "ultra_x20" : undefined) : undefined,
  };
}

async function checkTtsAudioLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  const isGuest = userId.startsWith("guest-");
  if (isGuest) {
    return { allowed: false, remaining: 0, limit: 0, tier, upgradeRequired: "pro" };
  }
  
  if (tier === "free") {
    // Free tier: daily limit
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("daily_usage")
      .select("tts_audios")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();
    
    const used = data?.tts_audios || 0;
    const limit = config.ttsDailyLimit;
    
    return {
      allowed: used < limit,
      remaining: Math.max(0, limit - used),
      limit,
      tier,
      upgradeRequired: used >= limit ? "pro" : undefined,
    };
  }
  
  // Paid tiers: monthly limit
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const { data } = await supabase
    .from("monthly_usage")
    .select("tts_audios")
    .eq("user_id", userId)
    .eq("month", currentMonth)
    .maybeSingle();
  
  const used = data?.tts_audios || 0;
  const limit = config.ttsAudiosPerMonth;
  
  if (limit === -1) {
    return { allowed: true, remaining: 999, limit: -1, tier };
  }
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    tier,
    upgradeRequired: used >= limit ? (tier === "pro" ? "max" : tier === "max" ? "ultra" : tier === "ultra" ? "ultra_x20" : undefined) : undefined,
  };
}

async function checkAlertLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  const isGuest = userId.startsWith("guest-");
  if (isGuest) {
    return { allowed: false, remaining: 0, limit: 0, tier, upgradeRequired: "pro" };
  }
  
  const { count } = await supabase
    .from("price_alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_active", true);
  
  const used = count || 0;
  const limit = config.maxActiveAlerts;
  
  if (limit === -1) {
    return { allowed: true, remaining: 999, limit: -1, tier };
  }
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    tier,
    upgradeRequired: used >= limit ? (tier === "free" ? "pro" : tier === "pro" ? "max" : tier === "max" ? "ultra" : "ultra_x20") : undefined,
  };
}

async function checkPortfolioLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  const isGuest = userId.startsWith("guest-");
  if (isGuest) {
    return { allowed: false, remaining: 0, limit: 0, tier, upgradeRequired: "pro" };
  }
  
  const { count } = await supabase
    .from("portfolio_assets")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  
  const used = count || 0;
  const limit = config.maxPortfolioAssets;
  
  if (limit === -1) {
    return { allowed: true, remaining: 999, limit: -1, tier };
  }
  
  return {
    allowed: used < limit,
    remaining: Math.max(0, limit - used),
    limit,
    tier,
    upgradeRequired: used >= limit ? (tier === "free" ? "pro" : tier === "pro" ? "max" : tier === "max" ? "ultra" : "ultra_x20") : undefined,
  };
}

/**
 * Check if user has enough tokens remaining (checking monthly/lifetime, 5-hour, and weekly limits in parallel)
 */
export async function checkTokenLimit(userId: string): Promise<{ allowed: boolean; remaining: number; limit: number; tier: PlanTier }> {
  const tier = await getUserTier(userId);
  const config = getPlanConfig(tier);
  const isGuest = userId.startsWith("guest-");

  // Define limits based on tier
  const monthlyLimit = tier === "free" ? config.aiLifetimeTokens : config.aiTokensPerMonth;
  const fiveHourLimit = config.aiTokensPer5Hours;
  const weeklyLimit = config.aiTokensPerWeek;

  let monthlyUsed = 0;
  let fiveHourUsed = 0;
  let weeklyUsed = 0;

  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Fetch general limit usage (monthly or lifetime)
    const generalPromise = (async () => {
      if (tier === "free") {
        if (isGuest) {
          const ipHash = resolveGuestIpHash(userId);
          const { data } = await supabase
            .from("guest_usage")
            .select("ai_tokens_total")
            .eq("ip_address", ipHash)
            .maybeSingle();
          return data?.ai_tokens_total || 0;
        } else {
          const { data } = await supabase
            .from("lifetime_usage")
            .select("ai_tokens_total")
            .eq("user_id", userId)
            .maybeSingle();
          return data?.ai_tokens_total || 0;
        }
      } else {
        const { data } = await supabase
          .from("monthly_usage")
          .select("ai_tokens")
          .eq("user_id", userId)
          .eq("month", currentMonth)
          .maybeSingle();
        return data?.ai_tokens || 0;
      }
    })();

    // 2. Fetch rolling time window logs from token_usage_logs (last 7 days covers weekly and 5h)
    const logsPromise = supabase
      .from("token_usage_logs")
      .select("tokens, created_at")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo);

    const [genUsed, { data: logs }] = await Promise.all([generalPromise, logsPromise]);
    monthlyUsed = genUsed;

    if (logs) {
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      let blockStart: number | null = null;

      sortedLogs.forEach((log) => {
        const t = log.tokens || 0;
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();

        weeklyUsed += t;

        if (blockStart === null) {
          if (now - logTime < 5 * 60 * 60 * 1000) {
            blockStart = logTime;
            fiveHourUsed = t;
          }
        } else {
          if (logTime - blockStart < 5 * 60 * 60 * 1000) {
            fiveHourUsed += t;
          } else {
            if (now - logTime < 5 * 60 * 60 * 1000) {
              blockStart = logTime;
              fiveHourUsed = t;
            }
          }
        }
      });
    }
  } catch (dbErr) {
    console.warn("[checkTokenLimit] Database error checking token windows, falling back:", dbErr);
  }

  // Calculate remaining capacities for each limit
  const monthlyRemaining = monthlyLimit === -1 ? 9999999 : Math.max(0, monthlyLimit - monthlyUsed);
  const fiveHourRemaining = fiveHourLimit === -1 ? 9999999 : Math.max(0, fiveHourLimit - fiveHourUsed);
  const weeklyRemaining = weeklyLimit === -1 ? 9999999 : Math.max(0, weeklyLimit - weeklyUsed);

  // The true limit is the bottleneck limit (lowest remaining capacity)
  const minRemaining = Math.min(monthlyRemaining, fiveHourRemaining, weeklyRemaining);
  const allowed = minRemaining > 0;

  // Find which limit is the bottleneck to return correct capacity info
  let activeLimit = monthlyLimit;
  if (fiveHourRemaining < monthlyRemaining && fiveHourRemaining < weeklyRemaining) {
    activeLimit = fiveHourLimit;
  } else if (weeklyRemaining < monthlyRemaining) {
    activeLimit = weeklyLimit;
  }

  return {
    allowed,
    remaining: minRemaining,
    limit: activeLimit,
    tier
  };
}

/**
 * Increment user's token usage in database.
 * Usa RPC atómicas (M-11): INSERT ... ON CONFLICT DO UPDATE SET ai_tokens = ai_tokens + p_tokens.
 * Fallback legacy si las RPC no están desplegadas todavía.
 */
export async function incrementTokenUsage(userId: string, tokens: number): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const isGuest = userId.startsWith("guest-");
  const safeTokens = Math.max(0, Math.floor(tokens));

  // 1. Log event en token_usage_logs (RPC atómica, hace también purge inline)
  try {
    const { error: logErr } = await supabase.rpc("log_token_usage", { p_tokens: safeTokens });
    if (logErr) {
      if (!isPostgresFunctionMissingError(logErr)) throw logErr;
      // Fallback: insert directo
      await supabase.from("token_usage_logs").insert({ user_id: userId, tokens: safeTokens });
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      supabase
        .from("token_usage_logs")
        .delete()
        .lt("created_at", sevenDaysAgo)
        .then(({ error }) => {
          if (error) console.warn("[incrementTokenUsage] Failed to purge old logs:", error);
        });
    }
  } catch (dbErr) {
    console.warn("[incrementTokenUsage] Failed to write token_usage_logs:", dbErr);
  }

  // 2. Guest path: service_role RPC atómica con IP hasheada
  if (isGuest) {
    const ipHash = resolveGuestIpHash(userId);
    try {
      const { error: gErr } = await supabase.rpc("increment_guest_tokens", {
        p_ip_hash: ipHash,
        p_tokens: safeTokens,
      });
      if (gErr && !isPostgresFunctionMissingError(gErr)) throw gErr;
      if (gErr) {
        console.warn("[incrementTokenUsage] RPC increment_guest_tokens no disponible, usando fallback");
        await legacyGuestTokenIncrement(ipHash, safeTokens);
      }
    } catch (dbErr) {
      console.warn("[incrementTokenUsage] Failed guest token increment:", dbErr);
    }
    return;
  }

  // 3. Authenticated path: RPC mensual + lifetime atómicas
  try {
    const { error: mErr } = await supabase.rpc("increment_monthly_tokens", {
      p_month: currentMonth,
      p_tokens: safeTokens,
    });
    if (mErr && !isPostgresFunctionMissingError(mErr)) throw mErr;
    if (mErr) {
      console.warn("[incrementTokenUsage] RPC increment_monthly_tokens no disponible, usando fallback");
      await legacyMonthlyIncrement(userId, currentMonth, "ai_tokens", safeTokens);
    }

    const { error: lErr } = await supabase.rpc("increment_lifetime_tokens", { p_tokens: safeTokens });
    if (lErr && !isPostgresFunctionMissingError(lErr)) throw lErr;
    if (lErr) {
      console.warn("[incrementTokenUsage] RPC increment_lifetime_tokens no disponible, usando fallback");
      await legacyLifetimeIncrement(userId, "ai_tokens_total", safeTokens);
    }
  } catch (dbErr) {
    console.warn("[incrementTokenUsage] Failed token increment (RPC path):", dbErr);
  }
}

/** Fallback legacy para tokens de invitados. */
async function legacyGuestTokenIncrement(ipHash: string, tokens: number): Promise<void> {
  const { data: existingGuest } = await supabase
    .from("guest_usage")
    .select("ai_tokens_total")
    .eq("ip_address", ipHash)
    .maybeSingle();

  if (existingGuest) {
    await supabase
      .from("guest_usage")
      .update({ ai_tokens_total: (existingGuest.ai_tokens_total || 0) + tokens, updated_at: new Date().toISOString() })
      .eq("ip_address", ipHash);
  } else {
    await supabase
      .from("guest_usage")
      .insert({ ip_address: ipHash, ai_tokens_total: tokens, updated_at: new Date().toISOString() });
  }
}
