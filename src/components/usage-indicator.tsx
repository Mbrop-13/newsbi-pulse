"use client";

import { motion } from "framer-motion";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { getPlanConfig } from "@/lib/plan-limits";

interface UsageIndicatorProps {
  type: "ai" | "tts";
  compact?: boolean;
  className?: string;
}

export function UsageIndicator({ type, compact = false, className = "" }: UsageIndicatorProps) {
  const { tier } = useSubscriptionStore();
  const config = getPlanConfig(tier);
  
  const remaining = type === "ai" 
    ? useSubscriptionStore.getState().getAiRemaining()
    : useSubscriptionStore.getState().getTtsRemaining();
  
  let limit: number;
  let label: string;
  let periodLabel: string;
  
  if (type === "ai") {
    if (tier === "free") {
      limit = config.aiLifetimeMessages;
      label = "Consultas IA";
      periodLabel = "de por vida";
    } else {
      limit = config.aiMessagesPerMonth;
      label = "Consultas IA";
      periodLabel = "/mes";
    }
  } else {
    if (tier === "free") {
      limit = config.ttsDailyLimit;
      label = "Audios";
      periodLabel = "/día";
    } else {
      limit = config.ttsAudiosPerMonth;
      label = "Audios";
      periodLabel = "/mes";
    }
  }
  
  if (limit === -1) return null; // Unlimited — no indicator needed
  
  const used = limit - remaining;
  const percentage = Math.min((used / limit) * 100, 100);
  const isLow = percentage >= 80;
  const isExhausted = percentage >= 100;
  
  const barColor = isExhausted
    ? "bg-red-500"
    : isLow
    ? "bg-amber-500"
    : "bg-accent";
  
  const textColor = isExhausted
    ? "text-red-500"
    : isLow
    ? "text-amber-500"
    : "text-muted-foreground";

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        <span className={`text-[10px] font-bold ${textColor}`}>
          {remaining}/{limit}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-secondary/30 border border-border rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={`text-[11px] font-bold ${textColor}`}>
          {remaining} restantes {periodLabel}
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barColor} transition-colors`}
        />
      </div>
      {isExhausted && (
        <p className="text-[10px] text-red-500 font-medium mt-1.5">
          Has alcanzado tu límite. Mejora tu plan para continuar.
        </p>
      )}
    </div>
  );
}
