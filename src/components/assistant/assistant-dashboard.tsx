"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantStore, debouncedSave, Ticker } from "@/lib/stores/assistant-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";
import {
  Loader2, Send, Settings, Sparkles, User as UserIcon, Bot, Search, ArrowRight, X,
  TrendingDown, TrendingUp, Layers, ChevronRight, ArrowLeft, GripVertical, Plus,
  Headphones, Sun, Moon, ChevronDown, Zap, Newspaper, MessageSquare, BarChart3, Paperclip,
  LayoutGrid, List, AlignJustify
} from "lucide-react";
import { NewsCard } from "@/components/news-card";
import { TraditionalNewspaper } from "@/components/traditional-newspaper";
import { SearchDialog } from "@/components/search-dialog";
import ReactMarkdown from "react-markdown";
import { TOPIC_INTERESTS } from "./assistant-setup";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { useViewStore } from "@/lib/stores/use-view-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QUICK_ACTIONS = [
  { icon: <TrendingUp className="w-3.5 h-3.5" />, label: "¿Cómo va mi portafolio?", prompt: "Dame un resumen rápido de cómo están mis activos hoy basándote en las noticias recientes." },
  { icon: <Newspaper className="w-3.5 h-3.5" />, label: "Resumen del día", prompt: "Hazme un resumen ejecutivo de las noticias más relevantes para mis intereses de hoy." },
  { icon: <Zap className="w-3.5 h-3.5" />, label: "Alertas de impacto", prompt: "¿Hay alguna noticia de alto impacto que deba saber ahora mismo?" },
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Análisis de tendencias", prompt: "Analiza las tendencias principales de esta semana en mis temas de interés." },
];

