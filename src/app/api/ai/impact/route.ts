import { NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';

export const maxDuration = 60; // Allow enough time for AI response

export async function POST(req: Request) {
  try {
    const { articles, userProfile } = await req.json();

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'News articles required' }, { status: 400 });
    }

    if (!userProfile) {
      return NextResponse.json({ error: 'User profile required' }, { status: 400 });
    }

    const { topics = [], tickers = [], interests = {} } = userProfile;
    
    // Flatten all interests into a readable string for the AI
    const subInterestsDesc = Object.entries(interests)
      .filter(([_, subList]) => (subList as string[]).length > 0)
      .map(([topic, subList]) => `${topic}: ${(subList as string[]).join(', ')}`)
      .join('; ');

    const portfolioDesc = `
      Temas Generales: ${topics.join(', ')}.
      Intereses Específicos: ${subInterestsDesc}.
      Activos Financieros (Stocks): ${tickers.map((t: any) => `${t.symbol} (${t.name})`).join(', ')}.
    `;

    // Map articles to a numbered list for the AI to analyze easily
    const articlesContext = articles.map((a: any, index: number) => `
      --- ARTÍCULO ${index + 1} (ID: ${a.id}) ---
      Título: ${a.title}
      Resumen: ${a.summary}
    `).join('\n');

    const prompt = `Eres un asesor financiero experto y analista de impacto altamente técnico. 
Tu misión es evaluar estrictamente cómo las siguientes noticias afectan al portafolio y los intereses ESPECÍFICOS de tu cliente.

PERFIL DEL CLIENTE:
${portfolioDesc}

ARTÍCULOS A EVALUAR:
${articlesContext}

INSTRUCCIONES:
Para cada artículo, debes determinar el impacto DIRECTO en el perfil del cliente.
Usa SÓLO los siguientes códigos de intensidad:
- Si afecta negativamente (ej. caída de acciones, regulaciones en contra): N1 (Leve), N2, N3, N4, N5 (Catastrófico).
- Si afecta positivamente (ej. alza de mercado, oportunidades de inversión clave): P1 (Leve), P2, P3, P4, P5 (Extremadamente Positivo).
- Si es simplemente informativo y no le afecta de forma direccta o su impacto económico es nulo: NU (Neutral).

FORMATO DE RESPUESTA REQUERIDO:
Devuelve SÓLO un objeto JSON donde la clave es el ID del artículo y el valor es el código de impacto.
NO escribas texto fuera del JSON. NO uses markdown de código.

Ejemplo:
{
  "uuid-del-articulo-1": "P4",
  "uuid-del-articulo-2": "NU",
  "uuid-del-articulo-3": "N2"
}`;

    const model = process.env.OPENROUTER_FILTER_MODEL || 'openrouter/hunter-alpha';
    const { content } = await callOpenRouter({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Low temp for robust JSON mapping
    });

    try {
      const rawJson = content.replace(/```json\n?|\`\`\`/g, '').trim();
      const impactMap = JSON.parse(rawJson);
      return NextResponse.json(impactMap);
    } catch (parseErr) {
      console.error("Impact JSON Parsing Error:", content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Impact Assessor Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
