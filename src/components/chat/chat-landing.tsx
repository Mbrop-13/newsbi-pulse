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
import { cn, formatDate as fmtDate, getFallbackImage, slugify } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Newspaper, Sparkles, Headphones, LineChart, Coins, Landmark, Briefcase, Shield, Lightbulb, Globe, Flame, Calendar, Cpu, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useSidebar } from "@/components/ui/sidebar"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
import { WebBuilderWorkspace } from "@/components/webbuilder/workspace"
import { parseArtifact, actionsToFiles, containsArtifact } from "@/lib/webbuilder-parser"

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

  const [activeMenu, setActiveMenu] = useState<'noticias' | 'mercados' | 'portafolio' | 'mundo' | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Legacy data fetching and activeMenu state have been removed as part of Phase 5 cleanup.

  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({})
  const [shareDialog, setShareDialog] = useState({ isOpen: false, question: "", answer: "" })
  const lastLoadedChatIdRef = useRef<string | null>(null)

  const accumulatedReasoningRef = useRef<string>("")
  const accumulatedCitationsRef = useRef<string[]>([]);

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
            openConversionModal("ai_chat");
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      return response;
    },
    onFinish: (message) => {
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

      // Use requestAnimationFrame to ensure aiMessages state has been flushed by React
      requestAnimationFrame(() => {
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

        const storeMessages: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
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
              reasoningSteps: agentReportsData.length > 0 ? agentReportsData : m.reasoningSteps || undefined,
              secondsElapsed: m.secondsElapsed,
            };
          }
          return {
            id: m.id,
            role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp || new Date(),
            model: m.model || (selectedModel === "fast" ? "deepseek" : "grok"),
            toolInvocations: m.toolInvocations,
            citations: m.citations || [],
            reasoning: m.reasoning || undefined,
            reasoningSteps: m.reasoningSteps || undefined,
            secondsElapsed: m.secondsElapsed,
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

        // Signal that the AI has finished responding
        useWebBuilderStore.getState().setAiResponding(false);
      });
    },
    onError: (error) => {
      console.error("[AI Chat] Stream error:", error);
      toast.error(error.message || "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.");
      useWebBuilderStore.getState().setAiResponding(false);
    }
  })

  const aiMessagesRef = useRef<any[]>([])
  useEffect(() => {
    aiMessagesRef.current = aiMessages
  }, [aiMessages])

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
    }
  }, [data]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      let targetPath = '/ai';
      if (currentChatId) {
        const firstUserMsg = storeMessages.find(m => m.role === 'user')?.content || '';
        const title = firstUserMsg.slice(0, 40) || 'Nuevo Chat';
        const slug = slugify(title);
        targetPath = `/ai/chat/${slug ? `${slug}-` : ''}${currentChatId}`;
      }
      if (currentPath !== targetPath && !currentPath.startsWith('/share/')) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [currentChatId, storeMessages]);

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

    accumulatedReasoningRef.current = ""
    accumulatedCitationsRef.current = []

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
          webBuilder: isWB,
          webBuilderFiles: isWB ? useWebBuilderStore.getState().files : undefined,
        },
      }
    )

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
    const isLastAssistantLike = (m.role === "assistant" || m.role === "tool") && idx === displayMessagesSource.length - 1;
    
    let reasoningText = (m as any).reasoning;
    let citationsList = (m as any).citations;
    let reasoningStepsList = (m as any).reasoningSteps;
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
      timestamp: (m as any).timestamp || new Date(),
      model: selectedModel === "fast" ? "deepseek" : "grok",
      toolInvocations: m.toolInvocations,
      reasoning: reasoningText || undefined,
      citations: citationsList || [],
      isCollapsed: (m as any).isCollapsed,
      secondsElapsed: (m as any).secondsElapsed,
      reasoningSteps: reasoningStepsList,
    };
  });

  const displayMessages = groupConsecutiveMessages(rawDisplayMessages);

  // ── WebBuilder artifact parsing from streaming AI messages ──
  const isWebBuilderMode = useWebBuilderStore((s) => s.isWebBuilderMode)
  const prevStreamTextRef = useRef<string>("")

  useEffect(() => {
    if (!isWebBuilderMode) return
    // Check the last assistant message for artifact XML
    const lastAssistant = [...aiMessages].reverse().find(m => m.role === 'assistant')
    if (!lastAssistant?.content) return
    const text = lastAssistant.content
    // Only parse if text changed and contains artifact
    if (text === prevStreamTextRef.current) return
    prevStreamTextRef.current = text
    if (!containsArtifact(text)) return
    const artifact = parseArtifact(text)
    if (artifact && artifact.actions.length > 0) {
      const store = useWebBuilderStore.getState()
      // Pass existing files so "update" (diff) actions can apply search/replace
      const newFiles = actionsToFiles(artifact.actions, store.files)
      // Merge with existing files (preserving index.tsx etc)
      const merged = { ...store.files, ...newFiles }
      store.setFiles(merged)
    }
  }, [aiMessages, isWebBuilderMode])

  // Listen for 'webbuilder_files' from streamData (data)
  useEffect(() => {
    if (!isWebBuilderMode || !data || data.length === 0) return
    const webBuilderFilesObj = (data as any[]).find((d: any) => d?.type === 'webbuilder_files')
    if (webBuilderFilesObj?.files) {
      const store = useWebBuilderStore.getState()
      // Merge new files from the agents
      const merged = { ...store.files, ...webBuilderFilesObj.files }
      
      // Let's compare to prevent unnecessary state updates
      const hasChanged = Object.keys(merged).some(k => merged[k] !== store.files[k]) || 
                         Object.keys(store.files).some(k => merged[k] !== store.files[k]);
      if (hasChanged) {
        store.setFiles(merged)
      }
    }
  }, [data, isWebBuilderMode])

  // ── Render ──
  const chatContent = (
    <div className="flex flex-col h-full relative flex-1">
      <div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages && !isMobile ? (
          /* Landing view - center content with prompt suggestions */
          <div className="flex-1 flex flex-col items-center justify-between md:justify-center px-4 pt-16 relative h-full">
            {/* Top Navigation Sections removed in Phase 5 */}

            <div className="flex-grow flex flex-col items-center justify-center w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center">
                  <img 
                    src={chatLogoSrc} 
                    alt="Maverlang Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-2 pb-2 md:pb-3">
              <div className="max-w-3xl mx-auto w-full">
                <ChatInput
                  placeholder="Pregúntame lo que quieras..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                />
              </div>
            </div>
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

            <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-2 pb-2 md:pb-3">
              <div className="max-w-3xl mx-auto w-full">
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

  return chatContent
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
