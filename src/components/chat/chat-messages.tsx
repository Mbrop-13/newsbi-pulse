"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Bot, User, ThumbsUp, ThumbsDown, Share2, RefreshCw, ChevronRight, ChevronDown, Sparkles, Loader2, Globe, ExternalLink, X, ArrowDown, CheckCircle2, XCircle, Clock, Cpu, ClipboardList, FileCode2, Maximize2, Info, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage } from "@/lib/stores/ai-chat-store"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
import { stripArtifactXml } from "@/lib/webbuilder-parser"
import { PortfolioSummaryCard } from "@/components/assistant/portfolio-summary-card"
import { StockAnalysisCard } from "@/components/assistant/stock-analysis-card"
import { AnalyzedNewsCard } from "@/components/assistant/analyzed-news-card"
import { AIChartCard } from "@/components/assistant/ai-chart-card"
import { PriceAlertCard } from "@/components/assistant/price-alert-card"
import { motion, AnimatePresence } from "framer-motion"
import { WebPreview, WebPreviewNavigation, WebPreviewUrl, WebPreviewBody } from "@/components/ai/web-preview"

interface ChatMessagesProps {
  messages: ChatMessage[]
  isLoading: boolean
  streamData?: any[]
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike' | null) => void
  onRetry?: () => void
  onShare?: (question: string, answer: string) => void
  messageFeedback?: Record<string, 'like' | 'dislike'>
  openReasoning?: Record<string, boolean>
  onToggleReasoning?: (id: string) => void
}

