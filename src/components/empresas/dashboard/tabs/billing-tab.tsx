"use client";

import { useState } from "react";
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
import { CreditCard, Calendar, Loader2, Minus, Plus, ArrowRight } from "lucide-react";

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
      <h2 className="text-xl font-black">Facturación</h2>

      {/* Current plan */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Plan actual</p>
            <h3 className="text-2xl font-black">{planConfig.name}</h3>
            <p className="text-sm text-muted-foreground">
              {planConfig.pricePerSeat === 0
                ? "Plan a medida — contacta a ventas"
                : `${formatCLP(planConfig.pricePerSeat)} / asiento / mes`}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" :
                isTrial ? "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" :
                "bg-red-100 text-red-700"
              }`}>
                <Calendar className="w-3 h-3" />
                {isTrial ? "En prueba" : isActive ? "Activa" : status}
              </span>
              <span className="text-xs text-muted-foreground">
                {periodEnd ? `Renueva ${new Date(periodEnd).toLocaleDateString("es-CL")}` : ""}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                {cycle === "annual" ? "Anual" : "Mensual"}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Costo actual</p>
            <p className="text-3xl font-black">
              {planConfig.pricePerSeat === 0
                ? "—"
                : formatCLP(cycle === "annual" ? currentAnnualMonthly : currentMonthly)}
            </p>
            <p className="text-xs text-muted-foreground">
              {cycle === "annual" ? `/ mes (facturado anual ${formatCLP(currentAnnual)})` : "/ mes"}
            </p>
          </div>
        </div>
      </div>

      {/* Seats management */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Asientos contratados
          </h3>
          {canAdmin && !editingSeats && (
            <button
              onClick={() => { setNewSeats(seatCount); setEditingSeats(true); }}
              className="text-sm text-[#1890FF] font-semibold hover:underline"
            >
              Cambiar
            </button>
          )}
        </div>

        {!editingSeats ? (
          <p className="text-2xl font-black">{seatCount} <span className="text-sm font-normal text-muted-foreground">asientos</span></p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setNewSeats(Math.max(planConfig.minSeats, newSeats - 1))}
                disabled={busy || newSeats <= planConfig.minSeats}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center disabled:opacity-30 hover:bg-accent"
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
                className="w-20 text-center text-2xl font-black border border-border rounded-xl py-1.5 outline-none focus:border-[#1890FF]"
              />
              <button
                onClick={() => setNewSeats(newSeats + 1)}
                disabled={busy || (planConfig.maxSeats !== -1 && newSeats >= planConfig.maxSeats)}
                className="w-10 h-10 rounded-xl border border-border flex items-center justify-center disabled:opacity-30 hover:bg-accent"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-accent rounded-xl p-3 text-sm">
              <p className="text-muted-foreground text-xs">Nuevo total:</p>
              <p className="text-lg font-black">
                {planConfig.pricePerSeat === 0
                  ? "—"
                  : formatCLP(cycle === "annual" ? getAnnualEquivalentMonthly(org.plan as EnterprisePlan, newSeats) : calculateSeatTotal(org.plan as EnterprisePlan, newSeats))}
                <span className="text-xs font-normal text-muted-foreground">/ mes</span>
              </p>
            </div>
            {result?.warning && <p className="text-[#f7525f] text-xs">{result.warning}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleUpdateSeats}
                disabled={busy || newSeats === seatCount}
                className="flex-1 bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {busy ? "Procesando…" : "Actualizar asientos"}
              </button>
              <button
                onClick={() => setEditingSeats(false)}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-accent disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment method */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-sm font-bold mb-3">Método de pago</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-sm">
            <p className="font-semibold">MercadoPago</p>
            <p className="text-xs text-muted-foreground">
              {subscription?.external_subscription_id ? "Suscripción activa" : "Sin suscripción configurada"}
            </p>
          </div>
          {subscription?.external_subscription_id && (
            <span className="text-xs text-muted-foreground ml-auto truncate max-w-[160px]">
              #{subscription.external_subscription_id.slice(0, 12)}…
            </span>
          )}
        </div>
      </div>

      {/* Tax info */}
      <div className="text-xs text-muted-foreground bg-accent/40 rounded-xl p-4">
        <p>
          Para facturación con RUT, orden de compra o facturación anual en Enterprise,
          escríbenos a <a href="mailto:ventas@maverlang.cl" className="text-[#1890FF] font-semibold">ventas@maverlang.cl</a>.
        </p>
      </div>
    </div>
  );
}