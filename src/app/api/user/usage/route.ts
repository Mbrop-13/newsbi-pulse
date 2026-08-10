import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/check-limits";
import { createServiceClient } from "@/lib/supabase";
import { getPlanConfig, PLAN_CONFIGS } from "@/lib/plan-limits";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tier = await getUserTier(user.id);
    const config = getPlanConfig(tier);
    const baseConfig = PLAN_CONFIGS[tier] || PLAN_CONFIGS.free;
    const serviceClient = createServiceClient();

    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Uso mensual/lifetime + logs semanales (ya no hay ventana de 5 horas)
    const [monthlyRes, lifetimeRes, logsRes, subRes] = await Promise.all([
      serviceClient
        .from("monthly_usage")
        .select("ai_tokens, image_credits")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .maybeSingle(),
      serviceClient
        .from("lifetime_usage")
        .select("ai_tokens_total")
        .eq("user_id", user.id)
        .maybeSingle(),
      serviceClient
        .from("token_usage_logs")
        .select("tokens, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo),
      serviceClient
        .from("subscriptions")
        .select("status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const monthly = monthlyRes.data;
    const lifetime = lifetimeRes.data;
    const logs = logsRes.data;
    const subData = subRes?.data;

    let weeklyUsed = 0;
    let oldestWeeklyLog: { created_at: string } | null = null;

    if (logs) {
      for (const log of logs) {
        weeklyUsed += log.tokens || 0;
        const logTime = new Date(log.created_at).getTime();
        if (
          !oldestWeeklyLog ||
          logTime < new Date(oldestWeeklyLog.created_at).getTime()
        ) {
          oldestWeeklyLog = log;
        }
      }
    }

    const weeklyReset = oldestWeeklyLog
      ? new Date(
          new Date(oldestWeeklyLog.created_at).getTime() + 7 * 24 * 60 * 60 * 1000
        ).toISOString()
      : null;

    const isFree = tier === "free";
    const currentPeriodEnd =
      subData && subData.status !== "expired" && subData.status !== "canceled"
        ? subData.current_period_end
        : null;

    const now = new Date();
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    ).toISOString();
    const monthlyReset = currentPeriodEnd || endOfMonth;

    const imageCreditsUsed = Number(monthly?.image_credits) || 0;
    const imageCreditsLimit = config.imageCreditsPerMonth;
    // Free (y cualquier plan sin cuota de imagen): feature bloqueada, no medidor 0%.
    const imageCreditsIncluded = imageCreditsLimit > 0;

    const usage = {
      tier,
      planName: baseConfig.name,
      currentPeriodEnd,
      monthlyImageCreditsUsed: imageCreditsUsed,
      imageCreditsLimit,
      resources: [
        {
          id: "ai_tokens_weekly",
          label: "Tokens · 7 días",
          icon: "briefcase",
          used: weeklyUsed,
          limit: config.aiTokensPerWeek,
          period: "últimos 7 días",
          color: "#EC4899",
          formatAsK: true,
          resetTime: weeklyReset,
          locked: false,
        },
        {
          id: "ai_tokens",
          label: isFree ? "Tokens · de por vida" : "Tokens · mes",
          icon: "cpu",
          used: isFree
            ? lifetime?.ai_tokens_total || 0
            : monthly?.ai_tokens || 0,
          limit: isFree ? config.aiLifetimeTokens : config.aiTokensPerMonth,
          period: isFree ? "de por vida" : "este mes",
          color: "#8B5CF6",
          formatAsK: true,
          resetTime: isFree ? null : monthlyReset,
          locked: false,
        },
        {
          id: "image_credits",
          label: "Imágenes · Flow",
          icon: "image",
          used: imageCreditsIncluded ? imageCreditsUsed : 0,
          limit: imageCreditsLimit,
          period: imageCreditsIncluded ? "este mes" : null,
          color: "#1890FF",
          formatAsK: false,
          resetTime: imageCreditsIncluded ? monthlyReset : null,
          locked: !imageCreditsIncluded,
          lockedMessage: imageCreditsIncluded
            ? null
            : "Actualiza tu plan para generar imágenes en Flow",
          upgradeRequired: !imageCreditsIncluded,
        },
      ],
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[/api/user/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
