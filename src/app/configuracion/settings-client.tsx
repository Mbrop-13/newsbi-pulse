"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, Shield, Smartphone, Mail, Globe, Palette, LogOut, Loader2, Save, Key, CheckCircle2, ChevronRight, Settings, Sparkles, Trash2, Search, Plus, Check, X, Cloud, CloudOff, BarChart3, Brain, Cpu, Volume2, BellRing, Briefcase, Zap, Crown, ArrowUpRight, RefreshCw } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";
import { type PlanTier } from "@/lib/plan-limits";
import { useAssistantStore, type Ticker } from "@/lib/stores/assistant-store";
import { PREDEFINED_TOPICS } from "@/components/assistant/assistant-setup";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";

interface UserPreferences {
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
  phone_number: string;
  language: string;
  theme: string;
}

const TABS = [
  { id: "general", label: "General", icon: User },
  { id: "usage", label: "Plan y Consumo", icon: BarChart3 },
  { id: "assistant", label: "Asistente AI", icon: Sparkles },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "security", label: "Seguridad", icon: Shield },
];

export default function SettingsClient() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  // Cloud Sync Settings
  const chatSync = useAIChatStore((s) => s.cloudSyncEnabled);
  const setChatSync = useAIChatStore((s) => s.setCloudSync);
  const wbSync = useWebBuilderStore((s) => s.cloudSyncEnabled);
  const setWbSync = useWebBuilderStore((s) => s.setCloudSync);

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Usage / Plan consumption
  interface UsageResource {
    id: string;
    label: string;
    icon: string;
    used: number;
    limit: number;
    period: string;
    color: string;
    formatAsK?: boolean;
  }
  interface UsageData {
    tier: PlanTier;
    planName: string;
    resources: UsageResource[];
  }
  const [usageData, setUsageData] = useState<UsageData | null>(null);
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
  
  // Security
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Tickers search state
  const [tickerQuery, setTickerQuery] = useState("");
  const [tickerResults, setTickerResults] = useState<Ticker[]>([]);
  const [isSearchingTickers, setIsSearchingTickers] = useState(false);

  const assistant = useAssistantStore();

  const [prefs, setPrefs] = useState<UserPreferences>({
    notify_email: false,
    notify_sms: false,
    notify_push: true,
    phone_number: "",
    language: "es",
    theme: theme || "system",
  });

  useEffect(() => {
    if (!tickerQuery.trim()) { setTickerResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearchingTickers(true);
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(tickerQuery)}`);
        if (res.ok) setTickerResults(await res.json());
      } catch (err) { console.error("Search error", err); }
      finally { setIsSearchingTickers(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [tickerQuery]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchPreferences();
    if (user) {
      assistant.loadFromSupabase(user.id);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    // Sync theme with next-themes if it changes locally
    if (prefs.theme && prefs.theme !== theme) {
      setTheme(prefs.theme);
    }
  }, [prefs.theme, setTheme, theme]);

  const fetchPreferences = async () => {
    if (!user) return;
    setLoading(true);
    
    // Attempt to fetch
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setPrefs({
        notify_email: data.notify_email,
        notify_sms: data.notify_sms,
        notify_push: data.notify_push,
        phone_number: data.phone_number || "",
        language: data.language || "es",
        theme: data.theme || "system",
      });
      if (data.theme) setTheme(data.theme);
    } else if (error && error.code === "PGRST116") {
      // Row doesn't exist yet, create default
      await supabase.from("user_preferences").insert({
        user_id: user.id,
      });
      // defaults are fine
    } else {
      console.error("Error fetching prefs:", error);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaveSuccess(false);

    const { error } = await supabase
      .from("user_preferences")
      .update({
        notify_email: prefs.notify_email,
        notify_sms: prefs.notify_sms,
        notify_push: prefs.notify_push,
        phone_number: prefs.phone_number,
        language: prefs.language,
        theme: prefs.theme,
      })
      .eq("user_id", user.id);

    try {
      await assistant.saveToSupabase(user.id);
    } catch (e) {
      console.error("Error saving assistant config:", e);
    }

    setSaving(false);
    
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      console.error("Error saving:", error);
    }
  };

  const handlePasswordReset = async () => {
    // Open the auth modal directly in "forgot" view
    // so the user can enter their email, receive the OTP, and type the code
    handleLogout();
    setTimeout(() => {
      openModal("forgot");
    }, 100);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-24 pb-16 flex flex-col items-center justify-center text-center">
        <Settings className="w-16 h-16 text-[#1890FF] mb-6 opacity-20" />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Configuración de Cuenta</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">Inicia sesión para gestionar tus preferencias, notificaciones y seguridad.</p>
        <button onClick={() => openModal("login")} className="px-8 py-3 rounded-full bg-[#1890FF] text-white font-bold hover:opacity-90 transition-opacity">
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] pt-4 md:pt-6 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-[#1890FF]" />
            Configuración
          </h1>
          <p className="text-sm text-gray-500 mt-2">Gestiona tu experiencia, alertas de precio y seguridad de la cuenta.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Menu */}
          <aside className="w-full md:w-64 shrink-0">
            <nav className="flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive 
                        ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/25" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-200 dark:hover:text-white dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
              
              {loading ? (
                <div className="p-12 flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
                </div>
              ) : (
                <div className="p-6 sm:p-8">
                  <AnimatePresence mode="wait">
                    
                    {/* GENERAL TAB */}
                    {activeTab === "general" && (
                      <motion.div
                        key="general"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Apariencia e Idioma</h2>
                          
                          <div className="space-y-6">
                            {/* Theme */}
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Palette className="w-4 h-4 text-gray-400" /> Tema Visual
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {["light", "dark", "system"].map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => setPrefs(p => ({ ...p, theme: t }))}
                                    className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                                      prefs.theme === t 
                                        ? "border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]" 
                                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                                    }`}
                                  >
                                    {t === "light" ? "Claro" : t === "dark" ? "Oscuro" : "Sistema"}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Language */}
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-400" /> Idioma de la Plataforma
                              </label>
                              <select 
                                value={prefs.language}
                                onChange={(e) => setPrefs(p => ({ ...p, language: e.target.value }))}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-medium outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] transition-all"
                              >
                                <option value="es">Español (Latinoamérica)</option>
                                <option value="en">English (US)</option>
                                <option value="pt">Português (Brasil)</option>
                              </select>
                            </div>

                            {/* Cloud Sync */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Cloud className="w-4 h-4 text-gray-400" /> Sincronización en la Nube
                              </label>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-250 dark:border-gray-800">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl mt-0.5 ${chatSync ? 'bg-blue-100 dark:bg-[#1890FF]/25 text-[#1890FF]' : 'bg-gray-250 dark:bg-gray-800 text-gray-500'}`}>
                                      {chatSync ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Guardar Chats en la Nube</h4>
                                      <p className="text-xs text-gray-500">Sincroniza y respalda tu historial de conversaciones automáticamente.</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setChatSync(!chatSync)}
                                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${chatSync ? 'bg-[#1890FF]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                  >
                                    <motion.div 
                                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                      animate={{ x: chatSync ? 20 : 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                  </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/40 rounded-2xl border border-gray-250 dark:border-gray-800">
                                  <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl mt-0.5 ${wbSync ? 'bg-blue-100 dark:bg-[#1890FF]/25 text-[#1890FF]' : 'bg-gray-250 dark:bg-gray-800 text-gray-500'}`}>
                                      {wbSync ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Guardar Proyectos Builder</h4>
                                      <p className="text-xs text-gray-500">Guarda en vivo en la nube tus códigos de aplicaciones construidas por la IA.</p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => setWbSync(!wbSync)}
                                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${wbSync ? 'bg-[#1890FF]' : 'bg-gray-300 dark:bg-gray-700'}`}
                                  >
                                    <motion.div 
                                      className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                                      animate={{ x: wbSync ? 20 : 0 }}
                                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 text-red-500">Zona de Peligro</h2>
                          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full sm:w-auto justify-center">
                            <LogOut className="w-4 h-4" /> Cerrar Sesión
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* USAGE / PLAN TAB */}
                    {activeTab === "usage" && (
                      <motion.div
                        key="usage"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        {/* Plan Header */}
                        <div className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-6 text-white shadow-xl">
                          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-zinc-950 opacity-80" />
                          <div className="relative z-10 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1 text-zinc-400">
                                <Crown className="w-5 h-5 text-[#8B5CF6]" />
                                <span className="text-sm font-medium">Tu plan actual</span>
                              </div>
                              <h2 className="text-2xl font-black text-white">
                                {usageData?.planName || user?.tier?.toUpperCase() || "Gratuito"}
                              </h2>
                              <p className="text-sm text-zinc-400 mt-1">
                                {usageData?.tier === "free" 
                                  ? "Actualiza para desbloquear más recursos" 
                                  : "Gestiona el consumo de tu suscripción"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={fetchUsageData}
                                disabled={usageLoading}
                                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
                                title="Actualizar datos"
                              >
                                <RefreshCw className={`w-4 h-4 text-zinc-300 ${usageLoading ? "animate-spin" : ""}`} />
                              </button>
                              {usageData?.tier === "free" && (
                                <Link
                                  href="/pricing"
                                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-black font-bold text-sm rounded-xl hover:bg-zinc-100 transition-colors shadow-lg"
                                >
                                  <Zap className="w-4 h-4 text-[#8B5CF6]" />
                                  Mejorar Plan
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Usage Cards */}
                        {usageLoading && !usageData ? (
                          <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
                          </div>
                        ) : usageError ? (
                          <div className="text-center py-12">
                            <p className="text-zinc-500 mb-4">No se pudo cargar la información de consumo.</p>
                            <button
                              onClick={fetchUsageData}
                              className="px-4 py-2 bg-zinc-900 border border-zinc-850 text-white text-sm font-bold rounded-xl hover:bg-zinc-850 transition-colors"
                            >
                              Reintentar
                            </button>
                          </div>
                        ) : usageData ? (
                          <div className="space-y-6">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Consumo de Recursos</h3>
                              <p className="text-sm text-gray-500 mb-5">Uso actual de cada recurso incluido en tu plan.</p>
                            </div>

                            <div className="grid gap-4">
                              {usageData.resources.map((resource, idx) => {
                                const isUnlimited = resource.limit === -1;
                                const percentageUsed = isUnlimited ? 0 : resource.limit === 0 ? 100 : Math.min(100, Math.round((resource.used / resource.limit) * 100));
                                const percentageRemaining = isUnlimited ? 100 : Math.max(0, 100 - percentageUsed);
                                const isWarning = percentageRemaining <= 20 && percentageRemaining > 0;
                                const isDanger = percentageRemaining === 0;
                                const statusColor = isDanger ? "#EF4444" : isWarning ? "#F59E0B" : "#8B5CF6";

                                const IconMap: Record<string, typeof Brain> = {
                                  brain: Brain,
                                  cpu: Cpu,
                                  volume: Volume2,
                                  bell: BellRing,
                                  briefcase: Briefcase,
                                };
                                const IconComponent = IconMap[resource.icon] || Cpu;

                                return (
                                  <motion.div
                                    key={resource.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="group relative p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-950 text-white transition-all shadow-md"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800"
                                        >
                                          <IconComponent className="w-5 h-5 text-[#8B5CF6]" />
                                        </div>
                                        <div>
                                          <h4 className="text-sm font-bold text-white">{resource.label}</h4>
                                          <p className="text-xs text-zinc-400 capitalize">{resource.period}</p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        {isUnlimited ? (
                                          <span className="text-xs font-bold text-emerald-400">Ilimitado</span>
                                        ) : (
                                          <div className="flex flex-col items-end">
                                            <span className="text-lg font-black text-white">
                                              {percentageRemaining}%
                                            </span>
                                            <span className="text-[10px] font-semibold text-zinc-400 mt-0.5">
                                              {isDanger ? "Agotado" : "disponible"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative h-1.5 rounded-full bg-zinc-900 overflow-hidden border border-zinc-800/50">
                                      {isUnlimited ? (
                                        <div className="absolute inset-0 bg-emerald-500/20 rounded-full" />
                                      ) : (
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${percentageUsed}%` }}
                                          transition={{ duration: 1, ease: "easeOut", delay: idx * 0.1 }}
                                          className="absolute inset-y-0 left-0 rounded-full bg-[#8B5CF6]"
                                        />
                                      )}
                                    </div>

                                    {/* Usage Numbers */}
                                    <div className="flex justify-between mt-2.5 text-xs font-semibold">
                                      <span className="text-zinc-400">
                                        {isUnlimited ? "0% ocupado" : `${percentageUsed}% ocupado`}
                                      </span>
                                      {!isUnlimited && (
                                        <span className="text-zinc-400">
                                          Quedan {percentageRemaining}%
                                        </span>
                                      )}
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>

                            {/* Upgrade CTA for free users */}
                            {usageData.tier === "free" && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="relative overflow-hidden p-6 rounded-2xl border border-[#1890FF]/20 bg-gradient-to-r from-[#1890FF]/5 to-[#6366F1]/5"
                              >
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                      <Sparkles className="w-4 h-4 text-[#1890FF]" />
                                      ¿Necesitas más capacidad?
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-1">Desbloquea mensajes ilimitados, análisis avanzado y más con un plan premium.</p>
                                  </div>
                                  <Link
                                    href="/pricing"
                                    className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1890FF] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-[#1890FF]/25 whitespace-nowrap shrink-0"
                                  >
                                    Ver Planes <ArrowUpRight className="w-4 h-4" />
                                  </Link>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        ) : null}
                      </motion.div>
                    )}

                    {/* ASSISTANT TAB */}
                    {activeTab === "assistant" && (
                      <motion.div
                        key="assistant"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">Configuración del Asistente</h2>
                          
                          <div className="space-y-6">
                            {/* Assistant Name */}
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                                Nombre de tu Asistente AI
                              </label>
                              <input
                                type="text"
                                value={assistant.name}
                                onChange={(e) => assistant.setName(e.target.value)}
                                placeholder="Ej. Alpha, Jarvis..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-medium outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] transition-all"
                              />
                            </div>

                            {/* Assistant Role & Tone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                                  Rol del Asistente
                                </label>
                                <select 
                                  value={assistant.assistantRole}
                                  onChange={(e) => assistant.setAssistantRole(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-medium outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] transition-all"
                                >
                                  <option value="Mentor Financiero">Mentor Financiero</option>
                                  <option value="Analista de Negocios">Analista de Negocios</option>
                                  <option value="Periodista Investigativo">Periodista Investigativo</option>
                                  <option value="Desarrollador de Código">Desarrollador de Código</option>
                                  <option value="Asistente General">Asistente General</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                                  Tono del Asistente
                                </label>
                                <select 
                                  value={assistant.assistantTone}
                                  onChange={(e) => assistant.setAssistantTone(e.target.value)}
                                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white font-medium outline-none focus:border-[#1890FF] focus:ring-1 focus:ring-[#1890FF] transition-all"
                                >
                                  <option value="Analítico">Analítico</option>
                                  <option value="Técnico">Técnico</option>
                                  <option value="Sencillo">Sencillo</option>
                                  <option value="Conciso">Conciso</option>
                                  <option value="Creativo">Creativo</option>
                                </select>
                              </div>
                            </div>

                            {/* Topics of Interest */}
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-3 block">
                                Temas de Interés (Máx. 5)
                              </label>
                              <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto pr-1">
                                {PREDEFINED_TOPICS.map((topic) => {
                                  const isSelected = assistant.topics.includes(topic);
                                  const isLimitReached = !isSelected && assistant.topics.length >= 5;
                                  return (
                                    <button
                                      key={topic}
                                      type="button"
                                      disabled={isLimitReached}
                                      onClick={() => isSelected ? assistant.removeTopic(topic) : assistant.addTopic(topic)}
                                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                        isSelected 
                                          ? "bg-[#1890FF] text-white border-[#1890FF]" 
                                          : "bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-30"
                                      }`}
                                    >
                                      {topic}
                                      {isSelected && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Portfolio Tickers */}
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white mb-2 block">
                                Portafolio / Activos de Interés
                              </label>
                              <div className="relative w-full mb-3">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                  type="text" 
                                  value={tickerQuery} 
                                  onChange={(e) => setTickerQuery(e.target.value)} 
                                  placeholder="Buscar activo bursátil (Ej: AAPL, BTC-USD)..."
                                  className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1890FF] transition-all font-medium" 
                                />
                                {isSearchingTickers && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#1890FF] animate-spin" />}
                                
                                {tickerResults.length > 0 && tickerQuery && (
                                  <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 text-sm">
                                    {tickerResults.map((r, idx) => (
                                      <button 
                                        key={`${r.symbol}-${idx}`} 
                                        type="button"
                                        onClick={() => { assistant.addTicker(r); setTickerQuery(""); setTickerResults([]); }}
                                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-left border-b border-gray-50 dark:border-slate-700/50 last:border-0"
                                      >
                                        <div>
                                          <div className="font-bold text-gray-900 dark:text-white">{r.symbol}</div>
                                          <div className="text-xs text-gray-400 line-clamp-1">{r.name}</div>
                                        </div>
                                        <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded uppercase">{r.exchange || "Market"}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {assistant.tickers.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/30">
                                  {assistant.tickers.map((t) => (
                                    <div 
                                      key={t.symbol}
                                      className="flex items-center gap-1.5 px-3 py-1 bg-[#1890FF]/10 text-[#1890FF] rounded-lg text-xs font-bold border border-[#1890FF]/25"
                                    >
                                      {t.symbol}
                                      <button 
                                        type="button"
                                        onClick={() => assistant.removeTicker(t.symbol)} 
                                        className="hover:bg-[#1890FF]/20 rounded-full p-0.5 transition-colors"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === "notifications" && (
                      <motion.div
                        key="notifications"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Alertas de Precio y Noticias</h2>
                          <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                            Configura por dónde quieres recibir notificaciones cuando tus acciones alcancen el precio objetivo o haya breaking news.
                          </p>
                          
                          <div className="space-y-4">
                            {/* In-App Push */}
                            <label className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 cursor-pointer group">
                              <div className="pt-0.5">
                                <input 
                                  type="checkbox" 
                                  checked={prefs.notify_push}
                                  onChange={(e) => setPrefs(p => ({ ...p, notify_push: e.target.checked }))}
                                  className="w-5 h-5 rounded border-gray-300 text-[#1890FF] focus:ring-[#1890FF]"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bell className="w-4 h-4 text-gray-500" />
                                  <h3 className="font-bold text-gray-900 dark:text-white">Notificaciones en la App</h3>
                                </div>
                                <p className="text-xs text-gray-500">Recibe alertas en la campana de notificaciones de la plataforma.</p>
                              </div>
                            </label>

                            {/* Email */}
                            <label className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 cursor-pointer group relative overflow-hidden">
                              <div className="pt-0.5 z-10">
                                <input 
                                  type="checkbox" 
                                  checked={prefs.notify_email}
                                  onChange={(e) => setPrefs(p => ({ ...p, notify_email: e.target.checked }))}
                                  className="w-5 h-5 rounded border-gray-300 text-[#1890FF] focus:ring-[#1890FF]"
                                />
                              </div>
                              <div className="flex-1 z-10">
                                <div className="flex items-center gap-2 mb-1">
                                  <Mail className="w-4 h-4 text-gray-500" />
                                  <h3 className="font-bold text-gray-900 dark:text-white">Correos Electrónicos</h3>
                                  <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">Microsoft Integrado</span>
                                </div>
                                <p className="text-xs text-gray-500">Recibe resúmenes y alertas críticas directamente en {user?.email}.</p>
                              </div>
                            </label>

                            {/* SMS */}
                            <label className="flex items-start gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 cursor-pointer group">
                              <div className="pt-0.5">
                                <input 
                                  type="checkbox" 
                                  checked={prefs.notify_sms}
                                  onChange={(e) => setPrefs(p => ({ ...p, notify_sms: e.target.checked }))}
                                  className="w-5 h-5 rounded border-gray-300 text-[#1890FF] focus:ring-[#1890FF]"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Smartphone className="w-4 h-4 text-gray-500" />
                                  <h3 className="font-bold text-gray-900 dark:text-white">Mensajes SMS</h3>
                                  <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">Próximamente</span>
                                </div>
                                <p className="text-xs text-gray-500">Alertas instantáneas al móvil (requiere número de teléfono).</p>
                                
                                <AnimatePresence>
                                  {prefs.notify_sms && (
                                    <motion.div 
                                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                      animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <input 
                                        type="tel" 
                                        placeholder="+56 9 1234 5678"
                                        value={prefs.phone_number}
                                        onChange={(e) => setPrefs(p => ({ ...p, phone_number: e.target.value }))}
                                        className="w-full max-w-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-900 text-sm outline-none focus:border-[#1890FF]"
                                      />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </label>

                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === "security" && (
                      <motion.div
                        key="security"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                      >
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Seguridad de la Cuenta</h2>
                          <p className="text-sm text-gray-500 mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                            Gestiona tu contraseña y los métodos de autenticación.
                          </p>

                          <div className="space-y-4">
                            <div className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                  <Key className="w-4 h-4 text-[#1890FF]" /> Contraseña
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Te enviaremos un código de seguridad a {user?.email} para cambiarla.</p>
                              </div>
                              <button 
                                onClick={handlePasswordReset}
                                disabled={resetEmailSent}
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:border-[#1890FF] hover:text-[#1890FF] transition-all whitespace-nowrap disabled:opacity-50"
                              >
                                {resetEmailSent ? "Código Enviado ✓" : "Cambiar Contraseña"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                  </AnimatePresence>

                  {/* Save Button (Sticky/Fixed to bottom of content) */}
                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end">
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.span 
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="mr-4 flex items-center gap-1.5 text-sm font-bold text-green-500"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Guardado exitosamente
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#1890FF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#1890FF]/25"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Guardar Cambios
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