export function ChatMessages({
  messages,
  isLoading,
  streamData,
  onFeedback,
  onRetry,
  onShare,
  messageFeedback = {},
  openReasoning = {},
  onToggleReasoning,
}: ChatMessagesProps) {
  const { isWebBuilderMode } = useWebBuilderStore()

  // Extract live streaming data for WebBuilder loading indicator
  const liveReasoning = useMemo(() => {
    if (!streamData || streamData.length === 0) return "";
    const reasoningChunks = streamData.filter((d: any) => d?.type === 'reasoning');
    return reasoningChunks.map(c => c.text).join('');
  }, [streamData]);

  const liveAgentReports = useMemo(() => {
    if (!streamData || streamData.length === 0) return [];
    const reportsObj = streamData.find((d: any) => d?.type === 'agentReports');
    return reportsObj?.reports || [];
  }, [streamData]);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const isAtBottomRef = useRef(true)

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    const isAtB = el.scrollHeight - el.scrollTop - el.clientHeight < 150
    isAtBottomRef.current = isAtB
    setShowScrollButton(!isAtB)
  }

  // Auto-scroll to bottom on new messages
  const lastMessageContent = messages[messages.length - 1]?.content || '';
  const messagesCount = messages.length;

  useEffect(() => {
    if (isAtBottomRef.current) {
      // Use requestAnimationFrame to avoid sudden jumps while layout shifts
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      });
    }
  }, [messagesCount, lastMessageContent, isLoading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    isAtBottomRef.current = true
    setShowScrollButton(false)
  }

  return (
    <div className="relative flex flex-col flex-1 min-h-0 w-full h-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn(
          "flex-1 overflow-y-auto scrollbar-hide w-full",
          isWebBuilderMode ? "pl-5 pr-3" : "px-4 md:px-6"
        )}
      >
        <div className={cn("pt-16 pb-6 space-y-6", isWebBuilderMode ? "w-full max-w-full" : "max-w-3xl mx-auto")}>
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              feedback={messageFeedback[msg.id]}
              onFeedback={onFeedback}
              onRetry={idx === messages.length - 1 && msg.role === 'assistant' ? onRetry : undefined}
              onShare={onShare}
              isReasoningOpen={openReasoning[msg.id] === true}
              onToggleReasoning={() => onToggleReasoning?.(msg.id)}
              prevMessageContent={idx > 0 ? messages[idx - 1].content : ""}
              streamData={streamData}
              isLast={idx === messages.length - 1}
              isLoading={isLoading}
              isWebBuilderMode={isWebBuilderMode}
            />
          ))}

          {/* Loading indicator */}
          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className={cn("flex flex-col w-full", isWebBuilderMode ? "gap-2 pl-1.5" : "gap-3")}>
              {!isWebBuilderMode ? (
                <div className="flex gap-3">
                  <AssistantAvatar isResponding={true} isWebBuilderMode={isWebBuilderMode} />
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              ) : (
                /* WebBuilder Live Orchestration Loading View */
                <div className="w-full flex-grow flex flex-col gap-3 min-w-0">
                  {/* Title / Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-black dark:text-white">Delegando agentes</span>
                    <div className="flex items-center gap-1 ml-1 shrink-0">
                      <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>

                  {/* Dynamic checklist or planning logs */}
                  {(() => {
                    const steps = parseOrchestrationSteps(liveReasoning);
                    const agentStatuses = getAgentStatuses(steps);
                    const hasAgentSteps = agentStatuses.length > 0;

                    if (hasAgentSteps) {
                      return (
                        <div className="ml-2.5 border-l border-gray-200 dark:border-slate-800 pl-4 space-y-3">
                          {agentStatuses.map((agent, idx) => {
                            const isDone = agent.status === 'done';
                            const isFailed = agent.status === 'failed';
                            const duration = agent.time;

                            return (
                              <div key={idx} className="relative pb-1 last:pb-0">
                                {/* Timeline dot */}
                                <div className={cn(
                                  "absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a0a0a]",
                                  isFailed ? "bg-red-500" : isDone ? "bg-black dark:bg-white" : "bg-amber-500 animate-pulse"
                                )} />

                                {/* Agent header */}
                                <div className="flex items-center gap-2 w-full text-left">
                                  <span className="text-[11px] font-bold text-foreground">
                                    {agent.agentName}
                                  </span>
                                  <span className="text-[10px] text-[#1890FF] font-medium">
                                    {agent.role}
                                  </span>
                                  {duration && (
                                    <span className="text-[9px] text-muted-foreground/60 font-mono">
                                      {duration}
                                    </span>
                                  )}
                                  {isFailed ? (
                                    <XCircle className="w-3 h-3 text-red-500 ml-auto shrink-0" />
                                  ) : isDone ? (
                                    <CheckCircle2 className="w-3 h-3 text-black dark:text-white ml-auto shrink-0" />
                                  ) : (
                                    <Loader2 className="w-3 h-3 text-amber-500 ml-auto shrink-0 animate-spin" />
                                  )}
                                </div>

                                {/* Task description */}
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                                  {agent.task}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (liveReasoning) {
                      return (
                        <div className="mb-2">
                          <div className="pl-3.5 border-l-2 border-[#1890FF]/30 text-[12.5px] text-muted-foreground/80 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-hide py-1">
                            {liveReasoning}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <AnimatePresence>
        {showScrollButton && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className={cn(
              "absolute bottom-6 z-50 w-10 h-10 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer border border-black/10 dark:border-white/10 active:scale-95",
              isWebBuilderMode ? "right-6" : "right-6 md:right-12"
            )}
            title="Ir al final"
          >
            <ArrowDown className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Parse orchestration log lines from reasoning text ───
interface ParsedAgentStep {
  type: 'orchestrator' | 'agent_start' | 'agent_done' | 'agent_fail' | 'info';
  agentName?: string;
  role?: string;
  task?: string;
  time?: string;
  text: string;
}

function parseOrchestrationSteps(text: string): ParsedAgentStep[] {
  if (!text) return [];
  const lines = text.split('\n').filter(l => l.trim());
  const steps: ParsedAgentStep[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Agent starting (Format 1 & 2)
    const startMatch1 = trimmed.match(/⏳\s*\[Agente\]\s*(.+?)\s*\((.+?)\)\s*iniciando tarea:\s*"?(.+?)"?\.{0,3}$/);
    const startMatch2 = trimmed.match(/⏳\s*\[Agente\]\s*(.+?)\s*\((.+?)\)\s*generando\/actualizando\s*`?(.+?)`?\.{0,3}$/);
    if (startMatch1) {
      steps.push({ type: 'agent_start', agentName: startMatch1[1], role: startMatch1[2], task: startMatch1[3], text: trimmed });
      continue;
    }
    if (startMatch2) {
      steps.push({ type: 'agent_start', agentName: startMatch2[1], role: startMatch2[2], task: `Generando/actualizando ${startMatch2[3]}`, text: trimmed });
      continue;
    }
    
    // Agent completed (Format 1 & 2)
    const doneMatch1 = trimmed.match(/✅\s*\[Agente\]\s*(.+?)\s*completado en\s*(\d+)ms/);
    const doneMatch2 = trimmed.match(/✅\s*\[Agente\]\s*(.+?)\s*completó la edición de\s*`?(.+?)`?\s*en\s*(\d+)ms/);
    if (doneMatch1) {
      steps.push({ type: 'agent_done', agentName: doneMatch1[1], time: `${(parseInt(doneMatch1[2]) / 1000).toFixed(1)}s`, text: trimmed });
      continue;
    }
    if (doneMatch2) {
      steps.push({ type: 'agent_done', agentName: doneMatch2[1], time: `${(parseInt(doneMatch2[3]) / 1000).toFixed(1)}s`, text: trimmed });
      continue;
    }
    
    // Agent failed (Format 1 & 2)
    const failMatch = trimmed.match(/❌\s*\[Agente\]\s*(.+?)\s*falló/);
    if (failMatch) {
      steps.push({ type: 'agent_fail', agentName: failMatch[1], text: trimmed });
      continue;
    }
    
    // Orchestrator message
    if (trimmed.includes('[Orquestador]') || trimmed.includes('[Orquestador WebBuilder]')) {
      steps.push({ type: 'orchestrator', text: trimmed.replace(/🧠|🔍|📊|✅/g, '').replace(/\[Orquestador\s*WebBuilder\]|\[Orquestador\]/g, '').trim() });
      continue;
    }
    
    // Creating agents line
    if (trimmed.includes('Creando') && trimmed.includes('agentes')) {
      steps.push({ type: 'orchestrator', text: trimmed.replace(/🤖/g, '').trim() });
      continue;
    }
    
    // Generic info line
    if (trimmed.length > 0) {
      steps.push({ type: 'info', text: trimmed });
    }
  }
  
  return steps;
}

interface AgentStatus {
  agentName: string;
  role: string;
  task: string;
  status: 'pending' | 'done' | 'failed';
  time?: string;
}

function getAgentStatuses(steps: ParsedAgentStep[]): AgentStatus[] {
  const agentsMap = new Map<string, AgentStatus>();
  
  for (const step of steps) {
    if (step.type === 'agent_start' && step.agentName) {
      agentsMap.set(step.agentName, {
        agentName: step.agentName,
        role: step.role || '',
        task: step.task || '',
        status: 'pending'
      });
    } else if (step.type === 'agent_done' && step.agentName) {
      const existing = agentsMap.get(step.agentName);
      if (existing) {
        existing.status = 'done';
        existing.time = step.time;
      } else {
        agentsMap.set(step.agentName, {
          agentName: step.agentName,
          role: '',
          task: '',
          status: 'done',
          time: step.time
        });
      }
    } else if (step.type === 'agent_fail' && step.agentName) {
      const existing = agentsMap.get(step.agentName);
      if (existing) {
        existing.status = 'failed';
      } else {
        agentsMap.set(step.agentName, {
          agentName: step.agentName,
          role: '',
          task: '',
          status: 'failed'
        });
      }
    }
  }
  
  return Array.from(agentsMap.values());
}


function MessageBubble({
  message,
  feedback,
  onFeedback,
  onRetry,
  onShare,
  isReasoningOpen,
  onToggleReasoning,
  prevMessageContent,
  streamData,
  isLast,
  isLoading,
  isWebBuilderMode,
}: {
  message: ChatMessage
  feedback?: 'like' | 'dislike'
  onFeedback?: (messageId: string, feedback: 'like' | 'dislike' | null) => void
  onRetry?: () => void
  onShare?: (question: string, answer: string) => void
  isReasoningOpen: boolean
  onToggleReasoning: () => void
  prevMessageContent: string
  streamData?: any[]
  isLast: boolean
  isLoading: boolean
  isWebBuilderMode?: boolean
}) {
  const isUser = message.role === "user"
  const [isCitationsOpen, setIsCitationsOpen] = useState(false)
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(false)
  const [expandedReportIdx, setExpandedReportIdx] = useState<number | null>(null)
  const [isPlanExpanded, setIsPlanExpanded] = useState(true)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const setSelectedTab = useWebBuilderStore((s) => s.setSelectedTab)
  
  const [localReasoningOpen, setLocalReasoningOpen] = useState(isReasoningOpen || (isLast && isLoading))
  const hasManuallyToggledRef = useRef(false)

  // Keep reasoning open during streaming unless the user manually toggles it
  useEffect(() => {
    if (isLast && isLoading && !hasManuallyToggledRef.current) {
      setLocalReasoningOpen(true)
    }
  }, [isLast, isLoading])

  // Sync with prop when streaming is done
  useEffect(() => {
    if (!isLoading) {
      setLocalReasoningOpen(isReasoningOpen)
    }
  }, [isReasoningOpen, isLoading])

  // Check citations
  let citationsList: string[] = message.citations || []
  if (citationsList.length === 0 && isLast && streamData && streamData.length > 0) {
    const sdCitation = (streamData as any[]).find((d: any) => d?.type === 'citations')
    if (sdCitation?.urls) {
      citationsList = sdCitation.urls
    }
  }
  const hasCitations = citationsList.length > 0

  // Render tool result cards (AFTER text now)
  const renderToolResults = () => {
    // 1. Render from traditional toolResults
    const traditionalCards = message.toolResults?.map((tr, i) => {
      switch (tr.tool) {
        case 'portfolio':
          return <PortfolioSummaryCard key={`tr-port-${i}`} result={tr.data} />
        case 'stock_info':
          return <StockAnalysisCard key={`tr-stock-${i}`} toolName="analyze_stock" result={tr.data} />
        case 'news':
          return <AnalyzedNewsCard key={`tr-news-${i}`} toolName="get_news" result={tr.data} />
        case 'alerts':
          return <PriceAlertCard key={`tr-alert-${i}`} result={tr.data} />
        default:
          return null
      }
    }) || []

    // 2. Render from Vercel AI SDK toolInvocations (from new messages)
    const sdkCards = message.toolInvocations?.map((inv: any, i: number) => {
      if (inv.state !== 'result') {
        return (
          <div key={inv.toolCallId || `loading-tool-${i}`} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 text-blue-500 rounded-xl text-xs font-bold w-fit animate-pulse border border-blue-500/20 my-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Analizando datos...
          </div>
        );
      }
      
      switch (inv.toolName) {
        case 'get_portfolio_summary':
          return <PortfolioSummaryCard key={`inv-port-${i}`} result={inv.result} />
        case 'analyze_stock':
        case 'compare_stocks':
        case 'screen_market':
        case 'get_sector_performance':
          return <StockAnalysisCard key={`inv-stock-${i}`} toolName={inv.toolName} result={inv.result} />
        case 'render_chart':
          return <AIChartCard key={`inv-chart-${i}`} result={inv.result} />
        case 'create_price_alert':
          return <PriceAlertCard key={`inv-alert-${i}`} result={inv.result} />
        case 'run_python':
          return <PythonResultCard key={`inv-python-${i}`} args={inv.args} result={inv.result} />
        default:
          return null;
      }
    }) || []

    // Filter out null cards
    const allCards = [...traditionalCards, ...sdkCards].filter(Boolean)
    if (allCards.length === 0) return null

    return <div className="space-y-3 mt-3">{allCards}</div>
  }

  // Render chart cards from tool invocations
  const renderCharts = () => {
    if (!message.toolInvocations?.length) return null
    return (
      <div className="space-y-3 mt-2">
        {message.toolInvocations.map((inv: any, i: number) => {
          if (inv.toolName?.startsWith('chart_') && inv.state === 'result') {
            return <AIChartCard key={i} result={inv.result} />
          }
          return null
        })}
      </div>
    )
  }

  // ─── Render reasoning / thinking steps (elegant design) ───
  const renderReasoning = () => {
    if (!message.reasoning && !message.thinkingSteps?.length) return null
    const content = message.reasoning || message.thinkingSteps?.join('\n') || ''
    if (!content) return null

    return (
      <div className="mb-3">
        <button
          onClick={() => {
            hasManuallyToggledRef.current = true;
            setLocalReasoningOpen(!localReasoningOpen);
            onToggleReasoning();
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group"
        >
          <span>Razonamiento</span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              localReasoningOpen && "rotate-90"
            )}
          />
          {message.secondsElapsed && (
            <span className="text-[10px] opacity-50 font-normal">
              ({message.secondsElapsed}s)
            </span>
          )}
        </button>
        <AnimatePresence>
          {localReasoningOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 pl-3.5 border-l-2 border-black/15 dark:border-white/15 text-[12.5px] text-muted-foreground/80 font-sans whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto scrollbar-hide py-1">
                {content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ─── Render Plan Card ───
  const renderPlanCard = () => {
    let plan = message.pendingPlan;

    // Fallback to active store plan during streaming or on direct entry
    if (!plan && isLast) {
      if (streamData && streamData.length > 0) {
        const planObj = (streamData as any[]).find((d: any) => d?.type === 'plan');
        if (planObj?.agents && planObj.agents.length > 0) {
          plan = {
            planId: planObj.planId || `plan-${Date.now()}`,
            reason: planObj.reason || "",
            agents: planObj.agents
          };
        }
      }
      if (!plan) {
        const storePlan = useWebBuilderStore.getState().pendingPlan;
        if (storePlan) {
          plan = {
            planId: storePlan.planId,
            reason: storePlan.reason,
            agents: storePlan.agents
          };
        }
      }
    }

    if (!plan || !plan.agents || plan.agents.length === 0) return null;

    return (
      <div className="mb-3">
        {/* Contenedor de la tarjeta del plan (clickeable → expande/colapsa en chat) */}
        <div
          onClick={() => setIsPlanExpanded(!isPlanExpanded)}
          className="rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 p-4 cursor-pointer hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300 select-none flex flex-col gap-3 group"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#1890FF]/10 text-[#1890FF] flex items-center justify-center shrink-0 border border-[#1890FF]/10">
                <ClipboardList className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">
                Plan de construcción
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlanModalOpen(true);
                }}
                title="Expandir vista completa"
                className="w-7 h-7 rounded-lg hover:bg-gray-150/50 dark:hover:bg-white/5 flex items-center justify-center text-muted-foreground/70 hover:text-foreground border border-transparent hover:border-gray-200/50 dark:hover:border-white/5 transition-all cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground/50 transition-transform duration-200",
                !isPlanExpanded && "-rotate-90"
              )} />
            </div>
          </div>

          {/* Motivo del plan */}
          {plan.reason && (
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed font-medium line-clamp-2 -mt-0.5 px-0.5">
              {plan.reason}
            </p>
          )}

          {/* Recuento de archivos y estado de expansión */}
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 border-t border-gray-200/30 dark:border-white/5 pt-2 mt-0.5 font-bold uppercase tracking-wider">
            <span>{plan.agents.length} {plan.agents.length === 1 ? "archivo" : "archivos"} planificados</span>
            <span className="text-[#1890FF] tracking-wide font-extrabold">
              {isPlanExpanded ? "Ocultar" : "Ver detalles"}
            </span>
          </div>

          {/* Lista de archivos planificados */}
          <AnimatePresence>
            {isPlanExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden w-full"
                onClick={(e) => e.stopPropagation()} // Previene colapsar si hace clic adentro
              >
                <div className="pt-2.5 space-y-2.5 cursor-default">
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {plan.agents.map((agent: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 px-3 py-2.5 hover:bg-gray-100/50 dark:hover:bg-white/[0.04] transition-colors duration-200"
                      >
                        <FileCode2 className="w-4 h-4 text-[#1890FF] mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-gray-900 dark:text-white truncate">
                              {agent.filePath}
                            </span>
                          </div>
                          <p className="text-[9.5px] font-medium text-muted-foreground mt-0.5 leading-snug">
                            {agent.agentName} · {agent.role}
                          </p>
                          <p className="text-[9.5px] text-muted-foreground/75 mt-0.5 leading-relaxed">
                            {agent.task}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pista de acción para el usuario */}
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2.5 mt-1">
                    <p className="text-[9.5px] text-amber-800 dark:text-amber-300 leading-relaxed font-semibold">
                      Escribe <span className="font-extrabold">aprobado</span> para construir, <span className="font-extrabold">no</span> para cancelar, o describe los cambios.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal View */}
        <AnimatePresence>
          {isPlanModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
              onClick={() => setIsPlanModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                transition={{ type: "spring", damping: 25, stiffness: 350 }}
                className="relative w-full max-w-[540px] max-h-[82vh] flex flex-col rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4.5 border-b border-gray-200/60 dark:border-white/5 bg-white dark:bg-zinc-950 shrink-0 select-none">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-sm border border-teal-500/10">
                      <ClipboardList className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Plan de Construcción</h3>
                  </div>
                  <button
                    onClick={() => setIsPlanModalOpen(false)}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground/60 hover:text-foreground border border-transparent hover:border-gray-200/50 dark:hover:border-white/5 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-zinc-950 custom-scrollbar">
                  {plan.reason && (
                    <div className="p-4 bg-gray-55/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 rounded-xl shadow-xs">
                      <h4 className="text-[10px] font-extrabold text-[#1890FF] mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                        <Info className="w-3.5 h-3.5" />
                        Objetivo del Plan
                      </h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                        {plan.reason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Archivos y Tareas Planificadas
                    </h4>
                    <div className="space-y-3.5">
                      {plan.agents.map((agent: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 rounded-xl shadow-sm space-y-3 hover:bg-gray-100/[0.15] dark:hover:bg-white/[0.03] transition-colors duration-200">
                          <div className="flex items-center justify-between border-b border-gray-200/40 dark:border-white/5 pb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCode2 className="w-4 h-4 text-[#1890FF] shrink-0" />
                              <span className="text-xs font-mono font-bold text-gray-900 dark:text-white truncate">
                                {agent.filePath}
                              </span>
                            </div>
                            <span className="text-[9px] font-extrabold text-teal-650 dark:text-teal-400 uppercase tracking-wider bg-teal-500/10 dark:bg-teal-500/5 border border-teal-500/10 px-2 py-0.5 rounded-full shrink-0">
                              {agent.agentName}
                            </span>
                          </div>
                          <div className="text-xs space-y-2">
                            <div>
                              <span className="text-[9px] font-extrabold text-muted-foreground/75 uppercase tracking-wider block mb-0.5">Rol</span>
                              <span className="text-gray-800 dark:text-gray-200 text-xs font-semibold">{agent.role}</span>
                            </div>
                            <div>
                              <span className="text-[9px] font-extrabold text-muted-foreground/75 uppercase tracking-wider block mb-0.5">Tarea específica</span>
                              <p className="text-muted-foreground text-xs leading-relaxed font-medium">{agent.task}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-center">
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-semibold">
                      Escribe <span className="font-extrabold">aprobado</span> en el chat para ejecutar, <span className="font-extrabold">no</span> para cancelar, o describe tus cambios.
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-gray-50/50 dark:bg-zinc-950/80 border-t border-gray-200/60 dark:border-white/5 flex justify-end shrink-0">
                  <button
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black rounded-full text-xs font-extrabold cursor-pointer transition-all shadow-md hover:scale-[1.02] active:scale-95"
                  >
                    Cerrar Vista
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderAgentReports = () => {
    let reports = message.reasoningSteps;
    if ((!reports || reports.length === 0) && isLast && isLoading && streamData) {
      const reportsObj = streamData.find((d: any) => d?.type === 'agentReports');
      reports = reportsObj?.reports || [];
    }

    if (!reports || reports.length === 0) return null;

    const successCount = reports.filter((r: any) => r.success !== false && (r.content || r.success)).length;
    const totalTime = reports.reduce((acc: number, r: any) => acc + (r.durationMs || 0), 0);

    return (
      <div className="mb-3">
        {/* Toggle Header */}
        <button
          onClick={() => setIsAgentsExpanded(!isAgentsExpanded)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            {reports.length} Agentes Especializados
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-normal">
            {successCount}/{reports.length} completados {totalTime > 0 && `· ${(totalTime / 1000).toFixed(1)}s`}
          </span>
          <ChevronDown className={cn(
            "w-3 h-3 text-muted-foreground/50 transition-transform duration-200 ml-auto",
            !isAgentsExpanded && "-rotate-90"
          )} />
        </button>

        {/* Expanded Timeline */}
        <AnimatePresence>
          {isAgentsExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="mt-2.5 ml-2.5 border-l border-gray-200 dark:border-slate-800 pl-4 space-y-0">
                {reports.map((report: any, idx: number) => {
                  const isSuccess = report.success !== false;
                  const isDone = report.content && report.success;
                  const isFailed = report.success === false || (report.content && !report.success);
                  const isExpanded = expandedReportIdx === idx;
                  const duration = report.durationMs ? `${(report.durationMs / 1000).toFixed(1)}s` : null;

                  return (
                    <div key={idx} className="relative pb-3 last:pb-0">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a0a0a]",
                        isFailed ? "bg-red-500" : isDone ? "bg-black dark:bg-white" : "bg-amber-500 animate-pulse"
                      )} />

                      {/* Agent header */}
                      <button
                        onClick={() => {
                          if (isDone || isFailed) {
                            setExpandedReportIdx(isExpanded ? null : idx);
                          }
                        }}
                        className="flex items-center gap-2 w-full text-left group/agent"
                      >
                        <span className="text-[11px] font-bold text-foreground">
                          {report.agentName}
                        </span>
                        <span className="text-[10px] text-[#1890FF] font-medium">
                          {report.role}
                        </span>
                        {duration && (
                          <span className="text-[9px] text-muted-foreground/60 font-mono">
                            {duration}
                          </span>
                        )}
                        {isFailed ? (
                          <XCircle className="w-3 h-3 text-red-500 ml-auto shrink-0" />
                        ) : isDone ? (
                          <CheckCircle2 className="w-3 h-3 text-black dark:text-white ml-auto shrink-0" />
                        ) : (
                          <Loader2 className="w-3 h-3 text-amber-500 ml-auto shrink-0 animate-spin" />
                        )}
                        {(isDone || isFailed) && (
                          <ChevronRight className={cn(
                            "w-3 h-3 text-muted-foreground/40 transition-transform duration-200 shrink-0",
                            isExpanded && "rotate-90"
                          )} />
                        )}
                      </button>

                      {/* Task description */}
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {report.task}
                      </p>

                      {/* Expanded report content */}
                      <AnimatePresence>
                        {isExpanded && (isDone || isFailed) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-2 bg-muted/40 border border-gray-100 dark:border-slate-800/60 rounded-xl p-3 text-[11px] text-foreground/80 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto scrollbar-hide">
                              {report.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className={cn(isWebBuilderMode ? "max-w-[95%]" : "max-w-[85%] md:max-w-[75%]")}>
          <div className={cn(
            "bg-secondary dark:bg-secondary text-sm",
            isWebBuilderMode ? "rounded-2xl px-3 py-2" : "rounded-3xl px-4 py-3"
          )}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  const isResponding = isLast && isLoading;

  // ─── Swarm thinking / Agent Orchestration in progress ───
  const isAgentOrchestrating = (message as any).isSwarmThinking || (isLast && isLoading && message.reasoning && !message.content);
  
  if (isAgentOrchestrating) {
    const steps = parseOrchestrationSteps(message.reasoning || message.content || '');
    const agentStatuses = getAgentStatuses(steps);
    const hasAgentSteps = agentStatuses.length > 0;

    return (
      <div className={cn("flex", isWebBuilderMode ? "gap-2 pl-1.5" : "gap-3")}>
        {!isWebBuilderMode && <AssistantAvatar isResponding={isResponding} isWebBuilderMode={isWebBuilderMode} />}
        <div className="flex-1 min-w-0">
          {/* Orchestrator header */}
          <div className="flex items-center gap-2 mb-3">
            {isWebBuilderMode ? (
              <>
                <span className="text-xs font-bold text-black dark:text-white">Delegando agentes</span>
                <div className="flex items-center gap-1 ml-1 shrink-0">
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-md bg-[#1890FF]/10 flex items-center justify-center shrink-0">
                  <Cpu className="w-3 h-3 text-[#1890FF] animate-pulse" />
                </div>
                <span className="text-xs font-semibold text-[#1890FF]">Orquestador analizando</span>
                <div className="flex items-center gap-1 ml-1 shrink-0">
                  <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </>
            )}
          </div>

          {hasAgentSteps ? (
            /* Timeline view for agent orchestration */
            <div className={cn(
              "ml-2.5 pl-4 border-l",
              isWebBuilderMode ? "border-gray-200 dark:border-slate-800 space-y-3" : "border-[#1890FF]/20 space-y-2"
            )}>
              {agentStatuses.map((agent, idx) => {
                const isDone = agent.status === 'done';
                const isFailed = agent.status === 'failed';
                const duration = agent.time;

                return (
                  <div key={idx} className="relative">
                    {/* Timeline dot */}
                    <div className={cn(
                      "absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a0a0a]",
                      isFailed ? "bg-red-500" : isDone ? "bg-black dark:bg-white" : "bg-amber-500 animate-pulse"
                    )} />
                    
                    <div className="flex items-center gap-1.5">
                      {isFailed ? (
                        <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                      ) : isDone ? (
                        <CheckCircle2 className="w-3 h-3 text-black dark:text-white shrink-0" />
                      ) : (
                        <Loader2 className="w-3 h-3 text-amber-500 shrink-0 animate-spin" />
                      )}
                      <span className="text-[11px] font-bold text-foreground">{agent.agentName}</span>
                      <span className="text-[10px] text-[#1890FF]">{agent.role}</span>
                      {duration && <span className="text-[9px] text-muted-foreground/60 font-mono">{duration}</span>}
                    </div>
                    {agent.task && <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{agent.task}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback: monospace log view */
            <div className="bg-muted/40 border border-gray-100 dark:border-slate-800/40 rounded-xl p-3 text-[11px] font-mono text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto scrollbar-hide leading-relaxed">
              {message.reasoning || message.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Standard Assistant message ───
  return (
    <div className={cn("flex group", isWebBuilderMode ? "gap-2 pl-1.5" : "gap-3")}>
      {!isWebBuilderMode && <AssistantAvatar isResponding={isResponding} isWebBuilderMode={isWebBuilderMode} />}
      <div className="flex-1 min-w-0">
        {/* 1. Reasoning (expandable) */}
        {renderReasoning()}

        {/* 2. Plan card (modo Plan: pendiente de aprobación) */}
        {renderPlanCard()}

        {/* 3. Agent reports timeline (if any) */}
        {renderAgentReports()}
        
        {/* 3. Main text content */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {isWebBuilderMode ? stripArtifactXml(message.content) : message.content}
            </ReactMarkdown>
          ) : (
            isResponding ? (
              <div className="flex items-center gap-2 py-1.5 text-muted-foreground text-xs font-semibold">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
                <span>Escribiendo respuesta...</span>
              </div>
            ) : (
              !message.toolResults?.length && !message.toolInvocations?.length && !message.reasoning && (
                <div className="flex items-center gap-1 py-1.5">
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )
            )
          )}
        </div>

        {/* 4. Tool results & charts (AFTER text) */}
        {!isWebBuilderMode && renderToolResults()}
        {!isWebBuilderMode && renderCharts()}

        {/* Citations Widget */}
        {hasCitations && (
          <div className="flex flex-col gap-2 mt-3 pt-2">
            <div className="flex items-center flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => {
                  const newOpen = !isCitationsOpen;
                  setIsCitationsOpen(newOpen);
                  if (newOpen && citationsList.length > 0) {
                    setActivePreviewUrl(citationsList[0]);
                  } else {
                    setActivePreviewUrl(null);
                  }
                }}
                className="flex items-center gap-1.5 w-fit pl-1.5 pr-2.5 py-1 bg-white hover:bg-gray-50 dark:bg-[#1A1A1A] dark:hover:bg-[#222] border border-gray-200 dark:border-gray-800 rounded-full transition-all cursor-pointer group shadow-sm mr-1.5"
              >
                <div className="flex -space-x-2">
                  {citationsList.slice(0, 3).map((url: string, i: number) => {
                    let hostname = "globe";
                    try { hostname = new URL(url).hostname; } catch {}
                    return (
                      <div
                        key={i}
                        className="w-[18px] h-[18px] rounded-full border-[1.5px] border-white dark:border-[#0a0a0a] bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center relative bg-white"
                        style={{ zIndex: 3 - i }}
                      >
                        <img 
                          src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                          alt="" 
                          className="w-full h-full object-cover bg-white" 
                          onError={(e) => { e.currentTarget.style.display='none'; }}
                        />
                      </div>
                    );
                  })}
                </div>
                <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                  {citationsList.length} Fuentes
                </span>
              </button>
            </div>

            {/* Expanded Citations Panel */}
            <AnimatePresence initial={false}>
              {isCitationsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-gray-50 dark:bg-slate-800/30 border border-gray-200/60 dark:border-gray-800/60 rounded-xl p-3 flex flex-wrap gap-2">
                    <p className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Fuentes Citadas
                    </p>
                    {citationsList.map((url: string, i: number) => {
                      let hostname = url;
                      try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                      const isSelected = activePreviewUrl === url;
                      return (
                        <div key={i} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActivePreviewUrl(isSelected ? null : url)}
                            className={cn(
                              "flex items-center gap-1.5 text-[11px] py-1 px-2.5 rounded-lg border transition-all shadow-sm select-none",
                              isSelected 
                                ? "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400 font-bold" 
                                : "bg-white hover:bg-gray-50 dark:bg-[#0a0a0a] dark:hover:bg-[#111] border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                            )}
                          >
                            <Globe className={cn("w-3 h-3 shrink-0", isSelected ? "text-[#1890FF]" : "text-gray-400")} />
                            <span className="truncate max-w-[130px]">{hostname}</span>
                          </button>
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center justify-center p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white hover:bg-gray-50 dark:bg-[#0a0a0a] dark:hover:bg-[#111] text-gray-400 hover:text-[#1890FF] transition-colors shadow-sm"
                            title="Abrir en pestaña nueva"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inline Web Preview Iframe Box */}
            <AnimatePresence>
              {activePreviewUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 max-h-[600px] bg-card">
                    <WebPreview defaultUrl={activePreviewUrl} onUrlChange={setActivePreviewUrl}>
                      <WebPreviewNavigation className="flex items-center justify-between p-2 border-b bg-muted/30">
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <WebPreviewUrl className="bg-white dark:bg-[#0a0a0a]" />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-black dark:hover:text-white"
                          onClick={() => setActivePreviewUrl(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </WebPreviewNavigation>
                      <WebPreviewBody />
                    </WebPreview>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) /* Citations closing tag */}

        {/* Actions bar */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onFeedback?.(message.id, feedback === 'like' ? null : 'like')}
            aria-label="Me gusta"
          >
            <ThumbsUp className={cn("h-3.5 w-3.5 transition-colors", feedback === 'like' && "text-black fill-black dark:text-white dark:fill-white")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onFeedback?.(message.id, feedback === 'dislike' ? null : 'dislike')}
            aria-label="No me gusta"
          >
            <ThumbsDown className={cn("h-3.5 w-3.5 transition-colors", feedback === 'dislike' && "text-black fill-black dark:text-white dark:fill-white")} />
          </Button>
          {onRetry && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={onRetry}
              aria-label="Reintentar"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onShare?.(prevMessageContent, message.content)}
            aria-label="Compartir"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const getGoogleFinanceSymbol = (symbol: string): string => {
  const clean = symbol.toUpperCase();
  if (clean.includes('SPXUSD') || clean.includes('SPX') || clean.includes('S&P 500')) {
    return '.INX:INDEXSP';
  }
  if (clean.includes('NDX') || clean.includes('NASDAQ')) {
    return 'NDX:INDEXNASDAQ';
  }
  if (clean.includes('DJI') || clean.includes('DOW')) {
    return '.DJI:INDEXDJX';
  }
  const parts = symbol.split(':');
  const ticker = parts[parts.length - 1];
  if (ticker.endsWith('USDT')) {
    return ticker.replace('USDT', '-USD');
  }
  return ticker;
};

function PythonResultCard({ args, result }: { args: any; result: any }) {
  const [showCode, setShowCode] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 max-w-xl text-left">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-black text-xs">
            PY
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Cálculo Python Ejecutado</h4>
            <p className="text-[10px] text-gray-400">Sandbox de WebAssembly · {result?.durationMs || 0}ms</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCode(!showCode)}
          className="text-xs font-semibold text-[#1890FF] hover:underline"
        >
          {showCode ? "Ocultar Código" : "Ver Código"}
        </button>
      </div>

      {showCode && args?.script && (
        <pre className="text-xs p-3.5 bg-slate-950 text-slate-100 rounded-2xl overflow-x-auto font-mono border border-slate-800 max-h-48">
          <code>{args.script}</code>
        </pre>
      )}

      {result?.success ? (
        <div className="space-y-2">
          {result.stdout && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Consola (stdout)</span>
              <pre className="text-xs p-3 bg-gray-50 dark:bg-slate-950 text-emerald-500 dark:text-emerald-400 rounded-2xl overflow-x-auto font-mono border border-gray-100 dark:border-slate-900">
                <code>{result.stdout}</code>
              </pre>
            </div>
          )}
          {result.output !== undefined && result.output !== null && (
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">Retorno de Función</span>
              <pre className="text-xs p-3 bg-gray-50 dark:bg-slate-950 text-blue-500 dark:text-blue-400 rounded-2xl overflow-x-auto font-mono border border-gray-100 dark:border-slate-900">
                <code>{typeof result.output === 'object' ? JSON.stringify(result.output, null, 2) : String(result.output)}</code>
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[9px] uppercase font-bold text-red-500 tracking-wider">Error de Ejecución</span>
          <pre className="text-xs p-3 bg-red-50 dark:bg-red-500/5 text-red-600 dark:text-red-400 rounded-2xl overflow-x-auto font-mono border border-red-100 dark:border-red-500/10">
            <code>{result?.stderr || result?.error || "Error desconocido en el script."}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

function AssistantAvatar({ isResponding, isWebBuilderMode }: { isResponding: boolean; isWebBuilderMode?: boolean }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isResponding) {
    return (
      <div className={cn(
        "shrink-0 mt-1 flex items-center justify-center rounded-2xl overflow-hidden bg-transparent dark:bg-black",
        isWebBuilderMode ? "h-10 w-10 rounded-xl" : "h-24 w-32"
      )}>
        <video 
          src="/assets/saturn-logo.mp4" 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  const isDark = mounted && resolvedTheme === "dark";
  const imageSrc = isDark
    ? "/assets/Logo 2-Blanco.png"
    : "/assets/Maverlang Logo-2.png";

  return (
    <div className={cn(
      "shrink-0 mt-1 flex items-center justify-center",
      isWebBuilderMode ? "h-10 w-10" : "h-20 w-28"
    )}>
      <img 
        src={imageSrc} 
        alt="Chat Logo" 
        className={cn("object-contain select-none pointer-events-none", isWebBuilderMode ? "w-8 h-8" : "w-12 h-12")}
      />
    </div>
  );
}
