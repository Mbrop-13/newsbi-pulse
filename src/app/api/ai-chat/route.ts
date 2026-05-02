import { NextRequest, NextResponse } from "next/server";
import { callOpenRouter } from "@/lib/openrouter";
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage } from "@/lib/check-limits";
import {
  parseToolCalls,
  executeTool,
  buildThinkingSteps,
  ToolResult,
} from "@/lib/agent-tools";

// ── Pre-prompt Agéntico ────────────────────────────

const AGENT_SYSTEM_PROMPT = `Eres R-AI, el asistente de inteligencia artificial de Reclu, una plataforma premium de noticias financieras y portafolio de inversiones.

## Tu Personalidad
- Profesional, conciso y analítico
- Respondes SIEMPRE en español de Chile
- Usas markdown para estructurar (##, **bold**, listas, tablas)
- Eres directo, no repites la pregunta del usuario
- Cuando muestres datos financieros, usa tablas markdown

## Herramientas Disponibles
Puedes invocar herramientas para obtener datos en tiempo real. Para usarlas, responde EXACTAMENTE con los siguientes comandos en tu primera respuesta:

- [TOOL:portfolio] → Obtiene todos los activos del portafolio del usuario con precios en tiempo real
- [TOOL:stock_info SYMBOL] → Obtiene el precio actual de un símbolo específico (ej: [TOOL:stock_info AAPL])
- [TOOL:news] → Obtiene las noticias más importantes del día
- [TOOL:news CATEGORY] → Noticias filtradas por categoría (tech, business, politics)
- [TOOL:portfolio_news] → Noticias específicamente relacionadas con los activos del usuario
- [TOOL:alerts] → Obtiene las alertas de precio activas del usuario

## Reglas Críticas de Herramientas
1. Si el usuario pregunta sobre SUS acciones/portafolio/inversiones → USA [TOOL:portfolio]
2. Si pregunta por un activo específico → USA [TOOL:stock_info SYMBOL]
3. Si pregunta sobre noticias de su portafolio → USA [TOOL:portfolio_news]
4. Si pregunta "qué pasó hoy" o noticias generales → USA [TOOL:news]
5. Si pregunta sobre sus alertas → USA [TOOL:alerts]
6. Puedes usar MÚLTIPLES herramientas: [TOOL:portfolio] [TOOL:portfolio_news]
7. Si NO necesitas datos del sistema, responde directamente sin herramientas
8. NUNCA inventes datos financieros. Si no tienes herramientas para algo, dilo.

## Formato de Respuesta con Datos
Cuando recibas datos de herramientas, genera un análisis profesional:
- Para portafolio: tabla con Symbol | Precio | Cambio | Posición, y un resumen ejecutivo
- Para noticias: lista con las más relevantes y su impacto potencial
- Para acciones: análisis del movimiento del día
- Siempre menciona la hora de los datos como "datos actualizados al momento"`;

// ── Shortcut Definitions ───────────────────────────
// Pre-built flows that skip the LLM tool-detection step

interface ShortcutConfig {
  tools: string[];
  systemAddendum: string;
}

const SHORTCUTS: Record<string, ShortcutConfig> = {
  portfolio_summary: {
    tools: ["portfolio"],
    systemAddendum:
      "El usuario quiere un resumen ejecutivo de su portafolio. Genera una tabla con todos los activos, precios, cambios porcentuales y valor de posición. Agrega un resumen general del rendimiento del día.",
  },
  portfolio_news: {
    tools: ["portfolio", "portfolio_news"],
    systemAddendum:
      "El usuario quiere ver noticias relacionadas con su portafolio. Primero muestra un resumen rápido de precios, luego las noticias más relevantes para sus activos con su potencial impacto.",
  },
  top_news: {
    tools: ["news"],
    systemAddendum:
      "El usuario quiere las noticias más importantes del día. Genera un resumen de las noticias más relevantes con impacto potencial en los mercados.",
  },
  market_analysis: {
    tools: ["portfolio", "news"],
    systemAddendum:
      "El usuario quiere un análisis del mercado. Combina el estado de su portafolio con las noticias del día para generar un análisis de cómo las noticias podrían afectar sus inversiones.",
  },
};

