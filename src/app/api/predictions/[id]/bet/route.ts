import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

// POST: Place a bet using diamonds
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { side, amount: rawAmount } = body;
    const amount = Number(Number(rawAmount).toFixed(2)); // Max 2 decimals for DB

    if (!["a", "b"].includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }
    if (!amount || amount < 1 || amount > 10000) {
      return NextResponse.json({ error: "Amount must be between 1 and 10000" }, { status: 400 });
    }

    const sc = createServiceClient();

    // 1. Check user diamond balance
    const { data: diamonds } = await sc
      .from("user_diamonds")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!diamonds || Number(diamonds.balance) < amount) {
      return NextResponse.json({ error: "Insufficient diamonds" }, { status: 400 });
    }

    // 2. Get prediction
    const { data: prediction } = await sc
      .from("predictions")
      .select("*")
      .eq("id", id)
      .single();

    if (!prediction) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    if (prediction.status !== "active") return NextResponse.json({ error: "Market is not active" }, { status: 400 });

    // 3. Calculate shares
    const poolThis = Number(side === "a" ? prediction.pool_a : prediction.pool_b);
    const poolOther = Number(side === "a" ? prediction.pool_b : prediction.pool_a);
    
    // Fixed odds AMM: Price is simply the probability.
    const probThis = poolThis / (poolThis + poolOther);
    // CPMM: fixed odds model where shares = amount / probability
    const shares = Number((amount / probThis).toFixed(2)); // round to 2 decimals

    // 4. Update pools (liquidity moves to adjust the probability)
    const poolUpdate = side === "a"
      ? { pool_a: Number(prediction.pool_a) + amount }
      : { pool_b: Number(prediction.pool_b) + amount };

    const { error: updateErr } = await sc
      .from("predictions")
      .update({
        ...poolUpdate,
        total_volume: Number(prediction.total_volume || 0) + amount,
      })
      .eq("id", id);

    if (updateErr) throw updateErr;

    // 5. Deduct diamonds (always integer)
    const newBalance = Number((Number(diamonds.balance) - amount).toFixed(2));
    const { error: diamondErr } = await sc
      .from("user_diamonds")
      .update({ balance: newBalance })
      .eq("user_id", user.id);

    if (diamondErr) throw diamondErr;

    // 6. Record bet
    const { data: bet, error: betErr } = await sc
      .from("user_bets")
      .insert({
        user_id: user.id,
        prediction_id: id,
        side,
        amount,
        shares,
      })
      .select()
      .single();

    if (betErr) throw betErr;

    // Return updated state
    const newPoolA = side === "a" ? Number(prediction.pool_a) + amount : Number(prediction.pool_a);
    const newPoolB = side === "b" ? Number(prediction.pool_b) + amount : Number(prediction.pool_b);

    return NextResponse.json({
      success: true,
      bet,
      newBalance,
      prob_a: newPoolA / (newPoolA + newPoolB),
      prob_b: newPoolB / (newPoolA + newPoolB),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
