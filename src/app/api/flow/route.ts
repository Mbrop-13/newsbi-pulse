import { NextResponse } from "next/server";
import { callOpenRouter, type OpenRouterMessage } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, model, isAgentActive } = body;

    if (!prompt) {
      return NextResponse.json({ error: "El prompt es obligatorio." }, { status: 400 });
    }

    // Determine the OpenRouter model identifier
    const openRouterModel = model || "google/gemini-3.1-flash-lite-image";

    // System prompt tailored for multimedia flow workspace
    const systemInstruction = isAgentActive
      ? `Eres el Agente Creativo de Maverlang Flow. Tu objetivo es ayudar al usuario de forma autónoma a planificar, desarrollar y optimizar contenido multimedia, diseño de personajes, guiones gráficos y herramientas interactivas. Proporciona planes detallados paso a paso, código de ejemplo si es necesario, y recomendaciones profesionales de primer nivel.`
      : `Eres Maverlang Flow, un asistente de inteligencia artificial especializado en diseño creativo, generación multimedia, creación de personajes y escenas. Ayuda al usuario con prompts ingeniosos, descripciones cinemáticas y consejos prácticos de arte digital. Sé directo y profesional.`;

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ];

    const result = await callOpenRouter({
      model: openRouterModel,
      messages,
      temperature: 0.7,
      max_tokens: 2500,
    });

    return NextResponse.json({ content: result.content });
  } catch (error: any) {
    console.error("[FLOW-API] Error:", error);
    return NextResponse.json(
      { error: "Lo sentimos, estamos teniendo dificultades en este momento. Por favor, inténtelo de nuevo más tarde." },
      { status: 500 }
    );
  }
}
