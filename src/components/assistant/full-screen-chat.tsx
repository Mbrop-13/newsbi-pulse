"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles, Loader2, ExternalLink, Paperclip, BarChart3, Newspaper, Bell, TrendingUp, X, Globe, Menu } from "lucide-react";
import { useAIChatStore, ChatMessage, ToolResultUI } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";

export function FullScreenChat() {
  const {
    messages, addMessage, isLoading, setLoading, 
    attachedArticles, attachedFiles, attachFile,
    webSearchEnabled, setWebSearch, clearMessages
  } = useAIChatStore();
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const user = useAuthStore((s) => s.user);

  const userMessagesCount = messages.filter((m) => m.role === "user").length;
  const questionLimit = userTier === "free" ? 5 : userTier === "pro" ? 100 : userTier === "max" ? 300 : 999999;
  const reachedQuestionLimit = userMessagesCount >= questionLimit;
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  const [hasPortfolio, setHasPortfolio] = useState(false);

  // Check if user has portfolio
  useEffect(() => {
    if (user) {
      supabase.from("portfolios").select("id").eq("user_id", user.id).limit(1)
        .then(({ data }) => {
          setHasPortfolio(data && data.length > 0);
        });
    }
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

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
        citations: data.citations,
        toolResults: data.toolResults,
        thinkingSteps: data.thinkingSteps,
        model: data.model,
        timestamp: new Date(),
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
    <div className="flex flex-col h-screen pt-[72px] bg-white dark:bg-[#0a0a0a] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">R-AI</h1>
            <p className="text-[10px] text-gray-500 flex items-center gap-1">
              {webSearchEnabled ? (
                <><Globe className="w-2.5 h-2.5 text-[#1890FF]" /> Conectado a la Web</>
              ) : (
                "Modo Rápido"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {userTier === "ultra" || userTier === "max" ? (
            <button
              onClick={() => setWebSearch(!webSearchEnabled)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                webSearchEnabled 
                  ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF]" 
                  : "border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Web Search</span>
            </button>
          ) : null}
          <button onClick={clearMessages} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-3 py-1.5">
            Nuevo Chat
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto hidden-scrollbar pb-24">
        <div className="max-w-3xl mx-auto w-full px-4 pt-12 pb-8">
          
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center mt-12 mb-20">
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl flex items-center justify-center mb-6 ring-1 ring-black/5 dark:ring-white/5">
                <Bot className="w-10 h-10 text-indigo-500" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">¿En qué te puedo ayudar hoy?</h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md">Soy tu asistente financiero impulsado por IA. Tengo acceso a tu portafolio y a noticias globales en tiempo real.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                {shortcuts.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => sendMessage(sc.query, sc.id)}
                    className="p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-left hover:border-[#1890FF]/30 hover:bg-[#1890FF]/5 hover:shadow-lg hover:shadow-[#1890FF]/5 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center mb-3 shadow-sm text-[#1890FF]">
                      {sc.id.includes("portfolio") ? <BarChart3 className="w-4 h-4" /> : <Newspaper className="w-4 h-4" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-[#1890FF] transition-colors">{sc.label}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{sc.query}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className="w-full flex flex-col group">
                {/* User Message */}
                {msg.role === "user" ? (
                  <div className="self-end max-w-[80%] bg-gray-100 dark:bg-slate-800 rounded-3xl rounded-tr-sm px-5 py-3.5 shadow-sm border border-black/5 dark:border-white/5">
                    <p className="text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="flex gap-4 max-w-[95%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                      
                      {/* Tool Results / Thinking */}
                      {msg.toolResults && msg.toolResults.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {msg.toolResults.map((tr, i) => (
                            <ToolResultPill key={i} result={tr} />
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed prose-p:my-3 prose-headings:my-4 prose-a:text-[#1890FF] prose-a:no-underline hover:prose-a:underline prose-th:text-left prose-td:border-t border-gray-200 dark:border-gray-800 prose-table:w-full">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Fuentes Citadas</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.citations.slice(0, 3).map((url, i) => {
                              let hostname = url;
                              try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                              return (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-[#1890FF] dark:hover:text-[#1890FF] transition-colors bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 py-1.5 px-3 rounded-full">
                                  <ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate max-w-[150px] font-medium">{hostname}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <ThinkingAnimation />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a] pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto w-full relative">
          
          {(userTier === "free" || userTier === "pro") && (
            <div className="absolute -top-8 left-0 right-0 flex justify-center">
              <span className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 px-3 py-1 rounded-full text-gray-500 shadow-sm">
                Mensajes: {userMessagesCount}/{questionLimit}
              </span>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-end gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] p-2 shadow-lg shadow-black/5 dark:shadow-white/5 focus-within:ring-2 focus-within:ring-[#1890FF]/30 focus-within:border-[#1890FF] transition-all">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts" />
            
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full transition-colors shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder={reachedQuestionLimit ? `Límite de mensajes alcanzado` : "Pregúntale a R-AI (ej. 'Resumen de mi portafolio')..."}
              className="flex-1 bg-transparent text-sm md:text-base py-3.5 max-h-32 min-h-[50px] resize-none outline-none disabled:cursor-not-allowed font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
              disabled={isLoading || reachedQuestionLimit}
              rows={1}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading || reachedQuestionLimit}
              className="p-3 m-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 disabled:opacity-30 transition-all shrink-0 hover:scale-105 active:scale-95 shadow-md"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-gray-400 font-medium">R-AI es un modelo automatizado. Verifica los datos financieros.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared UI Components (Same as Sidebar) ─────────

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-indigo-500/60" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-purple-500/80" />
      <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]" />
    </div>
  );
}

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
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all shadow-sm ${
          isOpen 
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-slate-800"
        }`}
      >
        {icons[result.tool] || <Sparkles className="w-3.5 h-3.5" />}
        {result.summary}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[300px] md:w-[380px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 p-4 max-h-[350px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contexto Analizado ({result.tool})</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-slate-800 rounded-full p-1"><X className="w-3 h-3" /></button>
            </div>
            
            <div className="space-y-2">
              {result.tool === "portfolio" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{item.symbol}</div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">${item.price?.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {result.tool === "news" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <a key={i} href={item.url || `/?tag=${item.slug}`} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors group">
                  <h4 className="text-sm font-bold line-clamp-2 leading-snug mb-1.5 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.title}</h4>
                  <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                    <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {item.source || "Reclu"}</span>
                    <span>{new Date(item.published_at).toLocaleDateString()}</span>
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
