"use client";

import { useState, useEffect } from "react";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Palette, Layers, Sliders, Database, Globe, Sparkles, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "cuenta" | "apariencia" | "comportamiento" | "customize" | "datos";

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
        active ? "bg-teal-650 dark:bg-teal-400" : "bg-gray-200 dark:bg-white/10"
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

export function ViewSettingsDialog({ isOpen, onClose }: ViewSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("cuenta");
  const [language, setLanguage] = useState("default");

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
            </div>

            {/* Right Content panel */}
            <div className="flex-1 bg-white dark:bg-zinc-950 flex flex-col relative min-h-0">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 shrink-0 select-none">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                  {activeTab === "datos" ? "Controles de datos" : activeTab === "customize" ? "Personalizar Asistente" : activeTab}
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
              <div className="flex-1 p-6 overflow-y-auto pb-24 hidden-scrollbar">
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

                    {/* Social connection */}
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <span className="text-[14px] font-black w-4.5 text-center font-mono shrink-0 select-none">𝕏</span>
                        <span className="text-[11px] font-semibold">Cuenta 𝕏</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => alert("Conexión con 𝕏 está en desarrollo")}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-55 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shrink-0"
                      >
                        Conectar
                      </button>
                    </div>

                    {/* Language setting */}
                    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <Globe className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                        <span className="text-[11px] font-semibold">
                          Idioma: <span className="font-bold text-gray-900 dark:text-white">{language === "default" ? "Por defecto" : language === "en" ? "English" : "Español"}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setLanguage(language === "es" ? "en" : "es")}
                        className="px-4 py-1.5 rounded-full border border-gray-200 dark:border-white/10 hover:bg-gray-55 dark:hover:bg-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 cursor-pointer transition-all shrink-0"
                      >
                        Cambiar
                      </button>
                    </div>

                    {/* Birth year */}
                    <div className="py-2.5">
                      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300 text-[11px] font-semibold">
                        <User className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                        <span>Año de nacimiento: <span className="font-bold text-gray-900 dark:text-white">2007</span></span>
                      </div>
                    </div>
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
              </div>

              {/* Bottom Promo Banner (Starry dark background) */}
              <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-r from-zinc-950 via-slate-900 to-zinc-950 text-white flex items-center justify-between px-6 border-t border-white/5 z-10 select-none">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold italic text-sm tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">Maverlang Ultra</span>
                  <span className="text-xs font-semibold text-slate-300/90 hidden sm:inline">— Menos límites de consulta, más capacidades</span>
                  <span className="text-[10px] font-semibold text-slate-300/90 sm:hidden">— Más capacidades</span>
                </div>
                <button
                  type="button"
                  onClick={() => { handleClose(); router.push("/suscripcion"); }}
                  className="bg-white hover:bg-white/90 text-black text-[11px] font-extrabold px-5 py-2 rounded-full cursor-pointer transition-all shadow-md active:scale-95 shrink-0"
                >
                  Probar gratis
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
