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
    const today = new Date().toISOString().slice(0, 10);

    // Fetch all usage data in parallel
    const [monthlyRes, lifetimeRes, dailyRes, alertsRes, portfolioRes] = await Promise.all([
      serviceClient
        .from("monthly_usage")
        .select("ai_messages, tts_audios, ai_tokens")
        .eq("user_id", user.id)
        .eq("month", currentMonth)
        .maybeSingle(),
      serviceClient
        .from("lifetime_usage")
        .select("ai_messages_total, ai_tokens_total")
        .eq("user_id", user.id)
        .maybeSingle(),
      serviceClient
        .from("daily_usage")
        .select("tts_audios")
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle(),
      serviceClient
        .from("price_alerts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_active", true),
      serviceClient
        .from("portfolio_assets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const monthly = monthlyRes.data;
    const lifetime = lifetimeRes.data;
    const daily = dailyRes.data;

    // Build usage response based on tier
    const isFree = tier === "free";

    const usage = {
      tier,
      planName: baseConfig.name,
      resources: [
        {
          id: "ai_messages",
          label: "Mensajes IA",
          icon: "brain",
          used: isFree 
            ? (lifetime?.ai_messages_total || 0) 
            : (monthly?.ai_messages || 0),
          limit: isFree ? config.aiLifetimeMessages : config.aiMessagesPerMonth,
          period: isFree ? "de por vida" : "este mes",
          color: "#6366F1", // indigo
        },
        {
          id: "ai_tokens",
          label: "Tokens IA",
          icon: "cpu",
          used: isFree 
            ? (lifetime?.ai_tokens_total || 0) 
            : (monthly?.ai_tokens || 0),
          limit: isFree ? config.aiLifetimeTokens : config.aiTokensPerMonth,
          period: isFree ? "de por vida" : "este mes",
          color: "#8B5CF6", // violet
          formatAsK: true,
        },
        {
          id: "tts_audios",
          label: "Audios TTS",
          icon: "volume",
          used: isFree 
            ? (daily?.tts_audios || 0) 
            : (monthly?.tts_audios || 0),
          limit: isFree ? config.ttsDailyLimit : config.ttsAudiosPerMonth,
          period: isFree ? "hoy" : "este mes",
          color: "#EC4899", // pink
        },
        {
          id: "price_alerts",
          label: "Alertas Activas",
          icon: "bell",
          used: alertsRes.count || 0,
          limit: config.maxActiveAlerts,
          period: "activas",
          color: "#F59E0B", // amber
        },
        {
          id: "portfolio_assets",
          label: "Activos en Portafolio",
          icon: "briefcase",
          used: portfolioRes.count || 0,
          limit: config.maxPortfolioAssets,
          period: "total",
          color: "#10B981", // emerald
        },
      ],
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[/api/user/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
