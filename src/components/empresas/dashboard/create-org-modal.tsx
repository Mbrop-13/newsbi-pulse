"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ENTERPRISE_PLANS,
  ENTERPRISE_PLAN_ORDER,
  calculateSeatTotal,
  calculateAnnualTotal,
  getAnnualEquivalentMonthly,
  formatCLP,
  type EnterprisePlan,
  type BillingCycle,
} from "@/lib/plan-limits";
import { X, Plus, Minus, Loader2, ArrowRight } from "lucide-react";

interface CreateOrgModalProps {
  onClose: () => void;
  onCreated: (orgId: string, checkoutUrl: string | null) => void;
  defaultPlan?: EnterprisePlan;
  defaultSeats?: number;
  defaultCycle?: BillingCycle;
}

export function CreateOrgModal({
  onClose,
  onCreated,
  defaultPlan,
  defaultSeats,
  defaultCycle,
}: CreateOrgModalProps) {
  const [name, setName] = useState("");
  const [rut, setRut] = useState("");
  const [plan, setPlan] = useState<EnterprisePlan>(defaultPlan ?? "business");
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle ?? "monthly");
  const [seats, setSeats] = useState(defaultSeats ?? ENTERPRISE_PLANS.business.recommendedSeats);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultPlan) setPlan(defaultPlan);
    if (defaultCycle) setCycle(defaultCycle);
    if (defaultSeats) setSeats(defaultSeats);
  }, [defaultPlan, defaultCycle, defaultSeats]);

  const config = ENTERPRISE_PLANS[plan];
  const canCreate = Boolean(name.trim()) && config.cta !== "contact";

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Ingresa el nombre de la organización");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/empresas/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), rut: rut.trim() || undefined, plan, seats, billing_cycle: cycle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear");
      onCreated(data.org_id, data.url ?? null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const monthly = calculateSeatTotal(plan, seats);
  const annualMonthly = getAnnualEquivalentMonthly(plan, seats);
  const annualTotal = calculateAnnualTotal(plan, seats);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-[32px] max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl text-neutral-900 dark:text-neutral-100"
      >
        <div className="flex items-center justify-between mb-7">
          <h2 className="text-xl font-black">Crear organización</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Nombre de la organización *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme SpA"
              className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">RUT (opcional)</label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9"
              className="w-full rounded-2xl border border-neutral-200 dark:border-zinc-700 bg-neutral-50 dark:bg-zinc-800/60 px-4 py-3 text-sm outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
            />
          </div>

          {/* Plan selector */}
          <div>
            <label className="block text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {ENTERPRISE_PLAN_ORDER.map((p) => {
                const pc = ENTERPRISE_PLANS[p];
                const active = p === plan;
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setPlan(p);
                      const clamped = Math.max(pc.minSeats, Math.min(seats, pc.maxSeats === -1 ? seats : pc.maxSeats));
                      setSeats(clamped);
                    }}
                    className={`rounded-2xl border-2 p-3 text-left transition-all ${
                      active
                        ? "border-neutral-900 dark:border-white bg-neutral-50 dark:bg-zinc-800/60"
                        : "border-neutral-200 dark:border-zinc-700 hover:border-neutral-400 dark:hover:border-zinc-500"
                    }`}
                  >
                    <span className="block text-sm font-bold">{pc.name}</span>
                    <span className="block text-[11px] text-neutral-500 dark:text-zinc-400">
                      {pc.pricePerSeat === 0 ? "Hablemos" : `${formatCLP(pc.pricePerSeat)}/asiento`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {config.cta !== "contact" && (
            <>
              {/* Seats */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-black text-neutral-500 dark:text-zinc-400 uppercase tracking-wide mb-0.5">Asientos</p>
                  <p className="text-[11px] text-neutral-400 dark:text-zinc-500">Mín. {config.minSeats}{config.maxSeats !== -1 ? ` · Máx. ${config.maxSeats}` : ""}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSeats(Math.max(config.minSeats, seats - 1))}
                    disabled={seats <= config.minSeats}
                    className="w-9 h-9 rounded-full border border-neutral-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-lg font-black">{seats}</span>
                  <button
                    onClick={() => setSeats(seats + 1)}
                    disabled={config.maxSeats !== -1 && seats >= config.maxSeats}
                    className="w-9 h-9 rounded-full border border-neutral-200 dark:border-zinc-700 flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cycle toggle */}
              <div className="flex bg-neutral-100 dark:bg-zinc-800 rounded-full p-1 border border-neutral-200/50 dark:border-zinc-700/50">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`flex-1 py-2 text-sm font-bold rounded-full transition ${cycle === "monthly" ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 dark:text-zinc-400"}`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setCycle("annual")}
                  className={`flex-1 py-2 text-sm font-bold rounded-full transition flex items-center justify-center gap-1.5 ${cycle === "annual" ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm" : "text-neutral-500 dark:text-zinc-400"}`}
                >
                  Anual
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black">-17%</span>
                </button>
              </div>

              {/* Total */}
              <div className="bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/50 dark:border-zinc-700/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 font-bold uppercase tracking-wide">
                    {cycle === "annual" ? "Equiv. mensual (anual)" : "Total mensual"}
                  </p>
                  <p className="text-2xl font-black mt-0.5">
                    {formatCLP(cycle === "annual" ? annualMonthly : monthly)}
                    <span className="text-xs font-normal text-neutral-500 dark:text-zinc-400">/mes</span>
                  </p>
                  {cycle === "annual" && (
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400">Facturado: {formatCLP(annualTotal)}/año</p>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-zinc-400 text-right">
                  Incluye prueba<br />de 14 días
                </p>
              </div>
            </>
          )}

          {config.cta === "contact" && (
            <p className="text-sm text-neutral-500 dark:text-zinc-400 bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-200/50 dark:border-zinc-700/50 rounded-2xl p-4">
              Para Enterprise contáctanos en <a href="mailto:ventas@maverlang.cl" className="text-neutral-900 dark:text-white font-bold underline underline-offset-2">ventas@maverlang.cl</a>.
            </p>
          )}

          {error && <p className="text-[#f7525f] text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canCreate || submitting}
            className="w-full bg-neutral-950 dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-full transition-all hover:bg-neutral-800 dark:hover:bg-neutral-100 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</>
            ) : (
              <>Crear y comenzar prueba <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
