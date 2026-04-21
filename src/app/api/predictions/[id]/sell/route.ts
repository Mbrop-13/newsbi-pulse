import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase";

// POST: Sell shares for diamonds early (Cashout)
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
    const { side, shares: inputShares } = body;

    if (!["a", "b"].includes(side)) {
      return NextResponse.json({ error: "Invalid side" }, { status: 400 });
    }
    if (!inputShares || inputShares <= 0) {
      return NextResponse.json({ error: "Shares must be positive" }, { status: 400 });
    }

    const sc = createServiceClient();

    // 1. Get prediction
    const { data: prediction } = await sc
      .from("predictions")
      .select("*")
      .eq("id", id)
      .single();

    if (!prediction) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    if (prediction.status !== "active") return NextResponse.json({ error: "Market is not active" }, { status: 400 });

    const poolThis = Number(side === "a" ? prediction.pool_a : prediction.pool_b);
    const poolOther = Number(side === "a" ? prediction.pool_b : prediction.pool_a);
    const probThis = poolThis / (poolThis + poolOther);

    // Sell price = shares × current probability × (1 - 5% spread fee)
    // ALWAYS floor to integer — diamonds are whole numbers
    const SELL_FEE = 0.05;
    const sharesToBurn = Number(Number(inputShares).toFixed(2));
    const amount = Number((sharesToBurn * probThis * (1 - SELL_FEE)).toFixed(2));

    if (amount <= 0) {
      return NextResponse.json({ error: "Cantidad demasiado pequeña para vender" }, { status: 400 });
    }

    // 2. Check user's shares FIRST (before any mutations)
    const { data: bets } = await sc
      .from("user_bets")
      .select("*")
      .eq("user_id", user.id)
      .eq("prediction_id", id)
      .eq("side", side);

    const totalOwnedShares = (bets || []).reduce((sum, b) => sum + Number(b.shares || 0), 0);
    
    if (totalOwnedShares < sharesToBurn - 0.01) {
      const maxDiamonds = Number((totalOwnedShares * probThis * (1 - SELL_FEE)).toFixed(2));
      return NextResponse.json({ 
        error: `No tienes suficientes participaciones. Tienes ${Number(totalOwnedShares.toFixed(2))} shares (≈${maxDiamonds} 💎)` 
      }, { status: 400 });
    }

    // 3. Refund diamonds to user FIRST (if this fails, no orphaned records)
    const { data: diamonds } = await sc
      .from("user_diamonds")
      .select("balance")
      .eq("user_id", user.id)
      .single();

    if (!diamonds) {
      return NextResponse.json({ error: "No se encontró tu balance de diamantes" }, { status: 400 });
    }

    const newBalance = Number((Number(diamonds.balance) + amount).toFixed(2));
    const { error: diamondErr } = await sc
      .from("user_diamonds")
      .update({ balance: newBalance })
      .eq("user_id", user.id);

    if (diamondErr) throw diamondErr;

    // 4. NOW burn the shares (safe because diamonds already updated)
    const { error: betErr } = await sc
      .from("user_bets")
      .insert({
        user_id: user.id,
        prediction_id: id,
        side,
        amount: -amount,
        shares: -sharesToBurn,
      });

    if (betErr) throw betErr;

    // 5. Update pools
    const poolUpdate = side === "a"
      ? { pool_a: Math.max(0, Number(prediction.pool_a) - amount) }
      : { pool_b: Math.max(0, Number(prediction.pool_b) - amount) };

    await sc
      .from("predictions")
      .update({
        ...poolUpdate,
        total_volume: Number(prediction.total_volume || 0) + amount,
      })
      .eq("id", id);

    // Return updated state
    const newPoolA = side === "a" ? Math.max(0, Number(prediction.pool_a) - amount) : Number(prediction.pool_a);
    const newPoolB = side === "b" ? Math.max(0, Number(prediction.pool_b) - amount) : Number(prediction.pool_b);

    return NextResponse.json({
      success: true,
      newBalance,
      prob_a: newPoolA / (newPoolA + newPoolB || 1),
      prob_b: newPoolB / (newPoolA + newPoolB || 1),
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
