import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Get referral code
    const { data: codeData } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", user.id)
      .single();

    // Get number of successful referrals
    const { count: referralsCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id);

    // Get claimed rewards
    const { data: claimedRewards } = await supabase
      .from("referral_rewards")
      .select("milestone")
      .eq("user_id", user.id);

    const claimedMilestones = claimedRewards?.map(r => r.milestone) || [];

    return NextResponse.json({
      code: codeData?.code || null,
      referralsCount: referralsCount || 0,
      claimedMilestones,
    });
  } catch (error) {
    console.error("[Referrals GET Error]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
