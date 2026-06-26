"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Headphones, Sparkles, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useConversionStore } from "@/lib/stores/conversion-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

export function PremiumConversionModal() {
  const { isOpen, feature, closeModal } = useConversionStore();
  const router = useRouter();
  const { tier } = useSubscriptionStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Do not show for users who are already pro/ultra
  if (mounted && (tier === "pro" || tier === "max" || tier === "ultra")) {
    return null;
  }

  const handleUpgradeClick = () => {
    closeModal();
    router.push("/precios");
  };

  const getFeatureContent = () => {
    switch (feature) {
      case "audio":
        return {
          title: "Has alcanzado tu límite de audios diarios",
          subtitle: "Desbloquea audios ilimitados y escucha las noticias mientras haces otras cosas.",
          icon: <Headphones className="w-8 h-8 text-indigo-400" />,
          color: "from-indigo-500/20 via-purple-500/10 to-transparent",
          glow: "bg-indigo-500/30"
        };
      case "ai_chat":
        return {
          title: "Has alcanzado tu límite del Asistente IA",
          subtitle: "Obtén mucha más capacidad de preguntas mensuales y descubre el contexto oculto de los mercados.",
          icon: <Sparkles className="w-8 h-8 text-blue-400" />,
          color: "from-blue-500/20 via-cyan-500/10 to-transparent",
          glow: "bg-blue-500/30"
        };
      case "portfolio":
        return {
          title: "Límite de activos alcanzado",
          subtitle: "Sigue activos ilimitados, crea múltiples portafolios y recibe alertas en tiempo real.",
          icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
          color: "from-emerald-500/20 via-teal-500/10 to-transparent",
          glow: "bg-emerald-500/30"
        };
      default:
        return {
          title: "Pasa al siguiente nivel con Pro",
          subtitle: "Accede a herramientas exclusivas diseñadas para mantenerte siempre un paso adelante.",
          icon: <Crown className="w-8 h-8 text-amber-400" />,
          color: "from-amber-500/20 via-orange-500/10 to-transparent",
          glow: "bg-amber-500/30"
        };
    }
  };

  const content = getFeatureContent();

  const benefits = [
    "Audios ilimitados (Texto a Voz realista)",
    "Mucha más capacidad de preguntas mensuales",
    "Activos y alertas de precios ilimitadas",
    "Reportes exclusivos de fin de semana"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop with heavy blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[480px] bg-[#0B1121] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Background Gradient Mesh */}
            <div className={`absolute top-0 left-0 right-0 h-64 bg-gradient-to-b ${content.color} pointer-events-none`} />
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[80px] ${content.glow} pointer-events-none`} />

            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="relative p-8 pt-10">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${content.color} opacity-50`} />
                  {content.icon}
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-3 leading-tight tracking-tight">
                  {content.title}
                </h2>
                <p className="text-[15px] text-slate-300 leading-relaxed">
                  {content.subtitle}
                </p>
              </div>

              <div className="space-y-4 mb-8 bg-white/5 rounded-2xl p-6 border border-white/5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Qué incluye el Plan Pro</p>
                {benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-200 leading-snug">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleUpgradeClick}
                  className="w-full relative group overflow-hidden rounded-2xl p-[1px]"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-[#1890FF] via-indigo-500 to-purple-500 rounded-2xl" />
                  <div className="relative flex items-center justify-center gap-2 bg-[#0B1121] group-hover:bg-opacity-0 transition-all duration-300 px-6 py-4 rounded-[15px]">
                    <span className="text-white font-bold text-lg">Inicia tus 7 Días Gratis</span>
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </button>
                <p className="text-center text-xs text-slate-500 font-medium">
                  Cancela en cualquier momento. Sin compromisos.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
