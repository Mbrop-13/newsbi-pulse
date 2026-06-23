import { createClient } from "@supabase/supabase-js";
import { PlanTier, getPlanConfig } from "@/lib/plan-limits";

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
 * Get the user's current subscription tier
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
 */
export async function incrementUsage(userId: string, feature: "ai_message" | "tts_audio"): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01"; // YYYY-MM-01
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const isGuest = userId.startsWith("guest-");
  
  if (feature === "ai_message") {
    if (isGuest) {
      try {
        const { data: existing } = await supabase
          .from("guest_usage")
          .select("ai_messages_total")
          .eq("ip_address", userId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("guest_usage")
            .update({ ai_messages_total: (existing.ai_messages_total || 0) + 1, updated_at: new Date().toISOString() })
            .eq("ip_address", userId);
        } else {
          await supabase
            .from("guest_usage")
            .insert({ ip_address: userId, ai_messages_total: 1, updated_at: new Date().toISOString() });
        }
      } catch (err) {
        console.warn("[incrementUsage] Failed to update guest_usage:", err);
      }
      return;
    }

    // Increment monthly usage (direct upsert — works even without RPCs)
    const { data: existing } = await supabase
      .from("monthly_usage")
      .select("ai_messages")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("monthly_usage")
        .update({ ai_messages: (existing.ai_messages || 0) + 1 })
        .eq("user_id", userId)
        .eq("month", currentMonth);
    } else {
      await supabase
        .from("monthly_usage")
        .insert({ user_id: userId, month: currentMonth, ai_messages: 1 });
    }
    
    // Increment lifetime usage
    const { data: lifeData } = await supabase
      .from("lifetime_usage")
      .select("ai_messages_total")
      .eq("user_id", userId)
      .maybeSingle();

    if (lifeData) {
      await supabase
        .from("lifetime_usage")
        .update({ ai_messages_total: (lifeData.ai_messages_total || 0) + 1 })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("lifetime_usage")
        .insert({ user_id: userId, ai_messages_total: 1 });
    }
  }
  
  if (feature === "tts_audio") {
    if (isGuest) return; // Guests do not support TTS audio usage tracking

    // Increment monthly
    const { data: existing } = await supabase
      .from("monthly_usage")
      .select("tts_audios")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("monthly_usage")
        .update({ tts_audios: (existing.tts_audios || 0) + 1 })
        .eq("user_id", userId)
        .eq("month", currentMonth);
    } else {
      await supabase
        .from("monthly_usage")
        .insert({ user_id: userId, month: currentMonth, tts_audios: 1 });
    }
    
    // Increment daily
    const { data: dailyData } = await supabase
      .from("daily_usage")
      .select("tts_audios")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle();

    if (dailyData) {
      await supabase
        .from("daily_usage")
        .update({ tts_audios: (dailyData.tts_audios || 0) + 1 })
        .eq("user_id", userId)
        .eq("date", today);
    } else {
      await supabase
        .from("daily_usage")
        .insert({ user_id: userId, date: today, tts_audios: 1 });
    }
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
        const { data, error } = await supabase
          .from("guest_usage")
          .select("ai_messages_total")
          .eq("ip_address", userId)
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
          const { data } = await supabase
            .from("guest_usage")
            .select("ai_tokens_total")
            .eq("ip_address", userId)
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
      logs.forEach((log) => {
        const t = log.tokens || 0;
        weeklyUsed += t;
        if (new Date(log.created_at) >= new Date(fiveHoursAgo)) {
          fiveHourUsed += t;
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
 * Increment user's token usage in database (updating lifetime/monthly counters and logging to token_usage_logs)
 */
export async function incrementTokenUsage(userId: string, tokens: number): Promise<void> {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const isGuest = userId.startsWith("guest-");

  // 1. Log event in token_usage_logs for time window checks
  try {
    await supabase
      .from("token_usage_logs")
      .insert({ user_id: userId, tokens });

    // Clean up older records asynchronously to keep the table size small
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from("token_usage_logs")
      .delete()
      .lt("created_at", sevenDaysAgo)
      .then(({ error }) => {
        if (error) console.warn("[incrementTokenUsage] Failed to purge old logs:", error);
      });
  } catch (dbErr) {
    console.warn("[incrementTokenUsage] Failed to write token_usage_logs:", dbErr);
  }

  if (isGuest) {
    try {
      const { data: existingGuest } = await supabase
        .from("guest_usage")
        .select("ai_tokens_total")
        .eq("ip_address", userId)
        .maybeSingle();

      if (existingGuest) {
        await supabase
          .from("guest_usage")
          .update({ ai_tokens_total: (existingGuest.ai_tokens_total || 0) + tokens, updated_at: new Date().toISOString() })
          .eq("ip_address", userId);
      } else {
        await supabase
          .from("guest_usage")
          .insert({ ip_address: userId, ai_tokens_total: tokens, updated_at: new Date().toISOString() });
      }
    } catch (dbErr) {
      console.warn("[incrementTokenUsage] Failed to update guest_usage ai_tokens_total:", dbErr);
    }
    return;
  }

  // 2. Increment monthly usage tokens
  try {
    const { data: existingMonthly } = await supabase
      .from("monthly_usage")
      .select("ai_tokens")
      .eq("user_id", userId)
      .eq("month", currentMonth)
      .maybeSingle();

    if (existingMonthly) {
      await supabase
        .from("monthly_usage")
        .update({ ai_tokens: (existingMonthly.ai_tokens || 0) + tokens })
        .eq("user_id", userId)
        .eq("month", currentMonth);
    } else {
      await supabase
        .from("monthly_usage")
        .insert({ user_id: userId, month: currentMonth, ai_tokens: tokens });
    }
  } catch (dbErr) {
    console.warn("[incrementTokenUsage] Failed to update monthly ai_tokens:", dbErr);
  }

  // 3. Increment lifetime usage tokens
  try {
    const { data: existingLifetime } = await supabase
      .from("lifetime_usage")
      .select("ai_tokens_total")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingLifetime) {
      await supabase
        .from("lifetime_usage")
        .update({ ai_tokens_total: (existingLifetime.ai_tokens_total || 0) + tokens })
        .eq("user_id", userId);
    } else {
      await supabase
        .from("lifetime_usage")
        .insert({ user_id: userId, ai_tokens_total: tokens });
    }
  } catch (dbErr) {
    console.warn("[incrementTokenUsage] Failed to update lifetime ai_tokens_total:", dbErr);
  }
}
