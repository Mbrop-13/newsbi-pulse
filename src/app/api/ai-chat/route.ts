import { NextRequest } from "next/server";
import { streamText, StreamData } from 'ai';
import { z } from 'zod';
import { createClient } from "@/lib/supabase/server";
import { checkLimit, incrementUsage, getUserTier, checkTokenLimit, incrementTokenUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, AI_CHAT_LIMIT } from "@/lib/rate-limit";
import { detectSuspiciousPatterns } from "@/lib/security";
import { runOrchestration, runWebBuilderOrchestration, selectRelevantContext } from "@/lib/services/agent-orchestrator";
import { containsArtifact, parseArtifact, actionsToFiles } from "@/lib/webbuilder-parser";

// Modular imports
import { getSystemPrompt } from "./prompts/finance-prompt";
import { getWebBuilderSystemPrompt } from "./prompts/webbuilder-prompt";
import { createMimoWithWebSearch } from "./utils/mimo-client";
import { getFinanceTools } from "./handlers/finance-tools";
import { getBrowserTools } from "./handlers/browser-tools";

export const maxDuration = 300;

const aiChatSchema = z.object({
  messages: z.array(z.any()),
  articles: z.array(z.any()).optional().default([]),
  files: z.array(z.any()).optional().default([]),
  modelId: z.string().optional(),
  activeTools: z.array(z.string()).optional(),
  contextOverride: z.string().optional(),
  webSearch: z.boolean().optional(),
  browser: z.boolean().optional(),
  webBuilder: z.boolean().optional(),
  webBuilderFiles: z.record(z.string(), z.any()).optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();
    const parseResult = aiChatSchema.safeParse(rawBody);

    if (!parseResult.success) {
      console.warn("[API_VALIDATION_ERROR]", parseResult.error.format());
      return new Response(JSON.stringify({ 
        error: "Invalid request payload", 
        details: parseResult.error.format() 
      }), { status: 400 });
    }

    const { messages, articles, files, modelId, activeTools, contextOverride, webSearch, browser, webBuilder, webBuilderFiles } = parseResult.data;

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages are required" }), { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // IP-based fallback identifier for guest users
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const userId = user?.id || `guest-${ip}`;

    // Fetch custom assistant configuration if it exists and user is logged in
    let assistantConfig = null;
    if (user) {
      const { data } = await supabase
        .from("assistant_configs")
        .select("name, tone, role, topics")
        .eq("user_id", user.id)
        .maybeSingle();
      assistantConfig = data;
    }

    const assistantName = assistantConfig?.name || "Maverlang AI";
    const assistantTone = assistantConfig?.tone || "Analítico";
    const assistantRole = assistantConfig?.role || "Mentor Financiero";
    const assistantTopics = assistantConfig?.topics || [];

    // ── Pre-check security scanner ──
    const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user')?.content || '';
    if (lastUserMessage) {
      const securityCheck = detectSuspiciousPatterns(lastUserMessage);
      if (securityCheck.isSuspicious) {
        console.warn(`[SECURITY_ALERT] [PRE-CHECK_DETECTION] Intento de Prompt Injection o solicitud dudosa del usuario ${userId}. Motivo: ${securityCheck.reason}. Contenido: "${lastUserMessage}"`);
        return new Response(JSON.stringify({ 
          error: "Solicitud bloqueada por políticas de seguridad (Intento de evasión detectado).", 
          code: "SECURITY_VIOLATION" 
        }), { status: 403 });
      }
    }

    // Burst protection — prevents rapid-fire abuse
    const rl = await rateLimit(`ai:${userId}`, AI_CHAT_LIMIT);
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds);

    const tokenLimit = await checkTokenLimit(userId);
    if (!tokenLimit.allowed) {
      return new Response(JSON.stringify({
        error: user 
          ? "Has alcanzado el límite de tokens de tu plan para la IA. Actualiza tu suscripción para continuar."
          : "Límite de tokens de invitado alcanzado. Por favor inicia sesión o regístrate para continuar chateando.",
        code: "TOKEN_LIMIT_REACHED",
        details: tokenLimit,
      }), { status: 403 });
    }

    const tier = user ? await getUserTier(user.id) : "free";
    const isPremium = tier !== "free";

    // Enforce model restrictions
    let finalModelStr = "xiaomi/mimo-v2.5";
    if (modelId === "pro") {
      if (isPremium) {
        finalModelStr = "xiaomi/mimo-v2.5-pro";
      } else {
        // Fallback to fast model if user is free and somehow requested pro
        finalModelStr = "xiaomi/mimo-v2.5";
      }
    }

    // Inject dynamic context as first user message context (not in system prompt = keeps cache)
    const now = new Date();
    const chileTime = now.toLocaleString('es-CL', { timeZone: 'America/Santiago', dateStyle: 'full', timeStyle: 'short' });
    let contextPrefix = `[Contexto: ${chileTime}]\n\n`;

    // Inject attached files into the conversation context if present
    if (files && Array.isArray(files) && files.length > 0) {
      contextPrefix += `[ARCHIVOS ADJUNTOS DEL USUARIO]\n`;
      for (const file of files) {
        const isImage = file.type === "image" || (file.content && file.content.startsWith("data:image/"));
        if (isImage) {
          contextPrefix += `--- Archivo de Imagen: ${file.name} (Imagen subida por el usuario) ---\n\n`;
        } else {
          contextPrefix += `--- Archivo: ${file.name} ---\nContenido:\n${file.content}\n---------------------\n\n`;
        }
      }
      contextPrefix += `[Fin de Archivos Adjuntos. Utiliza esta información si el usuario te hace consultas sobre estos archivos.]\n\n`;
    }

    if (activeTools && Array.isArray(activeTools)) {
      for (const toolId of activeTools) {
        if (toolId.startsWith('chart_')) {
          const chartType = toolId.split('_')[1];
          contextPrefix += `[INSTRUCCIÓN ESTRICTA: El usuario ha solicitado explícitamente visualizar su respuesta con la herramienta render_chart usando un gráfico de tipo '${chartType}'. Analiza su consulta y DEBES llamar a render_chart con type='${chartType}'.]\n\n`;
        } else if (toolId === 'analyze_stock') {
          contextPrefix += `[INSTRUCCIÓN ESTRICTA: El usuario ha activado el 'Análisis Fundamental'. Si la pregunta involucra una acción o empresa, DEBES priorizar llamar a la herramienta analyze_stock.]\n\n`;
        } else if (toolId === 'compare_stocks') {
          contextPrefix += `[INSTRUCCIÓN ESTRICTA: El usuario ha activado 'Comparación de Acciones'. Si menciona múltiples empresas, DEBES llamar a compare_stocks.]\n\n`;
        } else if (toolId === 'get_sector_performance') {
          contextPrefix += `[INSTRUCCIÓN ESTRICTA: El usuario ha activado 'Rendimiento por Sector'. DEBES llamar a get_sector_performance para responder.]\n\n`;
        }
      }
    }

    // Token optimization: Limit history to first message (context) and last 10 messages
    let optimizedMessages = messages;
    if (messages.length > 11) {
      optimizedMessages = [
        messages[0], 
        ...messages.slice(messages.length - 10)
      ];
    }

    const processedMessages = optimizedMessages.map((m: any, i: number) => {
      let content = m.content;
      
      // Token optimization: Remove heavy XML artifacts from previous assistant messages
      if (m.role === 'assistant' && typeof content === 'string') {
        content = content.replace(
          /<maverlangArtifact[\s\S]*?<\/maverlangArtifact>/g, 
          '\n\n[CÓDIGO AUTOGENERADO OMITIDO POR BREVEDAD PARA AHORRAR TOKENS. EL ESTADO ACTUAL DE LOS ARCHIVOS YA HA SIDO ENVIADO EN EL CONTEXTO]\n\n'
        );
      }

      return {
        role: m.role,
        content: i === 0 && m.role === 'user' ? contextPrefix + (contextOverride || content) : content,
      };
    });

    // NOTE: Usage is incremented in onFinish (after successful response), NOT here.
    // This prevents counting a question if the AI fails to respond.

    const streamData = new StreamData();
    const mimo = createMimoWithWebSearch(userId, streamData, webSearch !== false);

    // Load user portfolio context for orchestration
    let portfolioText = "";
    if (user) {
      const { data: dbAssets } = await supabase
        .from("portfolios")
        .select("symbol, shares, company_name")
        .eq("user_id", user.id);
      if (dbAssets && dbAssets.length > 0) {
        portfolioText = dbAssets
          .map((a: any) => `- ${a.symbol}: ${a.shares || 0} acciones (${a.company_name || ""})`)
          .join("\n");
      }
    }

    // ── Multi-Agent Orchestration ──
    const orchestratorModel = mimo(finalModelStr);
    let orchestrationResult = { isComplex: false, agentReports: [] as any[], totalTokensUsed: 0 };
    
    if (webBuilder) {
      orchestrationResult = await runWebBuilderOrchestration(
        orchestratorModel,
        lastUserMessage,
        webBuilderFiles || {},
        (text) => {
          try {
            streamData.append({ type: 'reasoning', text });
          } catch {
            // StreamData may already be closed/flushed
          }
        }
      );
    } else {
      orchestrationResult = await runOrchestration(
        orchestratorModel,
        lastUserMessage,
        portfolioText,
        (text) => {
          try {
            streamData.append({ type: 'reasoning', text });
          } catch {
            // StreamData may already be closed/flushed
          }
        },
        false
      );
    }

    // Track orchestrator tokens
    if (orchestrationResult.totalTokensUsed > 0) {
      await incrementTokenUsage(userId, orchestrationResult.totalTokensUsed).catch(console.error);
      
      // Re-verify token limit after orchestration before doing the final streamText
      const postOrchTokenLimit = await checkTokenLimit(userId);
      if (!postOrchTokenLimit.allowed) {
        return new Response(JSON.stringify({
          error: "Los agentes agotaron tu límite de tokens en esta consulta. Actualiza tu suscripción para continuar.",
          code: "TOKEN_LIMIT_REACHED",
          details: postOrchTokenLimit,
        }), { status: 403 });
      }
    }

    let messagesForFinalLlm = processedMessages;
    if (orchestrationResult.isComplex && orchestrationResult.agentReports.length > 0) {
      // Stream agent reports to client
      try {
        streamData.append({
          type: 'agentReports',
          reports: orchestrationResult.agentReports as any
        });
      } catch (e) {
        console.error("Failed to append agent reports to streamData:", e);
      }

      if (webBuilder) {
        // Parse and send the files directly to client via streamData
        const filesToApply: Record<string, { code: string }> = Object.fromEntries(
          Object.entries(webBuilderFiles || {}).map(([path, f]: any) => {
            const code = typeof f === 'object' && f !== null && 'code' in f ? String(f.code) : String(f);
            return [path, { code }];
          })
        );
        
        for (const report of orchestrationResult.agentReports) {
          if (report.success && containsArtifact(report.content)) {
            const parsed = parseArtifact(report.content);
            if (parsed && parsed.actions.length > 0) {
              const fileChanges = actionsToFiles(parsed.actions, filesToApply);
              Object.assign(filesToApply, fileChanges);
            }
          }
        }

        try {
          streamData.append({
            type: 'webbuilder_files',
            files: filesToApply
          });
        } catch (e) {
          console.error("Failed to append webbuilder_files to streamData:", e);
        }

        // The LLM final only needs to write the conversational message (without coding)
        const contextMessage = {
          role: "system" as const,
          content: `Los agentes de WebBuilder ya han generado y modificado los archivos de código correspondientes.
Los siguientes archivos fueron creados o actualizados con éxito:
${Object.keys(filesToApply).map(f => `- ${f}`).join('\n')}

REGLAS PARA TU RESPUESTA FINAL:
1. NO escribas bloques de código ni XML de artefactos (<maverlangArtifact>). Todo el código ya ha sido procesado y enviado al frontend.
2. Saluda al usuario y resume de forma breve, amigable y profesional lo que se ha construido o modificado en cada archivo.
3. Sé conciso y directo en español. Muestra entusiasmo por el resultado.`,
        };

        const lastIndex = messagesForFinalLlm.length - 1;
        messagesForFinalLlm = [
          ...messagesForFinalLlm.slice(0, lastIndex),
          contextMessage,
          messagesForFinalLlm[lastIndex],
        ];
      } else {
        const reportsSummary = orchestrationResult.agentReports
          .map(
            (r) =>
              `[Reporte de Agente Especializado: ${r.agentName} (Rol: ${r.role})]\nTarea: ${r.task}\nResultado del análisis:\n${r.content}`
          )
          .join("\n\n");

        // Inject the summaries as a system context instruction to the final model
        const contextMessage = {
          role: "system" as const,
          content: `REPORTES DE AGENTES ESPECIALIZADOS (ya ejecutados en paralelo):
Los siguientes reportes fueron generados por tus agentes delegados. REGLAS para tu respuesta final:
1. Consolida la información de TODOS los reportes en una respuesta UNIFICADA y coherente.
2. NO repitas trabajo: si un agente ya analizó datos o generó código, referencíalo directamente.
3. Presenta la síntesis de forma profesional con tablas markdown cuando compares datos numéricos.
4. Tu respuesta debe ser el análisis FINAL integrado — el usuario NO ve los reportes individuales a menos que los expanda.
5. Sé conciso pero completo. Prioriza insights accionables.

${reportsSummary}`,
        };

        const lastIndex = messagesForFinalLlm.length - 1;
        messagesForFinalLlm = [
          ...messagesForFinalLlm.slice(0, lastIndex),
          contextMessage,
          messagesForFinalLlm[lastIndex],
        ];
      }
    }

    let finalSystemPromptFiles: Record<string, string> | undefined = undefined;
    if (webBuilder && webBuilderFiles) {
      if (orchestrationResult.isComplex) {
        // Complex orchestration: agents generated code and streamed it directly; final LLM does not need code
        finalSystemPromptFiles = undefined;
      } else {
        // Simple change: only load relevant context to avoid Context Window Explosion
        const rawFiles: Record<string, string> = Object.fromEntries(
          Object.entries(webBuilderFiles).map(([path, f]: any) => {
            const code = typeof f === 'object' && f !== null && 'code' in f ? String(f.code) : String(f);
            return [path, code];
          })
        );
        const fileKeys = Object.keys(rawFiles);
        const appPath = fileKeys.find(k => k.toLowerCase().endsWith('app.tsx') || k.toLowerCase().endsWith('app.jsx')) || '';
        
        let selected = rawFiles;
        if (fileKeys.length > 3 && appPath) {
          selected = selectRelevantContext(appPath, rawFiles);
          const query = lastUserMessage.toLowerCase();
          for (const path of fileKeys) {
            const basename = path.split('/').pop() || '';
            const nameWithoutExt = basename.replace(/\.[^/.]+$/, "");
            if (nameWithoutExt && query.includes(nameWithoutExt.toLowerCase())) {
              const extraContext = selectRelevantContext(path, rawFiles);
              Object.assign(selected, extraContext);
            }
          }
        }
        finalSystemPromptFiles = selected;
      }
    }

    const result = await streamText({
      model: mimo(finalModelStr),
      system: webBuilder
        ? getWebBuilderSystemPrompt(finalSystemPromptFiles)
        : getSystemPrompt(assistantName, assistantTone, assistantRole, assistantTopics),
      messages: messagesForFinalLlm,
      maxTokens: (webBuilder && orchestrationResult.isComplex) ? 2048 : 8192, // MiMo is a reasoning model — needs enough budget for thinking + response
      maxSteps: webBuilder ? undefined : 8,
      toolChoice: webBuilder ? 'none' : 'auto',
      tools: webBuilder ? {} : {
        ...getFinanceTools({ user, userId }),
        ...(browser ? getBrowserTools({ streamData }) : {}),
      },
      onFinish: async ({ text, usage, finishReason }) => {
        // Only count usage if the model actually produced a response
        const hasContent = text && text.trim().length > 0;
        const isValidFinish = finishReason !== 'error';

        if (hasContent && isValidFinish) {
          // Increment message count only on successful response
          await incrementUsage(userId, "ai_message").catch(console.error);
        } else {
          console.warn(`[AI Chat] Skipping usage increment for user ${userId}: finishReason=${finishReason}, hasContent=${hasContent}`);
        }

        if (usage && usage.totalTokens) {
          await incrementTokenUsage(userId, usage.totalTokens).catch(console.error);
          console.log(`[AI Chat] Saved token usage for user ${userId}: ${usage.totalTokens} tokens.`);
        }
        if (text && (text.includes("[ALERTA_SEGURIDAD]") || text.includes("ALERTA DE SEGURIDAD") || text.includes("intento de evasión detectado"))) {
          console.warn(`[SECURITY_ALERT] [LLM_DETECTION] El modelo Maverlang AI detectó un intento de manipulación o solicitud inusual del usuario ${userId}. Respuesta del modelo: "${text}"`);
        }
      }
    });

    return result.toDataStreamResponse({ data: streamData });
  } catch (error: any) {
    console.error("[AI Chat Stream] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
