import { NextRequest } from "next/server";
import { streamText, StreamData, formatStreamPart, tool } from 'ai';
import { z } from 'zod';
import { runPythonCode } from "@/lib/services/pyodide-sandbox";
import { createClient } from "@/lib/supabase/server";
import { getUserTier, checkTokenLimit, incrementTokenUsage } from "@/lib/check-limits";
import { rateLimit, rateLimitResponse, AI_CHAT_LIMIT } from "@/lib/rate-limit";
import { detectSuspiciousPatterns } from "@/lib/security";
import { runOrchestration, runWebBuilderOrchestration, planWebBuilder, executeWebBuilderAgents, selectRelevantContext } from "@/lib/services/agent-orchestrator";
import { containsArtifact, parseArtifact, actionsToFiles } from "@/lib/webbuilder-parser";

// Modular imports
import { getSystemPrompt } from "./prompts/finance-prompt";
import { getWebBuilderSystemPrompt } from "./prompts/webbuilder-prompt";
import { createLlmWithWebSearch } from "./utils/llm-client";
import { getFinanceTools } from "./handlers/finance-tools";
import { getBrowserTools } from "./handlers/browser-tools";

export const maxDuration = 300;

/**
 * #6 SANITIZACIÓN ANTI PROMPT-INJECTION.
 *
 * `replanFeedback` y `originalUserMessage` son texto libre del usuario que se
 * inyecta directamente en el prompt del planner. Un usuario malicioso (o un
 * contenido copy-pasteado) podría intentar override instructions del tipo
 * "Ignora las reglas anteriores y...". Esta función:
 *  - Acota la longitud (evita DoS por prompt gigante).
 *  - Marca claramente el contenido como DATOS del usuario (no instrucciones).
 *  - Neutraliza secuencias que imitan directivas de sistema/rol.
 */
