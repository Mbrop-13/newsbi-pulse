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
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString();

    // Fetch token usage logs for rolling windows and monthly/lifetime values in parallel
    const [monthlyRes, lifetimeRes, logsRes, subRes] = await Promise.all([
      serviceClient
        .from("monthly_usage")
        .select("ai_tokens")
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

    let fiveHourUsed = 0;
    let weeklyUsed = 0;
    let oldestWeeklyLog: any = null;
    let blockStart: number | null = null;

    if (logs) {
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedLogs.forEach((log) => {
        const t = log.tokens || 0;
        const logTime = new Date(log.created_at).getTime();
        const now = Date.now();

        // Weekly calculations
        weeklyUsed += t;
        if (!oldestWeeklyLog || logTime < new Date(oldestWeeklyLog.created_at).getTime()) {
          oldestWeeklyLog = log;
        }

        // 5-hour calculations (fixed block window)
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

    const fiveHourReset = blockStart 
      ? new Date(blockStart + 5 * 60 * 60 * 1000).toISOString()
      : null;

    const weeklyReset = oldestWeeklyLog
      ? new Date(new Date(oldestWeeklyLog.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Build usage response based on tier
    const isFree = tier === "free";
    const currentPeriodEnd = subData && subData.status !== "expired" && subData.status !== "canceled"
      ? subData.current_period_end
      : null;

    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const monthlyReset = currentPeriodEnd || endOfMonth;

    const usage = {
      tier,
      planName: baseConfig.name,
      currentPeriodEnd,
      resources: [
        {
          id: "ai_tokens_5h",
          label: "5-hour remaining",
          icon: "brain",
          used: fiveHourUsed,
          limit: config.aiTokensPer5Hours,
          period: "últimas 5 horas",
          color: "#D946EF", // fuchsia
          formatAsK: true,
          resetTime: fiveHourReset,
        },
        {
          id: "ai_tokens_weekly",
          label: "Weekly remaining",
          icon: "briefcase",
          used: weeklyUsed,
          limit: config.aiTokensPerWeek,
          period: "últimos 7 días",
          color: "#EC4899", // pink
          formatAsK: true,
          resetTime: weeklyReset,
        },
        {
          id: "ai_tokens",
          label: isFree ? "Lifetime quota" : "Monthly quota",
          icon: "cpu",
          used: isFree 
            ? (lifetime?.ai_tokens_total || 0) 
            : (monthly?.ai_tokens || 0),
          limit: isFree ? config.aiLifetimeTokens : config.aiTokensPerMonth,
          period: isFree ? "de por vida" : "este mes",
          color: "#8B5CF6", // violet
          formatAsK: true,
          resetTime: isFree ? null : monthlyReset,
        },
      ],
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[/api/user/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
