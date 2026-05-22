import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Total registered users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Active subscriptions by tier
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("tier, status, created_at, current_period_end")
      .in("status", ["active", "trialing"]);

    const activePro = subscriptions?.filter(s => s.tier === "pro").length || 0;
    const activeMax = subscriptions?.filter(s => s.tier === "max").length || 0;
    const activeUltra = subscriptions?.filter(s => s.tier === "ultra").length || 0;
    const totalPaying = activePro + activeMax + activeUltra;
    const trialing = subscriptions?.filter(s => s.status === "trialing").length || 0;

    // Subscriptions created in last 30 days (new conversions)
    const newConversions30d = subscriptions?.filter(s => 
      new Date(s.created_at) > new Date(thirtyDaysAgo)
    ).length || 0;

    // Subscriptions created in last 7 days
    const newConversions7d = subscriptions?.filter(s => 
      new Date(s.created_at) > new Date(sevenDaysAgo)
    ).length || 0;

    // Churn: expired/canceled in last 30 days
    const { count: churned30d } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .in("status", ["canceled", "expired"])
      .gte("updated_at", thirtyDaysAgo);

    // Usage metrics - Monthly AI messages (top users)
    const currentMonth = now.toISOString().slice(0, 7) + "-01";
    const { data: aiUsage } = await supabase
      .from("monthly_usage")
      .select("user_id, ai_messages")
      .eq("month", currentMonth)
      .order("ai_messages", { ascending: false })
      .limit(10);

    // Monthly TTS usage
    const { data: ttsUsage } = await supabase
      .from("monthly_usage")
      .select("user_id, tts_audios")
      .eq("month", currentMonth)
      .order("tts_audios", { ascending: false })
      .limit(10);

    // Aggregate usage stats
    const { data: allAiUsage } = await supabase
      .from("monthly_usage")
      .select("ai_messages")
      .eq("month", currentMonth);
    
    const totalAiMessages = allAiUsage?.reduce((sum, r) => sum + (r.ai_messages || 0), 0) || 0;

    const { data: allTtsUsage } = await supabase
      .from("monthly_usage")
      .select("tts_audios")
      .eq("month", currentMonth);
    
    const totalTtsAudios = allTtsUsage?.reduce((sum, r) => sum + (r.tts_audios || 0), 0) || 0;

    // Portfolio count
    const { count: totalPortfolioAssets } = await supabase
      .from("portfolios")
      .select("*", { count: "exact", head: true });

    // Conversion rate
    const conversionRate = (totalUsers && totalUsers > 0) 
      ? ((totalPaying / totalUsers) * 100).toFixed(2) 
      : "0.00";

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalPaying,
        trialing,
        conversionRate: parseFloat(conversionRate),
        churned30d: churned30d || 0,
        newConversions30d,
        newConversions7d,
      },
      tiers: {
        pro: activePro,
        max: activeMax,
        ultra: activeUltra,
      },
      usage: {
        totalAiMessages,
        totalTtsAudios,
        totalPortfolioAssets: totalPortfolioAssets || 0,
        topAiUsers: aiUsage || [],
        topTtsUsers: ttsUsage || [],
      },
    });
  } catch (error: any) {
    console.error("[Conversion Metrics] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
