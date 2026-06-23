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
    const [monthlyRes, lifetimeRes, logsRes] = await Promise.all([
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
    ]);

    const monthly = monthlyRes.data;
    const lifetime = lifetimeRes.data;
    const logs = logsRes.data;

    let fiveHourUsed = 0;
    let weeklyUsed = 0;

    if (logs) {
      logs.forEach((log) => {
        const t = log.tokens || 0;
        weeklyUsed += t;
        if (new Date(log.created_at) >= new Date(fiveHoursAgo)) {
          fiveHourUsed += t;
        }
      });
    }

    // Build usage response based on tier
    const isFree = tier === "free";

    const usage = {
      tier,
      planName: baseConfig.name,
      resources: [
        {
          id: "ai_tokens_5h",
          label: "Tokens IA (5 horas)",
          icon: "brain",
          used: fiveHourUsed,
          limit: config.aiTokensPer5Hours,
          period: "últimas 5 horas",
          color: "#D946EF", // fuchsia
          formatAsK: true,
        },
        {
          id: "ai_tokens_weekly",
          label: "Tokens IA (Semanal)",
          icon: "briefcase",
          used: weeklyUsed,
          limit: config.aiTokensPerWeek,
          period: "últimos 7 días",
          color: "#EC4899", // pink
          formatAsK: true,
        },
        {
          id: "ai_tokens",
          label: isFree ? "Tokens IA (Vida)" : "Tokens IA (Mensual)",
          icon: "cpu",
          used: isFree 
            ? (lifetime?.ai_tokens_total || 0) 
            : (monthly?.ai_tokens || 0),
          limit: isFree ? config.aiLifetimeTokens : config.aiTokensPerMonth,
          period: isFree ? "de por vida" : "este mes",
          color: "#8B5CF6", // violet
          formatAsK: true,
        },
      ],
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[/api/user/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
