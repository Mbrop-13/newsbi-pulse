import { NextRequest } from "next/server";
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";
import YahooFinance from "yahoo-finance2";

export const maxDuration = 60;

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://reclu.cl',
    'X-Title': 'Reclu',
  }
});

export async function POST(req: NextRequest) {
  try {
    const { messages, articles, files, webSearch, shortcut } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Check usage limits
    const limitCheck = await checkLimit(user.id, "ai_message");
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({
          error: "Has alcanzado el límite de consultas de tu plan actual.",
          code: "LIMIT_REACHED",
          details: limitCheck,
        }),
        { status: 403 }
      );
    }

    const modelStr = webSearch ? "x-ai/grok-2-1212" : "google/gemini-2.5-flash"; // use tool-capable models

    let systemContent = `Eres R-AI, la AI financiera avanzada y de élite de Reclu.
Respondes SIEMPRE en español.
Eres profesional, concisa y analítica.

Tienes acceso a herramientas (tools) nativas para buscar noticias financieras y del portafolio.

REGLAS DE USO DE HERRAMIENTAS:
1. Cuando el usuario pregunte por su portafolio, acciones o inversiones: SIEMPRE llama get_portfolio_summary Y get_portfolio_news JUNTAS en el mismo paso. Presenta primero la tabla de acciones con precios en vivo, luego complementa con las noticias relacionadas.
2. Cuando el usuario pregunte "¿qué pasó hoy?" o por noticias del día: usa get_top_news_today.
3. Cuando el usuario pida análisis de mercado: llama get_portfolio_summary, get_portfolio_news Y get_top_news_today las tres juntas.
4. Para buscar noticias sobre un tema específico: usa search_general_news.
5. Para profundizar en una noticia: usa get_news_context.

NUNCA menciones que eres una IA de OpenAI, Anthropic o Google. Eres una creación pura de Reclu.`;

    // Increment usage
    await incrementUsage(user.id, "ai_message").catch(console.error);

    const result = await streamText({
      model: openrouter(modelStr),
      system: systemContent,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      maxSteps: 5,
      tools: {
        get_portfolio_summary: tool({
          description: 'Obtiene un resumen en vivo del portafolio del usuario con precios actuales, cambios del día, cantidad de acciones y valor de la posición. USAR SIEMPRE que el usuario pregunte por su portafolio o sus acciones.',
          parameters: z.object({}),
          execute: async () => {
            const sc = await createClient();
            const { data: dbAssets } = await sc.from('portfolios').select('*').eq('user_id', user.id);
            if (!dbAssets || dbAssets.length === 0) {
              return { error: "El usuario no tiene activos en su portafolio. Sugiérele agregar algunos en la sección Portafolio." };
            }

            const symbols = dbAssets.map((a: any) => a.symbol);
            try {
              const yf = new YahooFinance();
              const quotes = await yf.quote(symbols);
              const quoteArray = Array.isArray(quotes) ? quotes : [quotes];

              const assets = dbAssets.map((dbA: any) => {
                const live = quoteArray.find((q: any) => q.symbol === dbA.symbol) || {} as any;
                const price = live.regularMarketPrice || 0;
                const change = live.regularMarketChange || 0;
                const changePercent = live.regularMarketChangePercent || 0;
                const shares = dbA.shares || 0;
                const avgPrice = dbA.average_price || 0;
                const positionValue = price * shares;
                const invested = avgPrice * shares;
                const pnl = invested > 0 ? positionValue - invested : 0;

                return {
                  symbol: dbA.symbol,
                  company_name: dbA.company_name,
                  price: price,
                  change: change,
                  changePercent: changePercent,
                  shares: shares,
                  average_price: avgPrice,
                  position_value: positionValue,
                  pnl: pnl,
                  currency: live.currency || 'USD'
                };
              });

              const totalValue = assets.reduce((sum: number, a: any) => sum + a.position_value, 0);
              const totalPnl = assets.reduce((sum: number, a: any) => sum + a.pnl, 0);
              const avgChange = assets.length > 0 ? assets.reduce((sum: number, a: any) => sum + a.changePercent, 0) / assets.length : 0;

              return {
                assets,
                summary: {
                  total_assets: assets.length,
                  total_value: totalValue,
                  total_pnl: totalPnl,
                  average_daily_change: avgChange
                }
              };
            } catch (e) {
              // If Yahoo Finance fails, return at least the DB data
              return {
                assets: dbAssets.map((a: any) => ({
                  symbol: a.symbol,
                  company_name: a.company_name,
                  shares: a.shares || 0,
                  average_price: a.average_price || 0,
                  price: 0,
                  change: 0,
                  changePercent: 0
                })),
                summary: { total_assets: dbAssets.length, total_value: 0, total_pnl: 0, average_daily_change: 0 },
                error_note: 'No se pudieron obtener precios en vivo. Mostrando datos guardados.'
              };
            }
          }
        }),
        get_portfolio_news: tool({
          description: 'Obtiene las noticias de las ÚLTIMAS 48 horas relacionadas a los activos del portafolio del usuario.',
          parameters: z.object({
            limit: z.number().optional().describe('Cantidad máxima de noticias a recuperar. Por defecto 10.'),
          }),
          execute: async ({ limit = 10 }) => {
            const sc = await createClient();
            const { data: portfolios } = await sc.from('portfolios').select('symbol, company_name').eq('user_id', user.id);
            if (!portfolios || portfolios.length === 0) {
              return { error: "El usuario no tiene activos en su portafolio. Sugiérele agregar algunos en la sección Portafolio." };
            }
            
            // Only fetch news from the last 48 hours
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            
            // Build search terms from both symbols and company names
            const searchTerms: string[] = [];
            for (const p of portfolios) {
              if (p.symbol) searchTerms.push(p.symbol.toLowerCase());
              if (p.company_name) {
                searchTerms.push(p.company_name.toLowerCase());
                const words = p.company_name.split(/[\s,.\-\/]+/).filter((w: string) => w.length >= 3);
                for (const word of words) {
                  const lower = word.toLowerCase();
                  if (!['inc', 'corp', 'ltd', 'llc', 'the', 'and', 'group', 'holdings', 'company', 'class'].includes(lower)) {
                    searchTerms.push(lower);
                  }
                }
              }
            }
            
            // Try Supabase ilike filters with date cutoff
            const orFilters = searchTerms.map(t => `title.ilike.%${t}%`).join(',');
            
            const { data: matchedNews } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .or(orFilters)
              .gte('published_at', cutoff)
              .order('published_at', { ascending: false })
              .limit(limit);
            
            if (matchedNews && matchedNews.length > 0) {
              return { 
                news: matchedNews,
                portfolio_symbols: portfolios.map((p: any) => p.symbol)
              };
            }
            
            // Fallback: fetch recent news (last 48h) and do client-side fuzzy matching
            const { data: recentNews } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .gte('published_at', cutoff)
              .order('published_at', { ascending: false })
              .limit(100);
              
            if (!recentNews || recentNews.length === 0) {
              return { 
                news: [], 
                portfolio_symbols: portfolios.map((p: any) => p.symbol),
                note: "No se encontraron noticias recientes (últimas 48h) relacionadas con el portafolio."
              };
            }
            
            const relevantNews = recentNews.filter(article => {
              const text = (article.title + " " + (article.summary || "")).toLowerCase();
              return searchTerms.some(term => text.includes(term));
            }).slice(0, limit);
            
            return {
              news: relevantNews,
              portfolio_symbols: portfolios.map((p: any) => p.symbol),
              note: relevantNews.length === 0 ? "No se encontraron noticias recientes (últimas 48h) relacionadas con el portafolio." : undefined
            };
          },
        }),
        search_general_news: tool({
          description: 'Busca noticias generales en la plataforma Reclu por palabra clave o etiqueta.',
          parameters: z.object({
            query: z.string().describe('Término de búsqueda (ej. Trump, Apple, tasas de interés).'),
          }),
          execute: async ({ query }) => {
            const { data } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .ilike('title', `%${query}%`)
              .order('published_at', { ascending: false })
              .limit(5);
              
            return { news: data || [] };
          },
        }),
        get_top_news_today: tool({
          description: 'Obtiene las 10 noticias más importantes publicadas el día de hoy, ordenadas por relevancia.',
          parameters: z.object({}),
          execute: async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { data } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .gte('published_at', today.toISOString())
              .order('relevance_score', { ascending: false })
              .limit(10);
            return { news: data || [] };
          }
        }),
        get_news_context: tool({
          description: 'Obtiene el contenido completo de una noticia específica dado su slug o id.',
          parameters: z.object({
            id: z.string(),
          }),
          execute: async ({ id }) => {
            const { data } = await supabase
              .from('news_articles')
              .select('title, content, enriched_content')
              .eq('id', id)
              .single();
            if (!data) return { error: "Noticia no encontrada" };
            return { content: data.enriched_content || data.content };
          }
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("[AI Chat Stream] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
