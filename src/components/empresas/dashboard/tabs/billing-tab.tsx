"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { UserOrgMembership } from "@/lib/types";
import {
  ENTERPRISE_PLANS,
  calculateSeatTotal,
  calculateAnnualTotal,
  getAnnualEquivalentMonthly,
  formatCLP,
  type EnterprisePlan,
  type BillingCycle,
} from "@/lib/plan-limits";
import { CreditCard, Calendar, Loader2, Minus, Plus, ArrowRight, Wallet } from "lucide-react";

interface BillingTabProps {
  orgId: string;
  membership: UserOrgMembership;
  subscription: any;
  seatCount: number;
  onSeatsUpdated: (n: number) => void;
  canAdmin: boolean;
}

export function BillingTab({ orgId, membership, subscription, seatCount, onSeatsUpdated, canAdmin }: BillingTabProps) {
  const org = membership.org;
  const planConfig = ENTERPRISE_PLANS[(org.plan as EnterprisePlan) ?? "team"];
  const cycle = (org.billing_cycle as BillingCycle) ?? "monthly";
  const [editingSeats, setEditingSeats] = useState(false);
  const [newSeats, setNewSeats] = useState(seatCount);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url?: string; warning?: string } | null>(null);

  const currentMonthly = calculateSeatTotal(org.plan as EnterprisePlan, seatCount);
  const currentAnnualMonthly = getAnnualEquivalentMonthly(org.plan as EnterprisePlan, seatCount);
  const currentAnnual = calculateAnnualTotal(org.plan as EnterprisePlan, seatCount);

  const handleUpdateSeats = async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/empresas/${orgId}/seats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats: newSeats }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar");
      if (data.url) {
        window.location.href = data.url;
      } else {
        onSeatsUpdated(data.seats ?? newSeats);
        if (data.warning) setResult({ warning: data.warning });
      }
      setEditingSeats(false);
    } catch (err: any) {
      setResult({ warning: err.message });
    } finally {
      setBusy(false);
    }
  };

  const status = subscription?.status ?? org.status ?? "trial";
  const isActive = status === "active";
  const isTrial = status === "trial";
  const periodEnd = subscription?.current_period_end ?? org.current_period_end;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-black tracking-tight">Facturación</h2>

      {/* Current plan */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500 dark:text-zinc-400 mb-2">Plan actual</p>
            <h3 className="text-3xl font-black tracking-tight">{planConfig.name}</h3>
            <p className="text-sm text-neutral-500 dark:text-zinc-400 mt-1">
              {planConfig.pricePerSeat === 0
                ? "Plan a medida — contacta a ventas"
                : `${formatCLP(planConfig.pricePerSeat)} / asiento / mes`}
            </p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                isTrial ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              }`}>
                <Calendar className="w-3 h-3" />
                {isTrial ? "En prueba" : isActive ? "Activa" : status}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-zinc-400">
                {periodEnd ? `Renueva ${new Date(periodEnd).toLocaleDateString("es-CL")}` : ""}
              </span>
              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700">
                {cycle === "annual" ? "Anual" : "Mensual"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mb-1">Costo actual</p>
            <p className="text-3xl font-black tracking-tight">
              {planConfig.pricePerSeat === 0
                ? "—"
                : formatCLP(cycle === "annual" ? currentAnnualMonthly : currentMonthly)}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
              {cycle === "annual" ? `/ mes (anual ${formatCLP(currentAnnual)})` : "/ mes"}
            </p>
          </div>
        </div>
      </div>

      {/* Seats management */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-black flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
              <CreditCard className="w-3.5 h-3.5 text-neutral-400 dark:text-zinc-500" />
            </div>
            Asientos contratados
          </h3>
          {canAdmin && !editingSeats && (
            <button
              onClick={() => { setNewSeats(seatCount); setEditingSeats(true); }}
              className="text-xs font-bold px-3 py-1.5 rounded-full bg-neutral-100 dark:bg-zinc-800 text-neutral-900 dark:text-white hover:bg-neutral-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cambiar
            </button>
          )}
        </div>

        {!editingSeats ? (
          <p className="text-3xl font-black tracking-tight">{seatCount} <span className="text-sm font-normal text-neutral-500 dark:text-zinc-400">asientos</span></p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewSeats(Math.max(planConfig.minSeats, newSeats - 1))}
                disabled={busy || newSeats <= planConfig.minSeats}
                className="w-11 h-11 rounded-full border border-neutral-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={newSeats}
                min={planConfig.minSeats}
                max={planConfig.maxSeats === -1 ? undefined : planConfig.maxSeats}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || planConfig.minSeats;
                  const clamped = Math.max(planConfig.minSeats, planConfig.maxSeats === -1 ? v : Math.min(v, planConfig.maxSeats));
                  setNewSeats(clamped);
                }}
                className="w-24 text-center text-3xl font-black tracking-tight border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 rounded-2xl py-2 outline-none focus:border-neutral-900 dark:focus:border-white"
              />
              <button
                onClick={() => setNewSeats(newSeats + 1)}
                disabled={busy || (planConfig.maxSeats !== -1 && newSeats >= planConfig.maxSeats)}
                className="w-11 h-11 rounded-full border border-neutral-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/50 dark:border-zinc-700/50 rounded-2xl p-4">
              <p className="text-neutral-500 dark:text-zinc-400 text-[11px] font-bold uppercase tracking-wide">Nuevo total</p>
              <p className="text-xl font-black mt-0.5">
                {planConfig.pricePerSeat === 0
                  ? "—"
                  : formatCLP(cycle === "annual" ? getAnnualEquivalentMonthly(org.plan as EnterprisePlan, newSeats) : calculateSeatTotal(org.plan as EnterprisePlan, newSeats))}
                <span className="text-xs font-normal text-neutral-500 dark:text-zinc-400">/ mes</span>
              </p>
            </div>
            {result?.warning && <p className="text-[#f7525f] text-xs">{result.warning}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleUpdateSeats}
                disabled={busy || newSeats === seatCount}
                className="flex-1 bg-neutral-950 dark:bg-white text-white dark:text-black font-bold py-3 rounded-full flex items-center justify-center gap-2 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {busy ? "Procesando…" : "Actualizar asientos"}
              </button>
              <button
                onClick={() => setEditingSeats(false)}
                disabled={busy}
                className="px-5 py-3 rounded-full border border-neutral-200 dark:border-zinc-700 text-sm font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Payment method */}
      <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-7 shadow-sm">
        <h3 className="text-sm font-black mb-4">Método de pago</h3>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-neutral-400 dark:text-zinc-500" />
          </div>
          <div className="text-sm">
            <p className="font-bold">MercadoPago</p>
            <p className="text-xs text-neutral-500 dark:text-zinc-400">
              {subscription?.external_subscription_id ? "Suscripción activa" : "Sin suscripción configurada"}
            </p>
          </div>
          {subscription?.external_subscription_id && (
            <span className="text-[11px] text-neutral-400 dark:text-zinc-500 ml-auto truncate max-w-[160px] font-mono">
              #{subscription.external_subscription_id.slice(0, 12)}…
            </span>
          )}
        </div>
      </div>

      {/* Tax info */}
      <div className="text-xs text-neutral-500 dark:text-zinc-400 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/50 dark:border-zinc-700/50 rounded-2xl p-4 leading-relaxed">
        <p>
          Para facturación con RUT, orden de compra o facturación anual en Enterprise,
          escríbenos a <a href="mailto:ventas@maverlang.cl" className="text-neutral-900 dark:text-white font-bold underline underline-offset-2">ventas@maverlang.cl</a>.
        </p>
      </div>
    </div>
  );
}
