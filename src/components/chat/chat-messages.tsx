"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useTheme } from "next-themes"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Bot, User, ThumbsUp, ThumbsDown, Share2, RefreshCw, ChevronRight, ChevronDown, Sparkles, Loader2, Globe, ExternalLink, X, ArrowDown, CheckCircle2, XCircle, Clock, Cpu, ClipboardList, FileCode2, Maximize2, Info, FolderOpen, Code2, Search, Brain, Plus, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useCanvasStore } from "@/lib/stores/canvas-store"
import { useBrowserStore } from "@/lib/stores/browser-store"
import { CanvasFileCard } from "@/components/chat/canvas-file-card"
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
  const isBrowserOpen = useBrowserStore((s) => s.isOpen)
  const isCanvasOpen = useCanvasStore((s) => s.isOpen)
  const isSplitMode = isWebBuilderMode || isBrowserOpen || isCanvasOpen
  const { isMobile } = useSidebar()

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
        const el = containerRef.current
        if (el) el.scrollTop = el.scrollHeight
      });
    }
  }, [messagesCount, lastMessageContent, isLoading])

  const scrollToBottom = () => {
    const el = containerRef.current
    if (el) el.scrollTop = el.scrollHeight
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
          isSplitMode ? "pl-5 pr-3" : "px-4 md:px-6"
        )}
      >
        <div className={cn("pt-28 md:pt-16 pb-4 md:pb-6 space-y-6", isSplitMode ? "w-full max-w-full" : "max-w-3xl mx-auto")}>
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
            <div className={cn("flex flex-col w-full", (isWebBuilderMode || isSplitMode) ? "gap-2 pl-1.5" : "gap-3")}>
              {!isWebBuilderMode ? (
                <div className="flex gap-3">
                  {/* Use compact avatar (no video) when canvas/browser is open */}
                  {!isSplitMode && !isMobile && <AssistantAvatar isResponding={true} isWebBuilderMode={false} />}
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

// ─── Format citation URL into clean titles and sources ───
function formatCitationSource(url: string) {
  let hostname = "";
  let title = "";
  try {
    const urlObj = new URL(url);
    hostname = urlObj.hostname.replace("www.", "");
    
    // Generate a readable title from the path
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    if (pathSegments.length > 0) {
      const lastSegment = pathSegments[pathSegments.length - 1];
      // Clean extension if present (.html, .php, etc)
      const cleanSegment = lastSegment.replace(/\.[^/.]+$/, "");
      // Replace dashes/underscores with spaces
      title = cleanSegment
        .replace(/[-_]+/g, ' ')
        .trim();
      // Capitalize first letters of each word
      title = title.replace(/\b\w/g, c => c.toUpperCase());
    }
  } catch {
    hostname = url;
  }
  
  // Fallback to hostname if title is too short or empty
  if (!title || title.length < 3) {
    title = hostname;
  }
  
  // Format source name from hostname (e.g. bloomberg.com -> Bloomberg)
  let sourceName = hostname.split('.')[0] || "";
  if (sourceName) {
    sourceName = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);
  } else {
    sourceName = hostname;
  }
  
  return { title, sourceName, hostname };
}

// ─── Check if text is orchestration log ───
function isOrchestrationLog(text: string): boolean {
  if (!text) return false;
  return text.includes('[Orquestador]') || 
         text.includes('[Agente]') || 
         text.includes('agentes expertos') ||
         text.includes('agentes especializados');
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


interface UnifiedThinkingStep {
  name: string;
  role: string;
  task: string;
  status: 'pending' | 'done' | 'failed';
  duration?: string;
  content?: string;
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
  const [isUserMessageExpanded, setIsUserMessageExpanded] = useState(false)
  const isLongUserMessage = isUser && (message.content.length > 450 || message.content.split('\n').length > 5)
  const [isCitationsOpen, setIsCitationsOpen] = useState(false)
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(false)
  const [expandedReportIdx, setExpandedReportIdx] = useState<number | null>(null)
  const [isPlanExpanded, setIsPlanExpanded] = useState(true)
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false)
  const setSelectedTab = useWebBuilderStore((s) => s.setSelectedTab)
  const isBubbleCanvasOpen = useCanvasStore((s) => s.isOpen)
  const isBubbleBrowserOpen = useBrowserStore((s) => s.isOpen)
  const isBubbleSplitMode = isWebBuilderMode || isBubbleCanvasOpen || isBubbleBrowserOpen
  const { isMobile } = useSidebar()
  
  // Custom states for redesigned thinking/reasoning blocks
  const [showAllSources, setShowAllSources] = useState(false)
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(isLast && isLoading)
  const [localExpandedReportIdx, setLocalExpandedReportIdx] = useState<number | null>(null)
  const [localReasoningOpen, setLocalReasoningOpen] = useState(isLast && isLoading)
  const hasManuallyToggledRef = useRef(false)

  // Keep track of loading transition to auto-collapse/expand states
  const isResponding = isLast && isLoading;
  const prevLoadingRef = useRef(isLoading);
  
  useEffect(() => {
    if (isResponding) {
      setIsThinkingExpanded(true);
      if (extractedReasoning || message.thinkingSteps?.length) {
        setLocalReasoningOpen(true);
      }
    } else if (prevLoadingRef.current && !isLoading) {
      // Collapse thinking phase and reasoning once finished loading
      setIsThinkingExpanded(false);
      setLocalReasoningOpen(false);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, isResponding, message.reasoning, message.thinkingSteps]);

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
          return null
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

  // ─── Render Thinking Phase (Search, Agents, Citations) ───
  const renderThinkingPhase = () => {
    let reports = message.reasoningSteps || [];
    if (reports.length === 0 && isLast && isLoading && streamData) {
      const reportsObj = streamData.find((d: any) => d?.type === 'agentReports');
      reports = reportsObj?.reports || [];
    }

    const thinkingSteps: UnifiedThinkingStep[] = [];
    if (reports && reports.length > 0) {
      reports.forEach((r: any) => {
        thinkingSteps.push({
          name: r.agentName,
          role: r.role,
          task: r.task,
          status: r.success === false ? 'failed' : (r.content && r.success) ? 'done' : 'pending',
          duration: r.durationMs ? `${(r.durationMs / 1000).toFixed(1)}s` : undefined,
          content: r.content
        });
      });
    } else {
      const liveReasoning = (streamData && streamData.length > 0)
        ? streamData.filter((d: any) => d?.type === 'reasoning').map((c: any) => c.text).join('')
        : "";
      const logText = (isLast && isLoading && streamData) ? liveReasoning : (message.reasoning || '');
      if (isOrchestrationLog(logText)) {
        const parsedSteps = parseOrchestrationSteps(logText);
        const agentStatuses = getAgentStatuses(parsedSteps);
        agentStatuses.forEach((a: any) => {
          thinkingSteps.push({
            name: a.agentName,
            role: a.role,
            task: a.task,
            status: a.status,
            duration: a.time,
          });
        });
      }
    }

    const hasCitations = citationsList.length > 0;
    const hasSteps = thinkingSteps.length > 0;

    if (!hasCitations && !hasSteps) return null;

    // Determine titles & icons
    let headerTitle = "Búsqueda y análisis";
    let headerIcon = <Compass className="w-4 h-4 text-[#1890FF] dark:text-blue-400 shrink-0 animate-pulse" />;

    if (isLoading) {
      headerTitle = hasSteps ? "Ejecutando agentes de investigación..." : "Buscando en la web...";
      headerIcon = <Loader2 className="w-4 h-4 text-[#1890FF] dark:text-blue-400 shrink-0 animate-spin" />;
    } else {
      headerTitle = hasSteps 
        ? `Investigación completada • ${thinkingSteps.length} agentes` 
        : `Fuentes consultadas • ${citationsList.length} sitios`;
      headerIcon = <CheckCircle2 className="w-4 h-4 text-emerald-505 dark:text-emerald-400 shrink-0" />;
    }

    // Dynamic timer
    const totalDurationMs = reports.reduce((acc: number, r: any) => acc + (r.durationMs || 0), 0);
    const displayDuration = totalDurationMs > 0 
      ? `${(totalDurationMs / 1000).toFixed(1)}s` 
      : message.secondsElapsed 
        ? `${message.secondsElapsed}s` 
        : null;

    return (
      <div className="mb-4 rounded-2xl border border-slate-250/60 dark:border-zinc-800/60 bg-slate-50/30 dark:bg-zinc-950/20 overflow-hidden shadow-xs">
        {/* Accordion Trigger */}
        <div
          onClick={() => setIsThinkingExpanded(!isThinkingExpanded)}
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-zinc-900/20 transition-all select-none group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {headerIcon}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#1890FF] dark:group-hover:text-blue-400 transition-colors">
              {headerTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {displayDuration && (
              <span className="text-[10px] text-muted-foreground/60 font-medium bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full border border-slate-200/20 dark:border-zinc-800">
                {displayDuration}
              </span>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground/50 transition-transform duration-200",
              !isThinkingExpanded && "-rotate-90"
            )} />
          </div>
        </div>

        {/* Accordion Content */}
        <AnimatePresence initial={false}>
          {isThinkingExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-slate-200/40 dark:border-zinc-800/40 pt-3 space-y-4">
                
                {/* 1. Agent Steps Timeline */}
                {hasSteps && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#1890FF] dark:text-blue-400" /> Pasos de Investigación
                    </p>
                    <div className="ml-2 pl-3 border-l border-slate-200 dark:border-zinc-850 space-y-2.5">
                      {thinkingSteps.map((step, idx) => {
                        const isDone = step.status === 'done';
                        const isFailed = step.status === 'failed';
                        const isExpanded = localExpandedReportIdx === idx;
                        const hasContent = !!step.content;

                        return (
                          <div key={idx} className="relative">
                            {/* Timeline dot */}
                            <div className={cn(
                              "absolute -left-[17.5px] top-[4px] w-2 h-2 rounded-full border border-white dark:border-[#0a0a0a]",
                              isFailed ? "bg-red-500 animate-pulse" : isDone ? "bg-slate-900 dark:bg-slate-100" : "bg-amber-500 animate-pulse"
                            )} />

                            {/* Timeline Header Button */}
                            <button
                              disabled={!hasContent}
                              onClick={() => setLocalExpandedReportIdx(isExpanded ? null : idx)}
                              className={cn(
                                "flex items-center gap-1.5 w-full text-left font-sans text-[11.5px] leading-tight select-none",
                                hasContent ? "cursor-pointer hover:opacity-85" : "cursor-default"
                              )}
                            >
                              <Search className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                              <span className="font-bold text-foreground">
                                {step.name}
                              </span>
                              <span className="text-muted-foreground/60 shrink-0">•</span>
                              <span className="text-slate-600 dark:text-slate-400 font-medium truncate flex-1">
                                {step.task}
                              </span>
                              {step.duration && (
                                <span className="text-[9px] text-muted-foreground/50 font-mono">
                                  ({step.duration})
                                </span>
                              )}
                              
                              {/* Status Indicators */}
                              {isFailed ? (
                                <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                              ) : isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Loader2 className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-spin" />
                              )}
                              {hasContent && (
                                <ChevronRight className={cn(
                                  "w-3 h-3 text-muted-foreground/40 transition-transform duration-200 shrink-0",
                                  isExpanded && "rotate-90"
                                )} />
                              )}
                            </button>

                            {/* Expanded Agent report details */}
                            <AnimatePresence>
                              {isExpanded && hasContent && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: 6 }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-slate-100/60 dark:bg-zinc-900/50 border border-slate-200/50 dark:border-zinc-800/60 rounded-xl p-3 text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto scrollbar-hide">
                                    {step.content}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Citations Sources Grid */}
                {hasCitations && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#1890FF] dark:text-blue-400" /> Fuentes de Información
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {/* Render sources up to limit */}
                      {citationsList
                        .slice(0, showAllSources ? citationsList.length : 2)
                        .map((url, i) => {
                          const { title, sourceName, hostname } = formatCitationSource(url);
                          return (
                            <div
                              key={i}
                              onClick={() => {
                                setActivePreviewUrl(activePreviewUrl === url ? null : url);
                                setIsCitationsOpen(true);
                              }}
                              className="flex items-center gap-2 p-2 rounded-xl bg-white hover:bg-slate-100/50 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/90 border border-slate-200/50 dark:border-zinc-850 hover:border-[#1890FF]/30 dark:hover:border-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 shadow-sm cursor-pointer group min-w-0"
                            >
                              <div className="w-[18px] h-[18px] rounded-full bg-slate-100 dark:bg-zinc-800 text-[9px] font-extrabold flex items-center justify-center text-slate-500 shrink-0 border border-slate-200/40 dark:border-zinc-700/40">
                                {i + 1}
                              </div>
                              <div className="w-5 h-5 rounded-md bg-white border border-slate-150 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
                                  alt=""
                                  className="w-3.5 h-3.5 object-cover bg-white"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1 text-left">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight group-hover:text-[#1890FF] dark:group-hover:text-blue-400 transition-colors">
                                  {title}
                                </span>
                                <span className="text-[9px] text-muted-foreground/75 truncate mt-0.5">
                                  {sourceName}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                      {/* "+X más" Card or "Mostrar menos" Card */}
                      {citationsList.length > 2 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllSources(!showAllSources);
                          }}
                          className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900/20 dark:hover:bg-zinc-900/60 border border-dashed border-slate-200 dark:border-zinc-800 hover:border-[#1890FF]/30 dark:hover:border-blue-500/20 transition-all duration-200 shadow-sm cursor-pointer text-muted-foreground hover:text-[#1890FF] dark:hover:text-blue-400 group h-9"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] font-bold leading-none">
                            {showAllSources ? "Mostrar menos" : `+${citationsList.length - 2} más`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  let finalContent = message.content || '';
  let extractedReasoning = message.reasoning || '';
  
  if (finalContent.includes('<think>')) {
    const thinkMatch = finalContent.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkMatch) {
      extractedReasoning = (extractedReasoning ? extractedReasoning + '\n' : '') + thinkMatch[1].trim();
      finalContent = finalContent.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    } else {
      // Handle streaming case where closing tag is not yet present
      const partialMatch = finalContent.match(/<think>([\s\S]*)/);
      if (partialMatch) {
        extractedReasoning = (extractedReasoning ? extractedReasoning + '\n' : '') + partialMatch[1].trim();
        finalContent = finalContent.replace(/<think>[\s\S]*/, '').trim();
      }
    }
  }

  // ─── Render Model Reasoning (DeepSeek-R1 style) ───
  const renderModelReasoning = () => {
    if (!extractedReasoning && !message.thinkingSteps?.length) return null
    const content = extractedReasoning || message.thinkingSteps?.join('\n') || ''
    if (!content || isOrchestrationLog(content)) return null

    return (
      <div className="mb-4">
        {/* Toggle Button at the top */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 w-fit px-3 rounded-full text-xs font-semibold gap-1.5 border border-slate-250/60 dark:border-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-colors mb-2",
            localReasoningOpen ? "text-[#1890FF] border-[#1890FF]/30 bg-blue-500/5" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setLocalReasoningOpen(!localReasoningOpen)}
          title="Toggles deep reasoning visibility"
        >
          <Brain className="h-3.5 w-3.5" />
          <span>Razonamiento</span>
          <ChevronRight className={cn("h-3 w-3 transition-transform", localReasoningOpen && "rotate-90")} />
        </Button>

        <AnimatePresence>
          {localReasoningOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pl-4 py-2 border-l-[3px] border-[#1890FF]/60 dark:border-blue-500/40 bg-slate-50/50 dark:bg-zinc-900/30 rounded-r-xl text-[13px] text-muted-foreground/90 dark:text-zinc-400 font-sans whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto shadow-xs border border-y-slate-200/30 border-r-slate-200/30 dark:border-y-zinc-800/30 dark:border-r-zinc-800/30 pr-3 scrollbar-hide">
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

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className={cn(isWebBuilderMode ? "max-w-[95%]" : "max-w-[85%] md:max-w-[75%]")}>
          <div className={cn(
            "bg-secondary dark:bg-secondary text-[15px] relative overflow-hidden",
            isWebBuilderMode ? "rounded-2xl px-3.5 py-2.5" : "rounded-3xl px-5 py-3.5"
          )}>
            <div className={cn(
              "transition-all duration-300 relative",
              isLongUserMessage && !isUserMessageExpanded ? "max-h-[140px] overflow-hidden" : ""
            )}>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {isLongUserMessage && !isUserMessageExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#EBEBED] via-[#EBEBED]/90 to-transparent dark:from-[#0A0A0A] dark:via-[#0A0A0A]/90 dark:to-transparent pointer-events-none" />
              )}
            </div>
            
            {isLongUserMessage && (
              <div className="flex justify-end mt-2 pr-1">
                <span
                  onClick={() => setIsUserMessageExpanded(!isUserMessageExpanded)}
                  className="text-xs font-semibold text-black dark:text-white hover:opacity-70 transition-all flex items-center gap-1 cursor-pointer select-none"
                >
                  {isUserMessageExpanded ? "Ver menos ↑" : "Ver más →"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  // ─── Unified Assistant message return ───
  return (
    <div className={cn("flex group", isBubbleSplitMode ? "gap-2 pl-1.5" : "gap-3")}>
      {!isBubbleSplitMode && !isMobile && <AssistantAvatar isResponding={isResponding} isWebBuilderMode={isWebBuilderMode} />}
      <div className="flex-1 min-w-0">
        {/* 1. Unified Thinking & Search Phase */}
        {renderThinkingPhase()}

        {/* Inline Web Preview Iframe Box (rendered under research block for perfect layout) */}
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

        {/* 2. Model Reasoning (DeepSeek-R1 style, if any) */}
        {renderModelReasoning()}

        {/* 3. Plan card (modo Plan: pendiente de aprobación) */}
        {renderPlanCard()}
        
        {/* 4. Main text content */}
        <div className="prose dark:prose-invert max-w-none text-[15px] leading-relaxed">
          {finalContent ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                pre({ node, children, ...props }) {
                  return <>{children}</>;
                },
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const lang = match ? match[1] : '';
                  const codeValue = String(children).replace(/\n$/, '');
                  
                  if (match && lang) {
                    // Extract title from comment
                    let title = lang === 'python' ? 'Script de Python' : `Código ${lang.toUpperCase()}`;
                    const firstLine = codeValue.split('\n')[0].trim();
                    const filenameMatch = firstLine.match(/(?:filename|archivo|title)\s*:\s*([^\s][^\n\r]*)/i) || 
                                          firstLine.match(/(?:\/\/\/|\/\/|#|\/\*)\s*([a-zA-Z0-9_\-\.\s]+\.[a-zA-Z0-9]+)/i);
                    if (filenameMatch) {
                      title = filenameMatch[1].replace(/\*\/$/, '').trim();
                    }
 
                    // Render as a beautiful canvas file card
                    return (
                      <div className="my-1.5">
                        <CanvasFileCard
                          title={title}
                          code={codeValue}
                          language={lang}
                        />
                      </div>
                    );
                  }
                  
                  return (
                    <code className={cn("bg-muted px-1.5 py-0.5 rounded-md font-mono text-[13.5px]", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {isWebBuilderMode ? stripArtifactXml(finalContent) : finalContent}
            </ReactMarkdown>
          ) : (
            isResponding ? (
              // Avoid showing double loaders if the thinking phase or reasoning is already animating
              !(message.reasoning || citationsList.length > 0) ? (
                <div className="flex items-center gap-2 py-1.5 text-muted-foreground text-xs font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
                  <span>Escribiendo respuesta...</span>
                </div>
              ) : null
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

function AssistantAvatar({ isResponding, isWebBuilderMode }: { isResponding: boolean; isWebBuilderMode?: boolean }) {
  const { resolvedTheme } = useTheme();
  const { isMobile } = useSidebar();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Desactivar el video en móvil
  const showVideo = isResponding && !isMobile;

  if (showVideo) {
    const videoSrc = isDark
      ? "https://mail.programbi.com/uploads/Letras_se_mueven_planeta_c%C3%ADrculo%E2%80%A6_202606230457.mp4"
      : "https://mail.programbi.com/uploads/Flow_1080p_202606260417.mp4";

    return (
      <div className={cn(
        "shrink-0 mt-1 flex items-center justify-center rounded-2xl overflow-hidden bg-transparent",
        isWebBuilderMode ? "h-10 w-10 rounded-xl" : "h-24 w-32"
      )}>
        <video 
          src={videoSrc} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

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
