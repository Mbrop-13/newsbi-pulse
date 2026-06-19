import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

export const revalidate = 300; // Cache 5 minutes

const MARKET_SYMBOLS = [
  { symbol: "^GSPC", name: "S&P 500", shortName: "S&P 500" },
  { symbol: "^IXIC", name: "NASDAQ", shortName: "NASDAQ" },
  { symbol: "BTC-USD", name: "Bitcoin", shortName: "Bitcoin" },
  { symbol: "^VIX", name: "VIX", shortName: "VIX" },
];

const TRENDING_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META"];

export async function GET() {
  try {
    const yf = new YahooFinance();

    // Fetch market indices
    const marketQuotes = await yf.quote(MARKET_SYMBOLS.map(s => s.symbol));
    const marketArray = Array.isArray(marketQuotes) ? marketQuotes : [marketQuotes];

    const markets = MARKET_SYMBOLS.map((item) => {
      const q = marketArray.find((mq: any) => mq?.symbol === item.symbol) || ({} as any);
      return {
        symbol: item.symbol,
        name: item.shortName,
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        currency: q.currency || "USD",
      };
    });

    // Fetch trending stocks
    const trendingQuotes = await yf.quote(TRENDING_SYMBOLS);
    const trendingArray = Array.isArray(trendingQuotes) ? trendingQuotes : [trendingQuotes];

    const trending = trendingArray.map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      currency: q.currency || "USD",
    })).sort((a: any, b: any) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

    return NextResponse.json({ markets, trending }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" }
    });
  } catch (error: any) {
    console.error("[Market Overview] Error:", error);
    return NextResponse.json({ markets: [], trending: [] }, { status: 200 });
  }
}
