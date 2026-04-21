import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET: Single prediction detail + user's bets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // We need service_role to bypass RLS on user_bets and get the full history
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
    );

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let query = supabaseAdmin
      .from("predictions")
      .select("*, user_bets(id, side, amount, created_at, user_id)");
      
    if (isUUID) {
      query = query.eq("id", id);
    } else {
      query = query.eq("slug", id);
    }

    const { data: prediction, error } = await query.single();

    if (error || !prediction) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch user's own bets separately for their profile
    const { data: { user } } = await supabase.auth.getUser();
    let myBets: any[] = [];
    if (user) {
      myBets = (prediction.user_bets || []).filter((b: any) => b.user_id === user.id);
    }
    
    // Reconstruct history
    const bets = (prediction.user_bets || []).sort((a: any, b: any) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    let currentA = prediction.initial_liquidity || 300;
    let currentB = prediction.initial_liquidity || 300;
    
    const history = [{
      date: new Date(prediction.created_at).toISOString(),
      probA: currentA / (currentA + currentB)
    }];

    bets.forEach((bet: any) => {
      if (bet.side === 'a') currentA += bet.amount;
      else currentB += bet.amount;
      
      history.push({
        date: new Date(bet.created_at).toISOString(),
        probA: currentA / (currentA + currentB)
      });
    });

    if (prediction.status === 'active') {
      history.push({
        date: new Date().toISOString(),
        probA: prediction.pool_a / (prediction.pool_a + prediction.pool_b)
      });
    }

    delete prediction.user_bets;

    return NextResponse.json({
      prediction: {
        ...prediction,
        prob_a: prediction.pool_a / (prediction.pool_a + prediction.pool_b),
        prob_b: prediction.pool_b / (prediction.pool_a + prediction.pool_b),
        history,
      },
      myBets,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
