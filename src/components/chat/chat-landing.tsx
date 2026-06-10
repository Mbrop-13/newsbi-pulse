"use client"

import { useState, useEffect, useRef } from "react"

import { ChatInput } from "@/components/chat/chat-input"
import { ChatMessages } from "@/components/chat/chat-messages"
import { ModelSelector, type RecluModel } from "@/components/chat/model-selector"
import PromptSuggestions from "@/components/chat/prompt-suggestions"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useAIChatStore, type ChatMessage } from "@/lib/stores/ai-chat-store"
import { useAssistantStore } from "@/lib/stores/assistant-store"
import { useAuthStore } from "@/lib/stores/auth-store"
import { getPlanConfig, type PlanTier, getNextTier } from "@/lib/plan-limits"
import { useChat } from "ai/react"
import { ShareChatDialog } from "@/components/assistant/share-chat-dialog"
import { toast } from "sonner"

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
    
    if (isAssistantLike && isLastAssistantLike && !msg.isSwarmThinking && !lastGrouped.isSwarmThinking) {
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
  const user = useAuthStore((s) => s.user)
  const userTier = useAuthStore((s) =>
    s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free")
  ) as PlanTier

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

  // AI SDK useChat for streaming
  const {
    messages: aiMessages,
    setMessages: setAiMessages,
    append,
    isLoading: aiLoading,
    stop,
    input,
    handleInputChange,
    data,
  } = useChat({
    api: "/api/ai-chat",
    onFinish: (message) => {
      // Find citations & reasoning in streamData (data) or accumulated refs
      let citationsList: string[] = accumulatedCitationsRef.current.length > 0 ? accumulatedCitationsRef.current : []
      let reasoningText = accumulatedReasoningRef.current || ""
      if (citationsList.length === 0 || !reasoningText) {
        if (data && data.length > 0) {
          const citationObj = (data as any[]).find((d: any) => d?.type === 'citations')
          if (citationObj?.urls && citationsList.length === 0) {
            citationsList = citationObj.urls
          }
          const reasoningChunks = (data as any[]).filter((d: any) => d?.type === 'reasoning')
          const streamReasoning = reasoningChunks.map(c => c.text).join('')
          if (streamReasoning && !reasoningText) reasoningText = streamReasoning
        }
      }

      // Use requestAnimationFrame to ensure aiMessages state has been flushed by React
      requestAnimationFrame(() => {
        const latestMessages = aiMessagesRef.current;
        const lastAssistantIdx = [...latestMessages].reverse().findIndex(m => m.role === 'assistant' || m.role === 'tool');
        const targetIdx = lastAssistantIdx !== -1 ? (latestMessages.length - 1 - lastAssistantIdx) : -1;

        const storeMessages: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
          const isTarget = idx === targetIdx;
          if (isTarget) {
            return {
              id: message.id,
              role: "assistant",
              content: message.content || m.content || "",
              timestamp: new Date(),
              model: selectedModel === "fast" ? "deepseek" : "grok",
              toolInvocations: message.toolInvocations || m.toolInvocations,
              citations: citationsList,
              reasoning: reasoningText || m.reasoning || undefined,
            };
          }
          return {
            id: m.id,
            role: (m.role === 'tool' ? 'assistant' : m.role) as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(),
            model: selectedModel === "fast" ? "deepseek" : "grok",
            toolInvocations: m.toolInvocations,
            citations: m.citations || [],
            reasoning: m.reasoning || undefined,
          };
        });

        if (targetIdx === -1) {
          storeMessages.push({
            id: message.id,
            role: "assistant",
            content: message.content,
            timestamp: new Date(),
            model: selectedModel === "fast" ? "deepseek" : "grok",
            toolInvocations: message.toolInvocations,
            citations: citationsList,
            reasoning: reasoningText || undefined,
          });
        }

        useAIChatStore.setState({ messages: storeMessages });
        useAIChatStore.getState().updateCurrentChat();
      });
    },
    onError: (error) => {
      console.error("[AI Chat] Stream error:", error);
      toast.error(error.message || "Ocurrió un error al procesar la solicitud. Por favor, intenta de nuevo.");
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
        targetPath = `/ai/chat/${currentChatId}`;
      }
      if (currentPath !== targetPath && !currentPath.startsWith('/share/')) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [currentChatId]);

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
            isSwarmThinking: m.isSwarmThinking,
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

  const handleModelSelect = (model: RecluModel) => {
    setModel(model.id)
  }

  const handleSend = (
    text: string,
    options: { webSearch: boolean; image: boolean; codeInterpreter: boolean }
  ) => {
    if (!text.trim() || aiLoading) return

    accumulatedReasoningRef.current = ""
    accumulatedCitationsRef.current = []

    // If Swarm agent mode, route differently
    if (selectedModel === "agent") {
      sendSwarmMessage(text)
      return
    }

    // Check chat limits
    const planConfig = getPlanConfig(userTier)
    // Create chat ID if new
    let activeChatId = currentChatId
    if (!activeChatId) {
      activeChatId = Date.now().toString()
      lastLoadedChatIdRef.current = activeChatId
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text,
        timestamp: new Date(),
      }
      useAIChatStore.setState({
        currentChatId: activeChatId,
        messages: [userMsg],
      })
      useAIChatStore.getState().updateCurrentChat()
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
        },
      }
    )
  }

  const sendSwarmMessage = async (text: string) => {
    accumulatedReasoningRef.current = ""
    accumulatedCitationsRef.current = []

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }
    addMessage(userMsg)
    useAIChatStore.setState({ isLoading: true })

    try {
      const thinkingId = `swarm-thinking-${Date.now()}`
      const thinkingMsg: ChatMessage = {
        id: thinkingId,
        role: "assistant",
        content: "Coordinando agentes especializados...",
        timestamp: new Date(),
        isSwarmThinking: true,
      }
      addMessage(thinkingMsg)

      const res = await fetch("/api/ai/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, articles: attachedArticles }),
      })

      if (!res.ok) throw new Error("Swarm error")
      const data = await res.json()

      // Remove thinking message
      useAIChatStore.setState((s) => ({
        messages: s.messages.filter((m) => m.id !== thinkingId),
      }))

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || data.content || "",
        timestamp: new Date(),
        model: "grok",
        reasoningSteps: data.agentResults,
      }
      addMessage(assistantMsg)
      useAIChatStore.getState().updateCurrentChat()
    } catch (e) {
      toast.error("Error con Swarm AI. Intenta de nuevo.")
    } finally {
      useAIChatStore.setState({ isLoading: false })
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
      isSwarmThinking: (m as any).isSwarmThinking,
      isCollapsed: (m as any).isCollapsed,
      secondsElapsed: (m as any).secondsElapsed,
      reasoningSteps: (m as any).reasoningSteps,
    };
  });

  const displayMessages = groupConsecutiveMessages(rawDisplayMessages);

  return (
    <div className="flex flex-col h-full relative flex-1">
      <div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages ? (
          /* Landing view - center content with prompt suggestions */
          <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 relative">
            {/* Top Navigation Sections */}
            <div className="absolute top-6 inset-x-0 flex items-center justify-center gap-6 text-sm font-medium z-10">
              <Link href="/noticias" className="text-muted-foreground hover:text-foreground transition-colors py-1 px-2">
                Noticias
              </Link>
              <Link href="/mercados" className="text-muted-foreground hover:text-foreground transition-colors py-1 px-2">
                Mercados
              </Link>
              <Link href="/portafolio" className="text-muted-foreground hover:text-foreground transition-colors py-1 px-2">
                Portafolio
              </Link>
              <Link href="/mundo" className="text-muted-foreground hover:text-foreground transition-colors py-1 px-2">
                Mundo
              </Link>
            </div>

            <div className="w-full max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center">
                  <img 
                    src="/assets/maverlang-logo.png" 
                    alt="Maverlang Logo" 
                    className="h-16 w-auto object-contain"
                  />
                </div>
              </div>

              <div className="w-full">
                <ChatInput
                  placeholder="Pregúntame lo que quieras..."
                  onSubmit={handleSend}
                  disabled={false}
                  isStreaming={aiLoading}
                  onStop={stop}
                />
              </div>
            </div>
            {/* Spacer to push the input bar up slightly, keeping it centered where it was before */}
            <div className="h-32 w-full shrink-0" />
          </div>
        ) : (
          /* Chat view - messages + input at bottom */
          <>
            <ChatMessages
              messages={displayMessages}
              isLoading={aiLoading || storeLoading}
              streamData={data}
              onFeedback={setFeedback}
              onRetry={() => {
                // Re-send the last user message
                const lastUserMsg = [...displayMessages].reverse().find(m => m.role === 'user')
                if (lastUserMsg) {
                  handleSend(lastUserMsg.content, { webSearch: false, image: false, codeInterpreter: false })
                }
              }}
              onShare={handleShare}
              messageFeedback={messageFeedback}
              openReasoning={openReasoning}
              onToggleReasoning={toggleReasoning}
            />

            <div className="sticky bottom-0 z-10 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-4 pb-6">
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
}
