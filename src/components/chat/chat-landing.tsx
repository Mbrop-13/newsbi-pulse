"use client"

import { useState, useEffect, useRef } from "react"
import { useTheme } from "next-themes"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ModelSelector, type MaverlangModel } from "@/components/chat/model-selector"
import PromptSuggestions from "@/components/chat/prompt-suggestions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAIChatStore, type ChatMessage } from "@/lib/stores/ai-chat-store"
import { useAssistantStore } from "@/lib/stores/assistant-store"
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store"
import { useConversionStore } from "@/lib/stores/conversion-store"
import { getPlanConfig, type PlanTier, getNextTier } from "@/lib/plan-limits"
import { useChat } from "ai/react"
import { ShareChatDialog } from "@/components/assistant/share-chat-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn, formatDate as fmtDate, getFallbackImage, slugify, getCleanPathname } from "@/lib/utils"
import { useLanguageStore } from "@/lib/stores/language-store"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, Sparkles, Headphones, LineChart, Coins, Landmark, Briefcase, Shield, Lightbulb, Globe, Flame, Calendar, Cpu, ArrowUpRight, ArrowDownRight, MoreHorizontal, Link2, SquarePen, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "@/components/ui/sidebar"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
import { WebBuilderWorkspace } from "@/components/webbuilder/workspace"
import { parseArtifact, actionsToFiles, containsArtifact } from "@/lib/webbuilder-parser"
import { classifyPlanResponse } from "@/lib/webbuilder-plan-utils"
import { CanvasWorkspace } from "@/components/chat/canvas-workspace"
import { useCanvasStore } from "@/lib/stores/canvas-store"
import { useBrowserStore } from "@/lib/stores/browser-store"
import { BrowserWorkspace } from "@/components/chat/browser-workspace"

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
    } else {
      grouped.push({ 
        ...msg,
        role: isAssistantLike ? "assistant" : msg.role
      });
    }
  }
  
  return grouped;
}


