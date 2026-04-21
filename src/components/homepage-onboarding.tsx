"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  LayoutGrid,
  List,
  Sparkles,
  ArrowRight,
  X,
  Eye,
} from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useViewStore, type ViewLayout } from "@/lib/stores/use-view-store";

export function HomepageOnboarding() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useAuthModalStore();
  const { layout, setLayout } = useViewStore();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if already dismissed in session
    const wasDismissed = sessionStorage.getItem("homepage-onboarding-dismissed");
    if (wasDismissed) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("homepage-onboarding-dismissed", "true");
  };

  if (!mounted || isAuthenticated || dismissed) return null;

  const viewOptions: { id: ViewLayout; icon: React.ReactNode; label: string; desc: string }[] = [
    { id: "traditional", icon: <Newspaper className="w-5 h-5" />, label: "Tradicional", desc: "Estilo periódico editorial" },
    { id: "grid", icon: <LayoutGrid className="w-5 h-5" />, label: "Grid", desc: "Cards modernas" },
    { id: "list", icon: <List className="w-5 h-5" />, label: "Lista", desc: "Lectura enfocada" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="relative bg-gradient-to-r from-slate-50 via-blue-50/50 to-indigo-50/50 dark:from-slate-900 dark:via-[#0F172A] dark:to-slate-900 border-b border-gray-200/50 dark:border-white/5 overflow-hidden"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#1890FF]/5 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-indigo-500/5 blur-3xl" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-5">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-4 sm:right-6 w-7 h-7 rounded-full bg-gray-200/60 dark:bg-gray-800/60 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Left: Message */}
            <div className="flex-1 min-w-0 pr-8 sm:pr-0">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-md bg-[#1890FF]/10">
                  <Sparkles className="w-3.5 h-3.5 text-[#1890FF]" />
                </div>
                <span className="text-[10px] font-bold text-[#1890FF] uppercase tracking-wider">Bienvenido a Reclu</span>
              </div>
              <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                Personaliza tu experiencia
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed max-w-md">
                Elige cómo quieres ver las noticias. Regístrate gratis para guardar tus preferencias y leer todos los artículos.
              </p>
            </div>

            {/* Center: View mode selector (REAL) */}
            <div className="flex items-center gap-2">
              {viewOptions.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setLayout(view.id)}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    layout === view.id
                      ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/20"
                      : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-[#1890FF]/30 hover:text-[#1890FF]"
                  }`}
                >
                  {view.icon}
                  <div className="hidden sm:flex flex-col items-start">
                    <span>{view.label}</span>
                    <span className={`text-[9px] font-medium ${layout === view.id ? 'text-white/70' : 'text-gray-400'}`}>{view.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Register CTA */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => openModal("register")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-all shadow-lg shadow-[#1890FF]/20"
              >
                Registrarse Gratis
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => openModal("login")}
                className="text-xs font-bold text-gray-400 hover:text-[#1890FF] transition-colors hidden sm:block"
              >
                Iniciar sesión
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
