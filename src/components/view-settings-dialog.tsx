"use client";

import { useState, useEffect } from "react";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useWebBuilderStore } from "@/lib/stores/webbuilder-store";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Sparkles, User, Palette, Layers, Cloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

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

export function ViewSettingsDialog({ isOpen, onClose }: ViewSettingsDialogProps) {
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

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

  const [saving, setSaving] = useState(false);

  // Load preferences from Supabase if open
  useEffect(() => {
    if (isOpen && isAuthenticated && user) {
      assistant.loadFromSupabase(user.id);
    }
  }, [isOpen, isAuthenticated, user]);

  const handleSave = async () => {
    setSaving(true);
    if (isAuthenticated && user) {
      try {
        await assistant.saveToSupabase(user.id);
      } catch (err) {
        console.error("Error saving assistant to Supabase:", err);
      }
    }
    setSaving(false);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[380px] overflow-hidden rounded-2xl border border-gray-200/60 dark:border-white/5 bg-white dark:bg-[#0B1329] p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <Settings className="h-4.5 w-4.5 text-muted-foreground/80" />
                <span>Ajustes</span>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Scrollable Contents */}
            <div className="space-y-5 max-h-[60vh] overflow-y-auto hidden-scrollbar pr-0.5">
              {/* 1. APARIENCIA */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground/60">
                  <Palette className="w-3.5 h-3.5" />
                  <span>Apariencia y Vista</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span className="shrink-0">Tema visual</span>
                    <div className="w-48">
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

                  <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span className="shrink-0">Densidad</span>
                    <div className="w-48">
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

                  <div className="flex items-center justify-between py-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span>Mostrar imágenes en noticias</span>
                    <Toggle active={showImages} onChange={setShowImages} />
                  </div>
                </div>
              </div>

              {/* 2. CONFIGURACIÓN DEL ASISTENTE */}
              {isAuthenticated && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground/60">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Copiloto AI</span>
                  </div>
                  
                  <div className="space-y-2.5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Nombre del asistente</span>
                      <input
                        type="text"
                        value={assistant.name}
                        onChange={(e) => assistant.setName(e.target.value)}
                        placeholder="Ej. Jarvis, Maverlang..."
                        className="w-full bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 rounded-xl px-3 py-1.5 text-xs text-foreground outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all font-medium"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>Rol del Asistente</span>
                      <select
                        value={assistant.assistantRole}
                        onChange={(e) => assistant.setAssistantRole(e.target.value)}
                        className="bg-gray-50/50 dark:bg-slate-800 border border-gray-200/60 dark:border-white/5 rounded-xl px-2.5 py-1 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Mentor Financiero">Mentor Financiero</option>
                        <option value="Analista de Negocios">Analista de Negocios</option>
                        <option value="Periodista Investigativo">Periodista Investigativo</option>
                        <option value="Desarrollador de Código">Desarrollador de Código</option>
                        <option value="Asistente General">Asistente General</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-4 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>Tono de respuesta</span>
                      <select
                        value={assistant.assistantTone}
                        onChange={(e) => assistant.setAssistantTone(e.target.value)}
                        className="bg-gray-50/50 dark:bg-slate-800 border border-gray-200/60 dark:border-white/5 rounded-xl px-2.5 py-1 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="Analítico">Analítico</option>
                        <option value="Técnico">Técnico</option>
                        <option value="Sencillo">Sencillo</option>
                        <option value="Conciso">Conciso</option>
                        <option value="Creativo">Creativo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SINCRONIZACIÓN EN LA NUBE */}
              {isAuthenticated && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-muted-foreground/60">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Sincronización en la Nube</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>Guardar Chats</span>
                      <Toggle active={chatSync} onChange={setChatSync} />
                    </div>

                    <div className="flex items-center justify-between py-0.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <span>Guardar Proyectos Builder</span>
                      <Toggle active={wbSync} onChange={setWbSync} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-gray-100 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground/80 hover:text-foreground hover:bg-muted/40 transition-colors rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                Guardar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
