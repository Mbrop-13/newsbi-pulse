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

  const [newsList, setNewsList] = useState<any[]>([]);
  const [worldNewsList, setWorldNewsList] = useState<any[]>([]);
  const [portfolioList, setPortfolioList] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const handleMouseEnter = (menu: 'noticias' | 'mercados' | 'portafolio' | 'mundo') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveMenu(menu);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const supabase = createClient();
  const openModal = useAuthModalStore(s => s.openModal);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        // 1. Fetch News
        const { data: newsData } = await supabase
          .from('news_articles')
          .select('*')
          .neq('is_hidden', true)
          .order('published_at', { ascending: false })
          .limit(40);
        
        if (newsData) {
          // General News (first 3 articles)
          setNewsList(newsData.slice(0, 3));
          
          // World News (articles from countries Chile, Argentina, Colombia, Brasil, Ecuador, México)
          const countrySlugs = ['chile', 'argentina', 'colombia', 'brasil', 'ecuador', 'mexico'];
          const filteredWorld = newsData.filter(a => countrySlugs.includes(a.feed_tag || ''));
          setWorldNewsList(filteredWorld.slice(0, 3));
        }

        // 2. Fetch Portfolio if authenticated
        if (user?.id) {
          const { data: portData } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', user.id);
          if (portData && portData.length > 0) {
            const symbols = portData.map(a => a.symbol).join(",");
            try {
              const res = await fetch(`/api/finance/portfolio?symbols=${symbols}`);
              if (res.ok) {
                const liveData = await res.json();
                const enriched = portData.map(dbA => {
                  const live = liveData.find((l: any) => l.symbol === dbA.symbol) || {};
                  return {
                    ...dbA,
                    price: live.price || 0,
                    change: live.change || 0,
                    changePercent: live.changePercent || 0,
                    shares: dbA.shares || 0,
                    average_price: dbA.average_price || 0
                  };
                });
                setPortfolioList(enriched);
              } else {
                setPortfolioList(portData.map(a => ({ ...a, price: 0, change: 0, changePercent: 0, shares: a.shares || 0, average_price: a.average_price || 0 })));
              }
            } catch (err) {
              console.error("Error fetching live portfolio data:", err);
              setPortfolioList(portData.map(a => ({ ...a, price: 0, change: 0, changePercent: 0, shares: a.shares || 0, average_price: a.average_price || 0 })));
            }
          } else {
            setPortfolioList([]);
          }
        } else {
          setPortfolioList([]);
        }
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [user, isAuthenticated, supabase]);

  // Portfolio calculations
  const totalValue = portfolioList.reduce((sum, a) => sum + ((a.price || 0) * (a.shares || 0)), 0);
  
  let hasShares = false;
  portfolioList.forEach(a => { if ((a.shares || 0) > 0) hasShares = true; });
  let totalChange = 0;

  if (hasShares) {
    let prevTotalValue = 0;
    let totalAbsoluteChange = 0;
    portfolioList.forEach(a => {
      const shares = a.shares || 0;
      if (shares > 0) {
        const currentPosValue = (a.price || 0) * shares;
        const prevPrice = (a.price || 0) - (a.change || 0);
        const prevPosValue = prevPrice * shares;
        prevTotalValue += prevPosValue;
        totalAbsoluteChange += (a.change || 0) * shares;
      }
    });
    totalChange = prevTotalValue > 0 ? (totalAbsoluteChange / prevTotalValue) * 100 : 0;
  } else {
    totalChange = portfolioList.length > 0 
      ? portfolioList.reduce((sum, a) => sum + (a.changePercent || 0), 0) / portfolioList.length 
      : 0;
  }

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
              timestamp: new Date(),
              model: selectedModel === "fast" ? "deepseek" : "grok",
              toolInvocations: message.toolInvocations || m.toolInvocations,
              citations: citationsList,
              reasoning: reasoningText || m.reasoning || undefined,
              reasoningSteps: agentReportsData.length > 0 ? agentReportsData : m.reasoningSteps || undefined,
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
    const isWB = useWebBuilderStore.getState().isWebBuilderMode
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
    if (!isWebBuilderMode || !aiLoading) return
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
      const newFiles = actionsToFiles(artifact.actions)
      const store = useWebBuilderStore.getState()
      // Merge with existing files (preserving index.tsx etc)
      const merged = { ...store.files, ...newFiles }
      store.setFiles(merged)
    }
  }, [aiMessages, aiLoading, isWebBuilderMode])

  // ── Render ──
  const chatContent = (
    <div className="flex flex-col h-full relative flex-1">
      <div className="flex flex-col h-full relative">
        {/* Main content area */}
        {!hasMessages && !isMobile ? (
          /* Landing view - center content with prompt suggestions */
          <div className="flex-1 flex flex-col items-center justify-between md:justify-center px-4 pt-16 relative h-full">
            {/* Top Navigation Sections */}
            <div className="absolute top-6 inset-x-0 hidden md:flex items-center justify-center gap-2 text-sm font-semibold z-30 select-none">
              
              {/* NOTICIAS MENU */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('noticias')}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/noticias" className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors py-2 px-3.5 rounded-full hover:bg-secondary/50 flex items-center gap-1",
                  activeMenu === 'noticias' && "text-foreground bg-secondary/80"
                )}>
                  Noticias
                </Link>
                
                <AnimatePresence>
                  {activeMenu === 'noticias' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[360px] bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 font-sans text-left"
                    >
                      <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-white/5 pb-2">
                        <h4 className="text-[10px] font-black tracking-widest text-[#1890FF] uppercase">Noticias Destacadas</h4>
                        <span className="text-[9px] bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded-full animate-pulse">EN VIVO</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        {newsList.length > 0 ? (
                          newsList.map((art) => (
                            <Link 
                              key={art.id} 
                              href={`/article/${art.slug || art.id}`}
                              className="group flex items-start gap-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] transition-all duration-200"
                            >
                              <img 
                                src={art.image_url || getFallbackImage(art.category || art.feed_tag || 'general')} 
                                alt="" 
                                className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-slate-800 border border-gray-200/50 dark:border-white/5" 
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-[#1890FF] transition-colors">
                                  {art.title}
                                </p>
                                <span className="text-[10px] text-muted-foreground mt-1 block">
                                  {art.source_name || "Bloomberg"} • {fmtDate(art.published_at)}
                                </span>
                              </div>
                            </Link>
                          ))
                         ) : (
                           <div className="flex flex-col gap-2.5 py-1">
                             {[1, 2, 3].map((i) => (
                               <div key={i} className="flex items-start gap-3 p-2 rounded-xl relative overflow-hidden">
                                 <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] shrink-0" />
                                 <div className="flex-1 space-y-2 py-0.5">
                                   <div className="h-3.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-full" />
                                   <div className="h-3.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-[85%]" />
                                   <div className="h-2.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-[35%] mt-2" />
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                      
                      <Link href="/noticias" className="text-center text-[10px] font-bold text-[#1890FF] hover:underline pt-2 border-t border-gray-100 dark:border-white/5">
                        Ver todas las noticias →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* MERCADOS MENU */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('mercados')}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/mercados" className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors py-2 px-3.5 rounded-full hover:bg-secondary/50 flex items-center gap-1",
                  activeMenu === 'mercados' && "text-foreground bg-secondary/80"
                )}>
                  Mercados
                </Link>
                
                <AnimatePresence>
                  {activeMenu === 'mercados' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 font-sans text-left"
                    >
                      <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-white/5 pb-2">
                        <h4 className="text-[10px] font-black tracking-widest text-[#1890FF] uppercase">Resumen de Mercados</h4>
                        <span className="text-[9px] text-green-500 font-bold">MERCADOS ABIERTOS</span>
                      </div>
                                     <div className="flex flex-col gap-1">
                        {[
                          { symbol: "S&P 500", name: "Índice Standard & Poor's", price: "5,342.87", change: "+0.45%", isUp: true, logo: "SPY" },
                          { symbol: "NVDA", name: "NVIDIA Corporation", price: "$1,208.50", change: "+2.15%", isUp: true, logo: "NVDA" },
                          { symbol: "BTC", name: "Bitcoin / Dólar", price: "$68,420.00", change: "-1.20%", isUp: false, logo: "BTC" },
                          { symbol: "TSLA", name: "Tesla Motors", price: "$177.46", change: "-0.85%", isUp: false, logo: "TSLA" }
                        ].map((asset) => (
                          <Link 
                            key={asset.symbol}
                            href={`/mercados/${asset.symbol}`}
                            className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] border border-transparent hover:border-gray-200/50 dark:hover:border-white/5 transition-all duration-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <StockLogo symbol={asset.logo} className="w-8 h-8" />
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#1890FF] transition-colors">{asset.symbol}</span>
                                <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[130px]">{asset.name}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-bold text-gray-900 dark:text-white tabular-nums">{asset.price}</span>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-lg tabular-nums flex items-center gap-0.5",
                                asset.isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                              )}>
                                {asset.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {asset.change}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                      
                      <Link href="/mercados" className="text-center text-[10px] font-bold text-[#1890FF] hover:underline pt-2 border-t border-gray-100 dark:border-white/5">
                        Explorar todos los mercados →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* PORTAFOLIO MENU */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('portafolio')}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/portafolio" className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors py-2 px-3.5 rounded-full hover:bg-secondary/50 flex items-center gap-1",
                  activeMenu === 'portafolio' && "text-foreground bg-secondary/80"
                )}>
                  Portafolio
                </Link>
                
                <AnimatePresence>
                  {activeMenu === 'portafolio' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[340px] bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 font-sans text-left"
                    >
                      <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-white/5 pb-2">
                        <div className="flex flex-col">
                          <h4 className="text-[10px] font-black tracking-widest text-[#1890FF] uppercase">Mi Inversión</h4>
                          {isAuthenticated && portfolioList.length > 0 && (
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white mt-0.5">
                              ${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                        {isAuthenticated && portfolioList.length > 0 && (
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                            totalChange >= 0 
                              ? "text-green-500 bg-green-500/10" 
                              : "text-red-500 bg-red-500/10"
                          )}>
                            {totalChange >= 0 ? "+" : ""}{totalChange.toFixed(2)}%
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        {!isAuthenticated ? (
                          <div className="text-center py-4 px-2">
                            <Briefcase className="w-10 h-10 text-[#1890FF]/25 mx-auto mb-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-normal">
                              Inicia sesión para sincronizar tus activos y analizar tus retornos.
                            </p>
                            <Button 
                              onClick={() => { setActiveMenu(null); openModal("login"); }}
                              className="w-full h-8 rounded-xl bg-[#1890FF] text-white hover:bg-[#1890FF]/90 text-xs font-bold shadow-md shadow-[#1890FF]/15 cursor-pointer"
                            >
                              Iniciar Sesión
                            </Button>
                          </div>
                         ) : loadingData ? (
                            <div className="flex flex-col gap-2.5 py-1">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-xl relative overflow-hidden">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] shrink-0" />
                                    <div className="flex flex-col gap-1.5">
                                      <div className="w-12 h-3.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                                      <div className="w-20 h-2 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                                    </div>
                                  </div>
                                  <div className="w-14 h-4 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded" />
                                 </div>
                              ))}
                            </div>
                         ) : portfolioList.length > 0 ? (
                          <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto pr-1">
                            {portfolioList.map((asset) => (
                              <Link 
                                key={asset.id}
                                href={`/mercados/${asset.symbol}`}
                                className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] transition-all duration-200"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <StockLogo symbol={asset.symbol} className="w-8 h-8" />
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#1890FF] transition-colors">{asset.symbol}</span>
                                    <span className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[120px]">{asset.company_name}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  <span className="text-xs font-semibold text-gray-900 dark:text-white tabular-nums">
                                    {(asset.shares || 0) > 0 
                                      ? `$${((asset.shares || 0) * (asset.price || 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : `$${(asset.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                  </span>
                                  <span className={cn(
                                    "text-[9px] font-semibold mt-0.5 tabular-nums",
                                    (asset.changePercent || 0) >= 0 ? "text-green-500" : "text-red-500"
                                  )}>
                                    {(asset.changePercent || 0) >= 0 ? "+" : ""}{(asset.changePercent || 0).toFixed(2)}%
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 px-2">
                            <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 leading-normal">
                              Tu portafolio está vacío. Agrega tus acciones para seguir su rendimiento.
                            </p>
                            <Link 
                              href="/portafolio" 
                              onClick={() => setActiveMenu(null)}
                              className="w-full flex items-center justify-center h-8 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all"
                            >
                              Administrar Portafolio
                            </Link>
                          </div>
                        )}
                      </div>
                      
                      {isAuthenticated && portfolioList.length > 0 && (
                        <Link href="/portafolio" onClick={() => setActiveMenu(null)} className="text-center text-[10px] font-bold text-[#1890FF] hover:underline pt-2 border-t border-gray-100 dark:border-white/5">
                          Ver portafolio completo →
                        </Link>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* MUNDO MENU */}
              <div 
                className="relative"
                onMouseEnter={() => handleMouseEnter('mundo')}
                onMouseLeave={handleMouseLeave}
              >
                <Link href="/mundo" className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors py-2 px-3.5 rounded-full hover:bg-secondary/50 flex items-center gap-1",
                  activeMenu === 'mundo' && "text-foreground bg-secondary/80"
                )}>
                  Mundo
                </Link>
                
                <AnimatePresence>
                  {activeMenu === 'mundo' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[360px] bg-white/95 dark:bg-[#0B1329]/95 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 shadow-2xl z-50 flex flex-col gap-3 font-sans text-left"
                    >
                      <div className="flex items-center justify-between px-1 border-b border-gray-100 dark:border-white/5 pb-2">
                        <h4 className="text-[10px] font-black tracking-widest text-[#1890FF] uppercase">Noticias por Región</h4>
                        <span className="text-[9px] text-[#1890FF] font-bold">LATINOAMÉRICA</span>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        {worldNewsList.length > 0 ? (
                          worldNewsList.map((art) => {
                            const countryConfig = COUNTRY_MAP[art.feed_tag || ''];
                            return (
                              <Link 
                                key={art.id} 
                                href={`/article/${art.slug || art.id}`}
                                className="group flex items-start gap-3 p-2 rounded-xl hover:bg-gray-100/70 dark:hover:bg-white/[0.03] transition-all duration-200"
                              >
                                <img 
                                  src={art.image_url || getFallbackImage(art.category || art.feed_tag || 'general')} 
                                  alt="" 
                                  className="w-12 h-12 rounded-lg object-cover shrink-0 bg-gray-100 dark:bg-slate-800 border border-gray-200/50 dark:border-white/5" 
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                    {countryConfig && (
                                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-[#1890FF]/10 text-[#1890FF] px-1.5 py-0.5 rounded-full uppercase leading-none">
                                        <span>{countryConfig.flag}</span>
                                        <span>{countryConfig.name}</span>
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug group-hover:text-[#1890FF] transition-colors">
                                    {art.title}
                                  </p>
                                  <span className="text-[10px] text-muted-foreground mt-1 block">
                                    {art.source_name || "Mundo"} • {fmtDate(art.published_at)}
                                  </span>
                                </div>
                              </Link>
                            );
                          })
                         ) : (
                           <div className="flex flex-col gap-2.5 py-1">
                             {[1, 2, 3].map((i) => (
                               <div key={i} className="flex items-start gap-3 p-2 rounded-xl relative overflow-hidden">
                                 <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] shrink-0" />
                                 <div className="flex-1 space-y-2 py-0.5">
                                   <div className="h-3 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-[30%]" />
                                   <div className="h-3.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-full" />
                                   <div className="h-2.5 bg-gradient-to-r from-muted via-muted/65 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] rounded-md w-[40%] mt-2" />
                                 </div>
                               </div>
                             ))}
                           </div>
                         )}
                      </div>
                      
                      <Link href="/mundo" className="text-center text-[10px] font-bold text-[#1890FF] hover:underline pt-2 border-t border-gray-100 dark:border-white/5">
                        Explorar el mapa global →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

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
