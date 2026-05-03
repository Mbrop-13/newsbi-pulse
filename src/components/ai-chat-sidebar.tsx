"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, Sparkles, Loader2, ExternalLink, Trash2, History, ChevronRight, Paperclip, HelpCircle, FileText, Globe, BarChart3, Newspaper, Bell, TrendingUp, TrendingDown } from "lucide-react";
import { useAIChatStore, ChatMessage, AttachedArticle, ToolResultUI } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";

export function AIChatSidebar() {
  const {
    isOpen, close, messages, addMessage, isLoading, setLoading, clearMessages,
    attachedArticles, attachArticle, removeArticle, savedChats, loadChat, deleteSavedChat,
    attachedFiles, attachFile, removeFile, webSearchEnabled, setWebSearch
  } = useAIChatStore();
  
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const supabase = createClient();
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const user = useAuthStore((s) => s.user);

  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const questionLimit = userTier === "free" ? 5 : userTier === "pro" ? 100 : userTier === "max" ? 300 : 999999;
  const reachedQuestionLimit = userMessagesCount >= questionLimit;
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
    if (!text || isLoading || reachedQuestionLimit) return;

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
          files: attachedFiles,
          webSearch: webSearchEnabled,
          shortcut: shortcutOverride,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error de IA");

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
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Error: ${err.message}`,
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
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
          <div className="px-5 pt-5 pb-3 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight">R-AI Agent</h2>
                  <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                    {webSearchEnabled ? (
                      <><Globe className="w-2.5 h-2.5 text-[#1890FF]" /> Búsqueda Web Activa (Grok)</>
                    ) : (
                      "Modelo Rápido (DeepSeek)"
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {userTier === "ultra" || userTier === "max" ? (
                  <button
                    onClick={() => setWebSearch(!webSearchEnabled)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                      webSearchEnabled ? "bg-[#1890FF]/10 text-[#1890FF]" : "text-muted-foreground/40 hover:bg-[#1890FF]/10 hover:text-[#1890FF]"
                    }`}
                    title="Búsqueda en Web (Grok)"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                ) : null}
                
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${
                    showHistory ? "bg-purple-500/10 text-purple-500" : "text-muted-foreground/40 hover:bg-purple-500/10 hover:text-purple-500"
                  }`}
                  title="Historial de Chats"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
                {messages.length > 0 && !showHistory && (
                  <button onClick={clearMessages} className="w-7 h-7 rounded-xl hover:bg-red-500/10 flex items-center justify-center text-muted-foreground/40 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={close} className="w-7 h-7 rounded-xl hover:bg-red-500/10 flex items-center justify-center text-muted-foreground/40 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Usage Banner */}
          {(userTier === "free" || userTier === "pro") && (
            <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">Uso: {userMessagesCount}/{questionLimit} consultas</span>
            </div>
          )}

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
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#0052CC]/10 to-[#22D3EE]/10 flex items-center justify-center mb-5">
                    <Bot className="w-8 h-8 text-[#0052CC]" />
                  </div>
                  <h3 className="font-bold text-base mb-1">R-AI Assistant</h3>
                  <p className="text-xs text-muted-foreground mb-6">Agente inteligente conectado a tu portafolio y noticias del mundo.</p>
                  
                  <div className="flex flex-col gap-2 w-full max-w-[280px]">
                    {shortcuts.map((sc) => (
                      <button
                        key={sc.id}
                        onClick={() => sendMessage(sc.query, sc.id)}
                        className="px-4 py-3 bg-secondary/40 border border-border rounded-2xl text-xs font-medium hover:border-[#1890FF]/30 hover:bg-[#1890FF]/5 hover:text-[#1890FF] transition-all flex items-center justify-between group shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          {sc.id.includes("portfolio") ? <BarChart3 className="w-4 h-4 text-purple-500" /> : <Newspaper className="w-4 h-4 text-blue-500" />}
                          {sc.label}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} w-full`}>
                  {msg.role === "assistant" && msg.toolResults && msg.toolResults.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2 w-full justify-start">
                      {msg.toolResults.map((tr, i) => (
                        <ToolResultPill key={i} result={tr} />
                      ))}
                    </div>
                  )}

                  <div className={`max-w-[90%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-[#0052CC] text-white rounded-tr-sm"
                      : "bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-tl-sm text-gray-900 dark:text-gray-100"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed prose-p:my-2 prose-headings:my-3 prose-th:text-left prose-td:border-t prose-table:w-full">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-[14px] leading-relaxed font-medium">{msg.content}</p>
                    )}

                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1"><Globe className="w-3 h-3" /> Fuentes Consultadas</p>
                        {msg.citations.slice(0, 3).map((url, i) => {
                          let hostname = url;
                          try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                          return (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-[#1890FF] hover:underline truncate bg-[#1890FF]/5 py-1 px-2 rounded-md">
                              <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate font-medium">{hostname}</span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col gap-2 max-w-[85%]">
                  <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <ThinkingAnimation />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-2" />
            </div>
          )}

          {/* Input Area */}
          {!showHistory && (
            <div className="p-4 border-t border-gray-200/50 dark:border-white/5 bg-white dark:bg-slate-900">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts" />
              <div className="flex items-end gap-2 bg-secondary/40 border border-border rounded-2xl p-1.5 focus-within:border-[#1890FF]/50 focus-within:ring-2 focus-within:ring-[#1890FF]/20 transition-all shadow-sm">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl text-muted-foreground/50 hover:bg-[#1890FF]/10 hover:text-[#1890FF] transition-colors shrink-0">
                  <Paperclip className="w-5 h-5" />
                </button>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                  }}
                  placeholder={reachedQuestionLimit ? `Límite alcanzado` : "Hazle una pregunta al agente..."}
                  className="flex-1 bg-transparent text-sm py-2.5 max-h-32 min-h-[44px] resize-none outline-none disabled:cursor-not-allowed"
                  disabled={isLoading || reachedQuestionLimit}
                  rows={1}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || reachedQuestionLimit}
                  className="p-2.5 m-0.5 rounded-xl bg-gradient-to-r from-[#0052CC] to-[#0066FF] text-white disabled:opacity-50 transition-all shrink-0 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ── Thinking Steps Animation ───────────────────────

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
                    <span>{item.source || "Reclu"}</span>
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
