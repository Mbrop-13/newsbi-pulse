"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Hourglass } from "lucide-react";

export interface ReferralItem {
  id: string;
  label: string;
  status: "pending" | "qualified";
  signupAt: string | null;
  qualifiedAt: string | null;
}

/**
 * Lista de referidos (emails anonimizados) con pill de estado.
 */
export function ReferralList({ referrals }: { referrals: ReferralItem[] }) {
  if (referrals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-zinc-800 p-8 text-center">
        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          Aún no tienes referidos
        </p>
        <p className="text-[11px] text-neutral-400 dark:text-zinc-600 mt-1">
          Comparte tu enlace para ver aquí quién se une.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 overflow-hidden">
      <div className="divide-y divide-neutral-100 dark:divide-zinc-800/80">
        {referrals.map((r, i) => {
          const isQualified = r.status === "qualified";
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isQualified
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                      : "bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {r.label.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {r.label}
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-zinc-500">
                    {r.signupAt ? new Date(r.signupAt).toLocaleDateString("es", { day: "numeric", month: "short" }) : ""}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                  isQualified
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400"
                }`}
              >
                {isQualified ? <CheckCircle2 className="w-3 h-3" /> : <Hourglass className="w-3 h-3" />}
                {isQualified ? "Cualificado" : "Pendiente"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
