"use client";

import { motion } from "framer-motion";
import { Send, UserCheck, Clock, CalendarDays } from "lucide-react";

interface ReferralStatsProps {
  invited: number;
  qualified: number;
  pending: number;
  daysEarned: number;
}

/**
 * Grid de estadísticas de referidos. Reutiliza el patrón de stat-cards
 * de admin/page.tsx con tiles de icono y números tabulares.
 */
export function ReferralStats({ invited, qualified, pending, daysEarned }: ReferralStatsProps) {
  const cards = [
    {
      label: "Invitaciones",
      value: invited,
      icon: Send,
      color: "text-zinc-700 dark:text-zinc-350",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
      iconBg: "bg-zinc-150 dark:bg-zinc-800",
    },
    {
      label: "Se unieron",
      value: qualified + pending,
      icon: UserCheck,
      color: "text-zinc-700 dark:text-zinc-350",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
      iconBg: "bg-zinc-150 dark:bg-zinc-800",
    },
    {
      label: "Pagaron",
      value: qualified,
      icon: CalendarDays,
      color: "text-zinc-700 dark:text-zinc-350",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
      iconBg: "bg-zinc-150 dark:bg-zinc-800",
    },
    {
      label: "Días ganados",
      value: daysEarned,
      icon: Clock,
      color: "text-zinc-700 dark:text-zinc-350",
      bg: "bg-zinc-50 dark:bg-zinc-900/50",
      iconBg: "bg-zinc-150 dark:bg-zinc-800",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05 }}
          className={`${c.bg} border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none`}
        >
          <div className={`p-1.5 rounded-lg ${c.iconBg} w-fit mb-3`}>
            <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {c.value}
          </p>
          <p className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold mt-1 uppercase tracking-wider">
            {c.label}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
