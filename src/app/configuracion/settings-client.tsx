"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Bell, Shield, Smartphone, Mail, Globe, Palette, LogOut, Loader2, Save, Key, CheckCircle2, ChevronRight, Settings } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import Link from "next/link";

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
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "security", label: "Seguridad", icon: Shield },
];

export default function SettingsClient() {
  const { user, isAuthenticated, signOut } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Security
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [prefs, setPrefs] = useState<UserPreferences>({
    notify_email: false,
    notify_sms: false,
    notify_push: true,
    phone_number: "",
    language: "es",
    theme: theme || "system",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchPreferences();
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

    setSaving(false);
    
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      console.error("Error saving:", error);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/configuracion`,
    });
    if (!error) {
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    }
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] pt-[80px] pb-24">
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
                          </div>
                        </div>

                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 text-red-500">Zona de Peligro</h2>
                          <button onClick={signOut} className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors w-full sm:w-auto justify-center">
                            <LogOut className="w-4 h-4" /> Cerrar Sesión
                          </button>
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
                                  <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">AWS SES Integrado</span>
                                </div>
                                <p className="text-xs text-gray-500">Recibe resúmenes y alertas críticas directamente en {user.email}.</p>
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
                                <p className="text-xs text-gray-500 mt-1">Te enviaremos un enlace seguro a {user.email} para restablecerla.</p>
                              </div>
                              <button 
                                onClick={handlePasswordReset}
                                disabled={resetEmailSent}
                                className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-semibold hover:border-[#1890FF] hover:text-[#1890FF] transition-all whitespace-nowrap disabled:opacity-50"
                              >
                                {resetEmailSent ? "Enlace Enviado ✓" : "Cambiar Contraseña"}
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
