"use client";

import { motion } from "framer-motion";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { getPlanConfig } from "@/lib/plan-limits";

interface UsageIndicatorProps {
  type: "ai" | "tts";
  compact?: boolean;
  className?: string;
}

/** Format large token numbers: 12500 → "12.5k", 1000000 → "1M" */
function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return Number.isInteger(m) ? `${m}M` : `${m.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(n);
}

export function UsageIndicator({ type, compact = false, className = "" }: UsageIndicatorProps) {
  const tier = useSubscriptionStore((s) => s.tier);
  const config = getPlanConfig(tier);
  
  const remaining = type === "ai" 
    ? useSubscriptionStore.getState().getAiRemaining()
    : useSubscriptionStore.getState().getTtsRemaining();
  
  let limit: number;
  let label: string;
  let periodLabel: string;
  
  if (type === "ai") {
    // Primary AI quota is tokens (not message count)
    if (tier === "free") {
      limit = config.aiLifetimeTokens;
      label = "Tokens IA";
      periodLabel = "de por vida";
    } else {
      limit = config.aiTokensPerMonth;
      label = "Tokens IA";
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
  
  const used = Math.max(0, limit - remaining);
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

  const format = type === "ai" ? formatTokens : (n: number) => String(n);

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
          {format(remaining)}/{format(limit)}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-secondary/30 border border-border rounded-xl p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        <span className={`text-[11px] font-bold ${textColor}`}>
          {format(remaining)} restantes {periodLabel}
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
          Has alcanzado tu límite de tokens. Mejora tu plan para continuar.
        </p>
      )}
    </div>
  );
}