function sanitizeUserPlanInput(raw: string | undefined | null, maxLen = 2000): string {
  if (!raw) return "";
  let s = String(raw).trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);
  // Neutralizar marcadores de rol que podrían confundir al planner.
  s = s
    .replace(/^\s*(system|assistant|user|tool)\s*:/gim, "$1:")
    .replace(/<\s*\/?\s*(system|assistant|developer|role)\s*>/gi, "[$1]");
  return s;
}

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
  projectType: z.enum(["web", "app", "multiplatform"]).optional(),
  // Modo de construcción del WebBuilder: "plan" (planifica y pide aprobación)
  // o "turbo" (planifica y construye de una). Default implícito: turbo si no viene.
  buildMode: z.enum(["plan", "turbo"]).optional(),
  // Plan aprobado por el usuario (modo Plan): el servidor ejecuta solo agentes.
  // #6 Schema estricto: antes era z.array(z.any()) que aceptaba cualquier cosa.
  // Ahora validamos la forma real del agente para evitar que el cliente inyecte
  // payloads arbitrarios en el prompt del planner/ejecutor.
  approvedPlan: z.object({
    reason: z.string().max(4000),
    agents: z.array(z.object({
      agentName: z.string().max(120),
      role: z.string().max(200),
      task: z.string().max(4000),
      filePath: z.string().max(300).regex(/^[\w\-./]+$/, "filePath debe ser una ruta relativa válida"),
    })).min(1).max(5),
  }).optional(),
  // Feedback del usuario para replanificar (modo Plan): regenera el plan.
  replanFeedback: z.string().max(2000).optional(),
  // Cancelación del plan (modo Plan): el usuario escribió "no" / "cancelar".
  cancelPlan: z.boolean().optional(),
  // Mensaje original del usuario que originó el plan (para replan / ejecución).
  originalUserMessage: z.string().max(8000).optional(),
  codeInterpreter: z.boolean().optional(),
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

    const { messages, articles, files, modelId, activeTools, contextOverride, webSearch, browser, webBuilder, webBuilderFiles, projectType, buildMode, approvedPlan, replanFeedback, cancelPlan, originalUserMessage, codeInterpreter } = parseResult.data;

    // #6 SANITIZACIÓN: el feedback/mensaje original del usuario se inyecta en
    // el prompt del planner. Saneamos para neutralizar intentos de prompt
    // injection (override de instrucciones, marcadores de rol, etc.).
    const safeReplanFeedback = replanFeedback ? sanitizeUserPlanInput(replanFeedback) : undefined;
    const safeOriginalUserMessage = originalUserMessage ? sanitizeUserPlanInput(originalUserMessage, 8000) : undefined;

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
        .select("name, tone, role, topics, interests")
        .eq("user_id", user.id)
        .maybeSingle();
      assistantConfig = data;
    }

    const assistantName = assistantConfig?.name || "Maverlang AI";
    const assistantTone = assistantConfig?.tone || "Analítico";
    const assistantRole = assistantConfig?.role || "Mentor Financiero";
    const assistantTopics = assistantConfig?.topics || [];
    const interestsObj = (assistantConfig?.interests || {}) as Record<string, any>;
    const userName = interestsObj.userName || "";
    const primaryInterest = interestsObj.primaryInterest || "";

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
    let finalModelStr = process.env.LLM_MODEL_FAST || "xiaomi/mimo-v2.5";
    if (modelId === "pro") {
      if (isPremium) {
        finalModelStr = process.env.LLM_MODEL_PRO || "xiaomi/mimo-v2.5-pro";
      } else {
        // Fallback to fast model if user is free and somehow requested pro
        finalModelStr = process.env.LLM_MODEL_FAST || "xiaomi/mimo-v2.5";
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

    const encoder = new TextEncoder();
    let streamController: ReadableStreamDefaultController<Uint8Array> | null = null;
    // Client abort (stop button) → cancel server work as soon as possible
    const abortSignal = req.signal;
    let clientAborted = abortSignal.aborted;

    const responseStream = new ReadableStream({
      start(controller) {
        streamController = controller;
      },
      cancel() {
        // Client closed the connection (stop / navigation)
        clientAborted = true;
      },
    });

    const isAborted = () => clientAborted || abortSignal.aborted;

    const sendData = (type: 'text' | 'data' | 'error', value: any) => {
      if (!streamController || isAborted()) return;
      try {
        const chunkStr = formatStreamPart(type, value);
        streamController.enqueue(encoder.encode(chunkStr));
      } catch (err) {
        console.error("[DataStream] error writing chunk:", err);
      }
    };

    abortSignal.addEventListener("abort", () => {
      clientAborted = true;
    });

    // ── Heartbeat keepalive ──
    // GLM-5.2 (y modelos lentos en general) pueden tardar 30-120s en la
    // orquestación de agentes antes de emitir el primer texto visible. Durante
    // ese tiempo, aunque enviamos chunks de 'reasoning' de progreso, puede
    // haber pausas largas entre agentes que el gateway/proxy (Vercel,
    // Cloudflare, reverse proxy) interpreta como inactividad → 504 Gateway
    // Timeout.
    //
    // Solución: un interval que envíe un chunk de 'data' vacío cada 10 segundos
    // usando el formato Data Stream VÁLIDO de Vercel AI SDK. El parser del
    // cliente lo procesa sin romper (un array vacío de data no renderiza nada),
    // pero el byte viaja por el TCP → el proxy ve actividad → no corta.
    // NO usar comentarios SSE (': foo\n'): el protocolo Data Stream de Vercel
    // AI SDK no los soporta y el parser lanza "Failed to parse stream string.
    // Invalid code .", matando todo el stream.
    const heartbeatInterval = setInterval(() => {
      if (!streamController || isAborted()) {
        clearInterval(heartbeatInterval);
        return;
      }
      try {
        // Reusamos el MISMO formato que onOrchProgress (reasoning), que ya
        // sabemos que el parser del cliente procesa sin romper. Texto vacío =
        // no renderiza nada en la UI pero el byte viaja por el TCP.
        sendData('data', [{ type: 'reasoning', text: '' }]);
      } catch (err) {
        clearInterval(heartbeatInterval);
      }
    }, 10000);

    // Run async execution in the background
    (async () => {
      try {
        if (isAborted()) return;
        // Create a wrapper for streamData that directs append calls to sendData
        const fakeStreamData = {
          append: (value: any) => {
            // value is formatted as { type: 'reasoning', text: '...' } etc.
            sendData('data', [value]);
          },
          close: () => {}
        } as any;

        const llm = createLlmWithWebSearch(userId, fakeStreamData, webBuilder ? false : (webSearch !== false));

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
        const orchestratorModel = llm(finalModelStr);
        let orchestrationResult = { isComplex: false, agentReports: [] as any[], totalTokensUsed: 0, reason: "", agents: [] as any[] };
        // Bandera: si true, el flujo de plan/cancel/replan ya resolvió todo y NO
        // debe correr el streamText final (el plan es un "turno" que termina aquí).
        let planTurnHandled = false;

        const onOrchProgress = (text: string) => {
          if (isAborted()) return;
          try { fakeStreamData.append({ type: 'reasoning', text }); } catch { /* Ignore */ }
        };

        // Estado acumulado de archivos del proyecto. Se declara ANTES de la
        // orquestación para que el closure onFileReady (streaming apply live)
        // pueda capturarlo y emitir incremental.
        const filesToApply: Record<string, { code: string }> = Object.fromEntries(
          Object.entries(webBuilderFiles || {}).map(([path, f]: any) => {
            const code = typeof f === 'object' && f !== null && 'code' in f ? String(f.code) : String(f);
            return [path, { code }];
          })
        );

        // Streaming apply live (la "magia" de Lovable): cada agente al terminar
        // emite su archivo al stream INMEDIATAMENTE, en vez de esperar al final.
        // El callback es síncrono y single-threaded → parse+assign+append atómico,
        // sin races sobre filesToApply. El cliente ya hace merge incremental.
        const onFileReady = (agent: any, content: string, success: boolean) => {
          if (!success || !content || !containsArtifact(content)) return;
          const parsed = parseArtifact(content);
          if (!parsed || parsed.actions.length === 0) return;
          const { files: fileChanges, failedUpdates } = actionsToFiles(parsed.actions, filesToApply);
          Object.assign(filesToApply, fileChanges);
          try {
            fakeStreamData.append({ type: 'webbuilder_files', files: filesToApply });
          } catch (e) {
            console.error("Failed to append incremental webbuilder_files:", e);
          }
          // Surfacing estilo Aider: si un bloque SEARCH no coincidió, avisarlo.
          if (failedUpdates.length > 0) {
            const summary = failedUpdates.map(f => `• ${f.filePath}: ${f.reason}`).join('\n');
            try {
              fakeStreamData.append({
                type: 'reasoning',
                text: `\n⚠️ ${failedUpdates.length} edición(es) no aplicada(s) — el bloque SEARCH no coincide con el código actual:\n${summary}\nVuelve a pedirla indicando el código exacto.\n`,
              });
            } catch (e) {
              console.error("Failed to append failedUpdates reasoning:", e);
            }
          }
        };

        if (webBuilder) {
          // ── Modo PLAN: el usuario tiene un plan pendiente y respondió ──
          if (buildMode === "plan" && cancelPlan) {
            // Cancelar: el usuario escribió "no" / "cancelar". No se orquesta nada.
            orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: 0, reason: "Plan cancelado por el usuario.", agents: [] };
            planTurnHandled = true;
          } else if (buildMode === "plan" && approvedPlan && approvedPlan.agents.length > 0) {
            // Aprobado: ejecutar SOLO los agentes con el plan ya validado.
            const exec = await executeWebBuilderAgents(
              orchestratorModel,
              approvedPlan.agents,
              safeOriginalUserMessage || lastUserMessage,
              webBuilderFiles || {},
              onOrchProgress,
              onFileReady
            );
            orchestrationResult = {
              isComplex: true,
              reason: approvedPlan.reason,
              agents: approvedPlan.agents,
              agentReports: exec.agentReports,
              totalTokensUsed: exec.totalTokensUsed,
            };
          } else if (buildMode === "plan" && safeReplanFeedback) {
            // Replanificar: regenerar el plan incorporando el feedback del usuario.
            const plan = await planWebBuilder(
              orchestratorModel,
              safeOriginalUserMessage || lastUserMessage,
              webBuilderFiles || {},
              onOrchProgress,
              safeReplanFeedback
            );
            if (plan.question) {
              try {
                fakeStreamData.append({ type: 'question', question: plan.question });
              } catch (e) { console.error("Failed to append question to streamData:", e); }
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
            } else if (plan.isComplex && plan.agents.length > 0) {
              // Emitir la nueva tarjeta del plan y terminar el turno aquí.
              try {
                fakeStreamData.append({ type: 'plan', planId: `plan-${Date.now()}`, reason: plan.reason, agents: plan.agents });
              } catch (e) { console.error("Failed to append plan to streamData:", e); }
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: plan.agents };
            } else {
              // El feedback hizo que sea simple: proceder como conversación normal.
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
            }
            planTurnHandled = true;
          } else if (buildMode === "plan") {
            // Primera petición en modo Plan: solo planificar y emitir la tarjeta.
            const plan = await planWebBuilder(
              orchestratorModel,
              lastUserMessage,
              webBuilderFiles || {},
              onOrchProgress
            );
            if (plan.question) {
              try {
                fakeStreamData.append({ type: 'question', question: plan.question });
              } catch (e) { console.error("Failed to append question to streamData:", e); }
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
              planTurnHandled = true;
            } else if (plan.isComplex && plan.agents.length > 0) {
              // Emitir la tarjeta del plan y terminar el turno aquí. El LLM final
              // escribirá el mensaje "escribe aprobado / no / cambios".
              try {
                fakeStreamData.append({ type: 'plan', planId: `plan-${Date.now()}`, reason: plan.reason, agents: plan.agents });
              } catch (e) { console.error("Failed to append plan to streamData:", e); }
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: plan.agents };
              planTurnHandled = true;
            } else {
              // Consulta simple: no hay tarjeta, proceder como conversación normal
              // (puede ir por artifact inline del LLM final como antes).
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
            }
          } else {
            // ── Modo TURBO (o sin buildMode): planificar + ejecutar de una ──
            const plan = await planWebBuilder(
              orchestratorModel,
              lastUserMessage,
              webBuilderFiles || {},
              onOrchProgress
            );
            if (plan.question) {
              try {
                fakeStreamData.append({ type: 'question', question: plan.question });
              } catch (e) { console.error("Failed to append question to streamData:", e); }
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
              planTurnHandled = true;
            } else if (plan.isComplex && plan.agents.length > 0) {
              const exec = await executeWebBuilderAgents(
                orchestratorModel,
                plan.agents,
                lastUserMessage,
                webBuilderFiles || {},
                onOrchProgress,
                onFileReady
              );
              orchestrationResult = {
                isComplex: true,
                reason: plan.reason,
                agents: plan.agents,
                agentReports: exec.agentReports,
                totalTokensUsed: plan.totalTokensUsed + exec.totalTokensUsed,
              };
            } else {
              orchestrationResult = { isComplex: false, agentReports: [], totalTokensUsed: plan.totalTokensUsed, reason: plan.reason, agents: [] };
            }
          }
        } else {
          orchestrationResult = await runOrchestration(
            orchestratorModel,
            lastUserMessage,
            portfolioText,
            onOrchProgress,
            false
          );
        }

        if (isAborted()) return;

        // Track orchestrator tokens (token-only metering)
        if (orchestrationResult.totalTokensUsed > 0) {
          await incrementTokenUsage(userId, orchestrationResult.totalTokensUsed).catch(console.error);
          
          // Re-verify token limit after orchestration before doing the final streamText
          const postOrchTokenLimit = await checkTokenLimit(userId);
          if (!postOrchTokenLimit.allowed) {
            fakeStreamData.append({
              type: 'error',
              message: "Los agentes agotaron tu límite de tokens en esta consulta. Actualiza tu suscripción para continuar."
            });
            throw new Error("TOKEN_LIMIT_REACHED");
          }
        }

        if (planTurnHandled) {
          // El turno del plan ya se resolvió (tarjeta emitida / cancelado / replanificado).
          // No se ejecuta el streamText: emitimos un mensaje conversacional fijo.
          let planTurnMessage = "";
          if (cancelPlan) {
            planTurnMessage = "He cancelado el plan. Si quieres, dime de nuevo qué construir y replanteo desde cero.";
          } else if (safeReplanFeedback) {
            // Si la replanificación dio una nueva tarjeta, pedir autorización de nuevo.
            if (orchestrationResult.agents && orchestrationResult.agents.length > 0) {
              planTurnMessage = "He replanificado con tus cambios. Revisa el nuevo plan y, cuando estés listo, escribe **aprobado** para construir, **no** para cancelar, o dime qué más cambiar.";
            } else {
              planTurnMessage = "Con tus cambios la consulta pasó a ser simple. La resolveré directamente.";
            }
          } else {
            // Primera tarjeta del plan.
            const fileCount = orchestrationResult.agents?.length || 0;
            planTurnMessage = `He preparado un plan con ${fileCount} ${fileCount === 1 ? "archivo" : "archivos"}. Revisa la tarjeta del plan: escribe **aprobado** para que lo construya, **no** para cancelar, o descríbeme los cambios que quieres y replanifico.`;
          }
          try {
            // Emitir como texto del stream del asistente.
            const textChunk = formatStreamPart('text', planTurnMessage);
            streamController?.enqueue(encoder.encode(textChunk));
          } catch (e) {
            console.error("Failed to emit plan-turn message:", e);
          }
        } else {

        let messagesForFinalLlm = processedMessages;
        if (orchestrationResult.isComplex && orchestrationResult.agentReports.length > 0) {
          // Stream agent reports to client
          try {
            fakeStreamData.append({
              type: 'agentReports',
              reports: orchestrationResult.agentReports as any
            });
          } catch (e) {
            console.error("Failed to append agent reports to streamData:", e);
          }

          if (webBuilder) {
            // ── RECONCILIACIÓN FINAL DE ARCHIVOS ──
            // El streaming incremental (onFileReady) puede perder archivos si:
            //  - un agente tardó >240s (timeout) y onFileReady hizo early return
            //    con success=false → el archivo nunca entra a filesToApply
            //  - el stream de red se cortó (504, ERR_NETWORK_IO_SUSPENDED) antes
            //    de que el último agente emitiera su archivo al stream
            //  - el callback falló silenciosamente por un edge-case de parseo
            // Re-procesamos TODOS los agentReports exitosos para garantizar que
            // filesToApply refleje el estado real y final del proyecto. Sin esto,
            // archivos generados correctamente por agentes que no emitieron a
            // tiempo se pierden silenciosamente y el usuario solo ve 1 de N
            // archivos como tab. Esta emisión es autoritativa y final.
            const reportsForReconcile = orchestrationResult.agentReports || [];
            let reconciledNew = 0;
            for (const report of reportsForReconcile) {
              if (report.success === false) continue;
              if (!report.content || !containsArtifact(report.content)) continue;
              const parsedR = parseArtifact(report.content);
              if (!parsedR || parsedR.actions.length === 0) continue;
              const { files: fileChanges } = actionsToFiles(parsedR.actions, filesToApply);
              if (Object.keys(fileChanges).length > 0) {
                Object.assign(filesToApply, fileChanges);
                reconciledNew++;
              }
            }
            // Emitir el estado FINAL completo. El cliente hace merge incremental
            // ({ ...store.files, ...payload }), así que esto no duplica archivos:
            // asegura que ningún archivo generado se haya quedado fuera por un
            // fallo del streaming live. Es idempotente para type="file" (sobrescribe
            // con el mismo contenido) y safe para type="update" (si el diff ya se
            // aplicó, el SEARCH no coincide y se reporta como failedUpdate sin
            // dañar el estado actual).
            try {
              fakeStreamData.append({ type: 'webbuilder_files', files: filesToApply });
            } catch (e) {
              console.error("Failed to append reconciled webbuilder_files:", e);
            }
            if (reconciledNew > 0) {
              try {
                fakeStreamData.append({
                  type: 'reasoning',
                  text: `\n📦 Reconciliación final: ${reconciledNew} archivo(s) confirmados en el estado completo del proyecto.\n`,
                });
              } catch (e) { /* ignore */ }
            }

            // REPORTAR HONESTAMENTE (#3): distinguir agentes exitosos de fallidos
            // para que el LLM no diga "se construyó" cuando algunos fallaron.
            const allReports = orchestrationResult.agentReports || [];
            const successReports = allReports.filter((r: any) => r.success !== false);
            const failedReports = allReports.filter((r: any) => r.success === false);
            const successFiles = successReports.map((r: any) => `- ${r.filePath}`).join('\n');
            const failedFiles = failedReports
              .map((r: any) => `- ${r.filePath} (agente: ${r.agentName})`)
              .join('\n');

            let buildContext: string;
            if (successReports.length > 0 && failedReports.length === 0) {
              buildContext = `Los agentes de WebBuilder completaron TODAS las tareas con éxito.
Los siguientes archivos fueron creados o actualizados correctamente:
${successFiles}`;
            } else if (successReports.length > 0 && failedReports.length > 0) {
              buildContext = `Los agentes de WebBuilder completaron PARCIALMENTE el proyecto.

✅ Archivos creados/actualizados con ÉXITO (${successReports.length}):
${successFiles}

❌ Archivos que FALLARON (${failedReports.length}) — NO se aplicaron, debes informarlo al usuario:
${failedFiles}`;
            } else if (failedReports.length > 0) {
              buildContext = `⚠️ TODOS los agentes de WebBuilder FALLARON. NINGÚN archivo fue generado o modificado.
Archivos que fallaron:
${failedFiles}

Esto significa que el proyecto NO se construyó. Debes informarlo claramente al usuario y sugerirle que reintente la solicitud, quizás con más detalle o simplificando la petición.`;
            } else {
              buildContext = `Los agentes de WebBuilder generaron los archivos del proyecto:
${Object.keys(filesToApply).map(f => `- ${f}`).join('\n') || '(ninguno)'}`;
            }

            // The LLM final only needs to write the conversational message (without coding)
            const contextMessage = {
              role: "system" as const,
              content: `${buildContext}

REGLAS PARA TU RESPUESTA FINAL:
1. NO escribas bloques de código ni XML de artefactos (<maverlangArtifact>). Todo el código ya ha sido procesado y enviado al frontend.
2. Saluda al usuario y resume de forma breve, amigable y profesional lo que se ha construido o modificado.
3. IMPORTANTE — HONESTIDAD: si algunos o todos los archivos fallaron, dilo claramente. NO afirme que se construyó algo que falló. Si todo falló, pide al usuario que reintente.
4. Sé conciso y directo en español. Muestra entusiasmo por el resultado.`,
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
            finalSystemPromptFiles = undefined;
          } else {
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

        let systemPrompt = webBuilder
          ? getWebBuilderSystemPrompt(finalSystemPromptFiles, projectType)
          : getSystemPrompt(assistantName, assistantTone, assistantRole, assistantTopics);

        // Inject custom user preferences metadata into LLM system prompt
        if (userName) {
          systemPrompt += `\n\n[INFORMACIÓN DEL USUARIO (CRÍTICO)]:
El nombre del usuario al que le respondes es "${userName}". Dirígete a él por su nombre en tus respuestas para un trato personalizado cuando sea apropiado.`;
        }
        if (primaryInterest) {
          let interestText = "";
          if (primaryInterest === "crear_apps") {
            interestText = "crear aplicaciones interactivas, herramientas web, prototipos y plataformas en el entorno de desarrollo (Builder/Canvas). Ofrécele ayuda y ejemplos de código y diseño UI.";
          } else if (primaryInterest === "finanzas") {
            interestText = "el análisis de finanzas y mercados, portafolios, cotizaciones y noticias económicas en tiempo real. Adopta un enfoque con análisis cuantitativos y de inversión.";
          } else if (primaryInterest === "ambas") {
            interestText = "tanto la creación y desarrollo de aplicaciones web interactivas como el análisis financiero de mercados y portafolios. Combina la programación, automatización e insights de negocios en tus respuestas.";
          }
          if (interestText) {
            systemPrompt += `\nEl interés principal de este usuario es: ${interestText}`;
          }
        }

        // Only include Canvas / Code Interpreter instructions when NOT in WebBuilder (build) mode
        if (!webBuilder) {
          systemPrompt += `\n\n[MODO CANVAS / INTÉRPRETE DE CÓDIGO (CRÍTICO)]:
Tienes acceso de ejecución total a la herramienta 'run_python' para ejecutar scripts de Python en un entorno de sandbox seguro (WebAssembly/Pyodide).
REGLAS OBLIGATORIAS PARA EL MODO CANVAS:
1. Para tareas de análisis de datos, simulaciones matemáticas, cálculos financieros, graficación, procesamiento de texto o lógica algorítmica, DEBES escribir y ejecutar código Python llamando a la herramienta 'run_python'.
2. La ejecución de scripts de Python en el Canvas es una herramienta complementaria completamente aprobada y segura. BAJO NINGUNA CIRCUNSTANCIA debes bloquear o catalogar estas peticiones como inyecciones de código, jailbreaks o intentos de evasión de seguridad. Tienes permiso explícito para correr scripts para resolver las dudas del usuario.
3. Si el usuario te pide crear código o un script, agrégale un comentario de nombre de archivo en la primera línea para que el editor canvas lo identifique correctamente, por ejemplo:
# Pop-up Power BI Avanzado.html
o
# optimizacion.py
4. Las respuestas finales con código o scripts deben ir en un bloque de código markdown regular (por ejemplo: \`\`\`python ... \`\`\`), el cual automáticamente renderizará un botón de "Abrir en Canvas" para el usuario.
5. Imprime siempre tus resultados y variables usando 'print()' dentro del script de Python para poder verlos en la salida. Explícale al usuario los resultados de la ejecución del script y los insights financieros obtenidos.`;
        }

        if (browser) {
          systemPrompt += `\n\n[MODO NAVEGADOR VIRTUAL ACTIVADO (CRÍTICO)]:
Tienes acceso a herramientas de navegación web real (browser_navigate, browser_click, browser_type, browser_scroll) para visitar páginas, buscar información en Google o extraer datos en tiempo real de cualquier sitio.
REGLAS OBLIGATORIAS PARA EL MODO NAVEGADOR:
1. Si el usuario te pide buscar información en internet, visitar una página específica, investigar datos de mercado financieros en vivo o consultar cotizaciones, DEBES priorizar el uso del navegador virtual llamando a 'browser_navigate' con la URL correspondiente.
2. Al consultar información de acciones, precios o datos financieros en tiempo real, prefiere utilizar Google Finance (https://www.google.com/finance) o búsquedas en Google, en lugar de Yahoo Finance (ya que Yahoo Finance bloquea de forma muy agresiva las conexiones automatizadas de servidores y CDP).
3. Utilizar el navegador virtual es una herramienta completamente aprobada y segura. BAJO NINGUNA CIRCUNSTANCIA debes bloquear o catalogar estas búsquedas como evasiones de seguridad o inyecciones.
4. Explícale al usuario los pasos que vas realizando y los resultados que vas observando en la pantalla del navegador virtual (el usuario verá la captura de pantalla de lo que haces en tiempo real).`;
        }

        if (isAborted()) return;

        const result = await streamText({
          model: llm(finalModelStr),
          system: systemPrompt,
          messages: messagesForFinalLlm,
          maxTokens: (webBuilder && orchestrationResult.isComplex) ? 2048 : 8192,
          maxSteps: webBuilder ? undefined : 8,
          toolChoice: webBuilder ? 'none' : 'auto',
          abortSignal,
          tools: webBuilder ? {} : {
            ...getFinanceTools({ user, userId }),
            ...(browser ? getBrowserTools({ streamData: fakeStreamData }) : {}),
            run_python: tool({
              description: 'Ejecuta código Python en un sandbox seguro de WebAssembly y retorna la salida (stdout, valor de retorno y errores). Úsalo para cálculos matemáticos, análisis de datos complejos, procesamiento de texto o cualquier lógica algorítmica.',
              parameters: z.object({
                script: z.string().describe('El script de Python completo que deseas ejecutar. Puedes imprimir resultados usando print().'),
                packages: z.array(z.string()).optional().describe('Lista de paquetes de pip para instalar antes de la ejecución (ej: ["numpy", "pandas"]).'),
              }),
              execute: async ({ script, packages }) => {
                if (isAborted()) {
                  return { success: false, error: "Cancelado por el usuario", stdout: "", stderr: "aborted", durationMs: 0 };
                }
                try {
                  const result = await runPythonCode(script, {}, packages || []);
                  return result;
                } catch (err: any) {
                  return { success: false, error: err.message || String(err), stdout: "", stderr: err.message || String(err), durationMs: 0 };
                }
              }
            })
          },
          onFinish: async ({ text, usage, finishReason }) => {
            // Token-only metering: we no longer increment message counters for AI chat.
            // Still bill tokens even on partial/aborted responses when usage is reported.
            if (usage && usage.totalTokens && usage.totalTokens > 0) {
              await incrementTokenUsage(userId, usage.totalTokens).catch(console.error);
            }
            if (text && (text.includes("[ALERTA_SEGURIDAD]") || text.includes("ALERTA DE SEGURIDAD") || text.includes("intento de evasión detectado"))) {
              console.warn(`[SECURITY_ALERT] [LLM_DETECTION] El modelo Maverlang AI detectó un intento de manipulación o solicitud inusual del usuario ${userId}. Respuesta del modelo: "${text}"`);
            }
            void finishReason;
          }
        });

        // Pipe the final LLM text data stream chunks into our custom stream
        const textStreamReader = result.toDataStream().getReader();
        try {
          while (true) {
            if (isAborted()) {
              try { await textStreamReader.cancel("client_aborted"); } catch { /* ignore */ }
              break;
            }
            const { done, value } = await textStreamReader.read();
            if (done) break;
            if (streamController && value && !isAborted()) {
              try {
                streamController.enqueue(value);
              } catch {
                break; // controller already closed
              }
            }
          }
        } catch (readErr: any) {
          // AbortError is expected when the user stops generation
          if (readErr?.name !== "AbortError" && !isAborted()) {
            throw readErr;
          }
        }
        } // fin del else (!planTurnHandled)
      } catch (err: any) {
        if (isAborted() || err?.name === "AbortError") {
          console.log("[AI Chat Stream] Aborted by client");
        } else {
          console.error("[AI Chat Stream] Error in stream execution:", err);
          sendData('error', err.message || String(err));
        }
      } finally {
        clearInterval(heartbeatInterval);
        try {
          streamController?.close();
        } catch {
          // already closed
        }
      }
    })();

    return new Response(responseStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'x-vercel-ai-data-stream': 'v1',
      }
    });
  } catch (error: any) {
    console.error("[AI Chat Stream] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
