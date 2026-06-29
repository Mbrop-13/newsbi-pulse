"use client";

import { ENTERPRISE_PLANS, formatCLP, type EnterprisePlan } from "@/lib/plan-limits";
import type { UserOrgMembership } from "@/lib/types";
import { Users, Calendar, CheckCircle2, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";

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
      {/* Status card */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isTrial ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  <AlertTriangle className="w-3 h-3" /> Período de prueba
                </span>
              ) : isActive ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" /> Activa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400">
                  <AlertTriangle className="w-3 h-3" /> {status}
                </span>
              )}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent">{planConfig.name}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">{org.name}</h2>
            <p className="text-sm text-muted-foreground">{org.slug}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              <Calendar className="w-3 h-3" />
              {isTrial ? "Prueba termina" : "Próxima facturación"}
            </p>
            <p className="text-lg font-bold">
              {periodEnd ? new Date(periodEnd).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" }) : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Asientos contratados" value={String(org.seat_count)} icon={Users} />
        <StatCard label="Asientos en uso" value={`${usedSeats}`} sub={`${seatActiveCount} activos · ${pendingCount} invitaciones`} icon={Users} />
        <StatCard
          label="Costo actual"
          value={planConfig.pricePerSeat === 0 ? "—" : formatCLP(planConfig.pricePerSeat * org.seat_count)}
          sub="/ mes"
          icon={TrendingUp}
        />
        <StatCard
          label="Miembros activos"
          value={String(seatActiveCount)}
          sub={pendingCount > 0 ? `${pendingCount} pendientes` : "sin pendientes"}
          icon={CheckCircle2}
        />
      </div>

      {/* Seats progress */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Asientos</h3>
          <button onClick={onGoToMembers} className="text-xs text-[#1890FF] font-semibold flex items-center gap-1 hover:underline">
            Gestionar miembros <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="h-2.5 bg-accent rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${seatPct >= 90 ? "bg-[#f7525f]" : seatPct >= 70 ? "bg-amber-500" : "bg-[#1890FF]"}`}
            style={{ width: `${seatPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {usedSeats} de {org.seat_count} asientos en uso · {org.seat_count - usedSeats} disponibles
        </p>
      </div>

      {/* Recent members */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold mb-4">Miembros recientes</h3>
        {recentMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Sin miembros aún. Invita a tu equipo desde la pestaña Miembros.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentMembers.map((m: any) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold overflow-hidden">
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (m.name || m.email || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{m.name || m.email || "Invitado"}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email ?? "—"}</p>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent">
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

function StatCard({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: any }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <p className="text-xl font-black">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}