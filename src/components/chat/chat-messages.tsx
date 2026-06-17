"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { Bot, User, ThumbsUp, ThumbsDown, Share2, RefreshCw, ChevronRight, ChevronDown, Sparkles, Loader2, Globe, ExternalLink, X, ArrowDown, CheckCircle2, XCircle, Clock, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage } from "@/lib/stores/ai-chat-store"
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store"
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
            <div className={cn("flex", isWebBuilderMode ? "gap-2 pl-1.5" : "gap-3")}>
              {!isWebBuilderMode && <AssistantAvatar isResponding={true} isWebBuilderMode={isWebBuilderMode} />}
              <div className="flex items-center gap-2 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
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
              "absolute bottom-6 z-50 w-10 h-10 bg-[#1890FF] hover:bg-[#1890FF]/90 text-white rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer border border-[#1890FF]/20 active:scale-95",
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
    
    // Agent starting: "⏳ [Agente] AgentName (Role) iniciando tarea: "task"..."
    const startMatch = trimmed.match(/⏳\s*\[Agente\]\s*(.+?)\s*\((.+?)\)\s*iniciando tarea:\s*"?(.+?)"?\.{0,3}$/);
    if (startMatch) {
      steps.push({ type: 'agent_start', agentName: startMatch[1], role: startMatch[2], task: startMatch[3], text: trimmed });
      continue;
    }
    
    // Agent completed: "✅ [Agente] AgentName completado en XXXms."
    const doneMatch = trimmed.match(/✅\s*\[Agente\]\s*(.+?)\s*completado en\s*(\d+)ms/);
    if (doneMatch) {
      steps.push({ type: 'agent_done', agentName: doneMatch[1], time: `${(parseInt(doneMatch[2]) / 1000).toFixed(1)}s`, text: trimmed });
      continue;
    }
    
    // Agent failed: "❌ [Agente] AgentName falló..."
    const failMatch = trimmed.match(/❌\s*\[Agente\]\s*(.+?)\s*falló/);
    if (failMatch) {
      steps.push({ type: 'agent_fail', agentName: failMatch[1], text: trimmed });
      continue;
    }
    
    // Orchestrator message
    if (trimmed.includes('[Orquestador]')) {
      steps.push({ type: 'orchestrator', text: trimmed.replace(/🧠|🔍|📊|✅/g, '').replace('[Orquestador]', '').trim() });
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
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(true)
  const [expandedReportIdx, setExpandedReportIdx] = useState<number | null>(null)

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
          onClick={onToggleReasoning}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all duration-200 group"
        >
          <span>Razonamiento</span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              isReasoningOpen && "rotate-90"
            )}
          />
          {message.secondsElapsed && (
            <span className="text-[10px] opacity-50 font-normal">
              ({message.secondsElapsed}s)
            </span>
          )}
        </button>
        <AnimatePresence>
          {isReasoningOpen && (
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

  // ─── Render Agent Reports as collapsible timeline ───
  const renderAgentReports = () => {
    if (!message.reasoningSteps || message.reasoningSteps.length === 0) return null;

    const reports = message.reasoningSteps;
    const successCount = reports.filter((r: any) => r.success !== false).length;
    const totalTime = reports.reduce((acc: number, r: any) => acc + (r.durationMs || 0), 0);

    return (
      <div className="mb-3">
        {/* Toggle Header */}
        <button
          onClick={() => setIsAgentsExpanded(!isAgentsExpanded)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <div className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
            isAgentsExpanded ? "bg-[#1890FF]/10 text-[#1890FF]" : "bg-muted text-muted-foreground group-hover:bg-[#1890FF]/10 group-hover:text-[#1890FF]"
          )}>
            <Sparkles className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
            {reports.length} Agentes Especializados
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-normal">
            {successCount}/{reports.length} completados · {(totalTime / 1000).toFixed(1)}s
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
                  const isExpanded = expandedReportIdx === idx;
                  const duration = report.durationMs ? `${(report.durationMs / 1000).toFixed(1)}s` : null;

                  return (
                    <div key={idx} className="relative pb-3 last:pb-0">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#0a0a0a]",
                        isSuccess ? "bg-emerald-500" : "bg-red-500"
                      )} />

                      {/* Agent header */}
                      <button
                        onClick={() => setExpandedReportIdx(isExpanded ? null : idx)}
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
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto shrink-0" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500 ml-auto shrink-0" />
                        )}
                        <ChevronRight className={cn(
                          "w-3 h-3 text-muted-foreground/40 transition-transform duration-200 shrink-0",
                          isExpanded && "rotate-90"
                        )} />
                      </button>

                      {/* Task description */}
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
                        {report.task}
                      </p>

                      {/* Expanded report content */}
                      <AnimatePresence>
                        {isExpanded && (
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
    const hasAgentSteps = steps.some(s => s.type === 'agent_start' || s.type === 'agent_done' || s.type === 'agent_fail');

    return (
      <div className={cn("flex", isWebBuilderMode ? "gap-2 pl-1.5" : "gap-3")}>
        {!isWebBuilderMode && <AssistantAvatar isResponding={isResponding} isWebBuilderMode={isWebBuilderMode} />}
        <div className="flex-1 min-w-0">
          {/* Orchestrator header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-[#1890FF]/10 flex items-center justify-center">
              <Cpu className="w-3 h-3 text-[#1890FF] animate-pulse" />
            </div>
            <span className="text-xs font-semibold text-[#1890FF]">Orquestador analizando</span>
            <div className="flex items-center gap-1 ml-1">
              <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-[#1890FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {hasAgentSteps ? (
            /* Timeline view for agent orchestration */
            <div className="ml-2.5 border-l border-[#1890FF]/20 pl-4 space-y-2">
              {steps.map((step, idx) => {
                if (step.type === 'orchestrator') {
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full bg-[#1890FF]/60 border-2 border-white dark:border-[#0a0a0a]" />
                      <p className="text-[11px] text-muted-foreground font-medium">{step.text}</p>
                    </div>
                  );
                }
                if (step.type === 'agent_start') {
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#0a0a0a] animate-pulse" />
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
                        <span className="text-[11px] font-bold text-foreground">{step.agentName}</span>
                        <span className="text-[10px] text-[#1890FF]">{step.role}</span>
                      </div>
                      {step.task && <p className="text-[10px] text-muted-foreground mt-0.5">{step.task}</p>}
                    </div>
                  );
                }
                if (step.type === 'agent_done') {
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0a0a0a]" />
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        <span className="text-[11px] font-bold text-foreground">{step.agentName}</span>
                        {step.time && <span className="text-[9px] text-muted-foreground/60 font-mono">{step.time}</span>}
                      </div>
                    </div>
                  );
                }
                if (step.type === 'agent_fail') {
                  return (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-[5px] w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white dark:border-[#0a0a0a]" />
                      <div className="flex items-center gap-1.5">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <span className="text-[11px] font-bold text-foreground">{step.agentName}</span>
                        <span className="text-[10px] text-red-500">Error</span>
                      </div>
                    </div>
                  );
                }
                return null;
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

        {/* 2. Agent reports timeline (if any) */}
        {renderAgentReports()}
        
        {/* 3. Main text content */}
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          {message.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          ) : (
            !message.toolResults?.length && !message.toolInvocations?.length && !message.reasoning && (
              <div className="flex items-center gap-1 py-1.5">
                <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )
          )}
        </div>

        {/* 4. Tool results & charts (AFTER text) */}
        {renderToolResults()}
        {renderCharts()}

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
    ? "https://mail.programbi.com/uploads/Logo-2-Blanco.png"
    : "https://mail.programbi.com/uploads/Maverlang-Logo-2.png";

  return (
    <div className={cn(
      "shrink-0 mt-1 flex items-center justify-center",
      isWebBuilderMode ? "h-10 w-10" : "h-20 w-28"
    )}>
      <img 
        src={imageSrc} 
        alt="Chat Logo" 
        className={cn("object-contain", isWebBuilderMode ? "w-8 h-8" : "w-12 h-12")}
      />
    </div>
  );
}
