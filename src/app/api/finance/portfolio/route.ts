import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { createClient } from "@/lib/supabase/server";

const yf = new YahooFinance();

export async function GET(request: Request) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get("symbols");

  if (!symbolsParam) {
    return NextResponse.json({ error: "Missing symbols parameter" }, { status: 400 });
  }

  const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase());
  
  if (symbols.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const quotes = await yf.quote(symbols);
    // quote returns an array if multiple, or a single object if one
    const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

    const results = quoteArray.map((q: any) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePercent: q.regularMarketChangePercent,
      logo: `https://assets.parqet.com/logos/symbol/${q.symbol.toUpperCase()}`
    }));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Yahoo Finance Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 });
  }
}
