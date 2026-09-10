"use client"

import { useState, useEffect, useRef, useMemo, Suspense } from "react"
import { useTheme } from "next-themes"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ModelSelector, type MaverlangModel } from "@/components/chat/model-selector"
import { WelcomeChips, type WelcomeAction } from "@/components/chat/welcome-popup"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAIChatStore, type ChatMessage } from "@/lib/stores/ai-chat-store"
import { useShallow } from "zustand/shallow"

import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"
import { useConversionStore } from "@/lib/stores/conversion-store"
import { getPlanConfig, type PlanTier, getNextTier } from "@/lib/plan-limits"
import { useChat } from "ai/react"
import { ShareChatDialog } from "@/components/assistant/share-chat-dialog"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn, formatDate as fmtDate, getFallbackImage, slugify, getCleanPathname } from "@/lib/utils"
import { useLanguageStore } from "@/lib/stores/language-store"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, Sparkles, Headphones, LineChart, Coins, Landmark, Briefcase, Shield, Lightbulb, Flame, Calendar, Cpu, ArrowUpRight, ArrowDownRight, MoreHorizontal, SquarePen, Trash2, FolderOpen, Code2, FileCode2, ChevronRight, Share2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "@/components/ui/sidebar"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
import { WebBuilderWorkspace } from "@/components/webbuilder/workspace"
import { WebBuilderErrorBoundary } from "@/components/webbuilder/error-boundary"
import { parseArtifact, actionsToFiles, containsArtifact } from "@/lib/webbuilder-parser"
import { classifyPlanResponse } from "@/lib/webbuilder-plan-utils"
import { CanvasWorkspace } from "@/components/chat/canvas-workspace"
import { useCanvasStore } from "@/lib/stores/canvas-store"
import { useBrowserStore } from "@/lib/stores/browser-store"
import { BrowserWorkspace } from "@/components/chat/browser-workspace"
import { InteractiveQuestionCard, WebBuilderQuestion } from "./interactive-question-card"
import { useProjectsStore } from "@/lib/stores/projects-store"

// Model ID mapping for our API
const MODEL_MAP: Record<string, string> = {
  fast: "fast",
  pro: "pro",
  agent: "agent",
}

function groupConsecutiveMessages(messages: ChatMessage[]): ChatMessage[] {
  const grouped: ChatMessage[] = [];
  
  for (const msg of messages) {
    const isAssistantLike = msg.role === "assistant" || (msg.role as string) === "tool";
    
    if (grouped.length === 0) {
      grouped.push({ 
        ...msg,
        role: isAssistantLike ? "assistant" : msg.role
      });
      continue;
    }
    
    const lastGrouped = grouped[grouped.length - 1];
    const isLastAssistantLike = lastGrouped.role === "assistant";
    
    if (isAssistantLike && isLastAssistantLike) {
      if (msg.content) {
        lastGrouped.content = lastGrouped.content 
          ? (lastGrouped.content + "\n\n" + msg.content).trim()
          : msg.content;
      }
      
      if (msg.toolInvocations) {
        lastGrouped.toolInvocations = [
          ...(lastGrouped.toolInvocations || []),
          ...msg.toolInvocations
        ];
      }
      
      if (msg.citations && msg.citations.length > 0) {
        lastGrouped.citations = Array.from(new Set([
          ...(lastGrouped.citations || []),
          ...msg.citations
        ]));
      }
      
      if (msg.reasoning) {
        lastGrouped.reasoning = lastGrouped.reasoning 
          ? (lastGrouped.reasoning + "\n" + msg.reasoning).trim()
          : msg.reasoning;
      }
      
      if (msg.thinkingSteps) {
        lastGrouped.thinkingSteps = [
          ...(lastGrouped.thinkingSteps || []),
          ...msg.thinkingSteps
        ];
      }
      
      if (msg.reasoningSteps) {
        lastGrouped.reasoningSteps = [
          ...(lastGrouped.reasoningSteps || []),
          ...msg.reasoningSteps
        ];
      }
      
      if (msg.secondsElapsed) {
        lastGrouped.secondsElapsed = (lastGrouped.secondsElapsed || 0) + msg.secondsElapsed;
      }

      // Keep the latest pending plan card when merging assistant chunks
      if (msg.pendingPlan) {
        lastGrouped.pendingPlan = msg.pendingPlan;
      }
    } else {
      grouped.push({ 
        ...msg,
        role: isAssistantLike ? "assistant" : msg.role
      });
    }
  }
  
  return grouped;
}


