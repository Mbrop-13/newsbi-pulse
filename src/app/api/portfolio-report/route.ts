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

// ── Calculate EMA ──
function calculateEMA(closes: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    ema.push(closes[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

// ── MACD (12, 26, 9) ──
function calculateMACD(closes: number[]): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null;
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calculateEMA(macdLine.slice(26), 9);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return { macd: +lastMacd.toFixed(4), signal: +lastSignal.toFixed(4), histogram: +(lastMacd - lastSignal).toFixed(4) };
}

// ── Bollinger Bands (20, 2σ) ──
function calculateBollinger(closes: number[]): { upper: number; middle: number; lower: number; bandwidth: number } | null {
  if (closes.length < 20) return null;
  const slice = closes.slice(-20);
  const mean = slice.reduce((a, b) => a + b, 0) / 20;
  const stdDev = Math.sqrt(slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / 20);
  return {
    upper: +(mean + 2 * stdDev).toFixed(2), middle: +mean.toFixed(2),
    lower: +(mean - 2 * stdDev).toFixed(2), bandwidth: +((4 * stdDev / mean) * 100).toFixed(2),
  };
}

// ── Annualized Volatility ──
function calculateVolatility(closes: number[]): number | null {
  if (closes.length < 30) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) returns.push(Math.log(closes[i] / closes[i - 1]));
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return +(Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2);
}

// ── Max Drawdown ──
function calculateMaxDrawdown(closes: number[]): number | null {
  if (closes.length < 2) return null;
  let maxDD = 0, peak = closes[0];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > peak) peak = closes[i];
    const dd = (peak - closes[i]) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return +(maxDD * 100).toFixed(2);
}

