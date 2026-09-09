import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findQuote, getLiveQuotes, quoteKey } from "@/lib/market-quotes";

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

  const symbols = symbolsParam.split(",").map(s => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const quotes = await getLiveQuotes(symbols);
    const results = symbols.map((raw) => {
      const live = findQuote(quotes, raw);
      const symbol = (live?.symbol || quoteKey(raw) || raw).toUpperCase();
      return {
        symbol,
        price: live?.price ?? null,
        change: live?.change ?? null,
        changePercent: live?.changePercent ?? null,
        currency: live?.currency ?? null,
        quote_ok: !!(live && live.price > 0),
        regularMarketTime: live?.asOf ?? null,
        logo: `https://assets.parqet.com/logos/symbol/${symbol}`,
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Yahoo Finance Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio data" }, { status: 500 });
  }
}
