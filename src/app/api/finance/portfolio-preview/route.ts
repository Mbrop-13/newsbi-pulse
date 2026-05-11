import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import YahooFinance from "yahoo-finance2";

export const dynamic = "force-dynamic";

/**
 * Lightweight endpoint that returns a quick snapshot of the user's portfolio
 * plus the latest 5 news headlines from Supabase.
 * Used by the PromptCarousel to pre-inject context into smart prompts.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ portfolio: [], news: [] });
    }

    // ── 1. Portfolio symbols ──
    const { data: dbAssets } = await supabase
      .from("portfolios")
      .select("symbol")
      .eq("user_id", user.id);

    let portfolioSummary: { symbol: string; price: number; changePercent: number }[] = [];

    if (dbAssets && dbAssets.length > 0) {
      const symbols = dbAssets.map((a: any) => a.symbol);
      const yf = new YahooFinance();
      
      const quotes = await Promise.allSettled(
        symbols.map((s: string) => yf.quote(s))
      );

      portfolioSummary = quotes
        .map((result, i) => {
          if (result.status === "fulfilled" && result.value) {
            const q = result.value;
            return {
              symbol: symbols[i],
              price: q.regularMarketPrice ?? 0,
              changePercent: q.regularMarketChangePercent ?? 0,
            };
          }
          return null;
        })
        .filter(Boolean) as any;
    }

    // ── 2. Latest news headlines ──
    const { data: newsData } = await supabase
      .from("articles")
      .select("title, category")
      .order("published_at", { ascending: false })
      .limit(5);

    const newsHeadlines = (newsData || []).map((n: any) => n.title);

    return NextResponse.json({
      portfolio: portfolioSummary,
      news: newsHeadlines,
    });
  } catch (error) {
    console.error("portfolio-preview error:", error);
    return NextResponse.json({ portfolio: [], news: [] });
  }
}
