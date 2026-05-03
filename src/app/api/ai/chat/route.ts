import { createClient } from '@supabase/supabase-js';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    'HTTP-Referer': 'https://reclu.cl',
    'X-Title': 'Reclu',
  }
});

export async function POST(req: Request) {
  try {
    const { messages, profile } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages array required', { status: 400 });
    }

    const { name = 'AI', topics = [], tickers = [] } = profile || {};

    // Get current date for context
    const currentDate = new Date().toISOString();

    const systemPrompt = `Eres "${name}", un AI financiero avanzado y de élite, exclusivo de Reclu.
Tu objetivo es ayudar al usuario a entender el mercado, noticias y tomar decisiones.

PERFIL DEL USUARIO:
- Temas de interés: ${topics.join(', ') || 'General'}
- Activos en Portafolio: ${tickers.map((t: any) => `${t.symbol}`).join(', ') || 'Ninguno especificado'}
- Fecha actual: ${currentDate}

INSTRUCCIONES:
1. Responde de forma profesional, concisa y directa. (Máx 2-3 párrafos).
2. Tienes acceso a herramientas (tools) para buscar noticias en tiempo real en la base de datos de Reclu.
3. Si el usuario pregunta por su portafolio, usa la herramienta 'get_portfolio_news' obligatoriamente.
4. Si necesitas más contexto de una noticia específica, usa 'get_news_context'.
5. NUNCA inventes noticias, siempre usa las herramientas.
6. Nunca menciones que eres de OpenAI o Anthropic. Eres una creación pura de Reclu.
`;

    // Only Grok supports tool calling reasonably well on OpenRouter. If using another model, make sure it supports tools.
    // Actually, gemini-2.5-flash or grok-2 work great. We'll use the user's preferred model or fallback to a tool-capable one.
    const modelStr = process.env.OPENROUTER_ENRICH_MODEL || 'google/gemini-2.5-flash';

    const result = streamText({
      model: openrouter(modelStr),
      system: systemPrompt,
      messages,
      tools: {
        get_portfolio_news: tool({
          description: 'Obtiene las noticias más recientes e importantes específicamente relacionadas a los activos (tickers) del portafolio del usuario.',
          parameters: z.object({
            limit: z.number().optional().describe('Cantidad máxima de noticias a recuperar. Por defecto 5.'),
          }),
          execute: async ({ limit = 5 }) => {
            if (!tickers || tickers.length === 0) {
              return { error: "El usuario no tiene activos en su portafolio." };
            }
            
            const symbols = tickers.map((t: any) => t.symbol.toLowerCase());
            
            // Search news containing any of the symbols in the tags or title
            // A simple approach is fetching the latest news and filtering, or using Supabase text search.
            const { data } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug')
              .order('published_at', { ascending: false })
              .limit(50);
              
            if (!data) return { news: [] };
            
            // Filter locally for accuracy
            const relevantNews = data.filter(article => {
              const text = (article.title + " " + article.summary).toLowerCase();
              return symbols.some((sym: string) => text.includes(sym));
            }).slice(0, limit);
            
            return {
              news: relevantNews.map(n => ({
                id: n.id,
                title: n.title,
                relevance_score: n.relevance_score,
                date: n.published_at,
                slug: n.slug
              }))
            };
          },
        }),
        
        search_general_news: tool({
          description: 'Busca noticias generales en la plataforma Reclu por palabra clave o periodo de tiempo.',
          parameters: z.object({
            query: z.string().describe('Término de búsqueda (ej. Trump, Apple, tasas de interés).'),
            days_ago: z.number().optional().describe('Buscar noticias de los últimos X días. Por defecto 1.'),
          }),
          execute: async ({ query, days_ago = 1 }) => {
            const dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - days_ago);
            
            const { data } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug')
              .gte('published_at', dateLimit.toISOString())
              .ilike('title', `%${query}%`)
              .order('relevance_score', { ascending: false })
              .limit(5);
              
            return {
              news: data?.map(n => ({
                id: n.id,
                title: n.title,
                relevance_score: n.relevance_score,
                date: n.published_at,
                slug: n.slug
              })) || []
            };
          },
        }),

        get_news_context: tool({
          description: 'Obtiene el contenido completo o el contexto detallado de un artículo de noticias específico si necesitas más detalles para responder.',
          parameters: z.object({
            article_id: z.string().describe('El ID del artículo (devuelto por otras herramientas).'),
          }),
          execute: async ({ article_id }) => {
            const { data } = await supabase
              .from('news_articles')
              .select('id, title, content, enriched_content')
              .eq('id', article_id)
              .single();
              
            if (!data) return { error: "Artículo no encontrado." };
            return {
              content: data.enriched_content || data.content,
              title: data.title
            };
          },
        }),
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("AI Chat Stream Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
