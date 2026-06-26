"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Gift, ArrowRight, Crown } from "lucide-react";
import Link from "next/link";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";

type BannerVariant = "upgrade" | "trial";

interface PromoBannerProps {
  variant?: BannerVariant;
  className?: string;
}

const VARIANTS: Record<BannerVariant, {
  icon: typeof Sparkles;
  gradient: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  border: string;
}> = {
  upgrade: {
    icon: Crown,
    gradient: "from-[#0052CC]/10 via-purple-500/5 to-cyan-500/10",
    title: "Desbloquea análisis IA avanzado",
    subtitle: "Prueba Pro gratis por 7 días — sin cargo hasta que decidas.",
    cta: "Comenzar trial gratis",
    href: "/suscripcion",
    border: "border-[#1890FF]/20",
  },
  trial: {
    icon: Sparkles,
    gradient: "from-amber-500/10 via-orange-500/5 to-red-500/10",
    title: "¿Sabías que puedes probar Pro gratis?",
    subtitle: "7 días de acceso completo a IA avanzada, alertas y más. Sin compromiso.",
    cta: "Activar trial",
    href: "/suscripcion",
    border: "border-amber-500/20",
  },
};

export function PromoBanner({ variant = "upgrade", className = "" }: PromoBannerProps) {
  const { tier } = useSubscriptionStore();
  const [dismissed, setDismissed] = useState(false);

  // Only show to free users
  if (tier !== "free" || dismissed) return null;

  const config = VARIANTS[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.gradient} border ${config.border} p-4 sm:p-5 ${className}`}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-3 h-3" />
        </button>

        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-foreground" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-foreground leading-tight">{config.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed hidden sm:block">{config.subtitle}</p>
          </div>

          <Link href={config.href} className="shrink-0">
            <button className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap group">
              {config.cta}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
