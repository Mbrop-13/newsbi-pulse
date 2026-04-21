"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";

export function RegisterCornerPopup() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { openModal } = useAuthModalStore();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, dismissed]);

  if (isAuthenticated || dismissed || !visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-[80] w-[300px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/15 dark:shadow-black/40 border border-gray-200 dark:border-gray-800 overflow-hidden"
      >
        {/* Gradient top bar */}
        <div className="h-1 bg-gradient-to-r from-[#1890FF] via-indigo-500 to-purple-500" />

        <div className="p-5">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-3 right-3 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-3 h-3" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-[#1890FF]/10">
              <Sparkles className="w-4 h-4 text-[#1890FF]" />
            </div>
            <span className="text-xs font-bold text-[#1890FF] uppercase tracking-wider">Gratis</span>
          </div>

          <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight mb-1.5">
            Regístrate y lee todo
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            Accede a todas las noticias, personaliza tu feed y usa el asistente IA sin costo.
          </p>

          <button
            onClick={() => { setDismissed(true); openModal("register"); }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#1890FF]/20"
          >
            Crear Cuenta Gratis
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => { setDismissed(true); openModal("login"); }}
            className="w-full text-center text-xs text-gray-400 mt-3 hover:text-[#1890FF] transition-colors font-medium"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
