"use client";

import { useState, useEffect, useRef } from "react";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Palette, Layers, Sliders, Database, Globe, Sparkles, Compass, Headphones, Send, Loader2, Bot, PlusCircle, History, ChevronLeft, AlertCircle, CheckCircle2, MessageSquare, BarChart3, Brain, Cpu, Volume2, BellRing, Briefcase, Zap, Crown, ArrowUpRight, RefreshCw } from "lucide-react";
import { cn, getCleanPathname } from "@/lib/utils";
import { useLanguageStore } from "@/lib/stores/language-store";
import { useTranslation } from "@/lib/translations";
import { createClient } from "@/lib/supabase/client";
import { SupportTicket, SupportMessage } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ViewSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: TabType;
}

type TabType = "cuenta" | "usage" | "apariencia" | "comportamiento" | "customize" | "datos" | "soporte";

function SegmentControl<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: { id: T; label: string }[];
  selected: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 rounded-xl p-0.5 relative w-full">
      {options.map((opt) => {
        const isSelected = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative z-10 flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer select-none",
              isSelected
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                : "text-muted-foreground/80 hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ active, onChange }: { active: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors duration-300 outline-none shrink-0 cursor-pointer",
        active ? "bg-[#1890FF]" : "bg-gray-300 dark:bg-white/10"
      )}
    >
      <motion.div
        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
        animate={{ x: active ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function getInitials(name: string, email: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function ViewSettingsDialog({ isOpen, onClose, defaultTab }: ViewSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("cuenta");
  const preference = useLanguageStore((s) => s.preference);
  const setPreference = useLanguageStore((s) => s.setPreference);
  const activeLanguage = useLanguageStore((s) => s.language);
  const { t } = useTranslation(activeLanguage);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab || "cuenta");
      setSupportView("home");
      setSelectedTicket(null);
    }
  }, [isOpen, defaultTab]);

  // Support state
  const [supportView, setSupportView] = useState<"home" | "new_ticket" | "chat">("home");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New ticket form
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("Soporte Técnico");
  const [newTicketMessage, setNewTicketMessage] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadTickets = async () => {
    if (!user) return;
    setIsLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error("Error loading tickets:", err);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "soporte" && isAuthenticated && user) {
      loadTickets();
    }
  }, [activeTab, isAuthenticated, user]);

  useEffect(() => {
    if (activeTab !== "soporte" || !selectedTicket) return;

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("support_messages")
          .select("*")
          .eq("ticket_id", selectedTicket.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Error loading messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();

    // Subscribe to new messages for this ticket
    const channel = supabase
      .channel(`support_chat_${selectedTicket.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${selectedTicket.id}`
      }, (payload) => {
        const newMsg = payload.new as SupportMessage;
        setMessages((prev) => {
          if (!prev.find(m => m.id === newMsg.id)) {
            return [...prev, newMsg];
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, supportView]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket || !user || isSending) return;

    const msgText = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      const { data, error } = await supabase
        .from("support_messages")
        .insert([{
          ticket_id: selectedTicket.id,
          user_id: user.id,
          is_admin: false,
          message: msgText
        }])
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);

      await supabase
        .from("support_tickets")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedTicket.id);

      loadTickets();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketMessage.trim() || !user || isSending) return;

    setIsSending(true);
    try {
      const fullSubject = `[${newTicketCategory}] ${newTicketSubject.trim()}`;
      const { data: ticketData, error: ticketError } = await supabase
        .from("support_tickets")
        .insert([{
          user_id: user.id,
          subject: fullSubject,
          status: 'open'
        }])
        .select()
        .single();

      if (ticketError) throw ticketError;

      const { error: messageError } = await supabase
        .from("support_messages")
        .insert([{
          ticket_id: ticketData.id,
          user_id: user.id,
          is_admin: false,
          message: newTicketMessage.trim()
        }]);

      if (messageError) throw messageError;

      setNewTicketSubject("");
      setNewTicketMessage("");
      setNewTicketCategory("Soporte Técnico");

      await loadTickets();
      setSelectedTicket(ticketData);
      setSupportView("chat");
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async (ticketId: string) => {
    if (!confirm("¿Estás seguro de que deseas marcar esta consulta como resuelta?")) return;
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status: 'closed' })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (err) {
      console.error("Error closing ticket:", err);
    }
  };

  const handleLanguageChange = (pref: "default" | "es" | "en") => {
    setPreference(pref);
    
    // Determine the target locale to push to URL
    let targetLang: "es" | "en" = "es";
    if (pref === "default") {
      const browserLang = typeof navigator !== "undefined" ? navigator.language : "es";
      targetLang = browserLang.toLowerCase().startsWith("es") ? "es" : "en";
    } else {
      targetLang = pref;
    }

    // Rewrite the browser URL
    const rawPath = window.location.pathname;
    // Clean it of any es/en prefixes
    const cleanPath = getCleanPathname(rawPath);
    const search = window.location.search;
    const newPath = `/${targetLang}${cleanPath === '/' ? '' : cleanPath}${search}`;
    
    router.push(newPath);
  };

  // View preferences
  const {
    density, setDensity,
    showImages, setShowImages,
  } = useViewStore();

  // Assistant preferences
  const assistant = useAssistantStore();

  // Cloud sync preferences
  const chatSync = useAIChatStore((s) => s.cloudSyncEnabled);
  const setChatSync = useAIChatStore((s) => s.setCloudSync);
  const wbSync = useWebBuilderStore((s) => s.cloudSyncEnabled);
  const setWbSync = useWebBuilderStore((s) => s.setCloudSync);

  // Plan consumption state
  const [usageData, setUsageData] = useState<any | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState(false);

  const fetchUsageData = async () => {
    setUsageLoading(true);
    setUsageError(false);
    try {
      const res = await fetch("/api/user/usage");
      if (res.ok) {
        setUsageData(await res.json());
      } else {
        setUsageError(true);
      }
    } catch {
      setUsageError(true);
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === "usage") {
      fetchUsageData();
    }
  }, [isAuthenticated, activeTab]);

  // Load preferences from Supabase if open
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      assistant.loadFromSupabase(user.id);
    }
  }, [isOpen, isAuthenticated, user]);

  const handleClose = async () => {
    if (isAuthenticated && user) {
      try {
        await assistant.saveToSupabase(user.id);
      } catch (err) {
        console.error("Error auto-saving settings to Supabase:", err);
      }
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[820px] h-[550px] md:h-[500px] flex flex-col md:flex-row overflow-hidden rounded-3xl border border-gray-200/80 dark:border-white/5 bg-white dark:bg-zinc-950 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Sidebar navigation */}
            <div className="w-full md:w-[210px] bg-[#FAF9F5] dark:bg-[#080C16] p-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible md:overflow-y-auto border-b md:border-b-0 md:border-r border-[#E9E8E4] dark:border-white/5 shrink-0 select-none hidden-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab("cuenta")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "cuenta"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <User className="h-4 w-4 shrink-0" />
                <span>Cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("usage")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "usage"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                <span>Plan y Consumo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("apariencia")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "apariencia"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <Palette className="h-4 w-4 shrink-0" />
                <span>Apariencia</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("comportamiento")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "comportamiento"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <Layers className="h-4 w-4 shrink-0" />
                <span>Comportamiento</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("customize")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "customize"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <Sliders className="h-4 w-4 shrink-0" />
                <span>Personalizar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("datos")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "datos"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <Database className="h-4 w-4 shrink-0" />
                <span>Controles de datos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("soporte")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all cursor-pointer whitespace-nowrap md:w-full",
                  activeTab === "soporte"
                    ? "bg-white dark:bg-[#1E293B] border border-[#E9E8E4] dark:border-white/10 text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground/80 hover:text-foreground hover:bg-gray-100/50 dark:hover:bg-white/[0.01] font-medium"
                )}
              >
                <Headphones className="h-4 w-4 shrink-0" />
                <span>Soporte</span>
              </button>
            </div>

            {/* Right Content panel */}
            <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col relative min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 shrink-0 select-none">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  {activeTab === "datos" ? "Controles de datos" : activeTab === "customize" ? "Personalizar Asistente" : activeTab === "soporte" ? "Centro de Soporte" : activeTab === "usage" ? "Plan y Consumo" : activeTab}
                </h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Cerrar ajustes"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Scrollable Settings Panel */}
              <div className={cn(
                "flex-1 hidden-scrollbar",
                activeTab === "soporte" ? "p-0 overflow-hidden flex flex-col h-full relative" : "p-6 overflow-y-auto pb-6"
              )}>
                {activeTab === "cuenta" && (
                  <div className="space-y-5">
                    {/* User Profile Card */}
                    <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {getInitials(displayName, displayEmail)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xs font-semibold text-gray-900 dark:text-white truncate">{displayName}</h3>
                          <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => { handleClose(); router.push("/profile"); }}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shrink-0"
                      >
                        Administrar
                      </button>
                    </div>

                    {/* Premium Upgrade */}
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Compass className="w-4.5 h-4.5 text-slate-800 dark:text-slate-200 shrink-0" />
                        <span className="text-[11px] font-semibold">Obtener Maverlang Ultra</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { handleClose(); router.push("/suscripcion"); }}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shrink-0"
                      >
                        Actualizar
                      </button>
                    </div>

                    {/* Language setting */}
                    <div className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Globe className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px] font-semibold">
                          {t("language")}: <span className="font-bold text-gray-900 dark:text-white">{preference === "default" ? t("default") : preference === "en" ? "English" : "Español"}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLanguageChange(activeLanguage === "es" ? "en" : "es")}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-55 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shrink-0"
                      >
                        {t("change")}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === "usage" && (
                  <div className="space-y-4">
                    {/* Plan Header */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1890FF] via-[#6366F1] to-[#8B5CF6] p-4 text-white">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzEuNjU3IDAgMyAxLjM0MyAzIDNzLTEuMzQzIDMtMyAzLTMtMS4zNDMtMy0zIDEuMzQzLTMgMy0zek0xOCAzNmMxLjY1NyAwIDMgMS4zNDMgMyAzcy0xLjM0MyAzLTMgMy0zLTEuMzQzLTMtMyAxLjM0My0zIDMtM3oiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Crown className="w-4 h-4" />
                            <span className="text-[10px] font-medium opacity-80">Tu plan actual</span>
                          </div>
                          <h3 className="text-base font-black">
                            {usageData?.planName || (user?.tier === "free" ? "Gratuito" : user?.tier?.toUpperCase()) || "Cargando..."}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={fetchUsageData}
                            disabled={usageLoading}
                            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-sm"
                            title="Actualizar datos"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${usageLoading ? "animate-spin" : ""}`} />
                          </button>
                          {usageData?.tier === "free" && (
                            <button
                              type="button"
                              onClick={() => { handleClose(); router.push("/suscripcion"); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white text-[#6366F1] font-bold text-[10px] rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                            >
                              <Zap className="w-3 h-3 animate-pulse" />
                              Mejorar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Resources */}
                    {usageLoading && !usageData ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1890FF]" />
                      </div>
                    ) : usageError ? (
                      <div className="text-center py-6">
                        <p className="text-xs text-gray-500 mb-2">No se pudo cargar el consumo.</p>
                        <button
                          type="button"
                          onClick={fetchUsageData}
                          className="px-3 py-1 bg-[#1890FF] text-white text-[10px] font-bold rounded-lg"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : usageData ? (
                      <div className="space-y-3">
                        {usageData.resources.map((resource: any) => {
                          const isUnlimited = resource.limit === -1;
                          const percentageUsed = isUnlimited ? 0 : resource.limit === 0 ? 100 : Math.min(100, Math.round((resource.used / resource.limit) * 100));
                          const percentageRemaining = isUnlimited ? 100 : Math.max(0, 100 - percentageUsed);
                          const isWarning = percentageRemaining <= 20 && percentageRemaining > 0;
                          const isDanger = percentageRemaining === 0;
                          const statusColor = isDanger ? "#EF4444" : isWarning ? "#F59E0B" : resource.color;

                          const IconMap: Record<string, typeof Brain> = {
                            brain: Brain,
                            cpu: Cpu,
                            volume: Volume2,
                            bell: BellRing,
                            briefcase: Briefcase,
                          };
                          const IconComponent = IconMap[resource.icon] || Cpu;

                          const formatNumber = (n: number, asK?: boolean) => {
                            if (asK && n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
                            if (asK && n >= 1000) return `${(n / 1000).toFixed(0)}K`;
                            return n.toLocaleString("es-CL");
                          };

                          return (
                            <div
                              key={resource.id}
                              className="p-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#070B16] hover:border-gray-200 dark:hover:border-white/10 transition-all"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="p-1.5 rounded-lg"
                                    style={{ backgroundColor: `${statusColor}15` }}
                                  >
                                    <IconComponent className="w-4 h-4" style={{ color: statusColor }} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{resource.label}</h4>
                                    <p className="text-[9px] text-gray-400 capitalize">{resource.period}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {isUnlimited ? (
                                    <span className="text-[10px] font-bold text-emerald-500">Ilimitado</span>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs font-black" style={{ color: statusColor }}>
                                        {percentageRemaining}%
                                      </span>
                                      <span className="text-[8px] font-semibold text-gray-400">
                                        {isDanger ? "Agotado" : "disponible"}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Bar */}
                              <div className="relative h-1.5 rounded-full bg-gray-200/60 dark:bg-white/5 overflow-hidden">
                                {isUnlimited ? (
                                  <div className="absolute inset-0 bg-emerald-500 opacity-20 rounded-full" />
                                ) : (
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percentageUsed}%` }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{
                                      background: isDanger 
                                        ? `linear-gradient(90deg, ${statusColor}, #DC2626)` 
                                        : isWarning
                                          ? `linear-gradient(90deg, ${resource.color}, ${statusColor})`
                                          : `linear-gradient(90deg, ${resource.color}90, ${resource.color})`,
                                    }}
                                  />
                                )}
                              </div>

                              {/* Footer text */}
                              <div className="flex justify-between mt-1.5 text-[9px] font-semibold">
                                <span className="text-gray-500">
                                  {formatNumber(resource.used, resource.formatAsK)} de {isUnlimited ? "∞" : formatNumber(resource.limit, resource.formatAsK)} usados
                                </span>
                                {!isUnlimited && (
                                  <span className="text-gray-400">
                                    Quedan {formatNumber(Math.max(0, resource.limit - resource.used), resource.formatAsK)}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}

                {activeTab === "apariencia" && (
                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Tema visual</label>
                      <p className="text-[10px] text-muted-foreground">Ajusta el estilo de color de la interfaz</p>
                      <div className="w-full mt-2">
                        <SegmentControl
                          options={[
                            { id: "light", label: "Claro" },
                            { id: "dark", label: "Oscuro" },
                            { id: "system", label: "Sistema" },
                          ]}
                          selected={theme === "light" ? "light" : theme === "dark" ? "dark" : "system"}
                          onChange={(val) => setTheme(val)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Densidad visual</label>
                      <p className="text-[10px] text-muted-foreground">Ajusta la separación de los elementos</p>
                      <div className="w-full mt-2">
                        <SegmentControl
                          options={[
                            { id: "compact", label: "Compacta" },
                            { id: "comfortable", label: "Cómoda" },
                            { id: "spacious", label: "Amplia" },
                          ]}
                          selected={density}
                          onChange={(val) => setDensity(val)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-t border-gray-100 dark:border-white/5 mt-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Imágenes en noticias</span>
                        <span className="text-[10px] text-muted-foreground">Muestra fotos en el feed de noticias</span>
                      </div>
                      <Toggle active={showImages} onChange={setShowImages} />
                    </div>
                  </div>
                )}

                {activeTab === "comportamiento" && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Sincronización en la Nube</span>
                      <p className="text-[10px] text-muted-foreground">Sincroniza tus chats e información en tiempo real con Supabase</p>
                    </div>

                    <div className="space-y-2.5 mt-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Sincronizar historial de chat</span>
                          <span className="text-[10px] text-muted-foreground">Guarda y accede a conversaciones previas</span>
                        </div>
                        <Toggle active={chatSync} onChange={setChatSync} />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Sincronizar proyectos del Builder</span>
                          <span className="text-[10px] text-muted-foreground">Resguarda tus proyectos y código de sitios web</span>
                        </div>
                        <Toggle active={wbSync} onChange={setWbSync} />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "customize" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Nombre del Asistente</label>
                      <input
                        type="text"
                        value={assistant.name}
                        onChange={(e) => assistant.setName(e.target.value)}
                        placeholder="Ej. Jarvis, Maverlang..."
                        className="w-full bg-gray-50/50 dark:bg-[#070B16] border border-gray-200/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Rol del Asistente</label>
                      <select
                        value={assistant.assistantRole}
                        onChange={(e) => assistant.setAssistantRole(e.target.value)}
                        className="w-full bg-gray-55 dark:bg-[#070B16] border border-gray-200/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-teal-500 font-semibold"
                      >
                        <option value="Mentor Financiero">Mentor Financiero</option>
                        <option value="Analista de Negocios">Analista de Negocios</option>
                        <option value="Periodista Investigativo">Periodista Investigativo</option>
                        <option value="Desarrollador de Código">Desarrollador de Código</option>
                        <option value="Asistente General">Asistente General</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 dark:text-gray-200">Tono de Respuesta</label>
                      <select
                        value={assistant.assistantTone}
                        onChange={(e) => assistant.setAssistantTone(e.target.value)}
                        className="w-full bg-gray-55 dark:bg-[#070B16] border border-gray-200/60 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-teal-500 font-semibold"
                      >
                        <option value="Analítico">Analítico</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Sencillo">Sencillo</option>
                        <option value="Conciso">Conciso</option>
                        <option value="Creativo">Creativo</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === "datos" && (
                  <div className="space-y-5">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Administrar tus datos</span>
                      <p className="text-[10px] text-muted-foreground">Exporta o elimina tu información guardada permanentemente</p>
                    </div>

                    <div className="space-y-2.5 mt-3">
                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Exportar tus datos</span>
                          <span className="text-[10px] text-muted-foreground">Descarga todo tu historial en formato JSON</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Exportando datos en JSON...")}
                          className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-55 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer"
                        >
                          Exportar
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-red-500">Eliminar historial de chats</span>
                          <span className="text-[10px] text-muted-foreground">Borra permanentemente todas las conversaciones de IA</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Historial borrado")}
                          className="px-4 py-1.5 rounded-full border border-red-200 dark:border-red-500/25 hover:bg-red-50 dark:hover:bg-red-500/10 text-[11px] font-semibold text-red-500 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-red-500">Eliminar Cuenta</span>
                          <span className="text-[10px] text-muted-foreground">Elimina tu perfil y datos definitivamente</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Eliminación de cuenta iniciada")}
                          className="px-4 py-1.5 rounded-full border border-red-200 dark:border-red-500/25 hover:bg-red-50 dark:hover:bg-red-500/10 text-[11px] font-semibold text-red-500 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "soporte" && (
                  <div className="flex flex-col h-full bg-[#FAF9F5]/40 dark:bg-black/15 overflow-hidden">
                    {supportView === "home" && (
                      <div className="flex flex-col h-full overflow-hidden p-6">
                        {/* Heading */}
                        <div className="flex flex-col gap-1 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 shadow-2xs">
                              <Headphones className="w-4 h-4 text-[#1890FF]" />
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-gray-900 dark:text-white">Centro de Soporte</h3>
                              <p className="text-[9px] text-green-500 font-semibold flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                Agentes en línea
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Call to action */}
                        <div className="grid grid-cols-1 gap-4 mb-5 shrink-0">
                          <div className="p-4 bg-gradient-to-br from-blue-500/5 to-teal-500/5 border border-blue-500/10 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-3xs">
                            <div>
                              <h4 className="text-xs font-bold text-gray-950 dark:text-white">¿Tienes alguna pregunta?</h4>
                              <p className="text-[10px] text-muted-foreground mt-0.5">Crea un ticket de soporte y te responderemos a la brevedad.</p>
                            </div>
                            <button
                              onClick={() => setSupportView("new_ticket")}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-black text-[10px] font-extrabold cursor-pointer transition-all shadow-sm hover:scale-[1.02] active:scale-95 shrink-0"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Nuevo Ticket
                            </button>
                          </div>
                        </div>

                        {/* History */}
                        <div className="flex-1 min-h-0 flex flex-col">
                          <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2 shrink-0">
                            <History className="w-3.5 h-3.5" />
                            Historial de Consultas
                          </div>

                          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {isLoadingTickets ? (
                              <div className="py-12 flex flex-col items-center gap-2 justify-center text-xs text-muted-foreground">
                                <Loader2 className="w-5 h-5 animate-spin text-[#1890FF]" />
                                Cargando historial...
                              </div>
                            ) : tickets.length === 0 ? (
                              <div className="py-12 border border-dashed border-gray-200 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center bg-white dark:bg-zinc-900/50">
                                <MessageSquare className="w-8 h-8 text-gray-300 dark:text-zinc-700" />
                                <p className="text-xs font-medium text-gray-800 dark:text-zinc-400">No tienes consultas anteriores</p>
                                <p className="text-[10px] text-muted-foreground">Tu historial de soporte aparecerá aquí.</p>
                              </div>
                            ) : (
                              tickets.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => { setSelectedTicket(t); setSupportView("chat"); }}
                                  className="w-full text-left p-3.5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 rounded-2xl transition-all shadow-3xs cursor-pointer hover:shadow-2xs group"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-xs text-gray-900 dark:text-white truncate max-w-[70%] group-hover:text-[#1890FF] transition-colors">
                                      {t.subject}
                                    </span>
                                    <span className="text-[9px] text-muted-foreground font-medium shrink-0">
                                      {format(new Date(t.updated_at), "dd MMM, HH:mm", { locale: es })}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-muted-foreground truncate">Ticket #{t.id.split('-')[0]}</span>
                                    <span className={cn(
                                      "flex items-center gap-1 font-bold uppercase tracking-wider text-[8px]",
                                      t.status === 'open' ? 'text-green-500' : 'text-gray-500'
                                    )}>
                                      <span className={cn(
                                        "w-1 h-1 rounded-full shrink-0",
                                        t.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                                      )} />
                                      {t.status === 'open' ? 'Abierto' : 'Resuelto'}
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {supportView === "new_ticket" && (
                      <div className="flex flex-col h-full overflow-hidden p-6">
                        <div className="flex items-center gap-2 mb-4 shrink-0">
                          <button
                            onClick={() => setSupportView("home")}
                            className="p-1 rounded-full bg-gray-55 dark:bg-white/5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Nueva Consulta de Soporte</h3>
                        </div>

                        <form onSubmit={handleCreateTicket} className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Categoría</label>
                            <select
                              value={newTicketCategory}
                              onChange={(e) => setNewTicketCategory(e.target.value)}
                              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-teal-500 font-semibold"
                            >
                              <option value="Soporte Técnico">Soporte Técnico</option>
                              <option value="Facturación">Facturación y Planes</option>
                              <option value="Cuenta">Cuenta y Acceso</option>
                              <option value="Errores y Bugs">Errores y Bugs</option>
                              <option value="Sugerencias/Otros">Sugerencia u Otro</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Asunto</label>
                            <input
                              type="text"
                              value={newTicketSubject}
                              onChange={(e) => setNewTicketSubject(e.target.value)}
                              placeholder="Escribe un título descriptivo..."
                              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-semibold"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-850 dark:text-gray-200 uppercase tracking-wider">Mensaje Inicial</label>
                            <textarea
                              value={newTicketMessage}
                              onChange={(e) => setNewTicketMessage(e.target.value)}
                              placeholder="Describe tu problema o pregunta con detalle..."
                              rows={4}
                              className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium resize-none"
                              required
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => setSupportView("home")}
                              className="flex-1 py-2 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-55 dark:hover:bg-white/5 text-[10px] font-extrabold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shadow-3xs text-center"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={!newTicketSubject.trim() || !newTicketMessage.trim() || isSending}
                              className="flex-1 py-2 rounded-full bg-[#1890FF] hover:bg-[#1890FF]/90 text-white text-[10px] font-extrabold cursor-pointer transition-all shadow-md disabled:opacity-50 text-center flex items-center justify-center gap-1.5"
                            >
                              {isSending ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3 h-3" />
                                  Enviar Consulta
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {supportView === "chat" && selectedTicket && (
                      <div className="flex flex-col h-full bg-slate-50/50 dark:bg-zinc-950/30 overflow-hidden">
                        {/* Subheader */}
                        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-white/5 shrink-0 select-none">
                          <button
                            onClick={() => { setSupportView("home"); setSelectedTicket(null); }}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Atrás
                          </button>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shadow-3xs",
                              selectedTicket.status === 'open' 
                                ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                            )}>
                              {selectedTicket.status === 'open' ? 'Abierto' : 'Resuelto'}
                            </span>
                            {selectedTicket.status === 'open' && (
                              <button 
                                onClick={() => handleCloseTicket(selectedTicket.id)}
                                title="Marcar como resuelto"
                                className="flex items-center gap-1 text-[9px] font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-950 border border-gray-250 dark:border-white/5 hover:border-green-500 dark:hover:border-green-500/30 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                Marcar como resuelto
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Messages Box */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#E5DDD5]/10 dark:bg-[#0B141A]/20 custom-scrollbar animate-fadeIn">
                          {isLoadingMessages ? (
                            <div className="h-full flex items-center justify-center">
                              <Loader2 className="w-5 h-5 animate-spin text-[#1890FF]" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                              No hay mensajes en este chat.
                            </div>
                          ) : (
                            <div className="space-y-3 flex flex-col">
                              {messages.map((msg, idx) => {
                                const isMe = !msg.is_admin;
                                return (
                                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className="flex max-w-[85%] items-end gap-1.5">
                                      {!isMe && (
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-[#1890FF] shrink-0 shadow-3xs">
                                          <Headphones className="w-2.5 h-2.5" />
                                        </div>
                                      )}
                                      <div className={cn(
                                        "px-3 py-1.5 text-xs leading-relaxed shadow-3xs rounded-xl",
                                        isMe 
                                          ? "bg-teal-600 text-white rounded-tr-none" 
                                          : "bg-white dark:bg-zinc-900 text-foreground border border-gray-100 dark:border-white/5 rounded-tl-none"
                                      )}>
                                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                                        <span className="block text-[8px] text-right mt-1 opacity-60">
                                          {format(new Date(msg.created_at), "HH:mm")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </div>

                        {/* Message Input Form */}
                        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-white/5 shrink-0">
                          {selectedTicket.status === 'closed' ? (
                            <div className="text-center text-xs text-muted-foreground py-1 bg-gray-50 dark:bg-zinc-950 rounded-xl">
                              Este ticket está resuelto. No puedes enviar más mensajes.
                            </div>
                          ) : (
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                                className="flex-1 bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/5 rounded-full px-4 py-2 text-xs text-foreground outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] transition-all"
                                disabled={isSending}
                              />
                              <button
                                type="submit"
                                disabled={!newMessage.trim() || isSending}
                                className="w-8 h-8 rounded-full bg-[#1890FF] hover:bg-[#1890FF]/90 text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-colors shadow-sm cursor-pointer"
                              >
                                {isSending ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3 h-3 ml-0.5" />
                                )}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>


            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
