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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      iconBg: "bg-blue-100 dark:bg-white/5",
    },
    {
      label: "Se unieron",
      value: qualified + pending,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      iconBg: "bg-emerald-100 dark:bg-white/5",
    },
    {
      label: "Pagaron",
      value: qualified,
      icon: CalendarDays,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-500/10",
      iconBg: "bg-violet-100 dark:bg-white/5",
    },
    {
      label: "Días ganados",
      value: daysEarned,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      iconBg: "bg-amber-100 dark:bg-white/5",
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