function ChatLandingContent() {
  const { isMobile } = useSidebar()
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const userTier = useAuthStore((s) =>
    s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free")
  ) as PlanTier
  const { openModal: openConversionModal } = useConversionStore()
  // openModal del auth modal store: para abrir el popup de registro/login cuando
  // un usuario no autenticado intenta enviar un mensaje.
  const { openModal: openAuthModal } = useAuthModalStore()

  // useShallow: suscribe a múltiples campos del store PERO solo re-renderiza
  // cuando los VALORES seleccionados cambian (comparación superficial). Sin
  // esto, useAIChatStore() sin selector re-renderiza ChatLandingContent en
  // CUALQUIER cambio del store (incluyendo props no usadas aquí) → durante el
  // streaming, las escrituras al store en ráfaga saturan la cola de React → #185.
  const {
    messages: storeMessages,
    addMessage,
    isLoading: storeLoading,
    selectedModel,
    setModel,
    clearMessages,
    savedChats,
    attachedArticles,
    attachedFiles,
    activeTools,
    messageFeedback,
    setFeedback,
    currentChatId,
  } = useAIChatStore(useShallow((s) => ({
    messages: s.messages,
    addMessage: s.addMessage,
    isLoading: s.isLoading,
    selectedModel: s.selectedModel,
    setModel: s.setModel,
    clearMessages: s.clearMessages,
    savedChats: s.savedChats,
    attachedArticles: s.attachedArticles,
    attachedFiles: s.attachedFiles,
    activeTools: s.activeTools,
    messageFeedback: s.messageFeedback,
    setFeedback: s.setFeedback,
    currentChatId: s.currentChatId,
  })))

  const language = useLanguageStore((s) => s.language)

  const [activeMenu, setActiveMenu] = useState<'noticias' | 'mercados' | 'portafolio' | 'mundo' | null>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Legacy data fetching and activeMenu state have been removed as part of Phase 5 cleanup.

  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({})
  const [shareDialog, setShareDialog] = useState<{
    isOpen: boolean
    question: string
    answer: string
    defaultMode: "qa" | "full"
  }>({ isOpen: false, question: "", answer: "", defaultMode: "qa" })
  const lastLoadedChatIdRef = useRef<string | null>(null)

  const router = useRouter()

  const chatFiles = useMemo(() => {
    const files: { id: string, title: string, lang: string, code: string }[] = [];
    storeMessages.forEach((msg, mIdx) => {
      if (msg.role === 'assistant' && msg.content) {
        const matches = [...msg.content.matchAll(/```(\w+)\n([\s\S]+?)```/g)];
        matches.forEach((match, idx) => {
          const lang = match[1];
          const codeValue = match[2].trim();
          let title = lang === 'python' ? 'Script de Python' : `Código ${lang.toUpperCase()}`;
          const firstLine = codeValue.split('\n')[0].trim();
          const filenameMatch = firstLine.match(/(?:filename|archivo|title)\s*:\s*([^\s][^\n\r]*)/i) || 
                                firstLine.match(/(?:\/\/\/|\/\/|#|\/\*)\s*([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]+)/i);
          if (filenameMatch) {
            title = filenameMatch[1].replace(/\*\/$/, '').trim();
          } else {
            title = `${title} ${idx + 1}`;
          }
          files.push({ id: `${mIdx}-${idx}`, title, lang, code: codeValue });
        });
      }
    });
    return files.reverse(); // Más recientes primero
  }, [storeMessages]);

  const browserSessionId = useBrowserStore((s) => s.sessionId);
  const isBrowserOpen = useBrowserStore((s) => s.isOpen);
  const isCanvasOpen = useCanvasStore((s) => s.isOpen);
  const updateScreenshot = useBrowserStore((s) => s.updateScreenshot);
  const addStep = useBrowserStore((s) => s.addStep);
  const updateUrl = useBrowserStore((s) => s.updateUrl);
  const clearSession = useBrowserStore((s) => s.clearSession);

  const updateScreenshotRef = useRef(updateScreenshot);
  const addStepRef = useRef(addStep);
  const updateUrlRef = useRef(updateUrl);
  const clearSessionRef = useRef(clearSession);

  useEffect(() => {
    updateScreenshotRef.current = updateScreenshot;
    addStepRef.current = addStep;
    updateUrlRef.current = updateUrl;
    clearSessionRef.current = clearSession;
  });

  useEffect(() => {
    return () => {
      clearSession();
    };
  }, [clearSession]);

  useEffect(() => {
    if (!browserSessionId) return;

    console.log("[Browser SSE] Connecting to session:", browserSessionId);
    const eventSource = new EventSource(`/api/browser/stream?sessionId=${browserSessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        console.log("[Browser SSE] Received event type:", parsed.type);
        
        if (parsed.type === "frame" && parsed.image) {
          updateScreenshotRef.current(parsed.image);
        } else if (parsed.type === "step") {
          addStepRef.current({
            action: parsed.action,
            description: parsed.description,
            status: parsed.status,
          });
          if (parsed.action === "navigate" && parsed.status === "done") {
            const urlMatch = parsed.description.match(/Navegó a (https?:\/\/[^\s]+)/);
            if (urlMatch) {
              updateUrlRef.current(urlMatch[1]);
            }
          }
        } else if (parsed.type === "closed") {
          eventSource.close();
          clearSessionRef.current();
          toast.error("La sesión de navegación ha finalizado");
        }
      } catch (e) {
        console.error("[Browser SSE] Error parsing message:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("[Browser SSE] Connection error (standard EventSource will attempt reconnect):", err);
    };

    return () => {
      console.log("[Browser SSE] Closing connection for:", browserSessionId);
      eventSource.close();
    };
  }, [browserSessionId]);

  const handleNewChat = () => {
    clearMessages()
    useCanvasStore.getState().clearCanvas()
    useBrowserStore.getState().clearSession()
    useWebBuilderStore.setState({
      isWebBuilderMode: false,
      files: {},
      activeProjectId: null,
      activeFilePath: "/App.tsx",
      pendingPlan: null
    })
    router.push(`/${language}`)
  }

  const handleDeleteCurrentChat = async () => {
    const chatId = currentChatId
    if (chatId) {
      if (confirm("¿Estás seguro de que deseas eliminar esta conversación?")) {
        await useAIChatStore.getState().deleteSavedChat(chatId)
        clearMessages()
        useCanvasStore.getState().clearCanvas()
        useBrowserStore.getState().clearSession()
        useWebBuilderStore.setState({
          isWebBuilderMode: false,
          files: {},
          activeProjectId: null,
          activeFilePath: "/App.tsx",
          pendingPlan: null
        })
        router.push(`/${language}`)
      }
    }
  }

  /** Open share dialog for the entire current conversation. */
  const handleShareFullChat = () => {
    // Prefer live AI messages, fall back to persisted store
    const live = aiMessagesRef.current?.length
      ? aiMessagesRef.current
      : storeMessages
    const msgs = (live as any[]).filter(
      (m) => m.role === "user" || m.role === "assistant" || m.role === "tool"
    )
    if (!msgs.length) {
      toast.error("No hay mensajes para compartir")
      return
    }
    if (!isAuthenticated) {
      openAuthModal("register")
      return
    }
    const firstUser = msgs.find((m) => m.role === "user")
    const firstAssistant = msgs.find(
      (m) => m.role === "assistant" || m.role === "tool"
    )
    setShareDialog({
      isOpen: true,
      question: firstUser?.content || "Conversación",
      answer: firstAssistant?.content || "Chat compartido en Maverlang AI.",
      defaultMode: "full",
    })
  }

  const accumulatedReasoningRef = useRef<string>("")
  const accumulatedCitationsRef = useRef<string[]>([]);
  /** Last tool options used on send — reused by edit / retry so modes aren't reset */
  const lastSendOptionsRef = useRef<{
    webSearch: boolean
    image: boolean
    codeInterpreter: boolean
    browser: boolean
  }>({ webSearch: false, image: false, codeInterpreter: false, browser: false })
  /** Último prompt del usuario en Build — para "Continuar generando" tras error/timeout */
  const lastBuildPromptRef = useRef<string>("")
  /** handleSend se define más abajo; el onError del stream lo llama vía ref */
  const handleSendRef = useRef<
    | ((
        text: string,
        options?: {
          webSearch: boolean
          image: boolean
          codeInterpreter: boolean
          browser: boolean
        }
      ) => void)
    | null
  >(null)
  const [activeQuestion, setActiveQuestion] = useState<WebBuilderQuestion | null>(null);

  // Track store hydration
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  useEffect(() => {
    setIsStoreHydrated(useAIChatStore.persist.hasHydrated())
    const unsub = useAIChatStore.persist.onFinishHydration(() => setIsStoreHydrated(true))
    return () => unsub()
  }, [])



  // Track theme mounting for dark mode logo swapping
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => {
    setThemeMounted(true)
  }, [])
  const isDark = themeMounted && resolvedTheme === "dark"
  const chatLogoSrc = isDark ? "/assets/maverlang-logo-white.png" : "/assets/maverlang-logo.png"
  const mobileLogoSrc = isDark ? "/assets/Logo 2-Blanco.png" : "/assets/Maverlang Logo-2.png"

  // AI SDK useChat for streaming
  const {
    messages: aiMessages,
    setMessages: setAiMessages,
    append,
    isLoading: aiLoading,
    stop,
    input,
    handleInputChange,
    setInput,
    data,
  } = useChat({
    api: "/api/ai-chat",
    fetch: async (url, options) => {
      const response = await fetch(url, options);
      if (!response.ok) {
        try {
          const clone = response.clone();
          const errData = await clone.json();
          if (errData?.code === "TOKEN_LIMIT_REACHED") {
            // Mostrar el banner sobre la barra de input en lugar de abrir
            // directamente el modal. El botón "Ver planes" del banner abre
            // el modal de upgrade.
            useConversionStore.getState().setTokenLimitReached(errData.details);
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      return response;
    },
    onFinish: (message) => {
      try {
        // Find citations & reasoning in streamData (data) or accumulated refs
        let citationsList: string[] = accumulatedCitationsRef.current.length > 0 ? accumulatedCitationsRef.current : []
        let reasoningText = accumulatedReasoningRef.current || ""
        let agentReportsData: any[] = []
        if (citationsList.length === 0 || !reasoningText || agentReportsData.length === 0) {
          if (data && data.length > 0) {
            const citationObj = (data as any[]).find((d: any) => d?.type === 'citations')
            if (citationObj?.urls && citationsList.length === 0) {
              citationsList = citationObj.urls
            }
            const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning')
            const streamReasoning = reasoningChunks.map(c => c.text).join('')
            if (streamReasoning && !reasoningText) reasoningText = streamReasoning
            
            const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports')
            if (reportsObj?.reports) {
              agentReportsData = reportsObj.reports
            }
          }
        }

        // Capturar el plan pendiente (modo Plan) para adjuntarlo a este mensaje
        // y poder renderizar la tarjeta en el chat. Si llegó un plan en este
        // turno, pendingPlan estará set en el store.
        const pendingPlanData = useWebBuilderStore.getState().pendingPlan;
        const messagePendingPlan = pendingPlanData
          ? { planId: pendingPlanData.planId, reason: pendingPlanData.reason, agents: pendingPlanData.agents }
          : undefined;

        // Use requestAnimationFrame to ensure aiMessages state has been flushed by React
        requestAnimationFrame(() => {
          try {
            const latestMessages = aiMessagesRef.current;
            // Buscar el mensaje por ID (confiable: el SDK garantiza el mismo id
            // durante todo el stream). ANTES buscábamos "el último assistant",
            // pero si el ref estaba stale (useEffect aún no flusheó aiMessages al
            // ref al dispararse el RAF), apuntábamos a un assistant ANTERIOR y
            // sobrescribíamos ese — perdiendo el mensaje del resumen final. Esto
            // era especialmente frecuente en WebBuilder, donde el resumen llega al
            // final del stream justo en la ventana de carrera del flush.
            let targetIdx = latestMessages.findIndex(m => m.id === message.id);
            if (targetIdx === -1) {
              // Fallback: último assistant/tool (comportamiento anterior) si por
              // algún motivo el id exacto no coincide (ej. ID regenerado).
              const lastAssistantIdx = [...latestMessages].reverse().findIndex(m => m.role === 'assistant' || m.role === 'tool');
              targetIdx = lastAssistantIdx !== -1 ? (latestMessages.length - 1 - lastAssistantIdx) : -1;
            }

            const firstMsgText = message.content || "";
            const toolsCalled = message.toolInvocations || [];
            const hasTools = toolsCalled.length > 0;
            const finalContent = (firstMsgText.trim().length > 0)
              ? firstMsgText
              : hasTools
                ? "He procesado los datos financieros solicitado y configurado los paneles interactivos correspondientes. Puedes revisar la información en los widgets de arriba."
                : "Lo siento, la respuesta de la IA se detuvo inesperadamente sin generar texto. Por favor, intenta de nuevo.";

            const currentStoreMessages = useAIChatStore.getState().messages;

            const storeMessages: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
              const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id);
              const isTarget = idx === targetIdx;
              if (isTarget) {
                return {
                  id: message.id,
                  role: "assistant",
                  content: finalContent,
                  timestamp: m.timestamp || new Date(),
                  model: selectedModel === "fast" ? "deepseek" : "grok",
                  toolInvocations: message.toolInvocations || m.toolInvocations,
                  citations: citationsList,
                  reasoning: reasoningText || m.reasoning || undefined,
                  reasoningSteps: agentReportsData.length > 0 ? agentReportsData : m.reasoningSteps || storeMsg?.reasoningSteps || undefined,
                  secondsElapsed: m.secondsElapsed,
                  pendingPlan: messagePendingPlan || storeMsg?.pendingPlan,
                };
              }
              return {
                id: m.id,
                role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
                content: m.content,
                timestamp: storeMsg?.timestamp || m.timestamp || new Date(),
                model: storeMsg?.model || m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
                toolInvocations: m.toolInvocations,
                citations: storeMsg?.citations || m.citations || [],
                reasoning: storeMsg?.reasoning || m.reasoning || undefined,
                reasoningSteps: storeMsg?.reasoningSteps || m.reasoningSteps || undefined,
                secondsElapsed: storeMsg?.secondsElapsed || m.secondsElapsed,
              };
            });

            if (targetIdx === -1) {
              // El mensaje del asistente NO estaba en el ref (stale). Lo añadimos
              // al final en vez de perderlo. Esto era la causa de que el mensaje
              // del resumen desapareciera al finalizar en modo WebBuilder.
              storeMessages.push({
                id: message.id,
                role: "assistant",
                content: finalContent,
                timestamp: new Date(),
                model: selectedModel === "fast" ? "deepseek" : "grok",
                toolInvocations: message.toolInvocations,
                citations: citationsList,
                reasoning: reasoningText || undefined,
                reasoningSteps: agentReportsData.length > 0 ? agentReportsData : undefined,
                pendingPlan: messagePendingPlan,
              });
            }

            useAIChatStore.setState({ messages: storeMessages });
            useAIChatStore.getState().updateCurrentChat();

            // Sync back to useChat's messages state so that reasoningSteps, citations, etc are preserved in aiMessages
            setAiMessages(
              storeMessages.map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                toolInvocations: m.toolInvocations,
                reasoning: m.reasoning,
                citations: m.citations,
                model: m.model,
                isCollapsed: m.isCollapsed,
                secondsElapsed: m.secondsElapsed,
                reasoningSteps: m.reasoningSteps,
                timestamp: m.timestamp,
                createdAt: m.timestamp ? new Date(m.timestamp) : undefined,
              })) as any
            );
          } catch (e) {
            console.error("Error in onFinish inner state transition:", e);
          } finally {
            // Signal that the AI has finished responding
            useWebBuilderStore.getState().setAiResponding(false);
            useWebBuilderStore.getState().setActiveAgentReports(null);
          }
        });
      } catch (err) {
        console.error("Error in onFinish outer transition block:", err);
        useWebBuilderStore.getState().setAiResponding(false);
        useWebBuilderStore.getState().setActiveAgentReports(null);
      }
    },
    onError: (error) => {
      console.error("[AI Chat] Stream error:", error);
      const wb = useWebBuilderStore.getState();
      const wasBuild = wb.isWebBuilderMode;
      const fileCount = Object.keys(wb.files || {}).length;
      const rawMsg = (error?.message || "").toString();
      const isTimeout =
        /504|timeout|timed out|gateway|excedió el tiempo|time.?out/i.test(rawMsg) ||
        rawMsg.includes("Failed to fetch");

      wb.setAiResponding(false);
      wb.setActiveAgentReports(null);

      // Conservar lo ya generado y ofrecer continuar (Build / timeout / fallo de red)
      if (wasBuild) {
        try {
          wb.syncToCloud();
        } catch {
          /* non-fatal */
        }

        const recoveryPrompt =
          "Hubo un error o timeout al generar. Continúa construyendo el proyecto desde donde quedó. " +
          "Revisa los archivos actuales del workspace, completa lo que falte y corrige lo incompleto. " +
          (lastBuildPromptRef.current
            ? `Pedido original del usuario: "${lastBuildPromptRef.current.slice(0, 500)}"`
            : "Completa el sitio/app que el usuario pidió.");

        const friendly = isTimeout
          ? fileCount > 0
            ? "La generación se cortó por tiempo (timeout). Ya hay archivos en el proyecto."
            : "La generación se cortó por tiempo (timeout) antes de terminar."
          : fileCount > 0
            ? "Algo falló al generar, pero se conservaron los archivos ya creados."
            : "Algo falló al generar tu proyecto.";

        toast.error(friendly, {
          duration: 16000,
          action: {
            label: "Continuar generando",
            onClick: () => {
              handleSendRef.current?.(recoveryPrompt, {
                ...lastSendOptionsRef.current,
              });
            },
          },
        });

        // Mensaje visible en el chat (además del toast) para que el usuario no se pierda
        try {
          const recoveryId = `assistant-recovery-${Date.now()}`;
          const recoveryContent =
            `⚠️ **${friendly}**\n\n` +
            (fileCount > 0
              ? `Hay **${fileCount}** archivo(s) en el workspace. Podés:\n` +
                `1. Pulsar **Continuar generando** en el aviso de arriba, o\n` +
                `2. Escribir qué querés que complete o corrija.\n\n` +
                `No se perdió el trabajo ya aplicado al panel Build.`
              : `Podés pulsar **Continuar generando** o reescribir tu pedido. Si el error se repite, probá un pedido más corto o en modo Plan.`);

          const current = useAIChatStore.getState().messages;
          useAIChatStore.setState({
            messages: [
              ...current,
              {
                id: recoveryId,
                role: "assistant",
                content: recoveryContent,
                timestamp: new Date(),
                model: "deepseek",
              },
            ],
          });
          useAIChatStore.getState().updateCurrentChat();
        } catch (e) {
          console.warn("[AI Chat] Failed to append recovery message:", e);
        }
        return;
      }

      toast.error(
        rawMsg || "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo."
      );
    }
  })

  const searchParams = useSearchParams();

  // Check for auto-start prompt in URL parameters
  useEffect(() => {
    if (!isStoreHydrated) return;
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      // Clear search params to prevent loop on reload/navigation
      const newUrl = window.location.pathname;
      window.history.replaceState(null, '', newUrl);

      // Start new chat with this prompt
      handleNewChat();
      
      // Paste the prompt in the input bar instead of sending automatically
      setTimeout(() => {
        setInput(promptParam);
      }, 150);
    }
  }, [isStoreHydrated, searchParams, setInput]);

  const aiMessagesRef = useRef<any[]>([])
  useEffect(() => {
    aiMessagesRef.current = aiMessages
  }, [aiMessages])

  const lastAutoOpenedRef = useRef<string>("");
  const lastCanvasUpdateRef = useRef<number>(0);

  useEffect(() => {
    lastAutoOpenedRef.current = "";
    lastCanvasUpdateRef.current = 0;
    useCanvasStore.getState().clearCanvas();
  }, [currentChatId]);

  useEffect(() => {
    if (aiMessages.length === 0) {
      lastAutoOpenedRef.current = "";
      return;
    }

    const lastMsg = aiMessages[aiMessages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;

    // 1. Check for run_python tool calls
    const runPythonInvocation = lastMsg.toolInvocations?.find(
      (inv: any) => inv.toolName === "run_python"
    );

    if (runPythonInvocation && runPythonInvocation.state === "result") {
      const scriptCode = runPythonInvocation.args?.script || "";
      if (scriptCode && scriptCode !== lastAutoOpenedRef.current) {
        lastAutoOpenedRef.current = scriptCode;
        lastCanvasUpdateRef.current = Date.now();
        
        const result = (runPythonInvocation as any).result;
        useCanvasStore.getState().openCanvas({
          title: "Script de Python",
          code: scriptCode,
          language: "python",
          stdout: result?.stdout || "",
          output: result?.output !== undefined && result?.output !== null ? String(result.output) : undefined,
          error: result?.stderr || result?.error || undefined,
          durationMs: result?.durationMs || 0,
          success: result?.success !== false,
        });
      }
      return;
    }

    // 2. Check for markdown code blocks in content
    const content = lastMsg.content || "";
    if (content) {
      const codeBlockMatch = /```(\w+)\n([\s\S]+?)```/.exec(content);
      if (codeBlockMatch) {
        const lang = codeBlockMatch[1];
        const codeValue = codeBlockMatch[2].trim();

        const now = Date.now();
        const shouldUpdate = !aiLoading || (now - lastCanvasUpdateRef.current > 800);

        if (codeValue && codeValue !== lastAutoOpenedRef.current && shouldUpdate) {
          lastAutoOpenedRef.current = codeValue;
          lastCanvasUpdateRef.current = now;

          // Extract title from comment in the first line
          let title = lang === 'python' ? 'Script de Python' : `Código ${lang.toUpperCase()}`;
          const firstLine = codeValue.split('\n')[0].trim();
          const filenameMatch = firstLine.match(/(?:filename|archivo|title)\s*:\s*([^\s][^\n\r]*)/i) || 
                                firstLine.match(/(?:\/\/\/|\/\/|#|\/\*)\s*([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]+)/i);
          if (filenameMatch) {
            title = filenameMatch[1].replace(/\*\/$/, '').trim();
          }

          useCanvasStore.getState().openCanvas({
            title,
            code: codeValue,
            language: lang,
          });
        }
      }
    }
  }, [aiMessages, aiLoading]);

  // Accumulate citations & reasoning from streamData to prevent them from vanishing during tool execution steps
  useEffect(() => {
    if (data && data.length > 0) {
      const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning');
      const streamReasoning = reasoningChunks.map(c => c.text).join('');
      if (streamReasoning && streamReasoning !== accumulatedReasoningRef.current) {
        accumulatedReasoningRef.current = streamReasoning;
      }

      const citationObj = (data as any[]).find((d: any) => d?.type === 'citations');
      if (citationObj?.urls && citationObj.urls.length > 0) {
        accumulatedCitationsRef.current = Array.from(new Set([
          ...accumulatedCitationsRef.current,
          ...citationObj.urls
        ]));
      }

      const browserSessionObj = (data as any[]).find((d: any) => d?.type === 'browser_session');
      if (browserSessionObj?.sessionId) {
        const currentSessionId = useBrowserStore.getState().sessionId;
        if (currentSessionId !== browserSessionObj.sessionId) {
          useBrowserStore.getState().setSessionId(browserSessionObj.sessionId);
        }
      }
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const cleanPath = getCleanPathname(currentPath);
      let cleanTargetPath = '';
      if (currentChatId) {
        const firstUserMsg = storeMessages.find(m => m.role === 'user')?.content || '';
        const title = firstUserMsg.slice(0, 40) || 'Nuevo Chat';
        const slug = slugify(title);
        cleanTargetPath = `/ai/chat/${slug ? `${slug}-` : ''}${currentChatId}`;
      }
      const targetPath = cleanTargetPath ? `/${language}${cleanTargetPath}` : `/${language}`;
      if ((cleanPath === '/ai' || cleanPath === '/' || cleanPath === '') && targetPath !== currentPath && !currentPath.startsWith('/share/')) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [currentChatId, storeMessages, language]);

  // Listen for click-to-edit events from the Sandpack preview iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'MAVERLANG_ELEMENT_CLICKED') {
        const html = e.data.elementHtml || '';
        if (html) {
          const formattedText = `Modifica este elemento:\n\`\`\`html\n${html}\n\`\`\`\n`;
          setInput(formattedText);
          // Optional: focus the input element here if needed, 
          // but just setting the input is usually enough for the user to see it.
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setInput]);

  // Sync store messages → useChat messages on load/chat switch
  useEffect(() => {
    if (!isStoreHydrated) return
    if (currentChatId) {
      if (currentChatId !== lastLoadedChatIdRef.current) {
        lastLoadedChatIdRef.current = currentChatId
        setAiMessages(
          storeMessages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolInvocations: m.toolInvocations,
            reasoning: m.reasoning,
            citations: m.citations,
            model: m.model,
            isCollapsed: m.isCollapsed,
            secondsElapsed: m.secondsElapsed,
            reasoningSteps: m.reasoningSteps,
            timestamp: m.timestamp,
            createdAt: m.timestamp ? new Date(m.timestamp) : undefined,
          })) as any
        )
      }
    } else {
      // Reset for New Chat
      lastLoadedChatIdRef.current = null
      setAiMessages([])
    }
  }, [currentChatId, isStoreHydrated, storeMessages, setAiMessages])

  // Sync WebBuilder project files on load or chat reset
  useEffect(() => {
    if (!isStoreHydrated) return
    const wbStore = useWebBuilderStore.getState()
    if (currentChatId) {
      wbStore.initProject(currentChatId)
      wbStore.loadFromCloud(currentChatId)
    } else {
      wbStore.resetProject()
      useWebBuilderStore.setState({ isWebBuilderMode: false })
    }
  }, [currentChatId, isStoreHydrated])

  // Save messages to store on unmount (if loading/streaming was interrupted)
  useEffect(() => {
    return () => {
      if (aiMessagesRef.current.length > 0) {
        const latest = aiMessagesRef.current;
        const lastMsg = latest[latest.length - 1];
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
          const storeMessages: ChatMessage[] = latest.map((m: any) => ({
            id: m.id,
            role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp || new Date(),
            model: m.model || (useAIChatStore.getState().selectedModel === "fast" ? "deepseek" : "grok"),
            toolInvocations: m.toolInvocations,
            citations: m.citations || [],
            reasoning: m.reasoning || undefined,
            reasoningSteps: m.reasoningSteps || undefined,
            secondsElapsed: m.secondsElapsed,
          }));
          
          useAIChatStore.setState({ messages: storeMessages });
          useAIChatStore.getState().updateCurrentChat();
        }
      }
    };
  }, []);

  const handleModelSelect = (model: MaverlangModel) => {
    setModel(model.id)
  }

  const handleSend = (
    text: string,
    options: { webSearch: boolean; image: boolean; codeInterpreter: boolean; browser: boolean } = { webSearch: false, image: false, codeInterpreter: false, browser: false }
  ) => {
    if (!text.trim() || aiLoading) return

    // Gate de autenticación: si el usuario no ha iniciado sesión, el chat es
    // "no funcional". Al intentar enviar el primer mensaje, abrimos el popup de
    // registro en vez de procesar el envío. Su texto queda en la barra (no se
    // borra) para que, tras autenticarse, pueda reenviarlo.
    if (!isAuthenticated) {
      openAuthModal("register");
      return;
    }

    accumulatedReasoningRef.current = ""
    accumulatedCitationsRef.current = []
    setActiveQuestion(null)
    // Ocultar el banner de límite de tokens al iniciar un nuevo envío.
    useConversionStore.getState().clearTokenLimitReached()

    // Check chat limits
    const planConfig = getPlanConfig(userTier)
    const isWB = useWebBuilderStore.getState().isWebBuilderMode
    if (isWB) {
      useWebBuilderStore.getState().resetAutoFixAttempts()
      // Reset del snapshot de diff entre builds: cada orquestación debe partir
      // de base limpia. Sin esto, el diff y "revertir archivo" del build 2+
      // apuntan al estado PRE-build-anterior (lastBuildPrevFiles nunca se
      // limpia entre turnos del mismo chat), acumulando cambios stale y
      // perdiendo trabajo al revertir.
      useWebBuilderStore.getState().clearBuildDiff()
      useWebBuilderStore.getState().setAiResponding(true)
      // Guardar prompt original (no el de recuperación interna) para reintentos
      if (!text.startsWith("Hubo un error o timeout al generar")) {
        lastBuildPromptRef.current = text
      }
    }
    // Remember tools so edit/retry keep the same modes
    lastSendOptionsRef.current = options

    // Create chat ID if new — use ONE shared id for store + useChat
    let activeChatId = currentChatId
    const userMsgId = `user-${Date.now()}`
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    if (!activeChatId) {
      activeChatId = Date.now().toString()
      lastLoadedChatIdRef.current = activeChatId
      useAIChatStore.setState({
        currentChatId: activeChatId,
        messages: [userMsg],
      })
    } else {
      // For existing chat, append the user message to store messages immediately
      const currentMessages = useAIChatStore.getState().messages;
      useAIChatStore.setState({
        messages: [...currentMessages, userMsg],
      })
    }
    useAIChatStore.getState().updateCurrentChat()

    // Modo Plan: si hay un plan pendiente y el usuario responde, clasificar su
    // intención (aprobar / cancelar / cambios) y dar forma al body en consecuencia.
    let planBodyExtras: Record<string, any> = {};
    if (isWB) {
      const wbState = useWebBuilderStore.getState();
      const pending = wbState.pendingPlan;
      if (wbState.buildMode === "plan" && pending) {
        const intent = classifyPlanResponse(text);
        if (intent === "approve") {
          planBodyExtras = {
            approvedPlan: { reason: pending.reason, agents: pending.agents },
            originalUserMessage: pending.originalUserMessage,
          };
          wbState.clearPendingPlan();
        } else if (intent === "reject") {
          planBodyExtras = { cancelPlan: true };
          wbState.clearPendingPlan();
        } else {
          // feedback: replanificar con el texto del usuario como cambios.
          planBodyExtras = {
            replanFeedback: text,
            originalUserMessage: pending.originalUserMessage,
          };
          wbState.clearPendingPlan();
        }
      }
    }

    // Find matching project type
    const currentProject = useProjectsStore.getState().projects.find(p => p.chatId === activeChatId);

    // Use AI SDK append with the SAME id as the store message
    append(
      { id: userMsgId, role: "user", content: text } as any,
      {
        body: {
          articles: attachedArticles,
          files: attachedFiles,
          modelId: selectedModel,
          activeTools: activeTools,
          webSearch: options.webSearch,
          browser: options.browser,
          codeInterpreter: options.codeInterpreter,
          webBuilder: isWB,
          webBuilderFiles: isWB ? useWebBuilderStore.getState().files : undefined,
          projectType: isWB ? currentProject?.projectType : undefined,
          buildMode: isWB ? useWebBuilderStore.getState().buildMode : undefined,
          ...planBodyExtras,
        },
      }
    )

    // Open workspaces immediately if user requested those modes
    if (options.browser) {
      useBrowserStore.getState().setOpen(true);
    }
    // Nota: en modo Canvas NO abrimos el panel aquí. El canvas se muestra
    // recién cuando la IA empieza a responder (cuando llega el primer
    // archivo vía openCanvas()), no apenas se activa la píldora ni al
    // enviar el mensaje.

    // If WebBuilder mode is active, ensure split view is shown
    if (isWB) {
      useWebBuilderStore.getState().setSplitView(true)
    }
  }

  // Mantener ref al día para onError / recovery (useChat se define antes que handleSend)
  handleSendRef.current = handleSend

  const toggleReasoning = (id: string) => {
    setOpenReasoning((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleShare = (question: string, answer: string) => {
    const q = (question || "").trim()
    const a = (answer || "").trim()
    if (!q || !a) {
      toast.error("No hay contenido suficiente para compartir")
      return
    }
    if (!isAuthenticated) {
      openAuthModal("register")
      return
    }
    setShareDialog({ isOpen: true, question: q, answer: a, defaultMode: "qa" })
  }

  /**
   * Stop the active AI stream cleanly:
   * - abort the fetch
   * - clear WebBuilder "responding" flags (onFinish is NOT called on abort)
   * - persist partial assistant content so it isn't lost
   */
  const handleStop = () => {
    stop()

    // WebBuilder / agent UI flags only clear in onFinish/onError — force clear on stop
    try {
      useWebBuilderStore.getState().setAiResponding(false)
      useWebBuilderStore.getState().setActiveAgentReports(null)
    } catch {
      // store may not be ready
    }

    // Persist whatever was streamed so far
    const latest = aiMessagesRef.current
    if (latest.length > 0) {
      const currentStoreMessages = useAIChatStore.getState().messages
      const formatted: ChatMessage[] = latest.map((m: any) => {
        const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id)
        const content =
          m.content && String(m.content).trim().length > 0
            ? m.content
            : m.role === "assistant" || m.role === "tool"
              ? "*(Respuesta detenida)*"
              : m.content
        return {
          id: m.id,
          role: (m.role === "tool" ? "assistant" : m.role) as "user" | "assistant",
          content,
          timestamp: storeMsg?.timestamp || m.timestamp || new Date(),
          model: storeMsg?.model || m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
          toolInvocations: m.toolInvocations,
          citations: storeMsg?.citations || m.citations || [],
          reasoning: storeMsg?.reasoning || m.reasoning || accumulatedReasoningRef.current || undefined,
          reasoningSteps: storeMsg?.reasoningSteps || m.reasoningSteps,
          secondsElapsed: storeMsg?.secondsElapsed || m.secondsElapsed,
        }
      })

      // Also patch aiMessages if the last assistant message was empty
      const needsAiPatch = latest.some(
        (m: any) =>
          (m.role === "assistant" || m.role === "tool") &&
          (!m.content || !String(m.content).trim())
      )
      if (needsAiPatch) {
        setAiMessages(
          formatted.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            toolInvocations: m.toolInvocations,
            reasoning: m.reasoning,
            citations: m.citations,
            model: m.model,
            secondsElapsed: m.secondsElapsed,
            reasoningSteps: m.reasoningSteps,
            timestamp: m.timestamp,
            createdAt: m.timestamp ? new Date(m.timestamp) : undefined,
          })) as any
        )
      }

      useAIChatStore.setState({ messages: formatted, isLoading: false })
      useAIChatStore.getState().updateCurrentChat()
    } else {
      useAIChatStore.setState({ isLoading: false })
    }

    toast.message("Generación detenida", {
      description: "Puedes editar tu mensaje o reintentar la respuesta.",
    })
  }

  // When editing a user message we first truncate history via setAiMessages.
  // useChat's append() reads messagesRef, which only updates after that render,
  // so the re-send is deferred to the next aiMessages effect.
  const pendingEditRef = useRef<string | null>(null)

  /**
   * Edit a previous user message: truncate conversation from that point,
   * then re-send the edited text so the AI responds again.
   */
  const handleEditMessage = (messageId: string, newContent: string) => {
    if (!newContent.trim() || aiLoading) return

    if (!isAuthenticated) {
      openAuthModal("register")
      return
    }

    const storeMsgs = useAIChatStore.getState().messages
    const aiMsgs = aiMessagesRef.current

    let storeIdx = storeMsgs.findIndex((m) => m.id === messageId)
    let aiIdx = aiMsgs.findIndex((m: any) => m.id === messageId)

    // IDs can diverge briefly between the Zustand store and useChat; resolve by
    // matching the ordinal of the user message in each list.
    if (storeIdx === -1 && aiIdx !== -1) {
      const userOrdinal = aiMsgs.slice(0, aiIdx + 1).filter((m: any) => m.role === "user").length - 1
      const storeUserEntries = storeMsgs
        .map((m, i) => ({ m, i }))
        .filter((x) => x.m.role === "user")
      storeIdx = storeUserEntries[userOrdinal]?.i ?? -1
      if (storeIdx === -1) {
        const content = aiMsgs[aiIdx]?.content
        storeIdx = storeMsgs.findIndex((m) => m.role === "user" && m.content === content)
      }
    }

    if (aiIdx === -1 && storeIdx !== -1) {
      const userOrdinal = storeMsgs.slice(0, storeIdx + 1).filter((m) => m.role === "user").length - 1
      const aiUserEntries = aiMsgs
        .map((m: any, i: number) => ({ m, i }))
        .filter((x) => x.m.role === "user")
      aiIdx = aiUserEntries[userOrdinal]?.i ?? -1
    }

    if (storeIdx === -1 && aiIdx === -1) {
      toast.error("No se pudo editar el mensaje")
      return
    }

    const truncateStoreAt = storeIdx !== -1 ? storeIdx : aiIdx
    const truncateAiAt = aiIdx !== -1 ? aiIdx : storeIdx

    // Drop the edited message and everything after it
    useAIChatStore.setState({ messages: storeMsgs.slice(0, truncateStoreAt) })
    pendingEditRef.current = newContent
    setAiMessages(aiMsgs.slice(0, truncateAiAt) as any)
    useAIChatStore.getState().updateCurrentChat()
  }

  // Flush deferred re-send after setAiMessages has committed (messagesRef is in sync)
  useEffect(() => {
    const pending = pendingEditRef.current
    if (!pending) return
    pendingEditRef.current = null
    handleSend(pending, { ...lastSendOptionsRef.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-send when history was truncated for edit
  }, [aiMessages])

  const hasMessages = storeMessages.length > 0 || aiMessages.length > 0

  const handleWelcomeAction = (action: WelcomeAction) => {
    if (action.id === "create-portfolio") {
      if (!isAuthenticated) {
        openAuthModal("register")
        return
      }
      router.push("/portafolio")
      return
    }
    if (action.prompt) {
      handleSend(action.prompt)
    }
  }


  // Determine which messages to display, mapping from aiMessages to capture streaming state and fallback to storeMessages when syncing
  const isSyncing = currentChatId !== lastLoadedChatIdRef.current
  const displayMessagesSource = (isSyncing || aiMessages.length === 0) ? storeMessages : aiMessages

  const rawDisplayMessages: ChatMessage[] = displayMessagesSource.map((m, idx) => {
    // Find the message in our Zustand store to retrieve full metadata (like citations, reasoningSteps)
    const storeMsg = storeMessages.find((sm) => sm.id === m.id);
    
    const isLastAssistantLike = (m.role === "assistant" || m.role === "tool") && idx === displayMessagesSource.length - 1;
    
    let reasoningText = storeMsg?.reasoning || (m as any).reasoning;
    let citationsList = storeMsg?.citations || (m as any).citations;
    let reasoningStepsList = storeMsg?.reasoningSteps || (m as any).reasoningSteps;
    
    if (isLastAssistantLike) {
      if (accumulatedReasoningRef.current) {
        reasoningText = accumulatedReasoningRef.current;
      } else if (data && data.length > 0) {
        const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning');
        const streamReasoning = reasoningChunks.map(c => c.text).join('');
        if (streamReasoning) reasoningText = streamReasoning;
      }

      if (accumulatedCitationsRef.current.length > 0) {
        citationsList = accumulatedCitationsRef.current;
      } else if (data && data.length > 0) {
        const citationObj = (data as any[]).find((d: any) => d?.type === 'citations');
        if (citationObj?.urls) {
          citationsList = citationObj.urls;
        }
      }

      if (data && data.length > 0) {
        const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
        if (reportsObj?.reports) {
          reasoningStepsList = reportsObj.reports;
        }
      }
    }

    return {
      id: m.id,
      role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
      timestamp: storeMsg?.timestamp || (m as any).timestamp || new Date(),
      model: storeMsg?.model ?? (selectedModel === "fast" ? "deepseek" : "grok"),
      toolInvocations: m.toolInvocations,
      reasoning: reasoningText || undefined,
      citations: citationsList || [],
      isCollapsed: storeMsg?.isCollapsed || (m as any).isCollapsed,
      secondsElapsed: storeMsg?.secondsElapsed || (m as any).secondsElapsed,
      reasoningSteps: reasoningStepsList,
      pendingPlan: storeMsg?.pendingPlan || (m as any).pendingPlan,
    };
  });

  const displayMessages = groupConsecutiveMessages(rawDisplayMessages);

  // ── WebBuilder unified stream and artifact parser ──
  const isWebBuilderMode = useWebBuilderStore((s) => s.isWebBuilderMode)
  const prevStreamTextRef = useRef<string>("")

  useEffect(() => {
    if (!isWebBuilderMode) return;

    // Helper: compara dos mapas de archivos por CONTENIDO (no por referencia).
    // Sin esto, normalizeFiles crea objetos nuevos cada vez y la comparación
    // por referencia siempre da hasChanged=true → loop infinito (React #185).
    const filesEqual = (
      a: Record<string, { code: string } | string>,
      b: Record<string, { code: string } | string>
    ): boolean => {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every(k => {
        const aCode = typeof a[k] === "string" ? a[k] : (a[k] as any)?.code;
        const bCode = typeof b[k] === "string" ? b[k] : (b[k] as any)?.code;
        return aCode === bCode;
      });
    };

    // 1. Process structured streamData (agent reports and webbuilder files)
    if (data && data.length > 0) {
      const store = useWebBuilderStore.getState();

      // Find the interactive question: {type:'question', question}
      const questionObj = (data as any[]).find((d: any) => d?.type === 'question');
      if (questionObj?.question && activeQuestion?.title !== questionObj.question.title) {
        setActiveQuestion(questionObj.question);
      }

      // Find the plan card (modo Plan): {type:'plan', planId, reason, agents}
      // Solo setear si cambió el planId (evita re-renders en cada tick del stream).
      const planObj = (data as any[]).find((d: any) => d?.type === 'plan');
      if (planObj?.agents && planObj.agents.length > 0) {
        const nextPlanId = planObj.planId || "";
        if (!store.pendingPlan || store.pendingPlan.planId !== nextPlanId) {
          const lastUserMsg = [...aiMessages].reverse().find(m => m.role === 'user')?.content || "";
          store.setPendingPlan({
            planId: nextPlanId || `plan-${Date.now()}`,
            reason: planObj.reason || "",
            agents: planObj.agents,
            originalUserMessage: lastUserMsg,
          });
        }
      }

      // Find agent reports (solo actualizar si hay datos nuevos)
      const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
      if (reportsObj?.reports) {
        store.setActiveAgentReports(reportsObj.reports);
        // Si llegan agentReports es que se construyó: limpiar plan pendiente.
        if (store.pendingPlan) store.clearPendingPlan();
      }

      // Find webbuilder files — usar la ÚLTIMA emisión, no la primera.
      // Durante el streaming el servidor emite múltiples eventos
      // webbuilder_files (uno por agente + reconciliación final), cada uno
      // un superset del anterior (acumula con Object.assign en filesToApply).
      // .find() devolvería solo el PRIMERO (ej. solo agent1), ignorando los
      // archivos de los agentes 2, 3, 4 → el usuario vería 1 de N archivos.
      // .filter(...).pop() toma el último, que tiene el estado acumulado más
      // completo (todos los archivos generados hasta ese punto).
      const allFilesEmissions = (data as any[]).filter((d: any) => d?.type === 'webbuilder_files');
      const webBuilderFilesObj = allFilesEmissions[allFilesEmissions.length - 1];
      if (webBuilderFilesObj?.files) {
        const merged = { ...store.files, ...webBuilderFilesObj.files };
        if (!filesEqual(merged, store.files)) {
          // setFilesStreaming (no setFiles): acumula el diff contra el
          // snapshot previo inicial del ciclo en vez de sobrescribirlo en
          // cada emisión incremental. Sin esto, la tarjeta de cambios solo
          // reflejaría la última emisión parcial, perdiendo archivos previos.
          store.setFilesStreaming(merged);
          store.syncToCloud();
        }
      }
    }

    // 2. Parse inline artifacts from the last assistant message
    const lastAssistant = [...aiMessages].reverse().find(m => m.role === 'assistant');
    if (lastAssistant?.content) {
      const text = lastAssistant.content;
      if (text !== prevStreamTextRef.current) {
        prevStreamTextRef.current = text;
        if (containsArtifact(text)) {
          const artifact = parseArtifact(text);
          if (artifact && artifact.actions.length > 0) {
            const store = useWebBuilderStore.getState();
            const { files: newFiles, failedUpdates } = actionsToFiles(artifact.actions, store.files);
            const merged = { ...store.files, ...newFiles };
            if (!filesEqual(merged, store.files)) {
              store.setFiles(merged);
            }
            // Surfacing estilo Aider: log en dev de las ediciones cuyo bloque
            // SEARCH no coincidió. En el path inline no emitimos al stream para
            // no ensuciar el chat simple, pero dejamos rastro para diagnóstico.
            if (failedUpdates.length > 0) {
              console.warn(
                "[WebBuilder] Ediciones no aplicadas (bloque SEARCH no encontrado):",
                failedUpdates.map(f => ({ filePath: f.filePath, reason: f.reason }))
              );
            }
          }
        }
      }
    }
  }, [data, aiMessages, isWebBuilderMode]);

  // Debounced local storage saving during stream
  const localSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!aiLoading || aiMessages.length === 0) {
      if (localSaveTimeoutRef.current) {
        clearTimeout(localSaveTimeoutRef.current);
        localSaveTimeoutRef.current = null;
      }
      return;
    }

    if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);

    localSaveTimeoutRef.current = setTimeout(() => {
      const latestMessages = aiMessagesRef.current;
      if (latestMessages.length === 0) return;

      // ⚠️ Anti-bucle (React #185 "Maximum update depth exceeded"):
      // ANTES este effect dependía también de `data` y escribía en el store un
      // snapshot "enriquecido" (citations/reasoning/agentReports) por cada tick
      // del stream. Con la fase 3 (streaming apply live) `data` muta en ráfaga
      // (una emisión webbuilder_files por agente + chunks de reasoning), y como
      // el effect que sincroniza storeMessages→aiMessages (más abajo) reacciona
      // a los cambios del store, se cerraba un bucle:
      //   data cambia → guardado escribe messages → sync escribe aiMessages →
      //   guardado re-escribe messages → ... → React aborta con #185.
      //
      // Ahora NO enriquecemos aquí ni dependemos de `data`: el enriquecimiento
      // (citations/reasoning/agentReports) lo hace `onFinish` una única vez al
      // terminar la respuesta, que es su sitio correcto. Aquí solo persistimos
      // el estado actual de los mensajes (debounced), sin retroalimentar el
      // flujo de render.
      const currentStoreMessages = useAIChatStore.getState().messages;

      const formatted: ChatMessage[] = latestMessages.map((m: any) => {
        const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id);
        return {
          id: m.id,
          role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
          content: m.content,
          timestamp: storeMsg?.timestamp || m.timestamp || new Date(),
          model: storeMsg?.model || m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
          toolInvocations: m.toolInvocations,
          citations: storeMsg?.citations || m.citations || [],
          reasoning: storeMsg?.reasoning || m.reasoning || undefined,
          reasoningSteps: storeMsg?.reasoningSteps || m.reasoningSteps || undefined,
          secondsElapsed: storeMsg?.secondsElapsed || m.secondsElapsed,
        };
      });

      // Solo escribir si el contenido realmente cambió, para no alimentar el
      // effect de sync storeMessages→aiMessages con referencias nuevas idénticas.
      const prevIds = currentStoreMessages.map((m) => m.id).join("|");
      const nextIds = formatted.map((m) => m.id).join("|");
      const lastPrevContent = currentStoreMessages[currentStoreMessages.length - 1]?.content ?? "";
      const lastNextContent = formatted[formatted.length - 1]?.content ?? "";
      if (prevIds === nextIds && lastPrevContent === lastNextContent) return;

      useAIChatStore.setState({ messages: formatted });
      useAIChatStore.getState().updateCurrentChat(true); // localOnly = true
    }, 1000); // Debounce by 1 second

    return () => {
      if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);
    };
  }, [aiMessages, aiLoading, selectedModel]);

  // ── Render ──
  const chatContent = (
    <div className="flex flex-col h-full relative flex-1">
      {/* Botones de auth para usuarios no autenticados (esquina superior derecha).
          El chat es "no funcional": al enviar se pide registro, y aquí damos una
          entrada directa a login/registro estilo ChatGPT/OpenAI. */}
      {!isAuthenticated && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => openAuthModal("login")}
            className="text-[13px] sm:text-sm font-semibold text-foreground/80 hover:text-foreground transition-all px-2 py-1.5"
          >
            Entrar
          </button>
          <button
            onClick={() => openAuthModal("register")}
            className="bg-foreground text-background hover:opacity-90 text-[13px] sm:text-sm font-semibold px-3.5 py-2 sm:px-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap"
          >
            Registrarse
          </button>
        </div>
      )}
      {isAuthenticated && hasMessages && !isBrowserOpen && !isCanvasOpen && (
        <TooltipProvider delayDuration={300}>
          <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 select-none">
            {/* Sheet Menu (Más / Archivos) — oculto en modo build: el explorador
                de archivos y opciones vive en el panel de preview dedicado. */}
            {!isWebBuilderMode && (
            <Sheet>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <SheetTrigger asChild>
                      <button 
                        type="button" 
                        className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                      >
                        <MoreHorizontal className="w-4.5 h-4.5" />
                      </button>
                    </SheetTrigger>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs font-semibold">
                  Archivos y Opciones
                </TooltipContent>
              </Tooltip>

              <SheetContent side="right" className="w-[340px] sm:w-[400px] flex flex-col p-0 border-l border-border/50">
                <SheetHeader className="px-5 py-4 border-b border-border/50 bg-muted/20">
                  <SheetTitle className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" />
                    Archivos del Chat
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    Códigos y artefactos generados en esta conversación.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-muted/10 scrollbar-hide">
                  {chatFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                      <Code2 className="w-8 h-8 text-muted-foreground/30 mb-3" />
                      <p className="text-xs text-muted-foreground">No hay archivos ni códigos generados en este chat todavía.</p>
                    </div>
                  ) : (
                    chatFiles.map((file) => (
                      <div 
                        key={file.id}
                        onClick={() => {
                          useCanvasStore.getState().openCanvas({
                            title: file.title,
                            code: file.code,
                            language: file.lang,
                          });
                        }}
                        className="group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-background hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileCode2 className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                            {file.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider">
                            {file.lang}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/70 transition-colors self-center shrink-0" />
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border/50 bg-background">
                  <button 
                    onClick={handleDeleteCurrentChat}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar conversación
                  </button>
                </div>
              </SheetContent>
            </Sheet>
            )}

            {/* Compartir chat completo — oculto en modo build */}
            {!isWebBuilderMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  type="button" 
                  onClick={handleShareFullChat} 
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                >
                  <Share2 className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Compartir chat
              </TooltipContent>
            </Tooltip>
            )}

            {/* New Chat — oculto en modo build */}
            {!isWebBuilderMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={handleNewChat}
                  className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
                >
                  <SquarePen className="w-4.5 h-4.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs font-semibold">
                Nueva conversación
              </TooltipContent>
            </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}
<div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages ? (
          /* Landing vacío: chips de acción junto a la barra (móvil arriba, desktop abajo). */
          isMobile ? (
            <div className="flex flex-col h-full relative px-4 pt-4 pb-4 overflow-hidden">
              <div className="flex-1 flex flex-col items-center justify-center min-h-0 w-full max-w-md mx-auto">
                <div className="text-center mb-5 shrink-0">
                  <img
                    src={mobileLogoSrc}
                    alt="Maverlang Logo"
                    className="h-14 w-auto object-contain select-none pointer-events-none"
                  />
                </div>
              </div>

              <div className="relative w-full max-w-md mx-auto shrink-0 space-y-3 mt-5">
                <WelcomeChips onAction={handleWelcomeAction} />
                <ChatInput
                  placeholder="Pregúntame lo que quieras..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={handleStop}
                  value={input}
                  onChange={setInput}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-start px-4 pt-[25vh] pb-4 relative h-full overflow-x-hidden overflow-y-auto scrollbar-hide">
              <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-start">
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="text-center mb-8"
                >
                  <div className="flex items-center justify-center">
                    <img
                      src={chatLogoSrc}
                      alt="Maverlang Logo"
                      className="h-14 w-auto object-contain select-none pointer-events-none"
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                  className="w-full max-w-3xl pb-2"
                >
                  <ChatInput
                    placeholder="Pregúntame lo que quieras..."
                    onSubmit={handleSend}
                    disabled={false}
                    isStreaming={aiLoading}
                    onStop={handleStop}
                    value={input}
                    onChange={setInput}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
                  className="w-full mt-3 flex justify-center"
                >
                  <WelcomeChips onAction={handleWelcomeAction} />
                </motion.div>
              </div>
            </div>
          )
        ) : (
          /* Chat view - messages + input at bottom */
          <>
            {(storeLoading && displayMessages.length === 0) ? (
               <div className="flex-grow overflow-y-auto px-4 md:px-6 py-20 relative space-y-8 max-w-3xl mx-auto w-full overflow-hidden select-none">
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/10 to-background pointer-events-none z-10" />
                 
                 {/* Loading bubble timeline */}
                 <div className="space-y-6">
                   {/* User message skeleton */}
                   <div className="flex justify-end">
                     <div className="max-w-[70%] w-60 h-11 bg-secondary rounded-2xl rounded-tr-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                   </div>

                   {/* AI response skeleton 1 */}
                   <div className="flex gap-4 items-start max-w-[85%]">
                     <div className="w-9 h-9 rounded-xl bg-muted shrink-0 flex items-center justify-center relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                     <div className="flex-grow space-y-2.5 pt-1.5">
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-full relative overflow-hidden" />
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[92%] relative overflow-hidden" />
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[65%] relative overflow-hidden" />
                     </div>
                   </div>

                   {/* User message skeleton 2 */}
                   <div className="flex justify-end">
                     <div className="max-w-[70%] w-48 h-11 bg-secondary rounded-2xl rounded-tr-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                   </div>

                   {/* AI response skeleton 2 (Dashboard layout simulation) */}
                   <div className="flex gap-4 items-start max-w-[90%]">
                     <div className="w-9 h-9 rounded-xl bg-muted shrink-0 relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                     </div>
                     <div className="flex-grow space-y-4 pt-1.5">
                       <div className="h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-full w-[80%] relative overflow-hidden" />
                       
                       {/* Nested mock widget card */}
                       <div className="border border-border/40 bg-card rounded-2xl p-4 space-y-3 relative overflow-hidden">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
                         <div className="h-4 bg-muted rounded-full w-[40%]" />
                         <div className="h-8 bg-muted rounded-xl w-[90%]" />
                         <div className="h-3 bg-muted rounded-full w-[25%]" />
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             ) : (
               <ChatMessages
                 messages={displayMessages}
                 isLoading={aiLoading || storeLoading}
                 streamData={data}
                 onFeedback={setFeedback}
                 onRetry={() => {
                   // Regenerate without duplicating the user turn: truncate from
                   // the last user message and re-send (same path as edit).
                   const lastUserMsg = [...displayMessages].reverse().find(m => m.role === 'user')
                   if (lastUserMsg) {
                     handleEditMessage(lastUserMsg.id, lastUserMsg.content)
                   }
                 }}
                 onShare={handleShare}
                 onEditMessage={handleEditMessage}
                 onPlanAction={(intent) => {
                   handleSend(intent === "approve" ? "aprobado" : "no", {
                     ...lastSendOptionsRef.current,
                     codeInterpreter: false,
                     browser: false,
                   })
                 }}
                 messageFeedback={messageFeedback}
                 openReasoning={openReasoning}
                 onToggleReasoning={toggleReasoning}
               />
             )}

            <div className="absolute bottom-4 left-0 right-0 z-10 bg-transparent px-4 pb-0 md:relative md:bottom-auto md:px-4 md:pb-5 md:pt-0">
              <div className={cn("w-full transition-all", (isBrowserOpen || isCanvasOpen || isWebBuilderMode) ? "max-w-full" : "max-w-3xl mx-auto")}>
                {activeQuestion && (
                  <div className="mb-3">
                    <InteractiveQuestionCard
                      question={activeQuestion}
                      onSubmit={(answer, optionId) => {
                        const q = activeQuestion;
                        setActiveQuestion(null);

                        // Oferta de workspace (chat normal → Build / Canvas / chat)
                        if (q?.intent === "workspace_mode" || optionId === "activate_build" || optionId === "use_canvas" || optionId === "stay_chat") {
                          const opts = { ...lastSendOptionsRef.current };
                          // Última petición del usuario (lo que quería construir)
                          const lastUser =
                            [...storeMessages].reverse().find((m) => m.role === "user")?.content?.trim() ||
                            [...aiMessages].reverse().find((m: any) => m.role === "user")?.content?.trim() ||
                            "";

                          if (optionId === "activate_build") {
                            const chatId = useAIChatStore.getState().currentChatId;
                            const wb = useWebBuilderStore.getState();
                            wb.setWebBuilderMode(true);
                            wb.setSplitView(true);
                            wb.clearPendingPlan();
                            if (chatId && wb.activeProjectId !== chatId) {
                              wb.initProject(chatId);
                            } else if (!chatId) {
                              wb.resetProject();
                            }
                            useCanvasStore.getState().setOpen(false);
                            const prompt = lastUser
                              ? lastUser
                              : "Quiero construir lo que te pedí. Activa el modo Build y empecemos.";
                            handleSend(prompt, {
                              ...opts,
                              codeInterpreter: false,
                              browser: false,
                            });
                            return;
                          }

                          if (optionId === "use_canvas") {
                            useWebBuilderStore.getState().setWebBuilderMode(false);
                            useCanvasStore.getState().setOpen(true);
                            opts.codeInterpreter = true;
                            const prompt = lastUser
                              ? `Continúa en Canvas con esto: ${lastUser}`
                              : "Prefiero usar Canvas / código para esto.";
                            handleSend(prompt, { ...opts, browser: false });
                            return;
                          }

                          // stay_chat u otra opción genérica
                          useWebBuilderStore.getState().setWebBuilderMode(false);
                          const prompt = lastUser
                            ? `Continúa en el chat normal (sin Build). Mi pedido: ${lastUser}`
                            : answer || "Prefiero continuar en el chat normal.";
                          handleSend(prompt, opts);
                          return;
                        }

                        handleSend(answer, { ...lastSendOptionsRef.current });
                      }}
                      onSkip={() => {
                        setActiveQuestion(null);
                        handleSend("Omitir preguntas y continuar con la configuración estándar", { ...lastSendOptionsRef.current });
                      }}
                      onClose={() => {
                        setActiveQuestion(null);
                      }}
                    />
                  </div>
                )}
                <ChatInput
                  placeholder={activeQuestion ? "Responde a la pregunta de arriba para continuar..." : "Envía un mensaje..."}
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={handleStop}
                  value={input}
                  onChange={setInput}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ShareChatDialog
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })}
        question={shareDialog.question}
        answer={shareDialog.answer}
        defaultMode={shareDialog.defaultMode}
        messages={(
          (aiMessagesRef.current?.length ? aiMessagesRef.current : storeMessages) as any[]
        )
          .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "tool")
          .map((m) => ({
            id: m.id,
            role: (m.role === "tool" ? "assistant" : m.role) as "user" | "assistant",
            content: m.content || "",
            timestamp: m.timestamp || m.createdAt,
            citations: m.citations,
          }))}
      />


    </div>
  )

  // If WebBuilder mode is active and we have messages, wrap in the split-screen workspace
  if (isWebBuilderMode && storeMessages.length > 0) {
    return (
      <WebBuilderErrorBoundary
        label="El panel de Build se detuvo"
        onRecover={() => {
          // Re-montar workspace y desbloquear flags de "generando"
          try {
            useWebBuilderStore.getState().setAiResponding(false)
            useWebBuilderStore.getState().setActiveAgentReports(null)
          } catch {
            /* noop */
          }
        }}
      >
        <WebBuilderWorkspace chatPanel={chatContent} />
      </WebBuilderErrorBoundary>
    )
  }

  // Wrap in Canvas/Browser workspace (will render split-pane if active)
  return (
    <BrowserWorkspace chatPanel={
      <CanvasWorkspace chatPanel={chatContent} />
    } />
  )
}

const COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  chile: { name: 'Chile', flag: '🇨🇱' },
  argentina: { name: 'Argentina', flag: '🇦🇷' },
  colombia: { name: 'Colombia', flag: '🇨🇴' },
  brasil: { name: 'Brasil', flag: '🇧🇷' },
  ecuador: { name: 'Ecuador', flag: '🇪🇨' },
  mexico: { name: 'México', flag: '🇲🇽' },
};

function MenuLink({ 
  href, 
  icon: Icon, 
  title, 
  desc 
}: { 
  href: string; 
  icon: React.ComponentType<any>; 
  title: string; 
  desc: string 
}) {
  return (
    <Link 
      href={href}
      className="group/menu-link flex items-start gap-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] transition-all duration-200 active:scale-[0.98]"
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-foreground group-hover/menu-link:bg-foreground group-hover/menu-link:text-background flex items-center justify-center shrink-0 transition-colors duration-200">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-gray-900 dark:text-gray-100 transition-colors">
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground leading-normal mt-0.5 line-clamp-2">
          {desc}
        </span>
      </div>
    </Link>
  )
}

function StockLogo({ symbol, className }: { symbol: string; className?: string }) {
  const [error, setError] = useState(false);
  const sym = symbol.toUpperCase();
  
  const logoUrl = sym === 'BTC' || sym === 'ETH' || sym === 'SOL'
    ? `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sym.toLowerCase()}.png`
    : `https://images.financialmodelingprep.com/symbol/${sym}.png`;

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'from-blue-500 to-indigo-600',
      'from-emerald-400 to-teal-600',
      'from-purple-500 to-pink-600',
      'from-orange-400 to-red-600',
      'from-cyan-400 to-blue-600',
      'from-pink-400 to-rose-600'
    ];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (error) {
    return (
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-gradient-to-br shrink-0 shadow-sm uppercase",
        getGradient(sym),
        className
      )}>
        {sym.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={sym}
      onError={() => setError(true)}
      className={cn("w-8 h-8 rounded-full object-cover shrink-0 bg-white p-0.5 border border-gray-100 dark:border-white/10 shadow-sm", className)}
    />
  );
}

export function ChatLanding() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F1117]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 text-[#1890FF] animate-spin border-2 border-t-transparent rounded-full" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    }>
      <ChatLandingContent />
    </Suspense>
  );
}
