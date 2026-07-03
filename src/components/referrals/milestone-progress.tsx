"use client";

import { motion } from "framer-motion";
import { Check, Lock, Gift } from "lucide-react";
import { REFERRAL_MILESTONES } from "@/lib/referral-config";

/**
 * Escalera gamificada de milestones (1, 3, 5, 10, 25). Muestra barra de
 * progreso al siguiente nivel + nodos alcanzados (✓) / bloqueados.
 */
export function MilestoneProgress({ qualified }: { qualified: number }) {
  const reached = REFERRAL_MILESTONES.filter((m) => qualified >= m.threshold);
  const prevThreshold = reached.length ? reached[reached.length - 1].threshold : 0;
  const next = REFERRAL_MILESTONES.find((m) => qualified < m.threshold);
  const span = next ? next.threshold - prevThreshold : 0;
  const done = next ? qualified - prevThreshold : span;
  const pct = next && span > 0 ? Math.min(100, (done / span) * 100) : 100;
  const allDone = !next;

  return (
    <div className="rounded-[32px] bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1890FF]/10 flex items-center justify-center">
            <Gift className="w-4 h-4 text-[#1890FF]" />
          </div>
          <h3 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white">
            Tu progreso
          </h3>
        </div>
        <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 tabular-nums">
          {qualified} {qualified === 1 ? "referido" : "referidos"}
        </span>
      </div>

      {/* Progress to next milestone */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
            {allDone ? "¡Todos los niveles desbloqueados! 🎉" : `Faltan ${next!.threshold - qualified} para el siguiente nivel`}
          </span>
          {next && (
            <span className="text-[10px] font-bold text-[#1890FF]">
              +{next.days} días · {next.badge}
            </span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-neutral-100 dark:bg-zinc-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-[#0052CC] to-[#22D3EE]"
          />
        </div>
      </div>

      {/* Milestone ladder */}
      <div className="flex items-center justify-between gap-1">
        {REFERRAL_MILESTONES.map((m, i) => {
          const isReached = qualified >= m.threshold;
          const isNext = next?.threshold === m.threshold;
          return (
            <div key={m.threshold} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${
                    isReached
                      ? "bg-gradient-to-br from-[#0052CC] to-[#0066FF] border-transparent text-white shadow-lg shadow-blue-500/30"
                      : isNext
                        ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF]"
                        : "border-neutral-200 dark:border-zinc-800 bg-neutral-50 dark:bg-zinc-900 text-neutral-300 dark:text-zinc-600"
                  }`}
                >
                  {isReached ? (
                    <Check className="w-5 h-5" />
                  ) : isNext ? (
                    <span className="text-xs font-black">{m.threshold}</span>
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`text-[9px] md:text-[10px] font-bold text-center leading-tight ${
                    isReached
                      ? "text-neutral-900 dark:text-white"
                      : "text-neutral-400 dark:text-zinc-500"
                  }`}
                >
                  {m.threshold}
                </span>
              </div>
              {i < REFERRAL_MILESTONES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 md:mx-2 -mt-5 rounded-full ${
                    isReached && qualified >= REFERRAL_MILESTONES[i + 1].threshold
                      ? "bg-gradient-to-r from-[#0052CC] to-[#22D3EE]"
                      : "bg-neutral-200 dark:bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
