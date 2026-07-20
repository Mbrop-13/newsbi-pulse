"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Brain, Sparkles, Loader2, ExternalLink, Trash2, History, ChevronRight, Paperclip, Globe, BarChart3, Newspaper, Bell, TrendingUp, TrendingDown, Mic, Plus, Share2, ThumbsUp, ThumbsDown, RefreshCw, LineChart, PieChart, AreaChart, Target, Scale, Layers, Star, Maximize } from "lucide-react";
import { useAIChatStore, ChatMessage, AttachedArticle, ToolResultUI } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useConversionStore } from "@/lib/stores/conversion-store";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { getCleanPathname } from "@/lib/utils";
import { AnalyzedNewsCard } from './assistant/analyzed-news-card';
import { PortfolioSummaryCard } from './assistant/portfolio-summary-card';
import { StockAnalysisCard } from './assistant/stock-analysis-card';
import { AIChartCard } from './assistant/ai-chart-card';
import { PromptCarousel } from "./assistant/prompt-carousel";

const ADVANCED_TOOLS = [
  { id: 'chart_bar', label: 'Gráfico Barras', icon: BarChart3, category: 'Gráficos' },
  { id: 'chart_line', label: 'Gráfico Líneas', icon: LineChart, category: 'Gráficos' },
  { id: 'chart_pie', label: 'Gráfico Circular', icon: PieChart, category: 'Gráficos' },
  { id: 'chart_area', label: 'Gráfico Área', icon: AreaChart, category: 'Gráficos' },
  { id: 'analyze_stock', label: 'Análisis Fundamental', icon: TrendingUp, category: 'Análisis' },
  { id: 'compare_stocks', label: 'Comparar Acciones', icon: Scale, category: 'Análisis' },
  { id: 'get_sector_performance', label: 'Rendimiento Sectorial', icon: Layers, category: 'Análisis' },
];

