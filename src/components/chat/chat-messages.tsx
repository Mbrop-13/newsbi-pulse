"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Bot, User, ThumbsUp, ThumbsDown, Share2, RefreshCw, ChevronRight, Sparkles, Loader2, Globe, ExternalLink, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { ChatMessage } from "@/lib/stores/ai-chat-store"
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto scrollbar-hide px-4 md:px-6 relative"
    >
      <div className="max-w-3xl mx-auto pt-20 pb-6 space-y-6">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            feedback={messageFeedback[msg.id]}
            onFeedback={onFeedback}
            onRetry={idx === messages.length - 1 && msg.role === 'assistant' ? onRetry : undefined}
            onShare={onShare}
            isReasoningOpen={openReasoning[msg.id] ?? false}
            onToggleReasoning={() => onToggleReasoning?.(msg.id)}
            prevMessageContent={idx > 0 ? messages[idx - 1].content : ""}
            streamData={streamData}
            isLast={idx === messages.length - 1}
          />
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0 mt-1">
              <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-xs">
                <Bot className="h-4 w-4 text-blue-500" />
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
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
}) {
  const isUser = message.role === "user"
  const [isCitationsOpen, setIsCitationsOpen] = useState(false)
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null)

  // Check citations
  let citationsList: string[] = message.citations || []
  if (citationsList.length === 0 && isLast && streamData && streamData.length > 0) {
    const sdCitation = (streamData as any[]).find((d: any) => d?.type === 'citations')
    if (sdCitation?.urls) {
      citationsList = sdCitation.urls
    }
  }
  const hasCitations = citationsList.length > 0

  // Render tool result cards
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
        default:
          return <AnalyzedNewsCard key={`inv-news-${i}`} toolName={inv.toolName} result={inv.result} />
      }
    }) || []

    // Filter out null cards
    const allCards = [...traditionalCards, ...sdkCards].filter(Boolean)
    if (allCards.length === 0) return null

    return <div className="space-y-3 mt-2">{allCards}</div>
  }

  // Render reasoning/thinking steps
  const renderReasoning = () => {
    if (!message.reasoning && !message.thinkingSteps?.length) return null
    const content = message.reasoning || message.thinkingSteps?.join('\n') || ''
    if (!content) return null

    return (
      <div className="mb-2">
        <button
          onClick={onToggleReasoning}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          <span>Razonamiento</span>
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform duration-200",
              isReasoningOpen && "rotate-90"
            )}
          />
          {message.secondsElapsed && (
            <span className="text-xs opacity-50">
              ({message.secondsElapsed}s)
            </span>
          )}
        </button>
        {isReasoningOpen && (
          <div className="mt-2 pl-4 border-l-2 border-blue-500/20 text-sm text-muted-foreground whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    )
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

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] md:max-w-[75%]">
          <div className="rounded-3xl bg-secondary dark:bg-secondary px-4 py-3">
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      </div>
    )
  }

  // Swarm thinking message
  if (message.isSwarmThinking) {
    return (
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-xs">
            🐝
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Swarm AI · Pensando...</span>
          </div>
          <div className="text-sm text-muted-foreground/70 whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0 mt-1">
        <AvatarFallback className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-xs">
          <Bot className="h-4 w-4 text-blue-500" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        {renderReasoning()}
        
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Citations Widget */}
        {hasCitations && (
          <div className="flex flex-col gap-2 mt-3 pt-2">
            <div className="flex items-center flex-wrap gap-1.5">
              <button 
                type="button"
                onClick={() => setIsCitationsOpen(prev => !prev)}
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
                      return (
                        <div key={i} className="flex items-center gap-1.5">
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 hover:text-[#1890FF] dark:hover:text-[#1890FF] transition-colors bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 py-1 px-2.5 rounded-lg shadow-sm hover:shadow-md hover:border-[#1890FF]/30"
                          >
                            <ExternalLink className="w-2.5 h-2.5 shrink-0 text-[#1890FF]" /> 
                            <span className="truncate max-w-[150px] font-bold">{hostname}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setActivePreviewUrl(activePreviewUrl === url ? null : url)}
                            className={cn(
                              "flex items-center justify-center p-1 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A] hover:bg-gray-50 dark:hover:bg-[#222] transition-colors shadow-sm",
                              activePreviewUrl === url && "text-blue-500 border-blue-500/35 bg-blue-500/10"
                            )}
                            title="Vista Previa"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1890FF]" />
                          </button>
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
        )}

        {renderToolResults()}
        {renderCharts()}

        {/* Actions bar */}
        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onFeedback?.(message.id, feedback === 'like' ? null : 'like')}
            aria-label="Me gusta"
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", feedback === 'like' && "text-blue-500 fill-blue-500")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full"
            onClick={() => onFeedback?.(message.id, feedback === 'dislike' ? null : 'dislike')}
            aria-label="No me gusta"
          >
            <ThumbsDown className={cn("h-3.5 w-3.5", feedback === 'dislike' && "text-red-500 fill-red-500")} />
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
