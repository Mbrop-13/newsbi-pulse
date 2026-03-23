import { NextRequest, NextResponse } from "next/server";

// ── Grok AI Enrichment API Route ──────────────────
// Uses xAI Grok API with tool calling for:
// - Source verification via web_search
// - Neutral rewrite (400 words max)
// - Live event detection (Trump, White House)
// - Official YouTube link detection

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "XAI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { article } = await request.json();
    if (!article || !article.title) {
      return NextResponse.json(
        { error: "Article with title is required" },
        { status: 400 }
      );
    }

    const model = process.env.XAI_MODEL || "grok-3";

    // Step 1: Enrich with Grok
    const enrichResponse = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `Eres un periodista profesional de tecnología y negocios. Tu tarea es:
1. Verificar la veracidad de la noticia
2. Reescribirla de forma neutral, atractiva y profesional (máximo 400 palabras) en español chileno
3. Detectar si es un evento EN VIVO (conferencias de prensa, transmisiones etc.)
4. Si detectas un evento live, buscar el link oficial de YouTube
5. Determinar el sentimiento general (positive/negative/neutral)

Responde siempre en formato JSON con esta estructura:
{
  "enriched_content": "texto reescrito profesional...",
  "is_live": false,
  "live_youtube_url": null,
  "sentiment": "neutral",
  "verified": true,
  "verification_notes": "breve nota sobre verificación",
  "suggested_tags": ["tag1", "tag2"]
}`,
          },
          {
            role: "user",
            content: `Analiza y enriquece esta noticia:\n\nTítulo: ${article.title}\n\nDescripción: ${article.description || "N/A"}\n\nContenido: ${article.content || "N/A"}\n\nFuente: ${article.original_source || "N/A"}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "web_search",
              description: "Search the web to verify news claims and find additional sources",
              parameters: {
                type: "object",
                properties: {
                  query: {
                    type: "string",
                    description: "Search query to verify the news",
                  },
                },
                required: ["query"],
              },
            },
          },
          {
            type: "function",
            function: {
              name: "x_keyword_search",
              description: "Search X/Twitter for related posts and reactions",
              parameters: {
                type: "object",
                properties: {
                  keyword: {
                    type: "string",
                    description: "Keyword to search on X",
                  },
                },
                required: ["keyword"],
              },
            },
          },
        ],
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!enrichResponse.ok) {
      const errText = await enrichResponse.text();
      throw new Error(`Grok API error: ${enrichResponse.status} - ${errText}`);
    }

    const enrichData = await enrichResponse.json();
    const content = enrichData.choices?.[0]?.message?.content;

    let enrichment;
    try {
      // Try to parse JSON from the response
      const jsonMatch = content?.match(/\{[\s\S]*\}/);
      enrichment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      enrichment = {
        enriched_content: content,
        is_live: false,
        live_youtube_url: null,
        sentiment: "neutral",
        verified: false,
        verification_notes: "Could not parse structured response",
        suggested_tags: [],
      };
    }

    return NextResponse.json({
      success: true,
      enrichment,
    });
  } catch (error: unknown) {
    console.error("Enrichment error:", error);
    return NextResponse.json(
      { error: "Failed to enrich article", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
