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
- Usa get_portfolio_news para buscar información específica sobre las inversiones/activos del usuario.
- Usa search_general_news para buscar noticias del día o sobre temas generales.
- Usa get_news_context si necesitas profundizar en el artículo.

NUNCA menciones que eres una IA de OpenAI, Anthropic o Google. Eres una creación pura de Reclu.`;

    // Increment usage
    await incrementUsage(user.id, "ai_message").catch(console.error);

    const result = streamText({
      model: openrouter(modelStr),
      system: systemContent,
      messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      tools: {
        get_portfolio_news: tool({
          description: 'Obtiene las noticias más recientes e importantes específicamente relacionadas a los activos (tickers) del portafolio del usuario.',
          parameters: z.object({
            limit: z.number().optional().describe('Cantidad máxima de noticias a recuperar. Por defecto 5.'),
          }),
          execute: async ({ limit = 5 }) => {
            const sc = await createClient(); // assuming authenticated client has access
            const { data: portfolios } = await sc.from('portfolios').select('symbol').eq('user_id', user.id);
            if (!portfolios || portfolios.length === 0) {
              return { error: "El usuario no tiene activos en su portafolio. Sugiérele agregar algunos en la sección Portafolio." };
            }
            const symbols = portfolios.map((p: any) => p.symbol.toLowerCase());
            
            // Search global news
            const { data: allNews } = await supabase
              .from('news_articles')
              .select('id, title, summary, published_at, relevance_score, slug')
              .order('published_at', { ascending: false })
              .limit(50);
              
            if (!allNews) return { news: [] };
            
            // Filter by symbols
            const relevantNews = allNews.filter(article => {
              const text = (article.title + " " + article.summary).toLowerCase();
              return symbols.some((sym: string) => text.includes(sym));
            }).slice(0, limit);
            
            return {
              news: relevantNews
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
              .select('id, title, summary, published_at, relevance_score, slug')
              .ilike('title', `%${query}%`)
              .order('published_at', { ascending: false })
              .limit(5);
              
            return { news: data || [] };
          },
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