export function ChatLanding() {
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
  } = useAIChatStore()

  const language = useLanguageStore((s) => s.language)

  const [activeMenu, setActiveMenu] = useState<'noticias' | 'mercados' | 'portafolio' | 'mundo' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Legacy data fetching and activeMenu state have been removed as part of Phase 5 cleanup.

  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({})
  const [shareDialog, setShareDialog] = useState({ isOpen: false, question: "", answer: "" })
  const lastLoadedChatIdRef = useRef<string | null>(null)

  const router = useRouter()

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
    router.push(`/${language}/ai`)
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
        router.push(`/${language}/ai`)
      }
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Enlace del chat copiado al portapapeles")
    }
  }

  const accumulatedReasoningRef = useRef<string>("")
  const accumulatedCitationsRef = useRef<string[]>([]);

  // Track store hydration
  const [isStoreHydrated, setIsStoreHydrated] = useState(false)
  useEffect(() => {
    setIsStoreHydrated(useAIChatStore.persist.hasHydrated())
    const unsub = useAIChatStore.persist.onFinishHydration(() => setIsStoreHydrated(true))
    return () => unsub()
  }, [])

  // Check for auto-start prompt in URL parameters
  useEffect(() => {
    if (!isStoreHydrated) return;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const promptParam = params.get("prompt");
      if (promptParam) {
        // Clear search params to prevent loop on reload/navigation
        const newUrl = window.location.pathname;
        window.history.replaceState(null, '', newUrl);

        // Start new chat with this prompt
        handleNewChat();
        
        // Wait for state to clear, then submit the prompt
        setTimeout(() => {
          handleSend(promptParam, { webSearch: true, image: false, codeInterpreter: false, browser: false });
        }, 150);
      }
    }
  }, [isStoreHydrated]);

  // Track theme mounting for dark mode logo swapping
  const { resolvedTheme } = useTheme()
  const [themeMounted, setThemeMounted] = useState(false)
  useEffect(() => {
    setThemeMounted(true)
  }, [])
  const isDark = themeMounted && resolvedTheme === "dark"
  const chatLogoSrc = isDark ? "/assets/maverlang-logo-white.png" : "/assets/maverlang-logo.png"

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
            const lastAssistantIdx = [...latestMessages].reverse().findIndex(m => m.role === 'assistant' || m.role === 'tool');
            const targetIdx = lastAssistantIdx !== -1 ? (latestMessages.length - 1 - lastAssistantIdx) : -1;

            const firstMsgText = message.content || "";
            const toolsCalled = message.toolInvocations || [];
            const hasTools = toolsCalled.length > 0;
            const finalContent = (firstMsgText.trim().length > 0)
              ? firstMsgText
              : hasTools
                ? "He procesado los datos financieros solicitados y configurado los paneles interactivos correspondientes. Puedes revisar la información en los widgets de arriba."
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
      toast.error(error.message || "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.");
      useWebBuilderStore.getState().setAiResponding(false);
      useWebBuilderStore.getState().setActiveAgentReports(null);
    }
  })

  const aiMessagesRef = useRef<any[]>([])
  useEffect(() => {
    aiMessagesRef.current = aiMessages
  }, [aiMessages])

  const lastAutoOpenedRef = useRef<string>("");

  useEffect(() => {
    lastAutoOpenedRef.current = "";
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

        if (codeValue && codeValue !== lastAutoOpenedRef.current) {
          lastAutoOpenedRef.current = codeValue;

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
  }, [aiMessages]);

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
      let cleanTargetPath = '/ai';
      if (currentChatId) {
        const firstUserMsg = storeMessages.find(m => m.role === 'user')?.content || '';
        const title = firstUserMsg.slice(0, 40) || 'Nuevo Chat';
        const slug = slugify(title);
        cleanTargetPath = `/ai/chat/${slug ? `${slug}-` : ''}${currentChatId}`;
      }
      const targetPath = `/${language}${cleanTargetPath}`;
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
    options: { webSearch: boolean; image: boolean; codeInterpreter: boolean; browser: boolean }
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
    // Ocultar el banner de límite de tokens al iniciar un nuevo envío.
    useConversionStore.getState().clearTokenLimitReached()

    // Check chat limits
    const planConfig = getPlanConfig(userTier)
    const isWB = useWebBuilderStore.getState().isWebBuilderMode
    if (isWB) {
      useWebBuilderStore.getState().resetAutoFixAttempts()
      useWebBuilderStore.getState().setAiResponding(true)
    }
    // Create chat ID if new
    let activeChatId = currentChatId
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
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

    // Use AI SDK append
    append(
      { role: "user", content: text },
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
          buildMode: isWB ? useWebBuilderStore.getState().buildMode : undefined,
          ...planBodyExtras,
        },
      }
    )

    // Open workspaces immediately if user requested those modes
    if (options.browser) {
      useBrowserStore.getState().setOpen(true);
    }
    if (options.codeInterpreter) {
      useCanvasStore.getState().setOpen(true);
    }

    // If WebBuilder mode is active, ensure split view is shown
    if (isWB) {
      useWebBuilderStore.getState().setSplitView(true)
    }
  }


  const toggleReasoning = (id: string) => {
    setOpenReasoning((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleShare = (question: string, answer: string) => {
    setShareDialog({ isOpen: true, question, answer })
  }

  const hasMessages = storeMessages.length > 0 || aiMessages.length > 0

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
      model: storeMsg?.model || selectedModel === "fast" ? "deepseek" : "grok",
      toolInvocations: m.toolInvocations,
      reasoning: reasoningText || undefined,
      citations: citationsList || [],
      isCollapsed: storeMsg?.isCollapsed || (m as any).isCollapsed,
      secondsElapsed: storeMsg?.secondsElapsed || (m as any).secondsElapsed,
      reasoningSteps: reasoningStepsList,
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

      // Find the plan card (modo Plan): {type:'plan', planId, reason, agents}
      const planObj = (data as any[]).find((d: any) => d?.type === 'plan');
      if (planObj?.agents && planObj.agents.length > 0) {
        // Último mensaje del usuario que originó el plan (para replan/ejecución).
        const lastUserMsg = [...aiMessages].reverse().find(m => m.role === 'user')?.content || "";
        store.setPendingPlan({
          planId: planObj.planId || `plan-${Date.now()}`,
          reason: planObj.reason || "",
          agents: planObj.agents,
          originalUserMessage: lastUserMsg,
        });
      }

      // Find agent reports
      const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
      if (reportsObj?.reports) {
        store.setActiveAgentReports(reportsObj.reports);
        // Si llegan agentReports es que se construyó: limpiar plan pendiente.
        store.clearPendingPlan();
      }

      // Find webbuilder files
      const webBuilderFilesObj = (data as any[]).find((d: any) => d?.type === 'webbuilder_files');
      if (webBuilderFilesObj?.files) {
        const merged = { ...store.files, ...webBuilderFilesObj.files };
        if (!filesEqual(merged, store.files)) {
          store.setFiles(merged);
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
            const newFiles = actionsToFiles(artifact.actions, store.files);
            const merged = { ...store.files, ...newFiles };
            if (!filesEqual(merged, store.files)) {
              store.setFiles(merged);
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
      
      let citationsList: string[] = accumulatedCitationsRef.current || [];
      let reasoningText = accumulatedReasoningRef.current || "";
      let agentReportsData: any[] = [];
      
      if (data && data.length > 0) {
        const citationObj = (data as any[]).find((d: any) => d?.type === 'citations');
        if (citationObj?.urls && citationsList.length === 0) {
          citationsList = citationObj.urls;
        }
        const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning');
        const streamReasoning = reasoningChunks.map(c => c.text).join('');
        if (streamReasoning && !reasoningText) reasoningText = streamReasoning;
        
        const reportsObj = (data as any[]).find((d: any) => d?.type === 'agentReports');
        if (reportsObj?.reports) {
          agentReportsData = reportsObj.reports;
        }
      }

      const currentStoreMessages = useAIChatStore.getState().messages;
      const lastAssistantIdx = [...latestMessages].reverse().findIndex(m => m.role === 'assistant' || m.role === 'tool');
      const targetIdx = lastAssistantIdx !== -1 ? (latestMessages.length - 1 - lastAssistantIdx) : -1;

      const formatted: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
        const storeMsg = currentStoreMessages.find((sm) => sm.id === m.id);
        const isTarget = idx === targetIdx;
        if (isTarget) {
          return {
            id: m.id,
            role: "assistant",
            content: m.content || "",
            timestamp: m.timestamp || new Date(),
            model: selectedModel === "fast" ? "deepseek" : "grok",
            toolInvocations: m.toolInvocations,
            citations: citationsList,
            reasoning: reasoningText || m.reasoning || undefined,
            reasoningSteps: agentReportsData.length > 0 ? agentReportsData : m.reasoningSteps || storeMsg?.reasoningSteps || undefined,
            secondsElapsed: m.secondsElapsed,
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

      useAIChatStore.setState({ messages: formatted });
      useAIChatStore.getState().updateCurrentChat(true); // localOnly = true
    }, 1000); // Debounce by 1 second

    return () => {
      if (localSaveTimeoutRef.current) clearTimeout(localSaveTimeoutRef.current);
    };
  }, [aiMessages, aiLoading, selectedModel, data]);

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
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 select-none">
          {/* Dropdown Menu (Más) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                type="button" 
                title="Más" 
                className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
              >
                <MoreHorizontal className="w-4.5 h-4.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl border border-gray-250 dark:border-white/5 bg-white dark:bg-zinc-950 p-1 shadow-lg z-[90]">
              <DropdownMenuItem 
                onClick={handleDeleteCurrentChat}
                className="text-red-650 dark:text-red-400 focus:bg-red-500/10 focus:text-red-650 dark:focus:text-red-400 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-semibold flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar conversación
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Copy link */}
          <button 
            type="button" 
            onClick={handleCopyLink} 
            title="Copiar enlace" 
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
          >
            <Link2 className="w-4.5 h-4.5" />
          </button>

          {/* New Chat */}
          <button 
            type="button" 
            onClick={handleNewChat} 
            title="Nueva conversación" 
            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-850/80 flex items-center justify-center text-gray-700 dark:text-gray-200 transition-all cursor-pointer shadow-xs border border-transparent dark:border-white/5 active:scale-95"
          >
            <SquarePen className="w-4.5 h-4.5" />
          </button>
        </div>
      )}
      <div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages ? (
          /* Landing view - logo + input centrados verticalmente (estilo Grok/Perplexity).
             Al enviar el primer mensaje, hasMessages pasa a true y el input baja a su
             posición fija en el fondo (rama del chat activo más abajo). */
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative h-full">
            {/* Spacer superior para empujar el bloque hacia el centro visual */}
            <div className="flex-grow" aria-hidden />

            <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center">
                  <img 
                    src={chatLogoSrc} 
                    alt="Maverlang Logo" 
                    className="h-16 w-auto object-contain select-none pointer-events-none"
                  />
                </div>
              </div>

              <div className="w-full pb-4 md:pb-8">
                <ChatInput
                  placeholder="Pregúntame lo que quieras..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                />
              </div>
            </div>

            {/* Spacer inferior para equilibrar el centrado visual */}
            <div className="flex-grow" aria-hidden />
          </div>
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
                   // Re-send the last user message
                   const lastUserMsg = [...displayMessages].reverse().find(m => m.role === 'user')
                   if (lastUserMsg) {
                     handleSend(lastUserMsg.content, { webSearch: false, image: false, codeInterpreter: false, browser: false })
                   }
                 }}
                 onShare={handleShare}
                 messageFeedback={messageFeedback}
                 openReasoning={openReasoning}
                 onToggleReasoning={toggleReasoning}
               />
             )}

            <div className="sticky bottom-0 z-10 w-full bg-transparent pt-2 pb-4 md:pb-5 px-4">
              <div className={cn("w-full transition-all", (isBrowserOpen || isCanvasOpen || isWebBuilderMode) ? "max-w-full" : "max-w-3xl mx-auto")}>
                <ChatInput
                  placeholder="Envía un mensaje..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share dialog */}
      <ShareChatDialog
        isOpen={shareDialog.isOpen}
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })}
        question={shareDialog.question}
        answer={shareDialog.answer}
      />
    </div>
  )

  // If WebBuilder mode is active and we have messages, wrap in the split-screen workspace
  if (isWebBuilderMode && storeMessages.length > 0) {
    return (
      <WebBuilderWorkspace chatPanel={chatContent} />
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