export function AIChatSidebar() {
  const {
    isOpen, close, messages, addMessage, isLoading, setLoading, clearMessages,
    attachedArticles, attachArticle, removeArticle, savedChats, loadChat, deleteSavedChat,
    attachedFiles, attachFile, removeFile,
    activeTools, toggleTool, clearTools, favoriteTools, toggleFavoriteTool,
    messageFeedback, setFeedback
  } = useAIChatStore();
  
  const [input, setInput] = useState("");
  const [webSearchEnabled, setWebSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'charts' | 'analysis'>('main');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Click outside listener for attachment menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
        setTimeout(() => setAttachMenuView('main'), 200);
      }
    }
    if (showAttachMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachMenu]);
  const rawPathname = usePathname();
  const pathname = getCleanPathname(rawPathname);
  const supabase = createClient();
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const user = useAuthStore((s) => s.user);
  const isPremium = userTier === "max" || userTier === "ultra";
  const { openModal } = useConversionStore();

  // AI quota is token-based (not per-message)
  const lifetimeAiTokens = useSubscriptionStore((s) => s.lifetimeAiTokens);
  const monthlyAiTokens = useSubscriptionStore((s) => s.monthlyAiTokens);
  const tokenRemaining = useSubscriptionStore((s) => s.getAiRemaining());
  const tokenLimit = useSubscriptionStore((s) => s.getAiTokenLimit());
  const canSendByTokens = useSubscriptionStore((s) => s.canSendAiMessage());
  const reachedTokenLimit = !canSendByTokens;
  const tokensUsed = Math.max(0, (tokenLimit > 0 && tokenLimit < 999999 ? tokenLimit : 0) - tokenRemaining);
  const tokenBarPct =
    tokenLimit > 0 && tokenLimit < 999999
      ? Math.min(100, (tokensUsed / tokenLimit) * 100)
      : 0;
  const formatTok = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
    : String(n);
  // silence unused if store not hydrated yet
  void lifetimeAiTokens;
  void monthlyAiTokens;
  const MAX_AI_ARTICLES = userTier === "free" ? 1 : userTier === "pro" ? 5 : 10;
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  const [isMobile, setIsMobile] = useState(false);
  const [hasPortfolio, setHasPortfolio] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Check if user has portfolio
  useEffect(() => {
    if (user && isOpen) {
      supabase.from("portfolios").select("id").eq("user_id", user.id).limit(1)
        .then(({ data }) => {
          setHasPortfolio(data ? data.length > 0 : false);
        });
    }
  }, [user, isOpen]);

  // Auto-scroll
  useEffect(() => {
    if (!showHistory) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showHistory]);

  // Focus
  useEffect(() => {
    if (isOpen && !showHistory && !isMobile) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen, showHistory, isMobile]);

  // Auto-attach article
  useEffect(() => {
    if (!isOpen) return;
    const match = pathname.match(/^\/article\/(.+)$/);
    if (!match) return;

    const articleId = decodeURIComponent(match[1]);
    if (attachedArticles.find((a) => a.id === articleId || a.slug === articleId)) return;
    if (attachedArticles.length >= MAX_AI_ARTICLES) return;

    (async () => {
      const isUUID = /^[0-9a-f]{8}-/.test(articleId);
      let query = supabase.from("news_articles").select("id, title, summary, category, image_url, slug");
      if (isUUID) query = query.eq("id", articleId);
      else query = query.eq("slug", articleId);

      const { data } = await query.single();
      if (data) {
        attachArticle({
          id: data.id,
          title: data.title,
          summary: data.summary || "",
          category: data.category || "",
          image_url: data.image_url || "",
          slug: data.slug || "",
        });
      }
    })();
  }, [isOpen, pathname]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedFiles.length >= MAX_FILES) {
      alert(`Has alcanzado el límite de ${MAX_FILES} archivos para tu plan.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        attachFile({
          id: Date.now().toString(),
          name: file.name,
          content: content.slice(0, 15000),
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendMessage = async (textOverride?: string, shortcutOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || isLoading) return;

    if (reachedTokenLimit) {
      openModal("ai_chat");
      toast.error("Has alcanzado tu límite de tokens de IA. Actualiza tu plan para continuar.");
      return;
    }

    if (tokenLimit > 0 && tokenLimit < 999999 && tokenRemaining < tokenLimit * 0.1) {
      toast("Tokens de IA bajos", {
        description: `Te quedan ${formatTok(tokenRemaining)} tokens. Actualiza tu plan para más capacidad.`,
        icon: <Sparkles className="w-4 h-4 text-[#1890FF]" />,
      });
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    if (!textOverride) setInput("");
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          articles: attachedArticles,
          files: attachedFiles.map(f => ({ name: f.name, content: f.content })),
          webSearch: webSearchEnabled,
          activeTools: activeTools,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.code === "TOKEN_LIMIT_REACHED") {
          openModal("ai_chat");
        }
        throw new Error(data.error || "Error de IA");
      }

      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
        citations: data.citations,
        toolResults: data.toolResults,
        thinkingSteps: data.thinkingSteps,
        model: data.model,
      });
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con Maverlang AI");
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${err.message}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
      clearTools();
    }
  };

  const toggleRecording = () => {
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'es-ES';
      let finalT = "";
      baseInputRef.current = input;
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e: any) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) finalT += e.results[i][0].transcript + " ";
          else interim += e.results[i][0].transcript;
        }
        setInput(baseInputRef.current + (baseInputRef.current ? " " : "") + finalT + interim);
      };
      rec.onerror = () => setIsRecording(false);
      rec.onend = () => setIsRecording(false);
      recognitionRef.current = rec;
      rec.start();
    } catch { setIsRecording(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const shortcuts = hasPortfolio ? [
    { label: "Mi portafolio", id: "portfolio_summary", query: "¿Cómo van mis acciones hoy?" },
    { label: "Noticias de mis activos", id: "portfolio_news", query: "¿Hay noticias de mis acciones?" },
    { label: "Análisis de mercado", id: "market_analysis", query: "Analiza mi portafolio frente al mercado hoy." },
  ] : [
    { label: "¿Qué pasó hoy?", id: "top_news", query: "Dame un resumen de las noticias más importantes de hoy." },
    { label: "Noticias tech", id: "top_news", query: "Noticias de tecnología." },
    { label: "Análisis del mercado", id: "top_news", query: "Análisis del mercado actual." },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={sidebarRef}
          initial={isMobile ? { y: "100%", opacity: 0.8 } : { x: "100%", opacity: 0.8 }}
          animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
          exit={isMobile ? { y: "100%", opacity: 0.8 } : { x: "100%", opacity: 0.8 }}
          transition={{ type: "spring", damping: 32, stiffness: 350 }}
          drag={isMobile ? "y" : false}
          dragConstraints={{ top: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            if (isMobile && (offset.y > 150 || velocity.y > 500)) close();
          }}
          className={`fixed z-[70] flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl ${
            isMobile 
              ? "bottom-0 left-0 right-0 h-[85vh] rounded-t-3xl border-t border-gray-200/50 dark:border-white/5" 
              : "top-0 right-0 h-full w-[450px] max-w-[90vw] border-l border-gray-200/50 dark:border-white/5"
          }`}
        >
          {isMobile && (
            <div className="w-full flex items-center justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700" />
            </div>
          )}
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-black dark:bg-white flex items-center justify-center shadow-md">
                  <Bot className="w-4 h-4 text-white dark:text-black" />
                </div>
                <div>
                  <h2 className="text-sm font-black tracking-tight text-gray-900 dark:text-white">Maverlang AI</h2>
                  <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    {webSearchEnabled ? (
                      <><Globe className="w-2.5 h-2.5 text-black dark:text-white" /> Web · Grok</>
                    ) : (
                      "Modelo Rápido"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => {
                    clearMessages();
                    setShowHistory(false);
                    clearTools();
                  }}
                  className="w-7 h-7 rounded-lg hover:bg-[#1890FF]/10 flex items-center justify-center text-[#1890FF] transition-colors"
                  title="Nuevo Chat"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${showHistory ? "bg-[#1890FF]/10 text-[#1890FF]" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-600"}`}
                  title="Historial"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
                <Link
                  href="/ai"
                  onClick={close}
                  className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-[#1890FF] transition-colors"
                  title="Pantalla Completa"
                >
                  <Maximize className="w-3.5 h-3.5" />
                </Link>
                <button onClick={close} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {/* Compact token usage bar */}
            {tokenLimit > 0 && tokenLimit < 999999 && (
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-[#1890FF] rounded-full transition-all" style={{ width: `${tokenBarPct}%` }} />
                </div>
                <span className="text-[10px] font-bold text-gray-400 shrink-0">
                  {formatTok(tokenRemaining)}/{formatTok(tokenLimit)}
                </span>
              </div>
            )}
          </div>

          {showHistory ? (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              <h3 className="font-bold text-sm">Historial de Chats</h3>
              {savedChats.map((chat) => (
                <div key={chat.id} onClick={() => { loadChat(chat.id); setShowHistory(false); }} className="cursor-pointer p-3 rounded-xl bg-secondary/30 hover:bg-purple-500/5 border border-transparent hover:border-purple-500/20">
                  <p className="text-xs font-medium">{chat.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
              
              {messages.length === 0 && !isLoading && (
                <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px]">
                  <PromptCarousel onSend={(query) => sendMessage(query)} />
                </div>
              )}

              {messages.map((msg, msgIndex) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full group/msg`}>
                  {msg.role === "assistant" && (
                    <div className="flex flex-col gap-2 mb-2 w-full">
                      {msg.toolInvocations?.map((toolInvocation) => {
                        if (toolInvocation.state === 'result') {
                          if (toolInvocation.toolName === 'get_portfolio_summary') {
                            return <PortfolioSummaryCard key={toolInvocation.toolCallId} result={toolInvocation.result} />;
                          }
                          if (['analyze_stock', 'compare_stocks', 'screen_market', 'get_sector_performance'].includes(toolInvocation.toolName)) {
                            return <StockAnalysisCard key={toolInvocation.toolCallId} toolName={toolInvocation.toolName} result={toolInvocation.result} />;
                          }
                          if (toolInvocation.toolName === 'render_chart') {
                            return <AIChartCard key={toolInvocation.toolCallId} result={toolInvocation.result} />;
                          }
                          return <AnalyzedNewsCard key={toolInvocation.toolCallId} toolName={toolInvocation.toolName} result={toolInvocation.result} />;
                        }
                        return (
                          <div key={toolInvocation.toolCallId} className="flex items-center gap-2 px-3 py-1.5 bg-[#1890FF]/5 text-[#1890FF] rounded-xl text-[10px] font-bold w-fit animate-pulse border border-[#1890FF]/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Procesando datos...
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.role === "user" ? (
                    <div className="max-w-[85%] bg-gray-100 dark:bg-slate-800 rounded-[1.5rem] rounded-tr-sm px-4 py-3 border border-black/5 dark:border-white/5">
                      <p className="text-[13px] leading-relaxed font-medium text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-full w-full">
                      {/* Reasoning Box */}
                      {(() => {
                        const reasoningText = msg.reasoning;
                        if (!reasoningText) return null;
                        return (
                          <div className="border border-gray-200/60 dark:border-slate-800/60 bg-gray-50/50 dark:bg-slate-900/40 rounded-xl p-2.5 mb-2.5 w-full">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 mb-1">
                              <span>Pensamiento de la IA</span>
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-300 dark:border-slate-700 pl-2">
                              {reasoningText}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:my-2 prose-headings:my-3 prose-a:text-[#1890FF] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-gray-700/50">
                                <table className="w-full text-xs border-collapse">{children}</table>
                              </div>
                            ),
                            thead: ({ children }) => (<thead className="bg-gray-50 dark:bg-slate-800/80">{children}</thead>),
                            th: ({ children }) => (<th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{children}</th>),
                            td: ({ children }) => (<td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 font-medium">{children}</td>),
                            strong: ({ children }) => (<strong className="font-bold text-gray-900 dark:text-white">{children}</strong>),
                          }}
                        >{msg.content}</ReactMarkdown>
                      </div>

                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/50">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1"><Globe className="w-3 h-3" /> Fuentes</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.citations.slice(0, 3).map((url, i) => {
                              let hostname = url;
                              try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                              return (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-400 hover:text-[#1890FF] bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 py-1 px-2 rounded-lg transition-colors">
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 text-[#1890FF]" /> <span className="truncate max-w-[120px] font-bold">{hostname}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Action bar */}
                      {(!messages[msgIndex + 1] || messages[msgIndex + 1].role === 'user') && (
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                          <button onClick={() => setFeedback(msg.id, messageFeedback[msg.id] === 'like' ? null : 'like')}
                            className={`p-1 rounded-md transition-colors ${messageFeedback[msg.id] === 'like' ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-green-500 hover:bg-green-500/10"}`}>
                            <ThumbsUp className={`w-3 h-3 ${messageFeedback[msg.id] === 'like' ? "fill-current" : ""}`} />
                          </button>
                          <button onClick={() => setFeedback(msg.id, messageFeedback[msg.id] === 'dislike' ? null : 'dislike')}
                            className={`p-1 rounded-md transition-colors ${messageFeedback[msg.id] === 'dislike' ? "text-red-500 bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"}`}>
                            <ThumbsDown className={`w-3 h-3 ${messageFeedback[msg.id] === 'dislike' ? "fill-current" : ""}`} />
                          </button>
                          {msg.id === messages.filter(m => m.role === 'assistant').pop()?.id && !isLoading && (
                            <button onClick={() => { /* regenerate last */ const lastUser = messages.filter(m => m.role === 'user').pop(); if (lastUser) sendMessage(lastUser.content); }}
                              className="p-1 rounded-md text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors">
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-center py-4 w-full">
                  <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-4 py-2.5 rounded-full shadow-sm flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Pensando...</span>
                    <ThinkingAnimation />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}

          {/* Input Area */}
          {!showHistory && (
            <div className="p-3 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-slate-900">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts" />
              
              {/* Active Tool Pills */}
              <AnimatePresence>
                {activeTools.length > 0 && (
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2 px-1">
                    {activeTools.map(toolId => {
                      const tool = ADVANCED_TOOLS.find(t => t.id === toolId);
                      if (!tool) return null;
                      return (
                        <motion.div key={toolId} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm"
                        >
                          <div className="w-4 h-4 rounded-full bg-blue-50 dark:bg-[#1890FF]/10 flex items-center justify-center">
                            <tool.icon className="w-2.5 h-2.5 text-[#1890FF]" />
                          </div>
                          {tool.label}
                          <button type="button" onClick={() => toggleTool(toolId, tool.category)} className="ml-1 text-gray-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10"><X className="w-3 h-3" /></button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              <div className="relative flex items-end gap-1.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700/50 rounded-2xl p-1 focus-within:ring-2 focus-within:ring-[#1890FF]/20 focus-within:border-[#1890FF]/50 transition-all shadow-sm">
                {/* Left: + button & Web toggle */}
                <div ref={attachMenuRef} className="flex items-center gap-0.5 pb-0.5 pl-0.5 shrink-0 relative">
                  <button onClick={() => setShowAttachMenu(!showAttachMenu)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${showAttachMenu ? "bg-[#1890FF] text-white" : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                    <Plus className={`w-4 h-4 transition-transform duration-200 ${showAttachMenu ? "rotate-45" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showAttachMenu && (
                      <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        className="absolute bottom-10 left-0 z-40 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden max-h-[300px]">
                        <div className="p-2 space-y-2 overflow-y-auto max-h-[300px]">
                            {attachMenuView === 'main' && (
                              <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <div>
                                  <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Adjuntar</div>
                                  <button onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }}
                                    className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#1890FF] rounded-xl transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0"><Paperclip className="w-3.5 h-3.5" /></div>
                                    Subir archivo
                                  </button>
                                </div>
                                <div className="mt-1">
                                  <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Herramientas</div>
                                  <button onClick={() => setAttachMenuView('charts')}
                                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-500 rounded-xl transition-colors">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><PieChart className="w-3.5 h-3.5" /></div>
                                      Gráficos
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                  <button onClick={() => setAttachMenuView('analysis')}
                                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-purple-500 rounded-xl transition-colors mt-0.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"><TrendingUp className="w-3.5 h-3.5" /></div>
                                      Análisis
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {attachMenuView === 'charts' && (
                              <motion.div key="charts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                <button onClick={() => setAttachMenuView('main')} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 mb-1 transition-colors">
                                  <ChevronRight className="w-3 h-3 rotate-180" /> Volver
                                </button>
                                <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Gráficos</div>
                                {ADVANCED_TOOLS.filter(t => t.category === 'Gráficos').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <button key={tool.id} onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }}
                                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-xs font-semibold rounded-xl transition-colors ${isActive ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#1890FF]"}`}>
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-blue-500/20 text-blue-600" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}><Icon className="w-3.5 h-3.5" /></div>
                                      {tool.label}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}

                            {attachMenuView === 'analysis' && (
                              <motion.div key="analysis" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                                <button onClick={() => setAttachMenuView('main')} className="flex items-center gap-1 text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 mb-1 transition-colors">
                                  <ChevronRight className="w-3 h-3 rotate-180" /> Volver
                                </button>
                                <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Análisis</div>
                                {ADVANCED_TOOLS.filter(t => t.category === 'Análisis').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <button key={tool.id} onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }}
                                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-xs font-semibold rounded-xl transition-colors ${isActive ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-purple-500"}`}>
                                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-purple-500/20 text-purple-600" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}><Icon className="w-3.5 h-3.5" /></div>
                                      {tool.label}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button onClick={() => { if (isPremium) setWebSearch(!webSearchEnabled); }}
                    className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${webSearchEnabled ? "bg-black/10 text-black dark:bg-white/10 dark:text-white" : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    title={webSearchEnabled ? "Web Search ON" : "Web Search OFF"}>
                    <Globe className={`w-4 h-4 ${webSearchEnabled ? "animate-pulse" : ""}`} />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder={reachedQuestionLimit ? "Límite alcanzado" : "Pregúntale a Maverlang AI..."}
                  className="flex-1 bg-transparent text-[13px] py-2.5 px-1 max-h-28 min-h-[40px] resize-none outline-none disabled:cursor-not-allowed font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  disabled={isLoading}
                  rows={1}
                />

                {/* Send / Mic */}
                {isRecording ? (
                  <button onClick={toggleRecording} className="w-8 h-8 mb-0.5 mr-0.5 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <div className="flex items-center justify-center gap-[2px] h-3.5">
                      {[1,2,3].map(i => (
                        <motion.div key={i} animate={{ height: ["3px","10px","3px"] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }} className="w-[2px] bg-white rounded-full" />
                      ))}
                    </div>
                  </button>
                ) : input.trim() ? (
                  <button onClick={() => sendMessage()} disabled={isLoading}
                    className="w-8 h-8 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
                    <Send className="w-3.5 h-3.5 ml-0.5" />
                  </button>
                ) : (
                  <button onClick={toggleRecording} disabled={isLoading}
                    className="w-8 h-8 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0">
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="text-center mt-1">
                <span className="text-[9px] text-gray-400 font-medium">Maverlang AI puede cometer errores. Verifica la información.</span>
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}



function ThinkingSteps({ steps }: { steps: string[] }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (steps.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 1500);
    return () => clearInterval(interval);
  }, [steps]);

  if (steps.length === 0) return <ThinkingAnimation />;

  return (
    <div className="flex items-center gap-3">
      <Loader2 className="w-4 h-4 animate-spin text-[#1890FF]" />
      <motion.span
        key={currentStep}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs font-medium text-muted-foreground"
      >
        {steps[currentStep]}
      </motion.span>
    </div>
  );
}

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2 h-2 rounded-full bg-[#1890FF]/60" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2 h-2 rounded-full bg-[#1890FF]/80" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2 h-2 rounded-full bg-[#1890FF]" />
    </div>
  );
}

// ── Tool Result Pill (Grok-like UI) ────────────────

function ToolResultPill({ result }: { result: ToolResultUI }) {
  const [isOpen, setIsOpen] = useState(false);

  const icons = {
    portfolio: <BarChart3 className="w-3.5 h-3.5" />,
    stock_info: <TrendingUp className="w-3.5 h-3.5" />,
    news: <Newspaper className="w-3.5 h-3.5" />,
    alerts: <Bell className="w-3.5 h-3.5" />,
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shadow-sm ${
          isOpen 
            ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF]" 
            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-[#1890FF]/50"
        }`}
      >
        {icons[result.tool] || <Sparkles className="w-3 h-3" />}
        {result.summary}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[280px] md:w-[350px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 p-3 max-h-[300px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Detalles de {result.tool}</span>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-red-500"><X className="w-3 h-3" /></button>
            </div>
            
            <div className="space-y-2">
              {result.tool === "portfolio" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-800">
                  <div className="font-bold text-xs">{item.symbol}</div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">${item.price?.toFixed(2)}</div>
                    <div className={`text-[10px] ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {result.tool === "news" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <a key={i} href={item.url || `/?tag=${item.slug}`} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors">
                  <h4 className="text-xs font-bold line-clamp-2 leading-snug mb-1">{item.title}</h4>
                  <div className="flex justify-between text-[9px] text-muted-foreground">
                    <span>{item.source || "Maverlang"}</span>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
