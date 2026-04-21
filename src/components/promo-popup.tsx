"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, ArrowRight, Zap, Crown, TrendingUp, Cpu } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";

export function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only show if user doesn't already have Max or higher
    const hasMax = user?.tier === "max" || user?.tier === "ultra";
    
    if (hasMax) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem("reclu_promo_dismissed");
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      // Wait 24 hours before showing again
      if (hoursSinceDismissed < 24) return;
    }

    // Delay the appearance for a nice effect
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem("reclu_promo_dismissed", Date.now().toString());
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 right-6 z-[100] w-80 sm:w-96"
        >
          <div className="absolute -inset-[2px] rounded-[26px] bg-gradient-to-br from-[#1890FF] via-indigo-500 to-purple-600 blur-xl opacity-40 group-hover:opacity-75 transition-opacity duration-1000 animate-pulse-slow"></div>
          
          <div className="relative overflow-hidden bg-white/95 dark:bg-[#070A11]/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-6 group">
            
            {/* Animated rotating background orb */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-tr from-[#1890FF] to-purple-500 blur-3xl opacity-20 dark:opacity-30 rounded-full mix-blend-screen"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
              className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-tr from-indigo-500 to-fuchsia-500 blur-3xl opacity-20 dark:opacity-30 rounded-full mix-blend-screen"
            />

            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/20 backdrop-blur-md transition-all z-20"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex items-start gap-4">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-200 to-[#1890FF] dark:from-blue-500/20 dark:to-blue-700/20 text-[#1890FF] dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                  <div className="absolute inset-0 bg-white/40 dark:bg-black/20 rounded-2xl"></div>
                  <Crown className="w-7 h-7 relative z-10" />
                  
                  {/* Sparkles around crown */}
                  <motion.div animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute -top-1 -right-1 text-blue-500"><Sparkles className="w-3 h-3" /></motion.div>
                </div>
                
                <div className="pt-1">
                  <h3 className="text-[22px] font-black tracking-tight text-gray-900 dark:text-white leading-none mb-1.5">
                    Reclu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1890FF] to-cyan-500">Max</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1890FF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1890FF]"></span>
                    </span>
                    <p className="text-[11px] font-black text-[#1890FF] dark:text-blue-400 uppercase tracking-widest">
                      Obtén la Ventaja Injusta
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[15px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
                Desbloquea el análisis a <strong className="text-gray-900 dark:text-white">Nivel Institucional</strong>. Adelántate al mercado con IA predictiva y fuentes globales sin restricciones.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-2 bg-gray-50/50 dark:bg-white/[0.03] p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Cpu className="w-4 h-4 text-[#1890FF]" /> Modelos IA
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <TrendingUp className="w-4 h-4 text-purple-500" /> Mercados PRO
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Zap className="w-4 h-4 text-amber-500" /> Velocidad Real
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                  <Sparkles className="w-4 h-4 text-pink-500" /> Sin Límites
                </div>
              </div>

              <Link 
                href="/suscripcion"
                onClick={() => setIsVisible(false)}
                className="group/btn relative w-full flex items-center justify-center gap-2 mt-1 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-[#1890FF] to-blue-600 hover:to-indigo-600 text-white font-black text-[15px] transition-all hover:scale-[1.02] shadow-[0_8px_30px_rgba(24,144,255,0.2)] hover:shadow-[0_8px_30px_rgba(24,144,255,0.4)] overflow-hidden"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 dark:via-black/10 to-transparent skew-x-12"></div>
                
                <span className="relative z-10">Iniciar 3 Días Gratis</span>
                <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
              
              <p className="text-center text-[10px] text-gray-400 font-medium">Cancela en cualquier momento. Sin compromisos.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
