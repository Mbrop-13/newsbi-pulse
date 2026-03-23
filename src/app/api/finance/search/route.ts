import { NextResponse } from 'next/server';
const { default: YahooFinance } = require('yahoo-finance2');
const yf = new YahooFinance();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  
  if (!q) {
    return NextResponse.json({ error: 'El parámetro "q" es requerido' }, { status: 400 });
  }

  try {
    const results = await yf.search(q, {
       newsCount: 0,
       quotesCount: 8
    });
    
    // Filtramos para retornar solo entidades válidas de mercado
    const quotes = results.quotes.filter((q: any) => q.isYahooFinance).map((q: any) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchDisp || q.exchange || ''
    }));

    return NextResponse.json(quotes);
  } catch (error: any) {
    console.error('Yahoo Finance Search API Error:', error);
    return NextResponse.json({ error: error.message || 'Error fetching finance data' }, { status: 500 });
  }
}
