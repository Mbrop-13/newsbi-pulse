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
  const { data } = await supabase
    .from("subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();
  
  if (!data || data.status === "expired" || data.status === "canceled") {
    return "free";
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
  
  if (feature === "ai_message") {
    // Increment monthly usage
    await supabase.rpc("increment_monthly_ai", { p_user_id: userId, p_month: currentMonth });
    
    // Increment lifetime usage
    await supabase
      .from("lifetime_usage")
      .upsert(
        { user_id: userId, ai_messages_total: 1 },
        { onConflict: "user_id" }
      );
    
    // Use raw SQL for increment since upsert doesn't increment
    await supabase.rpc("increment_lifetime_ai", { p_user_id: userId });
  }
  
  if (feature === "tts_audio") {
    // Increment monthly
    await supabase.rpc("increment_monthly_tts", { p_user_id: userId, p_month: currentMonth });
    
    // Increment daily
    await supabase.rpc("increment_daily_tts", { p_user_id: userId, p_date: today });
  }
}

// ── Internal checks ──

async function checkAiMessageLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  
  if (tier === "free") {
    // Free tier: lifetime limit
    const { data } = await supabase
      .from("lifetime_usage")
      .select("ai_messages_total")
      .eq("user_id", userId)
      .single();
    
    const used = data?.ai_messages_total || 0;
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
    .single();
  
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
    upgradeRequired: used >= limit ? (tier === "pro" ? "max" : tier === "max" ? "ultra" : undefined) : undefined,
  };
}

async function checkTtsAudioLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  
  if (tier === "free") {
    // Free tier: daily limit
    const today = new Date().toISOString().slice(0, 10);
    const { data } = await supabase
      .from("daily_usage")
      .select("tts_audios")
      .eq("user_id", userId)
      .eq("date", today)
      .single();
    
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
    .single();
  
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
    upgradeRequired: used >= limit ? (tier === "pro" ? "max" : tier === "max" ? "ultra" : undefined) : undefined,
  };
}

async function checkAlertLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  
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
    upgradeRequired: used >= limit ? (tier === "free" ? "pro" : tier === "pro" ? "max" : "ultra") : undefined,
  };
}

async function checkPortfolioLimit(userId: string, tier: PlanTier): Promise<LimitCheckResult> {
  const config = getPlanConfig(tier);
  
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
    upgradeRequired: used >= limit ? (tier === "free" ? "pro" : tier === "pro" ? "max" : "ultra") : undefined,
  };
}