// ── Graham Intrinsic Value: V = EPS × (8.5 + 2g) ──
function calculateGrahamValue(eps: number | null, growthRate: number | null): number | null {
  if (!eps || eps <= 0) return null;
  const g = (growthRate || 0) * 100;
  return +(eps * (8.5 + 2 * g)).toFixed(2);
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
          // Advanced Technical (server-calculated)
          macd: calculateMACD(closes),
          bollinger: calculateBollinger(closes),
          volatility_annual: calculateVolatility(closes),
          max_drawdown_1y: calculateMaxDrawdown(closes),
          // Valuation Models
          graham_value: calculateGrahamValue(ks.trailingEps, fd.earningsGrowth),
          margin_of_safety: (() => {
            const gv = calculateGrahamValue(ks.trailingEps, fd.earningsGrowth);
            return gv && p.regularMarketPrice ? +(((gv - p.regularMarketPrice) / gv) * 100).toFixed(2) : null;
          })(),
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

    const SYSTEM_PROMPT = `Eres un analista financiero senior de élite que trabaja para "Maverlang", una plataforma de inteligencia financiera. Generas informes de portafolio extremadamente técnicos y profesionales en ESPAÑOL.

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
── Avanzado (calculado server-side) ──
MACD(12,26,9): ${s.macd ? `MACD=${s.macd.macd} | Signal=${s.macd.signal} | Histograma=${s.macd.histogram}` : 'N/A'}
Bollinger(20,2σ): ${s.bollinger ? `Upper=$${s.bollinger.upper} | Mid=$${s.bollinger.middle} | Lower=$${s.bollinger.lower} | BW=${s.bollinger.bandwidth}%` : 'N/A'}
Volatilidad anualizada: ${s.volatility_annual != null ? s.volatility_annual + '%' : 'N/A'}
Max Drawdown (1Y): ${s.max_drawdown_1y != null ? '-' + s.max_drawdown_1y + '%' : 'N/A'}
── Valoración Cuantitativa ──
Graham Intrinsic Value [V=EPS×(8.5+2g)]: ${s.graham_value != null ? '$' + s.graham_value : 'N/A'}
Margen de Seguridad: ${s.margin_of_safety != null ? s.margin_of_safety + '%' : 'N/A'} ${s.margin_of_safety != null ? (s.margin_of_safety > 0 ? '(INFRAVALORADA)' : '(SOBREVALORADA)') : ''}
52w High: $${s.week52_high} (${s.pct_from_52w_high}%) | 52w Low: $${s.week52_low} (+${s.pct_from_52w_low}%)`;
    }).join('\n\n');

    // ── Portfolio-Level Calculations ──
    const validStocks = stockDataArray.filter((s: any) => !s.error && s.price);
    const totalValue = validStocks.reduce((sum: number, s: any) => sum + (s.shares * s.price), 0);
    const totalCost = validStocks.reduce((sum: number, s: any) => sum + (s.shares * s.average_price), 0);
    const totalPnL = totalValue - totalCost;
    const totalPnLPct = totalCost > 0 ? +((totalPnL / totalCost) * 100).toFixed(2) : 0;
    
    // Weighted portfolio beta
    const weightedBeta = validStocks.reduce((sum: number, s: any) => {
      const weight = (s.shares * s.price) / totalValue;
      return sum + weight * (s.beta || 1);
    }, 0);

    // Sector allocation
    const sectorMap: Record<string, number> = {};
    validStocks.forEach((s: any) => {
      const w = +((s.shares * s.price / totalValue) * 100).toFixed(1);
      sectorMap[s.sector] = (sectorMap[s.sector] || 0) + w;
    });

    // HHI Concentration Index
    const weights = validStocks.map((s: any) => (s.shares * s.price / totalValue) * 100);
    const hhi = Math.round(weights.reduce((sum, w) => sum + w * w, 0));
    const concentration = hhi > 2500 ? 'MUY CONCENTRADO' : hhi > 1500 ? 'CONCENTRADO' : 'DIVERSIFICADO';

    const portfolioCalcStr = `
═══ MÉTRICAS AGREGADAS DEL PORTAFOLIO (calculadas server-side) ═══
Valor Total: $${totalValue.toFixed(2)}
Costo Total: $${totalCost.toFixed(2)}
P&L Total: $${totalPnL.toFixed(2)} (${totalPnLPct > 0 ? '+' : ''}${totalPnLPct}%)
Beta Ponderado: ${weightedBeta.toFixed(3)}
Índice HHI: ${hhi} → ${concentration}
Asignación Sectorial: ${Object.entries(sectorMap).map(([k, v]) => `${k}: ${v.toFixed(1)}%`).join(' | ')}`;

    const userPrompt = `Fecha del informe: ${today}

DATOS DEL PORTAFOLIO (${validStocks.length} activos):

${stockDataStr}
${portfolioCalcStr}

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
      "technical_analysis": "Análisis técnico detallado (3-4 oraciones). Incluir señales MACD, Bollinger Bands, RSI, SMA, soporte/resistencia.",
      "risk_analysis": "Análisis de riesgo (2-3 oraciones). Volatilidad, Max Drawdown, Beta vs mercado.",
      "valuation_analysis": "Análisis de valoración cuantitativa (2-3 oraciones). Graham Value, Margen de Seguridad, P/E vs forward.",
      "formula_examples": [
        "P/E = Precio ÷ EPS = $175.50 ÷ $6.42 = 27.3x (sector promedio: ~25x)",
        "Graham V = EPS × (8.5 + 2g) = $6.42 × (8.5 + 2×15) = $247.17 → Margen Seguridad: +40.9%",
        "MACD Histograma = 0.45 → Señal alcista (MACD > Signal)",
        "Bollinger: Precio $175.50 vs Banda Superior $180.20 → 94% del rango, posible sobrecompra",
        "Volatilidad Anualizada = 28.5% → Riesgo MODERADO-ALTO",
        "Max Drawdown 1Y = -15.3% → Caída máxima desde pico"
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
    "total_pnl_pct": 6.84,
    "weighted_beta": 1.15,
    "hhi_index": 2100,
    "concentration": "CONCENTRADO|DIVERSIFICADO",
    "sector_allocation": {"Technology": 45.2, "Healthcare": 30.1},
    "diversification_score": "BUENA|REGULAR|POBRE",
    "risk_assessment": "Evaluación detallada del riesgo: volatilidad promedio ponderada, beta del portafolio vs S&P 500, exposición sectorial."
  },
  "disclaimer": "⚠️ AVISO LEGAL IMPORTANTE: Este informe es generado automáticamente por inteligencia artificial con fines exclusivamente informativos y educativos. NO constituye asesoría financiera, recomendación de inversión, ni oferta de compra o venta de valores. Los cálculos, proyecciones y análisis presentados se basan en datos históricos y modelos cuantitativos que pueden no reflejar condiciones futuras del mercado. Las decisiones de inversión son responsabilidad exclusiva del usuario. Rendimientos pasados no garantizan resultados futuros. Consulte siempre con un asesor financiero certificado antes de tomar decisiones de inversión. Maverlang no se hace responsable por pérdidas derivadas del uso de esta información."
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
