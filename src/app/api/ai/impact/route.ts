import { NextRequest, NextResponse } from 'next/server';
import { callOpenRouter } from '@/lib/openrouter';
import { createClient } from "@/lib/supabase/server";
import { z } from 'zod';
import { checkTokenLimit, incrementTokenUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, AI_CHAT_LIMIT } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/auth-helpers";

const impactRequestSchema = z.object({
  articles: z.array(z.object({
    id: z.string().max(80),
    title: z.string().max(400).optional(),
    summary: z.string().max(2000).optional(),
  })).min(1).max(12),
}).strict();

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rl = await rateLimit(`ai-impact:${user.id}:${ip}`, {
      ...AI_CHAT_LIMIT,
      failClosedInProd: true,
    });
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const tokenLimit = await checkTokenLimit(user.id);
    if (!tokenLimit.allowed) {
      return NextResponse.json({
        error: "Has alcanzado el límite de tokens de tu plan para la IA.",
        code: "TOKEN_LIMIT_REACHED",
      }, { status: 403 });
    }

    const rawBody = await req.json();
    const parseResult = impactRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }
    const { articles } = parseResult.data;

    const [{ data: assistantConfig }, { data: portfolioRows }] = await Promise.all([
      supabase
        .from("assistant_configs")
        .select("topics, interests")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("portfolios")
        .select("symbol, company_name")
        .eq("user_id", user.id)
        .limit(50),
    ]);

    const topics = Array.isArray(assistantConfig?.topics) ? assistantConfig!.topics.slice(0, 20) : [];
    const tickers = (portfolioRows || []).map((t) => ({
      symbol: t.symbol,
      name: t.company_name,
    }));
    const interests = (assistantConfig?.interests || {}) as Record<string, unknown>;
    
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
      const used = Math.ceil((content?.length || 0) / 4) + 800;
      await incrementTokenUsage(user.id, used);
      return NextResponse.json(impactMap);
    } catch (parseErr) {
      console.error("Impact JSON Parsing Error:", content);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

  } catch (error) {
    console.error("AI Impact Assessor Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
