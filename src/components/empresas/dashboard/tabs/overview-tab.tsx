"use client";

import { motion } from "framer-motion";
import { ENTERPRISE_PLANS, formatCLP, type EnterprisePlan } from "@/lib/plan-limits";
import type { UserOrgMembership } from "@/lib/types";
import { Users, Calendar, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp, Building2 } from "lucide-react";

interface OverviewTabProps {
  membership: UserOrgMembership;
  members: any[];
  subscription: any;
  seatActiveCount: number;
  pendingCount: number;
  onGoToMembers: () => void;
}

export function OverviewTab({
  membership,
  members,
  subscription,
  seatActiveCount,
  pendingCount,
  onGoToMembers,
}: OverviewTabProps) {
  const org = membership.org;
  const planConfig = ENTERPRISE_PLANS[(org.plan as EnterprisePlan) ?? "team"];
  const usedSeats = seatActiveCount + pendingCount;
  const seatPct = org.seat_count > 0 ? Math.min(100, (usedSeats / org.seat_count) * 100) : 0;

  const status = subscription?.status ?? org.status ?? "trial";
  const periodEnd = subscription?.current_period_end ?? org.current_period_end;
  const isTrial = status === "trial";
  const isActive = status === "active";

  const recentMembers = [...members]
    .filter((m) => m.status === "active")
    .sort((a, b) => new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Status hero card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm"
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {isTrial ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> Período de prueba
                </span>
              ) : isActive ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {status}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700">
                <Building2 className="w-3 h-3" /> {planConfig.name}
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">{org.name}</h2>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-1">{org.slug}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1 justify-end mb-1">
              <Calendar className="w-3 h-3" />
              {isTrial ? "Prueba termina" : "Próxima facturación"}
            </p>
            <p className="text-lg font-bold">
              {periodEnd ? new Date(periodEnd).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Asientos contratados" value={String(org.seat_count)} icon={Users} delay={0.05} />
        <StatCard
          label="Asientos en uso"
          value={`${usedSeats}`}
          sub={`${seatActiveCount} activos · ${pendingCount} invitaciones`}
          icon={Users}
          delay={0.1}
        />
        <StatCard
          label="Costo actual"
          value={planConfig.pricePerSeat === 0 ? "—" : formatCLP(planConfig.pricePerSeat * org.seat_count)}
          sub={planConfig.pricePerSeat === 0 ? "Plan a medida" : "/ mes"}
          icon={TrendingUp}
          delay={0.15}
        />
        <StatCard
          label="Miembros activos"
          value={String(seatActiveCount)}
          sub={pendingCount > 0 ? `${pendingCount} pendientes` : "sin pendientes"}
          icon={CheckCircle2}
          delay={0.2}
        />
      </div>

      {/* Seats progress */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black">Ocupación de asientos</h3>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5">
              {usedSeats} de {org.seat_count} en uso · {org.seat_count - usedSeats} disponibles
            </p>
          </div>
          <button
            onClick={onGoToMembers}
            className="text-xs text-neutral-900 dark:text-white font-bold flex items-center gap-1 hover:gap-2 transition-all px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800"
          >
            Gestionar <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="h-2.5 bg-neutral-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${seatPct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`h-full rounded-full ${seatPct >= 90 ? "bg-[#f7525f]" : seatPct >= 70 ? "bg-amber-500" : "bg-neutral-950 dark:bg-white"}`}
          />
        </div>
      </div>

      {/* Recent members */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm">
        <h3 className="text-sm font-black mb-5">Miembros recientes</h3>
        {recentMembers.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-neutral-400 dark:text-zinc-500" />
            </div>
            <p className="text-sm text-neutral-500 dark:text-zinc-400">Sin miembros aún. Invita a tu equipo desde la pestaña Miembros.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100 dark:divide-zinc-800">
            {recentMembers.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-black overflow-hidden shrink-0">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (m.name || m.email || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{m.name || m.email || "Invitado"}</p>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400 truncate">{m.email ?? "—"}</p>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300 uppercase tracking-wide">
                  {m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Miembro"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, delay = 0 }: { label: string; value: string; sub?: string; icon: any; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[24px] p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide">{label}</p>
        <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-neutral-400 dark:text-zinc-500" />
        </div>
      </div>
      <p className="text-2xl font-black tracking-tight">{value}</p>
      {sub && <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1">{sub}</p>}
    </motion.div>
  );
}
