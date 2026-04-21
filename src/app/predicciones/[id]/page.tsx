import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { PredictionClientPage } from "./client-page";
import { notFound } from "next/navigation";

export default async function PredictionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const supabase = await createClient();

  // We need service_role to bypass RLS on user_bets and get the full history
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key"
  );

  // 1. Fetch the specific prediction using ID or Slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  let query = supabaseAdmin
    .from("predictions")
    .select("*, user_bets(id, side, amount, shares, user_id, created_at)");
    
  if (isUUID) {
    query = query.eq("id", id);
  } else {
    query = query.eq("slug", id);
  }

  const { data: prediction, error } = await query.single();

  if (error || !prediction) {
    notFound();
  }

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
    const amt = Number(bet.amount || 0);
    if (bet.side === 'a') currentA = Math.max(1, currentA + amt);
    else currentB = Math.max(1, currentB + amt);
    
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

  const prob_a = prediction.pool_a / (prediction.pool_a + prediction.pool_b);
  const prob_b = prediction.pool_b / (prediction.pool_a + prediction.pool_b);
  
  const fullPrediction = {
    ...prediction,
    prob_a,
    prob_b,
    history,
  };

  // 2. Build tag query for matching news
  let newsArticles = [];
  if (prediction.tags && prediction.tags.length > 0) {
    let allTagsToMatch: string[] = [];
    prediction.tags.forEach((t: string) => {
      if (!t) return;
      allTagsToMatch.push(t);
      allTagsToMatch.push(t.toLowerCase());
      allTagsToMatch.push(t.toUpperCase());
      allTagsToMatch.push(t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
    });
    // Limpiar duplicados para la query
    allTagsToMatch = Array.from(new Set(allTagsToMatch));

    const { data: articles } = await supabase
      .from("news_articles")
      .select("*")
      .overlaps('tags', allTagsToMatch)
      .order("published_at", { ascending: false })
      .limit(10);
      
    if (articles) {
      newsArticles = articles;
    }
  }

  return <PredictionClientPage initialPrediction={fullPrediction} initialNews={newsArticles} initialMyBets={myBets} />;
}
