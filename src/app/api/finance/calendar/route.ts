import { NextResponse } from "next/server";
import yahooFinance from "yahoo-finance2";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolsParam = searchParams.get("symbols");

    if (!symbolsParam) {
      return NextResponse.json({ events: [] });
    }

    const symbols = symbolsParam.split(",").map(s => s.trim().toUpperCase()).slice(0, 10);
    const events = [];

    for (const symbol of symbols) {
      try {
        const summary = await yahooFinance.quoteSummary(symbol, { modules: ['calendarEvents', 'price'] }) as any;
        const calendar = summary.calendarEvents;
        const price = summary.price;
        
        if (calendar && calendar.earnings) {
          const earningsDates = calendar.earnings.earningsDate || [];
          for (const date of earningsDates) {
            // Check if date is valid and in the future (or very recent past)
            if (date && !isNaN(date.getTime())) {
              events.push({
                symbol,
                company_name: price?.shortName || symbol,
                type: "Earnings",
                date: date.toISOString(),
                // Sometimes YF provides an earnings average estimate
                revenue_estimate: calendar.earnings.revenueAverage?.raw,
                earnings_estimate: calendar.earnings.earningsAverage?.raw,
              });
            }
          }
        }
        
        if (calendar && calendar.exDividendDate) {
           const divDate = calendar.exDividendDate;
           if (divDate && !isNaN(divDate.getTime())) {
             events.push({
                symbol,
                company_name: price?.shortName || symbol,
                type: "Ex-Dividend",
                date: divDate.toISOString()
             });
           }
        }
      } catch (e) {
        console.error(`Error fetching calendar for ${symbol}:`, e);
      }
      
      // Delay to avoid rate limits
      await new Promise(r => setTimeout(r, 200));
    }

    // Sort by date ascending
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter out events older than 3 days
    const now = new Date();
    const threeDaysAgo = new Date(now.setDate(now.getDate() - 3));
    
    const futureEvents = events.filter(e => new Date(e.date) >= threeDaysAgo);

    return NextResponse.json({ events: futureEvents });
  } catch (error: any) {
    console.error("Finance Calendar API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
