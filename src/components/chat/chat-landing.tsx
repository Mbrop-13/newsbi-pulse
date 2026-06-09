"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
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
    api: "/api/ai/chat",
    onFinish: (message) => {
      // Find citations in useChat data (which contains all streamData)
      let citationsList: string[] = []
      if (data && data.length > 0) {
        const citationObj = (data as any[]).find((d: any) => d?.type === 'citations')
        if (citationObj?.urls) {
          citationsList = citationObj.urls
        }
      }

      // Sync finished message to our store
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: message.content,
        timestamp: new Date(),
        model: selectedModel === "fast" ? "deepseek" : "grok",
        toolInvocations: (message as any).toolInvocations,
        citations: citationsList,
      }

      // Extract reasoning from parts if available
      const parts = (message as any).parts || (message as any).content?.parts
      if (parts) {
        for (const part of parts) {
          if (part.type === "reasoning") {
            assistantMsg.reasoning = part.reasoning || part.content || ""
            assistantMsg.secondsElapsed = part.details?.durationMs
              ? Math.round(part.details.durationMs / 1000)
              : undefined
          }
        }
      }

      addMessage(assistantMsg)
      useAIChatStore.getState().updateCurrentChat()
    },
  })

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
          }))
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

  // Determine which messages to display
  const displayMessages = storeMessages.length > 0 ? storeMessages : []

  return (
    <SidebarInset>
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
                    src="https://cdn.shopify.com/s/files/1/0564/3812/8712/files/freepik__background__94196.png?v=1771922713" 
                    alt="Reclu Logo" 
                    className="h-28 w-auto object-contain"
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
    </SidebarInset>
  )
}
