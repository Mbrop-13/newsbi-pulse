"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Zap, Sparkles, ArrowRight, Check, TrendingUp, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { PLAN_CONFIGS, getNextTier, formatCLP, type PlanTier } from "@/lib/plan-limits";
import Link from "next/link";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
  customTitle?: string;
  customMessage?: string;
  usage?: { used: number; limit: number };
}

const FEATURE_MESSAGES: Record<string, { title: string; message: string; icon: React.ReactNode }> = {
  ai_message: {
    title: "Límite de IA alcanzado",
    message: "Has alcanzado el límite de preguntas de tu plan para la IA. Actualiza tu suscripción para continuar.",
    icon: <Sparkles className="w-6 h-6" />,
  },
  tts_audio: {
    title: "Límite de audio alcanzado",
    message: "Has alcanzado tu límite de resúmenes de audio.",
    icon: <Zap className="w-6 h-6" />,
  },
  price_alert: {
    title: "Límite de alertas alcanzado",
    message: "Has alcanzado el máximo de alertas de precio activas.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  portfolio_asset: {
    title: "Límite de portafolio alcanzado",
    message: "Has alcanzado el máximo de activos en tu portafolio.",
    icon: <Crown className="w-6 h-6" />,
  },
};

const TIER_BENEFITS: Record<PlanTier, string[]> = {
  free: [],
  pro: [
    "Mucha más capacidad de preguntas al mes",
    "1.000 créditos de imagen en Flow",
    "50 audios de noticias al mes",
    "5 alertas de precio",
    "Sin publicidad",
  ],
  max: [
    "Doble de límites de preguntas (x2 límites de Pro)",
    "2.000 créditos de imagen en Flow",
    "100 audios al mes (x2 Pro)",
    "10 alertas de precio (x2 Pro)",
    "Informe semanal IA",
  ],
  ultra: [
    "Límites de preguntas x5 (x5 límites de Pro)",
    "5.000 créditos de imagen en Flow",
    "250 audios al mes (x5 Pro)",
    "IA con búsqueda web activa",
    "Soporte dedicado 24/7",
  ],
  ultra_x20: [
    "Límites de preguntas x20 (x20 límites de Pro)",
    "10.000 créditos de imagen en Flow",
    "1.000 audios al mes (x20 Pro)",
    "100 alertas de precio (x20 Pro)",
    "Soporte dedicado 24/7",
  ],
};

export function UpgradeModal({ isOpen, onClose, feature, customTitle, customMessage, usage }: UpgradeModalProps) {
  const { tier } = useSubscriptionStore();
  const nextTier = getNextTier(tier);
  
  if (!nextTier) return null;
  
  const nextConfig = PLAN_CONFIGS[nextTier];
  const featureInfo = feature ? FEATURE_MESSAGES[feature] : null;
  const benefits = TIER_BENEFITS[nextTier];
  
  const title = customTitle || featureInfo?.title || "Mejora tu plan";
  const message = customMessage || featureInfo?.message || "Desbloquea más funciones con un plan superior.";
  const icon = featureInfo?.icon || <Crown className="w-6 h-6" />;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-background border border-border rounded-3xl shadow-2xl overflow-hidden relative"
          >
            {/* Gradient header */}
            <div className="relative overflow-hidden px-6 pt-8 pb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-purple-500/5 to-cyan-500/10" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-accent/30">
                  {icon}
                </div>
                <h2 className="text-xl font-bold mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground">{message}</p>

                {/* Usage bar */}
                {usage && (
                  <div className="mt-4 bg-background/60 backdrop-blur-sm rounded-xl p-3 border border-border/50">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-muted-foreground">Uso este mes</span>
                      <span className="text-xs font-bold text-foreground">{usage.used}/{usage.limit}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all" 
                        style={{ width: `${Math.min(100, (usage.used / usage.limit) * 100)}%` }} 
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Plan info */}
            <div className="px-6 pb-6">
              <div className="bg-secondary/30 border border-border rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan recomendado</span>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {nextConfig.name}
                      {nextTier === "max" && (
                        <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] font-bold rounded-full">
                          Popular
                        </span>
                      )}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold">{formatCLP(nextConfig.price)}</span>
                    <span className="text-xs text-muted-foreground block">/mes</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {benefits.map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <Link href="/suscripcion" onClick={onClose}>
                <Button className="w-full h-12 bg-gradient-to-r from-accent to-purple-600 hover:from-accent/90 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-accent/20 group">
                  Prueba 7 días gratis
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>

              <Link
                href="/suscripcion"
                onClick={onClose}
                className="w-full mt-2 text-center text-xs text-[#1890FF] hover:underline font-medium"
              >
                ¿Eres empresa? Ver planes para equipos →
              </Link>

              <button
                onClick={onClose}
                className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                Ahora no
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

