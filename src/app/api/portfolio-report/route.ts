import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserTier } from "@/lib/check-limits";
import { callOpenRouter } from "@/lib/openrouter";
import { createClient as createAdmin } from "@supabase/supabase-js";
import YahooFinance from "yahoo-finance2";

export const maxDuration = 120;

const REPORT_LIMITS: Record<string, number> = {
  free: 0, pro: 4, max: 8, ultra: -1,
};

function getSupabaseAdmin() {
  return createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── Calculate RSI from closing prices ──
function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return +(100 - 100 / (1 + rs)).toFixed(2);
}

// ── Calculate SMA ──
function calculateSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return +(slice.reduce((s, v) => s + v, 0) / period).toFixed(2);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const tier = await getUserTier(user.id);
    const limit = REPORT_LIMITS[tier] ?? 0;

    if (limit === 0) {
      return new Response(JSON.stringify({ error: "Los informes están disponibles a partir del plan Pro.", code: "PLAN_REQUIRED" }), { status: 403 });
    }

    // Check monthly usage
    if (limit > 0) {
      const admin = getSupabaseAdmin();
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data: usage } = await admin.from("monthly_usage")
        .select("portfolio_reports").eq("user_id", user.id).eq("month", currentMonth).maybeSingle();
      if (usage && (usage.portfolio_reports || 0) >= limit) {
        return new Response(JSON.stringify({ error: `Has alcanzado el límite de ${limit} informes este mes.`, code: "LIMIT_REACHED" }), { status: 403 });
      }
    }

    // Get portfolio
    const { data: portfolio } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
    if (!portfolio || portfolio.length === 0) {
      return new Response(JSON.stringify({ error: "No tienes activos en tu portafolio." }), { status: 400 });
    }

    const yf = new YahooFinance();
    const stockDataArray: any[] = [];

    for (const asset of portfolio) {
      try {
        const s = asset.symbol.toUpperCase();
        const [summary, hist] = await Promise.all([
          yf.quoteSummary(s, { modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'assetProfile'] }),
          yf.historical(s, { period1: new Date(Date.now() - 365 * 24 * 3600000).toISOString().split('T')[0] }).catch(() => []),
        ]);

        const p = summary.price || {} as any;
        const sd = summary.summaryDetail || {} as any;
        const ks = summary.defaultKeyStatistics || {} as any;
        const fd = summary.financialData || {} as any;
        const ap = summary.assetProfile || {} as any;

        const closes = (hist as any[]).map((h: any) => h.close).filter(Boolean);
        const volumes = (hist as any[]).map((h: any) => h.volume).filter(Boolean);
        const avgVol = volumes.length > 20 ? Math.round(volumes.slice(-20).reduce((a: number, b: number) => a + b, 0) / 20) : null;

        stockDataArray.push({
          symbol: s,
          company_name: p.shortName || p.longName || s,
          sector: ap.sector || 'N/A',
          industry: ap.industry || 'N/A',
          shares: asset.shares || 0,
          average_price: asset.average_price || 0,
          // Price
          price: p.regularMarketPrice,
          change_pct_1d: p.regularMarketChangePercent,
          currency: p.currency || 'USD',
          market_cap: p.marketCap,
          // Fundamental
          pe_trailing: sd.trailingPE, pe_forward: sd.forwardPE,
          pb: ks.priceToBook, peg: ks.pegRatio,
          eps_trailing: ks.trailingEps, eps_forward: ks.forwardEps,
          roe: fd.returnOnEquity, roa: fd.returnOnAssets,
          profit_margin: fd.profitMargins, operating_margin: fd.operatingMargins, gross_margin: fd.grossMargins,
          revenue_growth: fd.revenueGrowth, earnings_growth: fd.earningsGrowth,
          debt_to_equity: fd.debtToEquity, current_ratio: fd.currentRatio,
          total_debt: fd.totalDebt, total_cash: fd.totalCash,
          dividend_yield: sd.dividendYield, payout_ratio: sd.payoutRatio,
          beta: sd.beta,
          // Technical (server-calculated)
          week52_high: sd.fiftyTwoWeekHigh, week52_low: sd.fiftyTwoWeekLow,
          sma_20: calculateSMA(closes, 20),
          sma_50: calculateSMA(closes, 50),
          sma_200: calculateSMA(closes, 200),
          rsi_14: calculateRSI(closes),
          avg_volume_20d: avgVol,
          current_volume: sd.volume,
          // Price performance
          pct_from_52w_high: sd.fiftyTwoWeekHigh ? +((p.regularMarketPrice - sd.fiftyTwoWeekHigh) / sd.fiftyTwoWeekHigh * 100).toFixed(2) : null,
          pct_from_52w_low: sd.fiftyTwoWeekLow ? +((p.regularMarketPrice - sd.fiftyTwoWeekLow) / sd.fiftyTwoWeekLow * 100).toFixed(2) : null,
        });
      } catch (e: any) {
        stockDataArray.push({ symbol: asset.symbol, error: e.message });
      }
      await new Promise(r => setTimeout(r, 250));
    }

    // Build the mega-prompt
    const today = new Date().toLocaleDateString('es-CL', { dateStyle: 'full', timeZone: 'America/Santiago' });

    const SYSTEM_PROMPT = `Eres un analista financiero senior de élite que trabaja para "Reclu", una plataforma de inteligencia financiera. Generas informes de portafolio extremadamente técnicos y profesionales en ESPAÑOL.

REGLAS ESTRICTAS:
1. Responde ÚNICAMENTE con JSON válido puro. Sin markdown, sin explicaciones fuera del JSON.
2. Usa las métricas financieras proporcionadas para hacer cálculos y análisis REALES con fórmulas.
3. Busca en la web noticias recientes de cada empresa para enriquecer el análisis.
4. NUNCA des consejos de inversión directos. En su lugar, di "Otros inversionistas en esta situación considerarían..." o "El consenso del mercado sugiere...".
5. Sé extremadamente técnico: incluye fórmulas, ratios, comparaciones con benchmarks del sector.
6. El campo "formula_examples" debe mostrar cálculos REALES con los números proporcionados.`;

    const stockDataStr = stockDataArray.map(s => {
      if (s.error) return `${s.symbol}: ERROR - ${s.error}`;
      return `═══ ${s.symbol} (${s.company_name}) ═══
Sector: ${s.sector} | Industria: ${s.industry}
Posición: ${s.shares} acciones @ avg $${s.average_price}
Precio: $${s.price} (${s.change_pct_1d > 0 ? '+' : ''}${s.change_pct_1d?.toFixed(2)}% hoy) | Market Cap: $${s.market_cap}
── Valoración ──
P/E trailing: ${s.pe_trailing ?? 'N/A'} | P/E forward: ${s.pe_forward ?? 'N/A'} | P/B: ${s.pb ?? 'N/A'} | PEG: ${s.peg ?? 'N/A'}
EPS trailing: $${s.eps_trailing ?? 'N/A'} | EPS forward: $${s.eps_forward ?? 'N/A'}
── Rentabilidad ──
ROE: ${s.roe != null ? (s.roe * 100).toFixed(2) + '%' : 'N/A'} | ROA: ${s.roa != null ? (s.roa * 100).toFixed(2) + '%' : 'N/A'}
Margen bruto: ${s.gross_margin != null ? (s.gross_margin * 100).toFixed(1) + '%' : 'N/A'} | Op: ${s.operating_margin != null ? (s.operating_margin * 100).toFixed(1) + '%' : 'N/A'} | Neto: ${s.profit_margin != null ? (s.profit_margin * 100).toFixed(1) + '%' : 'N/A'}
── Crecimiento ──
Revenue growth: ${s.revenue_growth != null ? (s.revenue_growth * 100).toFixed(1) + '%' : 'N/A'} | Earnings growth: ${s.earnings_growth != null ? (s.earnings_growth * 100).toFixed(1) + '%' : 'N/A'}
── Salud financiera ──
D/E: ${s.debt_to_equity ?? 'N/A'} | Current ratio: ${s.current_ratio ?? 'N/A'}
Deuda total: $${s.total_debt ?? 'N/A'} | Cash: $${s.total_cash ?? 'N/A'}
Div yield: ${s.dividend_yield != null ? (s.dividend_yield * 100).toFixed(2) + '%' : 'N/A'} | Payout: ${s.payout_ratio != null ? (s.payout_ratio * 100).toFixed(1) + '%' : 'N/A'}
Beta: ${s.beta ?? 'N/A'}
── Técnico (calculado) ──
SMA20: $${s.sma_20 ?? 'N/A'} | SMA50: $${s.sma_50 ?? 'N/A'} | SMA200: $${s.sma_200 ?? 'N/A'}
RSI(14): ${s.rsi_14 ?? 'N/A'}
52w High: $${s.week52_high} (${s.pct_from_52w_high}%) | 52w Low: $${s.week52_low} (+${s.pct_from_52w_low}%)`;
    }).join('\n\n');

    const userPrompt = `Fecha del informe: ${today}

DATOS DEL PORTAFOLIO (${stockDataArray.filter(s => !s.error).length} activos):

${stockDataStr}

Genera un informe financiero profesional con esta estructura JSON EXACTA:
{
  "title": "Informe de Portafolio — [Fecha]",
  "executive_summary": "Resumen ejecutivo de 3-4 oraciones con las conclusiones principales del portafolio. Menciona el rendimiento general y los puntos más relevantes.",
  "market_context": "Párrafo sobre el contexto actual del mercado (busca noticias recientes). Cómo afecta al portafolio.",
  "alerts": [
    { "type": "danger|warning|info", "symbol": "TICKER", "title": "Título corto", "message": "Explicación de la alerta (ej: RSI en sobreventa, resultados negativos, deuda elevada)" }
  ],
  "analyses": [
    {
      "symbol": "TICKER",
      "company_name": "Nombre",
      "sector": "Sector",
      "price": 175.50,
      "change_pct": -1.2,
      "position_value": 17550,
      "pnl": 1250,
      "fundamental_analysis": "Análisis fundamental detallado (3-4 oraciones). Incluir P/E vs sector, márgenes, crecimiento.",
      "technical_analysis": "Análisis técnico (2-3 oraciones). Incluir señales SMA, RSI, soporte/resistencia.",
      "formula_examples": [
        "P/E = Precio ÷ EPS = $175.50 ÷ $6.42 = 27.3x (sector promedio: ~25x)",
        "RSI(14) = 45.2 → Zona neutral (30=sobreventa, 70=sobrecompra)",
        "Precio vs SMA200 = $175.50 vs $168.30 → +4.3% sobre tendencia largo plazo"
      ],
      "outlook": "Perspectiva a corto/mediano plazo (2 oraciones).",
      "verdict": "COMPRAR|MANTENER|VENDER",
      "verdict_reasoning": "Otros inversionistas en esta situación considerarían... porque..."
    }
  ],
  "recommendations_table": [
    { "symbol": "TICKER", "action": "MANTENER", "reasoning": "Explicación concisa del consenso", "risk_level": "BAJO|MEDIO|ALTO" }
  ],
  "portfolio_metrics": {
    "total_value": 50000,
    "total_pnl": 3200,
    "diversification_score": "BUENA|REGULAR|POBRE",
    "risk_assessment": "Evaluación general del riesgo del portafolio"
  },
  "disclaimer": "Este informe es generado por inteligencia artificial con fines informativos y educativos. No constituye asesoría financiera personalizada. Las decisiones de inversión son responsabilidad exclusiva del usuario. Rendimientos pasados no garantizan resultados futuros."
}`;

    const model = 'deepseek/deepseek-v4-flash';
    const { content, citations } = await callOpenRouter({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 8000,
      search: true,
    });

    // Parse the response
    let reportData: any;
    try {
      const cleaned = content.replace(/```json\n?|```/g, '').trim();
      reportData = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reportData = JSON.parse(jsonMatch[0]);
      } else {
        return new Response(JSON.stringify({ error: "Error al parsear el informe generado." }), { status: 500 });
      }
    }

    // Add citations from web search
    if (citations && citations.length > 0) {
      reportData.web_sources = citations;
    }

    const genTime = Date.now() - startTime;
    const title = reportData.title || `Informe de Portafolio — ${today}`;

    // Save to database
    const admin = getSupabaseAdmin();
    const { data: saved, error: saveError } = await admin.from("portfolio_reports").insert({
      user_id: user.id,
      title,
      report_data: reportData,
      symbols: stockDataArray.filter(s => !s.error).map(s => s.symbol),
      model_used: model,
      generation_time_ms: genTime,
    }).select("id, created_at").single();

    if (saveError) {
      console.error("[REPORT] Save error:", saveError);
      return new Response(JSON.stringify({ error: "Error al guardar el informe." }), { status: 500 });
    }

    // Increment monthly usage
    const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
    const { data: existing } = await admin.from("monthly_usage")
      .select("portfolio_reports").eq("user_id", user.id).eq("month", currentMonth).maybeSingle();
    if (existing) {
      await admin.from("monthly_usage").update({ portfolio_reports: (existing.portfolio_reports || 0) + 1 })
        .eq("user_id", user.id).eq("month", currentMonth);
    } else {
      await admin.from("monthly_usage").insert({ user_id: user.id, month: currentMonth, portfolio_reports: 1 });
    }

    return new Response(JSON.stringify({
      success: true,
      report: { id: saved.id, title, created_at: saved.created_at, report_data: reportData },
      generation_time_ms: genTime,
    }), { status: 200 });

  } catch (error: any) {
    console.error("[REPORT] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Error interno" }), { status: 500 });
  }
}

// GET — List user's reports
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data } = await supabase.from("portfolio_reports")
      .select("id, title, symbols, created_at, is_read, generation_time_ms")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({ reports: data || [] }), { status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
