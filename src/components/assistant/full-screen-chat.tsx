"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Sparkles, Loader2, ExternalLink, Paperclip, BarChart3, Newspaper, Bell, TrendingUp, X, Globe, History, Trash2, Plus, MessageSquare, PanelLeftClose, PanelLeft, Settings, Moon, Sun, Monitor, Type, Maximize, CheckCircle2 } from "lucide-react";
import { useAIChatStore, ChatMessage, ToolResultUI } from "@/lib/stores/ai-chat-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { useTheme } from "next-themes";


export function FullScreenChat() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return <div className="flex h-[100dvh] bg-white dark:bg-[#0a0a0a]" />;
  }
  
  return <FullScreenChatInternal />;
}

function FullScreenChatInternal() {
  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  useEffect(() => {
    setIsStoreHydrated(useAIChatStore.persist.hasHydrated());
    const unsub = useAIChatStore.persist.onFinishHydration(() => setIsStoreHydrated(true));
    return () => unsub();
  }, []);

  const {
    messages, addMessage, isLoading, setLoading, 
    attachedArticles, attachedFiles, attachFile,
    webSearchEnabled, setWebSearch, clearMessages,
    savedChats, loadChat, deleteSavedChat,
    cloudSyncEnabled, setCloudSync
  } = useAIChatStore();
  
  const [input, setInput] = useState("");
  const [showUpsell, setShowUpsell] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [realUsageCount, setRealUsageCount] = useState(0);
  
  // Chat Preferences
  const [chatPrefs, setChatPrefs] = useState({
    fontSize: "normal", // normal, large
    width: "standard" // standard, wide
  });
  const { theme, setTheme } = useTheme();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free"));
  const user = useAuthStore((s) => s.user);

  const isPremium = userTier === "max" || userTier === "ultra";

  const questionLimit = userTier === "free" ? 5 : userTier === "pro" ? 100 : userTier === "max" ? 300 : 999999;
  const reachedQuestionLimit = realUsageCount >= questionLimit;
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  const [hasPortfolio, setHasPortfolio] = useState(false);

  // Fetch real usage from Supabase
  const fetchRealUsage = async () => {
    if (!user) return;
    if (userTier === "free") {
      const { data } = await supabase.from("lifetime_usage").select("ai_messages_total").eq("user_id", user.id).single();
      setRealUsageCount(data?.ai_messages_total || 0);
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data } = await supabase.from("monthly_usage").select("ai_messages").eq("user_id", user.id).eq("month", currentMonth).single();
      setRealUsageCount(data?.ai_messages || 0);
    }
  };

  useEffect(() => {
    fetchRealUsage();
  }, [user]);

  // Load preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem("r_ai_prefs");
    if (savedPrefs) {
      try { setChatPrefs(JSON.parse(savedPrefs)); } catch {}
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("r_ai_prefs", JSON.stringify(chatPrefs));
  }, [chatPrefs]);

  // Check if user has portfolio
  useEffect(() => {
    if (user) {
      supabase.from("portfolios").select("id").eq("user_id", user.id).limit(1)
        .then(({ data }) => {
          setHasPortfolio(data && data.length > 0);
        });
    }
    
    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleWebSearchToggle = () => {
    if (isPremium) {
      setWebSearch(!webSearchEnabled);
    } else {
      setShowUpsell(true);
    }
  };

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
      fetchRealUsage(); // Refresh usage after message
    }
  };

  const shortcuts = [
    { label: "Mi portafolio", id: "portfolio_summary", query: "¿Cómo van mis acciones hoy?" },
    { label: "¿Qué pasó hoy?", id: "top_news", query: "Dame un resumen de las noticias más importantes de hoy." },
    { label: "Análisis de mercado", id: "market_analysis", query: "Analiza mi portafolio frente al mercado hoy." },
  ];

  // Dynamic classes based on preferences
  const maxWClass = chatPrefs.width === "wide" ? "max-w-5xl" : "max-w-3xl";
  const fontSizeClass = chatPrefs.fontSize === "large" ? "prose-lg" : "prose-base";
  const textClass = chatPrefs.fontSize === "large" ? "text-lg" : "text-[15px]";

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-[#0a0a0a] overflow-hidden relative font-sans">
      
      {/* ─── LEFT SIDEBAR (HISTORY) ─── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-gray-100 dark:border-white/5 bg-[#FAFAFA] dark:bg-[#0F1117] flex flex-col flex-shrink-0 z-20 absolute md:relative shadow-2xl md:shadow-none"
          >
            <div className="p-4 flex flex-col gap-2">
              <Link href="/" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all text-xs font-bold text-gray-600 dark:text-gray-300">
                <ExternalLink className="w-3.5 h-3.5" /> Volver al Inicio
              </Link>
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={() => { clearMessages(); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#1890FF]/30 hover:bg-[#1890FF]/5 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#1890FF]">
                    <Plus className="w-4 h-4" /> Nuevo Chat
                  </div>
                  <Bot className="w-4 h-4 text-gray-400 group-hover:text-[#1890FF]" />
                </button>
                
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
                  title="Ocultar menú lateral"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 hidden-scrollbar mt-2">
              <div className="mb-3 px-3">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <History className="w-3 h-3" /> Historial
                </span>
              </div>
              
              {savedChats.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium border border-dashed border-gray-200 dark:border-gray-800 rounded-xl mx-2">
                  Tus chats recientes aparecerán aquí
                </div>
              ) : (
                <div className="space-y-1">
                  {savedChats.map((chat) => (
                    <div key={chat.id} className="group flex items-center justify-between px-3 py-2.5 hover:bg-gray-200/50 dark:hover:bg-white/5 rounded-xl cursor-pointer transition-colors">
                      <div className="flex items-center gap-2.5 overflow-hidden" onClick={() => { loadChat(chat.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{chat.title}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); deleteSavedChat(chat.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Limits at bottom of sidebar */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 pb-2">
              <div className="bg-gradient-to-br from-[#1890FF]/5 to-indigo-500/5 rounded-xl p-3 border border-[#1890FF]/10 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Plan {userTier.charAt(0).toUpperCase() + userTier.slice(1)}</span>
                  <span className="text-[10px] font-bold text-[#1890FF]">{realUsageCount} / {questionLimit === 999999 ? "∞" : questionLimit}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-[#1890FF] rounded-full" style={{ width: `${Math.min(100, (realUsageCount / (questionLimit === 999999 ? realUsageCount : questionLimit)) * 100)}%` }} />
                </div>
                {userTier !== "ultra" && userTier !== "max" && (
                  <Link href="/suscripcion" className="block text-center py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-500/20">
                    Sube de Nivel
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Profile & Preferences */}
            <div className="p-3 pt-0">
              <button 
                onClick={() => setShowPreferences(true)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1890FF] to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">{user?.name ? user.name.charAt(0) : "U"}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name || "Usuario"}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Configuración</p>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-[#1890FF] group-hover:rotate-45 transition-all" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-[#0a0a0a]">
        
        {/* Toggle Sidebar Button (Floating) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#1890FF] shadow-sm hover:shadow-md transition-all"
            title="Abrir menú lateral"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {/* Close Sidebar Mobile Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden absolute inset-0 bg-black/40 backdrop-blur-sm z-10" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto hidden-scrollbar relative pb-32">
          <div className={`${maxWClass} mx-auto w-full px-4 md:px-8 pt-10 pb-8 transition-all duration-300`}>
            
            {isStoreHydrated && messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center text-center mt-6 md:mt-24 mb-10 md:mb-16">
                <div className="relative mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-[#1890FF] blur-2xl opacity-20 rounded-full"></div>
                  <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-[#0B0F1A]">
                    <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2 md:mb-3 tracking-tight">R-AI Assistant</h2>
                <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-10 max-w-md px-4">Tu agente financiero autónomo. Con acceso a mercados globales y a tu portafolio personal en tiempo real.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 w-full">
                  {shortcuts.map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => sendMessage(sc.query, sc.id)}
                      className="p-4 md:p-5 bg-gray-50/80 dark:bg-slate-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl md:rounded-3xl text-left hover:border-[#1890FF]/30 hover:bg-[#1890FF]/5 transition-all group shadow-sm hover:shadow-md hover:-translate-y-1"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center mb-3 md:mb-4 shadow-sm text-[#1890FF] group-hover:scale-110 transition-transform">
                        {sc.id.includes("portfolio") ? <BarChart3 className="w-4 h-4 md:w-5 md:h-5" /> : <Newspaper className="w-4 h-4 md:w-5 md:h-5" />}
                      </div>
                      <p className="text-[13px] md:text-sm font-bold text-gray-900 dark:text-white mb-1 md:mb-1.5 group-hover:text-[#1890FF] transition-colors">{sc.label}</p>
                      <p className="text-[11px] md:text-xs text-gray-500 font-medium line-clamp-2">{sc.query}</p>
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
                    <div className="self-end max-w-[85%] bg-gray-100 dark:bg-slate-800 rounded-[2rem] rounded-tr-sm px-6 py-4 shadow-sm border border-black/5 dark:border-white/5">
                      <p className={`${textClass} text-gray-900 dark:text-gray-100 font-medium whitespace-pre-wrap leading-relaxed`}>{msg.content}</p>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex max-w-full">
                      <div className="flex-1 space-y-3 min-w-0">
                        
                        {/* Tool Results / Thinking */}
                        {msg.toolResults && msg.toolResults.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {msg.toolResults.map((tr, i) => (
                              <ToolResultPill key={i} result={tr} />
                            ))}
                          </div>
                        )}

                        {/* Content */}
                        <div className={`prose ${fontSizeClass} dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed prose-p:my-3 prose-headings:my-5 prose-h1:text-2xl prose-h2:text-xl prose-a:text-[#1890FF] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-th:text-left prose-td:border-t border-gray-200 dark:border-gray-800 prose-table:w-full prose-table:text-sm prose-li:my-1`}>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800/50">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Fuentes Citadas</p>
                            <div className="flex flex-wrap gap-2">
                              {msg.citations.slice(0, 4).map((url, i) => {
                                let hostname = url;
                                try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                                return (
                                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-[#1890FF] dark:hover:text-[#1890FF] transition-colors bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 py-1.5 px-3 rounded-xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30">
                                    <ExternalLink className="w-3 h-3 shrink-0 text-[#1890FF]" /> <span className="truncate max-w-[180px] font-bold">{hostname}</span>
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
                <div className="flex pt-2">
                  <ThinkingAnimation />
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* ─── PREMIUM INPUT BAR (REPOSITIONED) ─── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/90 pt-8 pb-3 px-4 md:px-8 pointer-events-none">
          <div className={`${maxWClass} mx-auto w-full relative pointer-events-auto transition-all duration-300`}>
            
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-end gap-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700/50 rounded-3xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] focus-within:ring-4 focus-within:ring-[#1890FF]/15 focus-within:border-[#1890FF]/50 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts" />
              
              {/* Left Actions */}
              <div className="flex items-center gap-1.5 pb-0.5 pl-1 shrink-0">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 rounded-full transition-colors" title="Adjuntar Archivo">
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button 
                  type="button" 
                  onClick={handleWebSearchToggle} 
                  className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${
                    webSearchEnabled 
                      ? "bg-[#1890FF]/10 text-[#1890FF]" 
                      : "bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                  }`} 
                  title={webSearchEnabled ? "Búsqueda Web (Grok) Activa" : "Activar Búsqueda Web"}
                >
                  <Globe className={`w-5 h-5 ${webSearchEnabled ? "animate-pulse" : ""}`} />
                </button>
              </div>
              
              {/* Text Input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder={reachedQuestionLimit ? `Límite de consultas alcanzado` : "Pregúntale a R-AI..."}
                className="flex-1 bg-transparent text-[15px] py-3 px-2 max-h-40 min-h-[44px] resize-none outline-none disabled:cursor-not-allowed font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                disabled={isLoading || reachedQuestionLimit}
                rows={1}
              />
              
              {/* Send Button */}
              <button
                type="submit"
                disabled={!input.trim() || isLoading || reachedQuestionLimit}
                className="w-10 h-10 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 disabled:scale-100 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-2.5">
              <span className="text-[10px] text-gray-400 font-medium">R-AI puede cometer errores. Verifica la información financiera.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PREFERENCES MODAL ─── */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10">
              
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#1890FF]" /> Preferencias del Asistente
                </h3>
                <button onClick={() => setShowPreferences(false)} className="text-gray-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                
                {/* Privacy / Cloud Sync */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Privacidad y Sincronización</label>
                  <div className="bg-gray-50 dark:bg-[#0F1117] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#1890FF]" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Guardar en la Nube</span>
                      </div>
                      <button 
                        onClick={() => setCloudSync(!cloudSyncEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${cloudSyncEnabled ? "bg-[#1890FF]" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <motion.div 
                          animate={{ x: cloudSyncEnabled ? 24 : 0 }} 
                          className="w-5 h-5 bg-white rounded-full shadow-sm" 
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Tus chats se guardan <strong className="text-gray-700 dark:text-gray-300">localmente en este dispositivo</strong> para proteger tu privacidad. Activa esto para guardarlos de forma segura en nuestros servidores y poder verlos en tu celular u otros dispositivos.
                    </p>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Apariencia</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setTheme("light")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Sun className="w-6 h-6" /> <span className="text-xs font-bold">Claro</span>
                    </button>
                    <button onClick={() => setTheme("dark")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Moon className="w-6 h-6" /> <span className="text-xs font-bold">Oscuro</span>
                    </button>
                    <button onClick={() => setTheme("system")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Monitor className="w-6 h-6" /> <span className="text-xs font-bold">Sistema</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Tamaño de Texto</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setChatPrefs({...chatPrefs, fontSize: "normal"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.fontSize === 'normal' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Type className="w-4 h-4" /> <span className="text-sm font-bold">Normal</span>
                    </button>
                    <button onClick={() => setChatPrefs({...chatPrefs, fontSize: "large"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.fontSize === 'large' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Type className="w-5 h-5" /> <span className="text-sm font-bold">Grande</span>
                    </button>
                  </div>
                </div>

                {/* Chat Width */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Ancho del Chat</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setChatPrefs({...chatPrefs, width: "standard"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.width === 'standard' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Monitor className="w-4 h-4" /> <span className="text-sm font-bold">Estándar</span>
                    </button>
                    <button onClick={() => setChatPrefs({...chatPrefs, width: "wide"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.width === 'wide' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Maximize className="w-4 h-4" /> <span className="text-sm font-bold">Amplio</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UPSELL MODAL (REDESIGNED) ─── */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-[#0F1117] rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-gray-100 dark:border-white/10 text-center overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#1890FF]/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

              <button onClick={() => setShowUpsell(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2 z-10">
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl ring-8 ring-[#1890FF]/10">
                  <Globe className="w-12 h-12 text-white" />
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Internet en Vivo</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-[280px] mx-auto font-medium">
                  Sube de nivel para conectar el asistente a <strong className="text-gray-900 dark:text-white">Grok 4.3</strong> y la web en tiempo real.
                </p>
                
                <div className="space-y-3 text-left mb-8 bg-gray-50 dark:bg-white/5 p-5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Búsqueda web sin censura</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Datos financieros al milisegundo</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Límites expandidos (Hasta 600 msgs)</span>
                  </div>
                </div>
                
                <Link href="/suscripcion" onClick={() => setShowUpsell(false)} className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white font-black text-base hover:shadow-lg hover:shadow-[#1890FF]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Actualizar a Premium
                </Link>
                <button onClick={() => setShowUpsell(false)} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  Quizás más tarde
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared UI Components ─────────

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]/50" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]/80" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]" />
    </div>
  );
}

function ToolResultPill({ result }: { result: ToolResultUI }) {
  const [isOpen, setIsOpen] = useState(false);

  const icons = {
    portfolio: <BarChart3 className="w-4 h-4" />,
    stock_info: <TrendingUp className="w-4 h-4" />,
    news: <Newspaper className="w-4 h-4" />,
    alerts: <Bell className="w-4 h-4" />,
  };

  const renderPillContent = () => {
    if (result.tool === "portfolio" && Array.isArray(result.data) && result.data.length > 0) {
      const avgChange = result.data.reduce((sum: number, s: any) => sum + (s.changePercent || 0), 0) / result.data.length;
      return (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-1">
            {result.data.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="relative z-10 w-5 h-5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-white dark:bg-slate-700">
                {item.logo && (
                  <img src={item.logo} alt={item.symbol} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} className="absolute inset-0 w-full h-full object-cover bg-white" />
                )}
                <div className={`${item.logo ? 'hidden' : ''} absolute inset-0 flex items-center justify-center border border-gray-100 dark:border-slate-600 font-bold text-[8px] text-gray-600 dark:text-gray-300`}>
                  {item.symbol.substring(0, 2)}
                </div>
              </div>
            ))}
          </div>
          <span>{result.data.length} activos</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className={avgChange >= 0 ? "text-green-500" : "text-red-500"}>
            {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
          </span>
        </div>
      );
    }

    if (result.tool === "news" && Array.isArray(result.data) && result.data.length > 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-1">
            {result.data.slice(0, 3).map((item: any, i: number) => (
              item.image_url ? (
                <img key={i} src={item.image_url} alt="" className="w-5 h-5 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-900 z-10" />
              ) : (
                <div key={i} className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900 z-10">
                  <Newspaper className="w-2.5 h-2.5 text-gray-400" />
                </div>
              )
            ))}
          </div>
          <span>{result.data.length} noticias analizadas</span>
        </div>
      );
    }

    return (
      <>
        {icons[result.tool] || <Sparkles className="w-4 h-4" />}
        {result.summary}
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border text-[11px] md:text-xs font-bold transition-all shadow-sm ${
          isOpen 
            ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF]" 
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:border-[#1890FF]/50 hover:bg-gray-50 dark:hover:bg-slate-800"
        }`}
      >
        {renderPillContent()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[320px] md:w-[400px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 p-4 max-h-[350px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contexto Analizado ({result.tool})</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-slate-800 rounded-full p-1"><X className="w-3 h-3" /></button>
            </div>
            
            <div className="space-y-2">
              {result.tool === "portfolio" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-700 shrink-0">
                      {item.logo && (
                        <img src={item.logo} alt={item.symbol} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} className="absolute inset-0 w-full h-full object-cover bg-white" />
                      )}
                      <div className={`${item.logo ? 'hidden' : ''} absolute inset-0 flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-300`}>
                        {item.symbol.substring(0, 2)}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">${item.price?.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {result.tool === "news" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <a key={i} href={item.url || `/?tag=${item.slug}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-[#1890FF]/5 hover:border-[#1890FF]/20 border border-transparent transition-colors group">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                      <Newspaper className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col justify-between py-0.5">
                    <h4 className="text-[13px] font-bold line-clamp-2 leading-snug mb-1 text-gray-900 dark:text-white group-hover:text-[#1890FF]">{item.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 text-[#1890FF]" /> {item.source || "Reclu"}</span>
                    </div>
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
