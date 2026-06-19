import { tool } from 'ai';
import { z } from 'zod';
import YahooFinance from "yahoo-finance2";
import { createClient } from "@/lib/supabase/server";
import { checkLimit } from "@/lib/check-limits";

const yf = new YahooFinance();

interface FinanceToolsParams {
  user: any;
  userId: string;
}

export function getFinanceTools({ user, userId }: FinanceToolsParams) {
  return {
    // ── PORTFOLIO TOOLS ──
    get_portfolio_summary: tool({
      description: 'Resumen en vivo del portafolio: precios, cambios diarios, posiciones. Usar cuando pregunten por "mis acciones". IMPORTANTE: El "changePercent" devuelto es SÓLO el cambio de hoy (1d). Si el usuario pide el rendimiento de "este mes" (1mo), "este año" (1y) u otro periodo, DEBES llamar primero a esta herramienta para saber qué símbolos tiene el usuario, y LUEGO llamar a la herramienta "compare_stocks" pasándole esos símbolos y el "period" correspondiente para obtener el crecimiento histórico real antes de responder o graficar.',
      parameters: z.object({}),
      execute: async () => {
        try {
          if (!user) {
            return { error: "El usuario no ha iniciado sesión. Pídele que inicie sesión para ver su portafolio." };
          }
          const sc = await createClient();
          const { data: dbAssets } = await sc.from('portfolios').select('*').eq('user_id', user.id);
          if (!dbAssets || dbAssets.length === 0) {
            return { error: "El usuario no tiene activos en su portafolio. Sugiérele agregar algunos en /portafolio." };
          }
          const symbols = dbAssets
            .map((a: any) => a.symbol)
            .filter((sym): sym is string => typeof sym === 'string' && sym.trim().length > 0);
          
          if (symbols.length === 0) {
            return {
              assets: dbAssets.map((a: any) => ({ symbol: a.symbol, company_name: a.company_name, shares: a.shares || 0, average_price: a.average_price || 0, price: 0, change: 0, changePercent: 0 })),
              summary: { total_assets: dbAssets.length, total_value: 0, total_pnl: 0, average_daily_change: 0 },
              error_note: 'El portafolio no contiene símbolos de activos válidos.'
            };
          }
          try {
            const quotes = await yf.quote(symbols);
            const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
            const assets = dbAssets.map((dbA: any) => {
              const live = quoteArray.find((q: any) => q?.symbol === dbA.symbol) || {} as any;
              const price = live.regularMarketPrice || 0;
              const shares = dbA.shares || 0;
              const avgPrice = dbA.average_price || 0;
              return {
                symbol: dbA.symbol, company_name: dbA.company_name,
                price, change: live.regularMarketChange || 0,
                changePercent: live.regularMarketChangePercent || 0,
                shares, average_price: avgPrice,
                position_value: price * shares,
                pnl: avgPrice > 0 ? (price * shares) - (avgPrice * shares) : 0,
                currency: live.currency || 'USD'
              };
            });
            const totalValue = assets.reduce((s: number, a: any) => s + a.position_value, 0);
            const totalPnl = assets.reduce((s: number, a: any) => s + a.pnl, 0);
            const avgChange = assets.length > 0 ? assets.reduce((s: number, a: any) => s + a.changePercent, 0) / assets.length : 0;
            return { assets, summary: { total_assets: assets.length, total_value: totalValue, total_pnl: totalPnl, average_daily_change: avgChange } };
          } catch (e: any) {
            return {
              assets: dbAssets.map((a: any) => ({ symbol: a.symbol, company_name: a.company_name, shares: a.shares || 0, average_price: a.average_price || 0, price: 0, change: 0, changePercent: 0 })),
              summary: { total_assets: dbAssets.length, total_value: 0, total_pnl: 0, average_daily_change: 0 },
              error_note: 'No se pudieron obtener precios en vivo: ' + (e.message || String(e))
            };
          }
        } catch (error: any) {
          console.error("[get_portfolio_summary] Unhandled error:", error);
          return { error: error.message || String(error) };
        }
      }
    }),

    get_portfolio_news: tool({
      description: 'Noticias de las últimas 48h relacionadas al portafolio del usuario.',
      parameters: z.object({ limit: z.number().optional() }),
      execute: async ({ limit = 10 }) => {
        try {
          if (!user) return { news: [], portfolio_symbols: [], note: "Debes iniciar sesión para ver noticias de tu portafolio." };
          const sc = await createClient();
          const { data: portfolios } = await sc.from('portfolios').select('symbol, company_name').eq('user_id', user.id);
          if (!portfolios || portfolios.length === 0) return { error: "Sin portafolio.", news: [] };
          const cutoff = new Date(Date.now() - 48 * 3600000).toISOString();
          const searchTerms: string[] = [];
          for (const p of portfolios) {
            if (p.symbol) searchTerms.push(p.symbol.toLowerCase().replace(/[()\\,.:]/g, ''));
            if (p.company_name) {
              const cleanName = p.company_name.toLowerCase().replace(/[()\\,.:]/g, '');
              searchTerms.push(cleanName);
              p.company_name.split(/[\s,.\-\/]+/).filter((w: string) => w.length >= 3).forEach((w: string) => {
                const l = w.toLowerCase().replace(/[()\\,.:]/g, '');
                if (l.length >= 3 && !['inc','corp','ltd','llc','the','and','group','holdings','company','class'].includes(l)) {
                  searchTerms.push(l);
                }
              });
            }
          }
          const cleanTerms = searchTerms.filter(t => t.trim().length > 0);
          if (cleanTerms.length === 0) {
            return { news: [], portfolio_symbols: portfolios.map((p: any) => p.symbol), note: "El portafolio no contiene nombres de activos o símbolos procesables." };
          }
          const orFilters = cleanTerms.map(t => `title.ilike.%${t}%`).join(',');
          let news: any[] = [];
          try {
            const { data } = await sc.from('news_articles').select('id, title, summary, published_at, relevance_score, slug, image_url').or(orFilters).gte('published_at', cutoff).order('published_at', { ascending: false }).limit(limit);
            news = data || [];
          } catch (e) {
            console.error("[get_portfolio_news] error querying Supabase .or(orFilters):", e);
          }
          if (news && news.length > 0) return { news, portfolio_symbols: portfolios.map((p: any) => p.symbol) };
          
          const { data: recent } = await sc.from('news_articles').select('id, title, summary, published_at, relevance_score, slug, image_url').gte('published_at', cutoff).order('published_at', { ascending: false }).limit(100);
          if (!recent || recent.length === 0) return { news: [], portfolio_symbols: portfolios.map((p: any) => p.symbol), note: "Sin noticias recientes (48h)." };
          const relevant = recent.filter(a => { const t = (a.title + " " + (a.summary || "")).toLowerCase(); return cleanTerms.some(term => t.includes(term)); }).slice(0, limit);
          return { news: relevant, portfolio_symbols: portfolios.map((p: any) => p.symbol) };
        } catch (error: any) {
          console.error("[get_portfolio_news] Unhandled error:", error);
          return { error: error.message || String(error), news: [] };
        }
      },
    }),

    // ── NEWS TOOLS ──
    search_general_news: tool({
      description: 'Buscar noticias en Maverlang por palabra clave.',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        try {
          const sc = await createClient();
          const { data, error } = await sc.from('news_articles').select('id, title, summary, published_at, relevance_score, slug, image_url').ilike('title', `%${query}%`).order('published_at', { ascending: false }).limit(5);
          if (error) throw error;
          return { news: data || [] };
        } catch (err: any) {
          console.error("[search_general_news] error:", err);
          return { news: [], error: err.message || String(err) };
        }
      },
    }),

    get_top_news_today: tool({
      description: 'Top 10 noticias de hoy ordenadas por relevancia.',
      parameters: z.object({}),
      execute: async () => {
        try {
          const sc = await createClient();
          const today = new Date(); today.setHours(0, 0, 0, 0);
          const { data, error } = await sc.from('news_articles').select('id, title, summary, published_at, relevance_score, slug, image_url').gte('published_at', today.toISOString()).order('relevance_score', { ascending: false }).limit(10);
          if (error) throw error;
          return { news: data || [] };
        } catch (err: any) {
          console.error("[get_top_news_today] error:", err);
          return { news: [], error: err.message || String(err) };
        }
      }
    }),

    get_news_context: tool({
      description: 'Contenido completo de una noticia por su id.',
      parameters: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        try {
          const sc = await createClient();
          const { data, error } = await sc.from('news_articles').select('title, content, enriched_content').eq('id', id).maybeSingle();
          if (error) throw error;
          if (!data) return { error: "Noticia no encontrada" };
          return { content: data.enriched_content || data.content };
        } catch (err: any) {
          console.error("[get_news_context] error:", err);
          return { error: err.message || String(err) };
        }
      }
    }),

    // ── NEW PRO TOOLS ──
    analyze_stock: tool({
      description: 'Análisis fundamental completo de una acción: P/E, EPS, ROE, márgenes, deuda, dividendos, market cap, sector, 52w rango. Usar cuando pidan "analizar X" o "fundamentales de X".',
      parameters: z.object({
        symbol: z.string().describe('Ticker de la acción, ej: AAPL, TSLA, MSFT'),
      }),
      execute: async ({ symbol }) => {
        try {
          const s = symbol.toUpperCase();
          const summary = await yf.quoteSummary(s, { modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData', 'earningsQuarterlyGrowth', 'assetProfile'] as any });
          const p = summary.price || {} as any;
          const sd = summary.summaryDetail || {} as any;
          const ks = summary.defaultKeyStatistics || {} as any;
          const fd = summary.financialData || {} as any;
          const ap = summary.assetProfile || {} as any;

          return {
            symbol: s,
            company_name: p.shortName || p.longName || s,
            sector: ap.sector || 'N/A',
            industry: ap.industry || 'N/A',
            price: { current: p.regularMarketPrice, change: p.regularMarketChange, changePercent: p.regularMarketChangePercent, currency: p.currency || 'USD', marketCap: p.marketCap },
            valuation: { pe_trailing: sd.trailingPE, pe_forward: sd.forwardPE, pb: ks.priceToBook, ps: ks.priceToSalesTrailing12Months, peg: ks.pegRatio, ev_ebitda: ks.enterpriseToEbitda },
            profitability: { profit_margin: fd.profitMargins, operating_margin: fd.operatingMargins, roe: fd.returnOnEquity, roa: fd.returnOnAssets, gross_margin: fd.grossMargins },
            growth: { revenue_growth: fd.revenueGrowth, earnings_growth: fd.earningsGrowth, eps: ks.trailingEps, forward_eps: ks.forwardEps },
            financial_health: { total_debt: fd.totalDebt, total_cash: fd.totalCash, debt_to_equity: fd.debtToEquity, current_ratio: fd.currentRatio, quick_ratio: fd.quickRatio },
            dividends: { yield: sd.dividendYield, rate: sd.dividendRate, payout_ratio: sd.payoutRatio, ex_date: sd.exDividendDate },
            risk: { beta: sd.beta, fifty_two_week_high: sd.fiftyTwoWeekHigh, fifty_two_week_low: sd.fiftyTwoWeekLow, avg_volume: sd.averageVolume },
            summary: ap.longBusinessSummary ? ap.longBusinessSummary.substring(0, 300) + '...' : undefined,
          };
        } catch (e: any) {
          return { error: `No se pudo analizar ${symbol}: ${e.message}` };
        }
      }
    }),

    compare_stocks: tool({
      description: 'Compara 2-5 acciones lado a lado con métricas fundamentales clave y rendimiento histórico. Usar cuando digan "compara X con Y" o "¿cuál subió más en el último mes?".',
      parameters: z.object({
        symbols: z.array(z.string()).min(2).max(5).describe('Array de tickers, ej: ["AAPL","MSFT","GOOGL"]'),
        period: z.enum(['1d', '1mo', '3mo', '6mo', '1y', 'ytd', '5y']).optional().describe('Periodo histórico para comparar rendimiento. Por defecto es 1d.'),
      }),
      execute: async ({ symbols, period = '1d' }) => {
        const results = [];
        for (const sym of symbols) {
          try {
            const s = sym.toUpperCase();
            const summary = await yf.quoteSummary(s, { modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData'] });
            const p = summary.price || {} as any;
            const sd = summary.summaryDetail || {} as any;
            const ks = summary.defaultKeyStatistics || {} as any;
            const fd = summary.financialData || {} as any;
            
            let historicalChangePercent = p.regularMarketChangePercent;
            
            if (period !== '1d') {
              try {
                const now = new Date();
                let period1 = new Date();
                if (period === '1mo') period1.setMonth(now.getMonth() - 1);
                else if (period === '3mo') period1.setMonth(now.getMonth() - 3);
                else if (period === '6mo') period1.setMonth(now.getMonth() - 6);
                else if (period === '1y') period1.setFullYear(now.getFullYear() - 1);
                else if (period === '5y') period1.setFullYear(now.getFullYear() - 5);
                else if (period === 'ytd') period1 = new Date(now.getFullYear(), 0, 1);
                
                const hist = await yf.historical(s, { period1: period1.toISOString().split('T')[0] });
                if (hist && hist.length > 0) {
                  const startPrice = hist[0].close;
                  const currentPrice = hist[hist.length - 1].close;
                  historicalChangePercent = ((currentPrice - startPrice) / startPrice) * 100;
                }
              } catch (e) {
                console.error("Historical fetch failed for", s, e);
              }
            }

            results.push({
              symbol: s, name: p.shortName || s,
              price: p.regularMarketPrice, 
              changePercent: historicalChangePercent,
              periodoEvalado: period,
              marketCap: p.marketCap, pe: sd.trailingPE, pb: ks.priceToBook,
              roe: fd.returnOnEquity, profitMargin: fd.profitMargins,
              debtToEquity: fd.debtToEquity, dividendYield: sd.dividendYield,
              beta: sd.beta, fiftyTwoWeekHigh: sd.fiftyTwoWeekHigh, fiftyTwoWeekLow: sd.fiftyTwoWeekLow,
            });
          } catch { results.push({ symbol: sym.toUpperCase(), error: 'No disponible' }); }
          await new Promise(r => setTimeout(r, 200));
        }
        return { comparison: results };
      }
    }),

    get_earnings_calendar: tool({
      description: 'Obtiene las próximas fechas de reportes de ganancias (earnings) para una o varias acciones. Usar cuando pregunten "cuándo reporta X" o "calendario de ganancias".',
      parameters: z.object({
        symbols: z.array(z.string()).min(1).max(10).describe('Array de tickers, ej: ["AAPL","MSFT"]'),
      }),
      execute: async ({ symbols }) => {
        const results = [];
        for (const sym of symbols) {
          try {
            const s = sym.toUpperCase();
            const summary = await yf.quoteSummary(s, { modules: ['calendarEvents', 'price'] });
            const earnings = summary.calendarEvents?.earnings as any;
            if (earnings && earnings.earningsDate && earnings.earningsDate.length > 0) {
              results.push({
                symbol: s,
                name: summary.price?.shortName || s,
                nextEarningsDate: earnings.earningsDate[0].toISOString(),
                revenueEstimate: earnings.revenueAverage?.raw,
                earningsEstimate: earnings.earningsAverage?.raw,
              });
            } else {
              results.push({ symbol: s, error: 'Sin fechas próximas' });
            }
          } catch {
            results.push({ symbol: sym.toUpperCase(), error: 'No disponible' });
          }
          await new Promise(r => setTimeout(r, 200));
        }
        return { earningsCalendar: results };
      }
    }),

    screen_market: tool({
      description: 'Muestra top gainers y losers del mercado US hoy. Usar cuando pregunten "¿cómo va el mercado?" o "qué acciones subieron/bajaron hoy".',
      parameters: z.object({}),
      execute: async () => {
        try {
          const watchlist = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM','V','JNJ','WMT','PG','UNH','HD','MA','DIS','NFLX','PYPL','CRM','AMD','INTC','BA','GS','CAT','NKE','KO','PEP','MCD','COST','ABBV'];
          const quotes = await yf.quote(watchlist);
          const quoteArray = (Array.isArray(quotes) ? quotes : [quotes]).map((q: any) => ({
            symbol: q.symbol, name: q.shortName,
            price: q.regularMarketPrice, change: q.regularMarketChange,
            changePercent: q.regularMarketChangePercent,
            volume: q.regularMarketVolume, marketCap: q.marketCap,
          }));
          const sorted = quoteArray.sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
          return {
            gainers: sorted.slice(0, 5),
            losers: sorted.slice(-5).reverse(),
            market_summary: {
              avg_change: sorted.reduce((s: number, q: any) => s + (q.changePercent || 0), 0) / sorted.length,
              positive_count: sorted.filter((q: any) => (q.changePercent || 0) > 0).length,
              total_tracked: sorted.length,
            }
          };
        } catch (e: any) {
          return { error: `Error al obtener datos del mercado: ${e.message}` };
        }
      }
    }),

    get_sector_performance: tool({
      description: 'Rendimiento por sector del mercado usando ETFs sectoriales. Usar cuando pregunten por sectores o "qué sector va mejor".',
      parameters: z.object({}),
      execute: async () => {
        try {
          const sectorETFs: Record<string, string> = {
            'Tecnología': 'XLK', 'Salud': 'XLV', 'Financiero': 'XLF',
            'Consumo Discrecional': 'XLY', 'Comunicaciones': 'XLC', 'Industrial': 'XLI',
            'Consumo Básico': 'XLP', 'Energía': 'XLE', 'Inmobiliario': 'XLRE',
            'Materiales': 'XLB', 'Utilities': 'XLU',
          };
          const symbols = Object.values(sectorETFs);
          const quotes = await yf.quote(symbols);
          const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
          const sectors = Object.entries(sectorETFs).map(([name, sym]) => {
            const q = quoteArray.find((q: any) => q.symbol === sym) || {} as any;
            return { sector: name, etf: sym, price: q.regularMarketPrice, change: q.regularMarketChange, changePercent: q.regularMarketChangePercent };
          }).sort((a: any, b: any) => (b.changePercent || 0) - (a.changePercent || 0));
          return { sectors };
        } catch (e: any) {
          return { error: `Error: ${e.message}` };
        }
      }
    }),

    // ── CHART TOOL ──
    render_chart: tool({
      description: 'Renderiza un gráfico interactivo en el chat. Tipos: bar, line, pie, area, radar. Usar cuando el usuario pida visualizar datos o cuando un gráfico ayude a entender mejor la información (ej: comparar precios, mostrar distribución del portafolio, tendencias).',
      parameters: z.object({
        type: z.enum(['bar', 'line', 'pie', 'area', 'radar']).describe('Tipo de gráfico'),
        title: z.string().describe('Título descriptivo del gráfico'),
        data: z.array(z.object({
          label: z.string().describe('Etiqueta del eje X o nombre del dato'),
          value: z.number().describe('Valor numérico principal'),
        })).min(2).describe('Array de datos a graficar'),
        xLabel: z.string().optional().describe('Etiqueta del eje X'),
        yLabel: z.string().optional().describe('Etiqueta del eje Y'),
      }),
      execute: async ({ type, title, data, xLabel, yLabel }) => {
        return { type, title, data, xLabel, yLabel };
      }
    }),

    create_price_alert: tool({
      description: 'Crea una alerta de precio para una acción específica. Informa al usuario que la alerta se enviará por correo electrónico (email) cuando el precio alcance el objetivo.',
      parameters: z.object({
        symbol: z.string().describe('Ticker de la acción, ej: AAPL, TSLA'),
        targetPrice: z.number().describe('Precio objetivo para activar la alerta'),
        condition: z.enum(['above', 'below']).optional().describe('Condición de activación: "above" si se espera que suba hasta ese precio, o "below" si se espera que caiga hasta ese precio. Si no se especifica, se calculará automáticamente comparando con el precio actual.')
      }),
      execute: async ({ symbol, targetPrice, condition }) => {
        try {
          if (!user) {
            return { success: false, error: "Debes iniciar sesión para crear alertas de precio." };
          }
          const sc = await createClient();
          const s = symbol.toUpperCase();
          
          // 1. Check plan limits
          const limitCheck = await checkLimit(user.id, "price_alert");
          if (!limitCheck.allowed) {
            return {
              success: false,
              error: "Límite de alertas alcanzado",
              upgradeRequired: limitCheck.upgradeRequired,
              message: `Has alcanzado el límite de tu plan (${limitCheck.limit} alertas activas). Actualiza tu plan para crear más alertas.`
            };
          }

          // 2. Auto-detect condition if not provided
          let finalCondition = condition;
          if (!finalCondition) {
            try {
              const quote = await yf.quote(s);
              const currentPrice = quote?.regularMarketPrice;
              if (currentPrice) {
                finalCondition = targetPrice >= currentPrice ? 'above' : 'below';
              } else {
                finalCondition = 'above';
              }
            } catch {
              finalCondition = 'above';
            }
          }

          // 3. Insert into database
          const { data, error } = await sc
            .from("price_alerts")
            .insert({
              user_id: user.id,
              symbol: s,
              target_price: targetPrice,
              condition: finalCondition,
              is_active: true
            })
            .select()
            .single();

          if (error) {
            console.error("[create_price_alert] DB Error:", error);
            return { success: false, error: error.message };
          }

          return {
            success: true,
            alert: data,
            message: `Alerta creada con éxito para ${s} a $${targetPrice} (${finalCondition === 'above' ? 'por encima' : 'por debajo'}). Se notificará al correo electrónico registrado.`
          };
        } catch (err: any) {
          console.error("[create_price_alert] Error:", err);
          return { success: false, error: err.message || String(err) };
        }
      }
    }),
  };
}
