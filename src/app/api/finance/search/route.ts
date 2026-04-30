import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    const results = (await yf.search(query, {
      quotesCount: 8,
      newsCount: 0,
    })) as any;

    // Filter only equities/ETFs with valid symbols
    const filtered = (results.quotes || []).filter(
      (q: any) => q.symbol && q.isYahooFinance && (q.quoteType === "EQUITY" || q.quoteType === "ETF")
    );

    return NextResponse.json({ quotes: filtered });
  } catch (error) {
    console.error("Yahoo Finance Search Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
