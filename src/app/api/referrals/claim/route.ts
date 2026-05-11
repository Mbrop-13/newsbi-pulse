import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

const MILESTONES_BASE = {
  1: { tier: "pro", daysToAdd: 10, monthsToAdd: 0 },
  3: { tier: "pro", daysToAdd: 0, monthsToAdd: 1 },
  5: { tier: "max", daysToAdd: 0, monthsToAdd: 1 },
  10: { tier: "max", daysToAdd: 0, monthsToAdd: 3 },
  25: { tier: "ultra", daysToAdd: 0, monthsToAdd: 3 },
};

export async function POST(request: NextRequest) {
  try {
    const { milestone } = await request.json();

    const baseMilestone = ((milestone - 1) % 25) + 1;

    if (![1, 3, 5, 10, 25].includes(baseMilestone)) {
      return NextResponse.json({ error: "Hito inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Check referrals count
    const { count: referralsCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    if ((referralsCount || 0) < milestone) {
      return NextResponse.json({ error: "No tienes suficientes referidos para este premio" }, { status: 400 });
    }

    // Use service client to bypass RLS for subscriptions update
    const serviceClient = createServiceClient();

    // Check if already claimed
    const { data: existingClaim } = await serviceClient
      .from("referral_rewards")
      .select("id")
      .eq("user_id", user.id)
      .eq("milestone", milestone)
      .maybeSingle();

    if (existingClaim) {
      return NextResponse.json({ error: "Este premio ya fue reclamado" }, { status: 400 });
    }

    // Get current subscription
    const { data: currentSub } = await serviceClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const reward = MILESTONES_BASE[baseMilestone as keyof typeof MILESTONES_BASE];
    const now = new Date();
    
    // Calculate new period end
    let currentEnd = currentSub?.current_period_end ? new Date(currentSub.current_period_end) : now;
    
    // If the subscription was expired or canceled, restart from NOW
    if (!currentSub || currentSub.status === "expired" || currentSub.status === "canceled" || currentEnd < now) {
      currentEnd = now;
    }
    
    // Add reward time
    if (reward.monthsToAdd > 0) {
      currentEnd.setMonth(currentEnd.getMonth() + reward.monthsToAdd);
    }
    if (reward.daysToAdd > 0) {
      currentEnd.setDate(currentEnd.getDate() + reward.daysToAdd);
    }

    // Give them the highest tier (don't downgrade them if they already have Ultra and claim a Pro reward)
    let newTier = reward.tier;
    const tierRanks = { free: 0, pro: 1, max: 2, ultra: 3 };
    const currentTierRank = tierRanks[(currentSub?.tier as keyof typeof tierRanks) || "free"];
    const rewardTierRank = tierRanks[reward.tier as keyof typeof tierRanks];
    
    if (currentTierRank > rewardTierRank) {
      newTier = currentSub!.tier; // keep their higher tier, but they still get the time extension
    }

    // Update Subscription
    const { error: subError } = await serviceClient
      .from("subscriptions")
      .upsert({
        user_id: user.id,
        tier: newTier,
        status: "active",
        current_period_start: (currentSub?.current_period_start ? new Date(currentSub.current_period_start) : now).toISOString(),
        current_period_end: currentEnd.toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: "user_id" });

    if (subError) {
      console.error("[Referrals Claim] Sub update error:", subError);
      return NextResponse.json({ error: "Error al aplicar la suscripción" }, { status: 500 });
    }

    // Mark as claimed
    await serviceClient.from("referral_rewards").insert({
      user_id: user.id,
      milestone,
      reward_tier: reward.tier,
    });

    return NextResponse.json({ success: true, tier: newTier, newPeriodEnd: currentEnd.toISOString() });

  } catch (error) {
    console.error("[Referrals Claim] Unexpected error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
