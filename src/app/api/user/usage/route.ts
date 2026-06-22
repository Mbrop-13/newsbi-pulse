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

    // Fetch only token usage in parallel
    const [monthlyRes, lifetimeRes] = await Promise.all([
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
    ]);

    const monthly = monthlyRes.data;
    const lifetime = lifetimeRes.data;

    // Build usage response based on tier
    const isFree = tier === "free";

    const usage = {
      tier,
      planName: baseConfig.name,
      resources: [
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
      ],
    };

    return NextResponse.json(usage);
  } catch (error) {
    console.error("[/api/user/usage] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
