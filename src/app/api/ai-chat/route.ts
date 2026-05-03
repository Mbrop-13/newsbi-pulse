import { NextRequest } from "next/server";
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";

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
- Usa get_top_news_today para ver las noticias más importantes publicadas HOY (usar si el usuario dice "¿qué pasó hoy?").
- Usa get_portfolio_news para buscar información específica sobre las inversiones/activos del usuario.
- Usa search_general_news para buscar noticias del día o sobre temas generales.
- Usa get_news_context si necesitas profundizar en el artículo.

NUNCA menciones que eres una IA de OpenAI, Anthropic o Google. Eres una creación pura de Reclu.`;

    // Increment usage
    await incrementUsage(user.id, "ai_message").catch(console.error);

    const result = await streamText({
      model: openrouter(modelStr),
      system: systemContent,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      maxSteps: 3,
      tools: {
        get_portfolio_news: tool({
          description: 'Obtiene las noticias más recientes e importantes específicamente relacionadas a los activos (tickers) del portafolio del usuario.',
          parameters: z.object({
            limit: z.number().optional().describe('Cantidad máxima de noticias a recuperar. Por defecto 10.'),
          }),
          execute: async ({ limit = 10 }) => {
            const sc = await createClient();
            const { data: portfolios } = await sc.from('portfolios').select('symbol, company_name').eq('user_id', user.id);
            if (!portfolios || portfolios.length === 0) {
              return { error: "El usuario no tiene activos en su portafolio. Sugiérele agregar algunos en la sección Portafolio." };
            }
            
            // Build search terms from both symbols and company names
            const searchTerms: string[] = [];
            for (const p of portfolios) {
              if (p.symbol) searchTerms.push(p.symbol.toLowerCase());
              if (p.company_name) {
                // Add full company name and also individual significant words (3+ chars)
                searchTerms.push(p.company_name.toLowerCase());
                const words = p.company_name.split(/[\s,.\-\/]+/).filter((w: string) => w.length >= 3);
                for (const word of words) {
                  const lower = word.toLowerCase();
                  // Skip common words that would match too broadly
                  if (!['inc', 'corp', 'ltd', 'llc', 'the', 'and', 'group', 'holdings', 'company', 'class'].includes(lower)) {
                    searchTerms.push(lower);
                  }
                }
              }
            }
            
            // Try Supabase ilike filters — build an OR filter for title matching
            const orFilters = searchTerms.map(t => `title.ilike.%${t}%`).join(',');
            
            const { data: matchedNews } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .or(orFilters)
              .order('published_at', { ascending: false })
              .limit(limit);
            
            if (matchedNews && matchedNews.length > 0) {
              return { 
                news: matchedNews,
                portfolio_symbols: portfolios.map((p: any) => p.symbol)
              };
            }
            
            // Fallback: fetch recent news and do client-side fuzzy matching
            const { data: recentNews } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug, image_url')
              .order('published_at', { ascending: false })
              .limit(100);
              
            if (!recentNews) return { news: [], portfolio_symbols: portfolios.map((p: any) => p.symbol) };
            
            const relevantNews = recentNews.filter(article => {
              const text = (article.title + " " + (article.summary || "")).toLowerCase();
              return searchTerms.some(term => text.includes(term));
            }).slice(0, limit);
            
            return {
              news: relevantNews,
              portfolio_symbols: portfolios.map((p: any) => p.symbol)
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
