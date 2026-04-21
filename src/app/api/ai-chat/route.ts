import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";

export async function POST(request: NextRequest) {
  try {
    const { messages, articles, files } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Build system prompt dynamically based on attached articles
    let systemContent = `Eres el asistente de IA de Reclu, una plataforma de noticias y mercados de predicción.
Responde siempre en español de forma concisa y profesional.
Puedes buscar información en internet para dar respuestas actualizadas.
Usa formato Markdown para estructurar tus respuestas cuando sea apropiado.
Sé amable, útil y directo. No repitas la pregunta del usuario.`;

    if (articles && Array.isArray(articles) && articles.length > 0) {
      systemContent += `\n\n--- CONTEXTO DE NOTICIAS ADJUNTAS ---\n`;
      systemContent += `El usuario ha adjuntado las siguientes noticias para que las analices y respondas según su contexto:\n\n`;
      articles.forEach((art: any, i: number) => {
        systemContent += `[Noticia ${i + 1}]\n`;
        systemContent += `Título: ${art.title}\n`;
        if (art.category) systemContent += `Categoría: ${art.category}\n`;
        if (art.summary) systemContent += `Resumen: ${art.summary}\n`;
        systemContent += `\n`;
      });
      systemContent += `Usa estas noticias como contexto principal para responder las preguntas del usuario. Si te preguntan algo relacionado, haz referencia directa a estas noticias.`;
    }

    if (files && Array.isArray(files) && files.length > 0) {
      systemContent += `\n\n--- ARCHIVOS ADJUNTOS ---\n`;
      systemContent += `El usuario ha adjuntado los siguientes archivos de texto como contexto:\n\n`;
      files.forEach((file: any) => {
        systemContent += `[Archivo: ${file.name}]\n`;
        systemContent += `${file.content}\n\n`;
      });
      systemContent += `Analiza el contenido de estos archivos y utilízalos para responder a las preguntas del usuario cuando sea relevante.`;
    }

    const systemPrompt = {
      role: "system" as const,
      content: systemContent,
    };

    const result = await callOpenRouter({
      model: "x-ai/grok-3-fast:online",
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 2000,
      search: true,
    });

    return NextResponse.json({
      content: result.content,
      citations: result.citations || [],
    });
  } catch (error: any) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
