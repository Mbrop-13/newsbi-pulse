import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    const results = await yahooFinance.search(query, {
      quotesCount: 5,
      newsCount: 0,
      enableFuzzyQuery: true
    });

    return NextResponse.json({ quotes: results.quotes });
  } catch (error) {
    console.error("Yahoo Finance Search Error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
