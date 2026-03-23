import { NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, profile, contextArticles } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array required' }, { status: 400 });
    }

    const { name = 'Asistente', topics = [], tickers = [] } = profile || {};
    
    let contextStr = '';
    if (contextArticles && contextArticles.length > 0) {
      contextStr = `\n\nNOTICIAS RECIENTES EN EL FEED DEL USUARIO (Contexto):\n`;
      contextArticles.forEach((a: any, i: number) => {
        contextStr += `- ${a.title}: ${a.summary}\n`;
      });
    }

    const systemPrompt = `Eres "${name}", un asistente de IA financiero avanzado y élite, exclusivo de la plataforma ProgramBI.
Tu objetivo es ayudar al usuario a entender el mercado, las noticias y tomar mejores decisiones.

PERFIL DEL USUARIO:
- Temas de interés: ${topics.join(', ') || 'General'}
- Activos en Portafolio: ${tickers.map((t: any) => `${t.symbol} (${t.name})`).join(', ') || 'Ninguno especificado'}
${contextStr}

INSTRUCCIONES:
1. Responde de forma concisa, profesional, pero conversacional. (Máx 2-3 párrafos).
2. Usa viñetas o negritas para resaltar datos clave o tickers.
3. Si el usuario pregunta por su portafolio o las noticias actuales, básate en el contexto provisto arriba para darle un análisis en tiempo real.
4. NUNCA menciones que eres una IA de OpenAI o Anthropic. Eres una creación pura de ProgramBI.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    const model = process.env.OPENROUTER_ENRICH_MODEL || 'x-ai/grok-4.1-fast:online';
    
    // We pass search: true so the Assistant can look up recent stock prices if asked
    const { content } = await callOpenRouter({
      model,
      messages: formattedMessages,
      temperature: 0.6,
      search: true 
    });

    return NextResponse.json({ reply: content });

  } catch (error: any) {
    console.error("AI Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
