import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// GET: List predictions (public)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag") || "";
    const status = searchParams.get("status") || "active";

    // We need service_role to bypass RLS on user_bets so we can reconstruct the full history for the chart
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
    );

    let query = supabaseAdmin
      .from("predictions")
      .select("*, user_bets(id, side, amount, created_at)")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (tag) query = query.contains("tags", [tag]);

    const { data, error } = await query;
    if (error) throw error;

    // Calculate probabilities and history
    const predictions = (data || []).map((p: any) => {
      // Reconstruct history
      const bets = (p.user_bets || []).sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      let currentA = p.initial_liquidity || 300;
      let currentB = p.initial_liquidity || 300;
      
      const history = [{
        date: new Date(p.created_at).toISOString(),
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

      // Add final current point if active
      if (p.status === 'active') {
        history.push({
          date: new Date().toISOString(),
          probA: p.pool_a / (p.pool_a + p.pool_b)
        });
      }

      // Cleanup large nested array before sending
      delete p.user_bets;

      return {
        ...p,
        prob_a: p.pool_a / (p.pool_a + p.pool_b),
        prob_b: p.pool_b / (p.pool_a + p.pool_b),
        history,
      };
    });

    return NextResponse.json({ predictions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
