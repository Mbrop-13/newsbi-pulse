import { NextRequest, NextResponse } from "next/server";

// ── Chat API Route ───────────────────────────────
// Handles per-article chat with Grok AI

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { message, articleContext, history } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const model = process.env.XAI_MODEL || "grok-3";

    const systemPrompt = articleContext
      ? `Eres un asistente de noticias IA impulsado por Grok. Estás respondiendo preguntas sobre esta noticia:

Título: ${articleContext.title}
Contenido: ${articleContext.enriched_content || articleContext.description}
Fuente: ${articleContext.original_source}
Categoría: ${articleContext.category}

Responde de forma precisa, neutral y profesional en español. Si no tienes información suficiente, indícalo claramente. Sé conciso pero informativo.`
      : `Eres un asistente de noticias IA impulsado por Grok. Responde preguntas sobre noticias de actualidad, tecnología, negocios y Chile. Sé preciso, neutral y profesional en español.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate chat response", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