export function AssistantDashboard() {
  const {
    name, topics, tickers, interests,
    showPreferences, setShowPreferences,
    showSettings, setShowSettings,
    messages, addMessage, clearMessages, saveMessage, clearMessagesSupabase,
    resetSetup, loadFromSupabase
  } = useAssistantStore();

  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();
  const toggleAudioSidebar = useAudioPlayerStore((s) => s.toggleSidebar);
  const isAudioOpen = useAudioPlayerStore((s) => s.isOpen);
  const { timePeriod } = useViewStore();

  const [articles, setArticles] = useState<any[]>([]);
  const [impactScores, setImpactScores] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [radarView, setRadarView] = useState<"grid" | "list" | "compact" | "traditional">("traditional");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Layout resizing state
  const [chatWidth, setChatWidth] = useState(35);
  const [isResizing, setIsResizing] = useState(false);

  // Chat State
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = (mouseMoveEvent.clientX / window.innerWidth) * 100;
        if (newWidth > 25 && newWidth < 65) setChatWidth(newWidth);
      }
    },
    [isResizing]
  );

  useEffect(() => setMounted(true), []);

  // Load assistant config from Supabase on mount
  useEffect(() => {
    if (user?.id) {
      loadFromSupabase(user.id);
    }
  }, [user?.id, loadFromSupabase]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    fetchPersonalizedNews();
  }, [topics, tickers, interests, timePeriod]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchPersonalizedNews = async () => {
    setIsLoading(true);
    let query = supabase.from("news_articles").select("*");

    if (timePeriod === "recent") {
      query = query.order("published_at", { ascending: false });
    } else {
      // Prioritize most important (relevant) news for time-bounded queries, fallback to recency
      query = query
        .order("relevance_score", { ascending: false, nullsFirst: false })
        .order("published_at", { ascending: false });

      if (timePeriod === "24h") {
        query = query.gte("published_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      } else if (timePeriod === "7d") {
        query = query.gte("published_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
      } else if (timePeriod === "30d") {
        query = query.gte("published_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      }
    }

    const { data } = await query.limit(60);

    if (data) {
      const filtered = data.filter((a) => {
        let match = false;
        if (Array.isArray(a.tags)) {
          if (topics.some((t) => a.tags.includes(t))) match = true;
          if (tickers.some((t) => a.tags.includes(t.symbol))) match = true;
          Object.values(interests).forEach((subList) => {
            if (subList.some((s) => a.tags.includes(s))) match = true;
          });
        }
        if (!match) {
          const content = `${a.title || ""} ${a.summary || ""}`.toLowerCase();
          if (tickers.some((t) => content.includes(t.symbol.toLowerCase()) || content.includes(t.name.toLowerCase()))) match = true;
          if (!match) {
            Object.values(interests)
              .flat()
              .forEach((interest) => {
                if (content.includes(interest.toLowerCase())) match = true;
              });
          }
        }
        return match;
      });

      // Apply topic filter if active
      let finalArticles = filtered;
      if (activeTopic) {
        finalArticles = filtered.filter((a) => {
          const content = `${a.title || ""} ${a.summary || ""}`.toLowerCase();
          const topicInterests = interests[activeTopic] || [];
          return (
            (Array.isArray(a.tags) && a.tags.includes(activeTopic)) ||
            topicInterests.some((i) => content.includes(i.toLowerCase())) ||
            content.includes(activeTopic.toLowerCase())
          );
        });
      }

      const top10 = finalArticles.slice(0, 10);
      setArticles(top10);
      setIsLoading(false);

      if (top10.length > 0) evaluateImpact(top10);
    } else {
      setIsLoading(false);
    }
  };

  const evaluateImpact = async (newsDocs: any[]) => {
    setIsScoring(true);
    try {
      const payload = {
        articles: newsDocs.map((a) => ({ id: a.id, title: a.title, summary: a.summary })),
        userProfile: { topics, tickers, interests },
      };
      const res = await fetch("/api/ai/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const scores = await res.json();
        setImpactScores(scores);
      }
    } catch (e) {
      console.error("Impact parsing error", e);
    } finally {
      setIsScoring(false);
    }
  };

  const sendMessage = async (e?: React.FormEvent, overrideMsg?: string) => {
    if (e) e.preventDefault();
    const msgText = overrideMsg || inputMsg.trim();
    if (!msgText) return;

    const userMsg = { role: "user" as const, content: msgText };
    addMessage(userMsg);
    if (user?.id) saveMessage(user.id, userMsg);
    setInputMsg("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          profile: { name, topics, tickers },
          contextArticles: articles.slice(0, 5),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = { role: "assistant" as const, content: data.reply };
        addMessage(aiMsg);
        if (user?.id) saveMessage(user.id, aiMsg);
      } else {
        const errMsg = { role: "assistant" as const, content: "Lo siento, he perdido la conexión a mis servidores core." };
        addMessage(errMsg);
        if (user?.id) saveMessage(user.id, errMsg);
      }
    } catch (error) {
      const errMsg = { role: "assistant" as const, content: "Lo siento, hubo un error de red." };
      addMessage(errMsg);
      if (user?.id) saveMessage(user.id, errMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const isOverlayOpen = showPreferences || showSettings;

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[#FAFBFC] dark:bg-[#0B0F1A] text-gray-900 dark:text-gray-100 font-sans">
      {/* Overlays */}
      <AssistantPreferencesOverlay />
      <AssistantSettingsOverlay />
      <SearchDialog isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Dashboard container */}
      <div
        className={`flex flex-col h-full w-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOverlayOpen ? "filter blur-lg opacity-40 scale-[0.98] pointer-events-none select-none" : "scale-100"
        }`}
      >
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* ── LEFT PANEL: CHAT ── */}
          <div
            style={{ width: `${chatWidth}%` }}
            className="flex flex-col bg-white dark:bg-[#0F1629] relative min-w-[320px] shadow-[4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.3)] z-10"
          >
            {/* ═══ Premium Integrated Header ═══ */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3">
              {/* Left: Logo + Assistant Name */}
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 group shrink-0" title="Volver al Inicio">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1890FF] to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <ArrowLeft className="w-4 h-4 text-white" />
                  </div>
                </Link>
                <div className="w-px h-7 bg-gray-200 dark:bg-white/10" />
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-tr from-[#1890FF] to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-[#0F1629] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div className="hidden sm:block">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[120px]">
                      {name || "Mi Asistente"}
                    </h2>
                    <span className="text-[9px] font-bold text-green-500 uppercase tracking-[0.15em]">Online</span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex items-center gap-1.5">
                {/* Search */}
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5 transition-all"
                  title="Buscar (⌘K)"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Setup / Config */}
                <button
                  onClick={() => setShowPreferences(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5 transition-all"
                  title="Configurar Mi Radar"
                >
                  <Layers className="w-4 h-4" />
                </button>

                {/* View Preferences */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all"
                  title="Preferencias"
                >
                  <Settings className="w-4 h-4" />
                </button>

                {/* Audio */}
                <button
                  onClick={toggleAudioSidebar}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    isAudioOpen
                      ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/30"
                      : "text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5"
                  }`}
                  title="Reclu Radio"
                >
                  <Headphones className="w-4 h-4" />
                </button>

                {/* Theme */}
                {mounted && (
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-500/5 transition-all"
                    title={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                  >
                    {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                )}

                <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-0.5" />

                {/* Avatar */}
                {mounted && user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none">
                      <Avatar className="w-8 h-8 border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-[#1890FF]/30 transition-all cursor-pointer">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-[10px] font-bold bg-[#1890FF] text-white">{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-gray-200 dark:border-gray-800 shadow-xl p-2 bg-white dark:bg-slate-900 mt-2">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="py-2 px-3">
                          <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">{user.name}</p>
                          <p className="text-[11px] text-gray-500 line-clamp-1">{user.email}</p>
                        </DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                      <Link href="/profile">
                        <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          <UserIcon className="w-4 h-4 mr-2 text-gray-500" />
                          Mi Perfil
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/suscripcion">
                        <DropdownMenuItem className="text-sm py-2 px-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#1890FF] font-medium">
                          Suscripción Premium
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800 mx-1" />
                      <DropdownMenuItem onClick={handleLogout} className="text-sm py-2 px-3 cursor-pointer rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        Cerrar sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* New Chat */}
                <button
                  onClick={() => {
                    if (user?.id) clearMessagesSupabase(user.id);
                    else clearMessages();
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/5 transition-all group"
                  title="Nuevo chat"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {/* ═══ Messages ═══ */}
            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 hidden-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  {/* Empty State with Quick Actions */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#1890FF]/10 to-indigo-500/10 dark:from-[#1890FF]/15 dark:to-indigo-500/15 rounded-[1.8rem] flex items-center justify-center mb-5 mx-auto ring-4 ring-white dark:ring-[#0F1629] shadow-xl">
                      <Sparkles className="w-10 h-10 text-[#1890FF]" />
                    </div>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2">Hola, soy {name || "tu asistente"}</h3>
                    <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                      Monitoreando {topics.length} temáticas y {tickers.length} activos en tiempo real. ¿En qué puedo ayudarte?
                    </p>
                  </motion.div>

                  {/* Quick Action Chips */}
                  <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                    {QUICK_ACTIONS.map((action, i) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        onClick={() => sendMessage(undefined, action.prompt)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-semibold transition-all bg-gray-50 dark:bg-white/5 hover:bg-[#1890FF]/5 dark:hover:bg-[#1890FF]/10 border border-gray-100 dark:border-white/5 hover:border-[#1890FF]/20 text-gray-600 dark:text-gray-300 hover:text-[#1890FF] group"
                      >
                        <span className="flex-shrink-0 text-gray-400 group-hover:text-[#1890FF] transition-colors">{action.icon}</span>
                        <span className="line-clamp-2">{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-[#1890FF] to-blue-600 text-white rounded-tr-sm shadow-blue-500/15"
                          : "bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-white/5 rounded-tl-sm"
                      }`}
                    >
                      <div className={`prose prose-sm dark:prose-invert max-w-none ${msg.role === "user" ? "text-white prose-headings:text-white prose-p:text-white prose-strong:text-white" : ""}`}>
                        {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : <p className="m-0 whitespace-pre-wrap text-sm font-medium">{msg.content}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-[#1890FF]/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#1890FF]/80 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#1890FF] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* ═══ Premium Floating Input ═══ */}
            <div className="px-4 pb-3 pt-2">
              <form onSubmit={sendMessage} className="relative group">
                <input type="hidden" />
                <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.txt,.csv,.json,.md" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // File handling placeholder - will integrate with chat context
                    const userMsg = { role: 'user' as const, content: `📎 Archivo adjunto: ${file.name}` };
                    addMessage(userMsg);
                    if (user?.id) saveMessage(user.id, userMsg);
                  }
                  e.target.value = '';
                }} />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#1890FF] hover:bg-[#1890FF]/5 transition-all"
                  title="Adjuntar archivo"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Escribe tu consulta..."
                  className="w-full bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 rounded-2xl pl-12 pr-14 py-3.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1890FF]/50 focus:bg-white dark:focus:bg-white/5 focus:shadow-[0_0_0_3px_rgba(24,144,255,0.08)] transition-all font-medium placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-gradient-to-r from-[#1890FF] to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-500/15 active:scale-95 disabled:opacity-25 disabled:shadow-none"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[9px] text-center text-gray-300 dark:text-gray-600 mt-2 font-medium">Nuestro asistente puede cometer errores. Verifica las respuestas.</p>
            </div>
          </div>

          {/* ── DRAG HANDLE ── */}
          <div
            onMouseDown={startResizing}
            className="hidden md:flex absolute top-0 bottom-0 z-50 w-2 cursor-col-resize items-center justify-center group hover:bg-[#1890FF]/80 transition-colors"
            style={{ left: `${chatWidth}%`, transform: "translateX(-50%)" }}
          >
            <div className="w-1 h-14 bg-gray-200 dark:bg-gray-700 rounded-full group-hover:bg-white group-hover:scale-y-125 transition-all shadow-md" />
          </div>

          {/* ── RIGHT PANEL: NEWS FEED ── */}
          <div style={{ width: `${100 - chatWidth}%` }} className="flex flex-col bg-[#F8F9FB] dark:bg-[#080C16] overflow-hidden relative min-w-[320px]">
            {/* News Panel Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight">Tu Radar</h2>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-full">
                  {articles.length} artículos
                </span>
                <AnimatePresence>
                  {isScoring && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[#1890FF] bg-[#1890FF]/5 px-2.5 py-1 rounded-full"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Evaluando
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex bg-gray-100 dark:bg-white/5 rounded-lg p-0.5 ml-auto">
                <button onClick={() => setRadarView("grid")} title="Vista Cuadrícula" className={`p-1.5 rounded-md transition-all ${radarView === "grid" ? "bg-white dark:bg-slate-800 shadow-sm text-[#1890FF]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setRadarView("list")} title="Vista Lista" className={`p-1.5 rounded-md transition-all ${radarView === "list" ? "bg-white dark:bg-slate-800 shadow-sm text-[#1890FF]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><List className="w-4 h-4" /></button>
                <button onClick={() => setRadarView("compact")} title="Vista Compacta" className={`p-1.5 rounded-md transition-all ${radarView === "compact" ? "bg-white dark:bg-slate-800 shadow-sm text-[#1890FF]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><AlignJustify className="w-4 h-4" /></button>
                <button onClick={() => setRadarView("traditional")} title="Vista Tradicional" className={`p-1.5 rounded-md transition-all ${radarView === "traditional" ? "bg-white dark:bg-slate-800 shadow-sm text-[#1890FF]" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}><BookOpen className="w-4 h-4" /></button>
              </div>
            </div>

            {/* Topic Filter Chips */}
            {topics.length > 0 && (
              <div className="px-6 py-2.5 flex items-center gap-2 overflow-x-auto hidden-scrollbar border-b border-gray-100 dark:border-white/5">
                <button
                  onClick={() => { setActiveTopic(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    !activeTopic
                      ? "bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/20"
                      : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                  }`}
                >
                  Todos
                </button>
                {topics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      activeTopic === topic
                        ? "bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/20"
                        : "bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10"
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {/* News List */}
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              <div className="max-w-3xl mx-auto p-5 md:p-8">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <div className="w-16 h-16 bg-[#1890FF]/5 rounded-2xl flex items-center justify-center mb-6 ring-4 ring-[#1890FF]/5">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
                    </div>
                    <p className="font-bold text-base text-gray-700 dark:text-gray-300">Escaneando fuentes...</p>
                  </div>
                ) : articles.length > 0 ? (
                  radarView === "traditional" ? (
                    <TraditionalNewspaper articles={articles} />
                  ) : (
                  <div className={`mt-4 ${
                    radarView === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4" :
                    radarView === "list" ? "grid grid-cols-1 gap-4" :
                    "grid grid-cols-1 gap-2"
                  }`}>
                    {articles.map((article, idx) => {
                      const impactCode = impactScores[article.id];
                      return (
                        <div key={article.id} className="relative group flex">
                          <div className="transition-transform duration-500 ease-out flex-1 group-hover:scale-[1.01] h-full flex flex-col">
                            <NewsCard 
                              article={article} 
                              index={idx} 
                              layout={radarView} 
                            />
                          </div>
                          <AnimatePresence>
                            {impactCode && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -20, rotateY: 90 }}
                                animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
                                className="absolute -right-4 -top-4 z-20 pointer-events-none"
                              >
                                <ImpactVisualizer code={impactCode} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                  )
                ) : (
                  <div className="text-center py-28 bg-white/50 dark:bg-white/[0.02] backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-white/5 shadow-inner">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Sin resultados</h3>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                      No hay noticias recientes que coincidan con{activeTopic ? ` "${activeTopic}"` : " tus filtros"}. Intenta con otra temática.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subcomponents ──

function ImpactVisualizer({ code }: { code: string }) {
  const isPositive = code.startsWith("P");
  const isNegative = code.startsWith("N") && code !== "NU";
  const isNeutral = code === "NU";

  const intensityMatch = code.match(/\d+/);
  const intensity = intensityMatch ? parseInt(intensityMatch[0], 10) : 0;

  if (isNeutral) {
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-xl border border-gray-200/50 dark:border-white/10 rounded-xl px-4 py-3 flex items-center gap-2.5">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Neutral</span>
        <div className="w-10 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  const activeColor = isPositive ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
  const inactiveColor = "bg-gray-100 dark:bg-slate-800";

  return (
    <div className="bg-white/95 dark:bg-[#0F1629]/95 backdrop-blur-2xl shadow-xl border border-gray-200/50 dark:border-white/5 rounded-2xl p-4 flex flex-col gap-2 items-center min-w-[100px]">
      <div className="flex items-center gap-1.5">
        {isPositive ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
        <span className={`text-[10px] font-black uppercase tracking-widest ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "Alza" : "Alerta"}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`w-3 h-5 rounded-sm transition-all ${level <= intensity ? activeColor : inactiveColor}`}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
        {intensity}/5
      </span>
    </div>
  );
}

function AssistantPreferencesOverlay() {
  const { showPreferences, setShowPreferences, resetSetup } = useAssistantStore();
  const { user } = useAuthStore();

  if (!showPreferences) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-2xl">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 relative">
        <button onClick={() => { setShowPreferences(false); if (user?.id) debouncedSave(user.id); }} className="absolute top-6 right-6 p-3 bg-gray-100/50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 z-10 hover:rotate-90">
          <X className="w-5 h-5" />
        </button>
        <div className="p-10 md:p-14 min-h-[450px]">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-[#1890FF]/10 rounded-2xl flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg">
              <Layers className="w-8 h-8 text-[#1890FF]" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Preferencias</h2>
              <p className="text-sm font-medium text-gray-500">Espectro de escaneo activo</p>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 space-y-3">
            <button onClick={() => { setShowPreferences(false); resetSetup(); if (user?.id) debouncedSave(user.id); }} className="w-full py-5 bg-[#1890FF] hover:bg-blue-600 text-white rounded-2xl font-bold transition-all shadow-lg active:scale-95 text-lg">
              Reconfigurar mi Radar Completo
            </button>
            <button onClick={() => setShowPreferences(false)} className="w-full py-4 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 rounded-2xl font-semibold transition-all active:scale-95 text-base flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Volver al Asistente
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AssistantSettingsOverlay() {
  const { showSettings, setShowSettings, name, setName, assistantTone, setAssistantTone, assistantRole, setAssistantRole } = useAssistantStore();
  const { user } = useAuthStore();

  if (!showSettings) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-2xl">
      <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="w-full max-w-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 dark:border-white/10 relative">
        <button onClick={() => { setShowSettings(false); if (user?.id) debouncedSave(user.id); }} className="absolute top-6 right-6 p-3 bg-gray-100/50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 z-10 hover:rotate-90">
          <X className="w-5 h-5" />
        </button>
        <div className="p-10 md:p-14 max-h-[85vh] overflow-y-auto scrollbar-thin">
          <h2 className="text-3xl font-black mb-8 text-gray-900 dark:text-white">ADN del Asistente</h2>
          <div className="space-y-8">
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3 block">Identidad</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-50 dark:bg-slate-800/80 border-2 border-gray-200 dark:border-slate-700/50 rounded-2xl p-5 font-bold text-lg focus:outline-none focus:border-indigo-500" />
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition-all">
              Guardar Cambios
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
