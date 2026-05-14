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

    // Get successful referrals
    const { data: referrals, count: referralsCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact" })
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });
      
    // Fetch user details for referrals using service role
    let referredUsers: any[] = [];
    if (referrals && referrals.length > 0) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const adminAuth = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const referredIds = referrals.map(r => r.referred_id);
      
      // Get emails from auth.admin
      // Note: Supabase admin listUsers doesn't support easy filtering by multiple IDs,
      // but we can query profiles if they exist, or just use listUsers for small scale.
      const { data: profilesData } = await adminAuth
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", referredIds)
        .catch(() => ({ data: [] })); // fail gracefully if profiles doesn't exist
        
      referredUsers = referrals.map(r => {
        const profile = profilesData?.find(p => p.id === r.referred_id);
        return {
          id: r.id,
          date: r.created_at,
          name: profile?.full_name || "Usuario Anónimo",
          avatar: profile?.avatar_url || null
        };
      });
    }

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
      referredUsers,
    });
  } catch (error) {
    console.error("[Referrals GET Error]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
