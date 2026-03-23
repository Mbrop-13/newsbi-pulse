"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuthToastStore } from "@/lib/stores/auth-toast-store";
import { LogIn, UserPlus, X } from "lucide-react";

export function AuthToast() {
  const { isOpen, message, hideToast } = useAuthToastStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95, x: "-50%" }}
          animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
          exit={{ opacity: 0, y: 20, scale: 0.95, x: "-50%" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-6 left-1/2 z-[100] w-[90%] max-w-sm"
        >
          <div className="bg-white/90 dark:bg-[#1E293B]/90 backdrop-blur-md border border-gray-200 dark:border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 flex-1 leading-snug">
                {message}
              </p>
              <button 
                onClick={hideToast}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors shrink-0 p-1 -m-1"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <button 
                onClick={() => { hideToast(); window.dispatchEvent(new CustomEvent('open-login')); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-[#1890FF] hover:bg-[#1890FF]/90 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Iniciar Sesión
              </button>
              <button 
                onClick={() => { hideToast(); window.dispatchEvent(new CustomEvent('open-register')); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-colors border border-transparent dark:border-white/5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Crear Cuenta
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
