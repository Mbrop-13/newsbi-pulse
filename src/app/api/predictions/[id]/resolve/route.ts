import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

// POST: Resolve a prediction (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const sc = createServiceClient();
    const { data: adminRow } = await sc.from("admin_users").select("role").eq("user_id", user.id).single();
    if (!adminRow || adminRow.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { winner } = body; // "a" or "b"

    if (!["a", "b"].includes(winner)) {
      return NextResponse.json({ error: "Winner must be 'a' or 'b'" }, { status: 400 });
    }

    // Get prediction
    const { data: prediction } = await sc.from("predictions").select("*").eq("id", id).single();
    if (!prediction) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (prediction.status === "resolved") return NextResponse.json({ error: "Already resolved" }, { status: 400 });

    // Get all bets on the winning side
    const { data: winningBets } = await sc
      .from("user_bets")
      .select("*")
      .eq("prediction_id", id)
      .eq("side", winner);

    // Calculate total shares on winning side (just for stats)
    const totalWinningShares = (winningBets || []).reduce((sum: number, b: any) => sum + b.shares, 0);
    const totalPool = prediction.pool_a + prediction.pool_b;

    // Distribute winnings: 1 diamond per 1 winning share
    if (winningBets && winningBets.length > 0) {
      for (const bet of winningBets) {
        // Because of the AMM (shares = amount / prob), each share guarantees 1 payout unit.
        const payout = Math.floor(bet.shares);
        if (payout > 0) {
          // Add diamonds to winner
          const { data: userData } = await sc
            .from("user_diamonds")
            .select("balance")
            .eq("user_id", bet.user_id)
            .single();

          if (userData) {
            await sc
              .from("user_diamonds")
              .update({ balance: userData.balance + payout })
              .eq("user_id", bet.user_id);
          }
        }
      }
    }

    // Mark prediction as resolved
    await sc
      .from("predictions")
      .update({
        status: "resolved",
        winner,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      winner,
      totalPool,
      winnersCount: winningBets?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