// ── Main Handler ───────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { messages, articles, files, webSearch, shortcut } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check usage limits
    const limitCheck = await checkLimit(user.id, "ai_message");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Has alcanzado el límite de consultas de tu plan actual.",
          code: "LIMIT_REACHED",
          details: limitCheck,
        },
        { status: 403 }
      );
    }

    // ── Choose model ──
    const model = webSearch
      ? "x-ai/grok-3-fast:online"
      : "deepseek/deepseek-chat-v3-0324:free";

    // ── Build system prompt ──
    let systemContent = AGENT_SYSTEM_PROMPT;

    // Add article context if attached
    if (articles && Array.isArray(articles) && articles.length > 0) {
      systemContent += `\n\n--- NOTICIAS ADJUNTAS ---\n`;
      articles.forEach((art: any, i: number) => {
        systemContent += `[Noticia ${i + 1}] ${art.title}`;
        if (art.summary) systemContent += ` — ${art.summary}`;
        systemContent += `\n`;
      });
    }

    // Add file context if attached
    if (files && Array.isArray(files) && files.length > 0) {
      systemContent += `\n\n--- ARCHIVOS ADJUNTOS ---\n`;
      files.forEach((file: any) => {
        systemContent += `[${file.name}]\n${file.content}\n\n`;
      });
    }

    // ── Shortcut Flow ──
    // If a shortcut was triggered, skip the LLM tool-detection step
    // and directly execute the tools, then pass results to LLM
    if (shortcut && SHORTCUTS[shortcut]) {
      const config = SHORTCUTS[shortcut];
      const toolResults: ToolResult[] = [];
      const thinkingSteps: string[] = [];

      for (const toolName of config.tools) {
        const result = await executeTool(toolName, "", user.id);
        if (result) {
          toolResults.push(result);
          // Build thinking steps
          if (toolName === "portfolio") {
            thinkingSteps.push("Consultando tu portafolio...");
            thinkingSteps.push("Obteniendo precios en tiempo real...");
          } else if (toolName === "portfolio_news") {
            thinkingSteps.push("Analizando noticias de tu portafolio...");
          } else if (toolName === "news") {
            thinkingSteps.push("Buscando noticias relevantes...");
          }
        }
      }
      thinkingSteps.push("Generando análisis...");

      // Build enriched system with tool results
      let enrichedSystem = systemContent + "\n\n" + config.systemAddendum;
      enrichedSystem += "\n\n--- DATOS DEL SISTEMA ---\n";
      for (const tr of toolResults) {
        enrichedSystem += `\n[${tr.tool.toUpperCase()}] ${tr.summary}\n`;
        enrichedSystem += JSON.stringify(tr.data, null, 2) + "\n";
      }

      const finalResult = await callOpenRouter({
        model,
        messages: [
          { role: "system", content: enrichedSystem },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 3000,
        search: webSearch || false,
      });

      await incrementUsage(user.id, "ai_message").catch(console.error);

      return NextResponse.json({
        content: finalResult.content,
        citations: finalResult.citations || [],
        toolResults,
        thinkingSteps,
        model: webSearch ? "grok" : "deepseek",
      });
    }

    // ── Normal Flow (with tool detection) ──
    // Step 1: Ask LLM what tools it needs
    const step1Messages = [
      { role: "system" as const, content: systemContent },
      ...messages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const step1Result = await callOpenRouter({
      model,
      messages: step1Messages,
      temperature: 0.7,
      max_tokens: 3000,
      search: webSearch || false,
    });

    // Step 2: Check if LLM requested tools
    const toolCalls = parseToolCalls(step1Result.content);

    if (toolCalls.length === 0) {
      // No tools needed — direct response
      await incrementUsage(user.id, "ai_message").catch(console.error);

      return NextResponse.json({
        content: step1Result.content,
        citations: step1Result.citations || [],
        toolResults: [],
        thinkingSteps: [],
        model: webSearch ? "grok" : "deepseek",
      });
    }

    // Step 3: Execute tools
    const toolResults: ToolResult[] = [];
    for (const call of toolCalls) {
      const result = await executeTool(call.tool, call.params, user.id);
      if (result) toolResults.push(result);
    }

    const thinkingSteps = buildThinkingSteps(toolCalls);

    // Step 4: Re-inject tool results and get final answer
    let enrichedSystem = systemContent;
    enrichedSystem += "\n\n--- DATOS DEL SISTEMA (RESULTADOS DE HERRAMIENTAS) ---\n";
    enrichedSystem += "Usa estos datos REALES para generar tu respuesta. NO inventes números.\n\n";
    for (const tr of toolResults) {
      enrichedSystem += `[${tr.tool.toUpperCase()}] ${tr.summary}\n`;
      enrichedSystem += JSON.stringify(tr.data, null, 2) + "\n\n";
    }

    const finalResult = await callOpenRouter({
      model,
      messages: [
        { role: "system", content: enrichedSystem },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 3000,
      search: webSearch || false,
    });

    await incrementUsage(user.id, "ai_message").catch(console.error);

    return NextResponse.json({
      content: finalResult.content,
      citations: finalResult.citations || [],
      toolResults,
      thinkingSteps,
      model: webSearch ? "grok" : "deepseek",
    });
  } catch (error: any) {
    console.error("[AI Chat] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
