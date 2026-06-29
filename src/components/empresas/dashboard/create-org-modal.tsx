"use client";

import { useState, useEffect } from "react";
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card rounded-3xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black">Crear organización</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nombre de la organización *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme SpA"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">RUT (opcional)</label>
            <input
              type="text"
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-[#1890FF]"
            />
          </div>

          {/* Plan selector */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Plan</label>
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
                    className={`rounded-xl border-2 p-3 text-left transition ${
                      active ? "border-[#1890FF] bg-[#1890FF]/5" : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <span className="block text-sm font-bold">{pc.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
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
                  <p className="text-xs font-semibold text-muted-foreground mb-0.5">Asientos</p>
                  <p className="text-[11px] text-muted-foreground">Mín. {config.minSeats}{config.maxSeats !== -1 ? ` · Máx. ${config.maxSeats}` : ""}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSeats(Math.max(config.minSeats, seats - 1))}
                    disabled={seats <= config.minSeats}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-30 hover:bg-accent"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-lg font-black">{seats}</span>
                  <button
                    onClick={() => setSeats(seats + 1)}
                    disabled={config.maxSeats !== -1 && seats >= config.maxSeats}
                    className="w-9 h-9 rounded-lg border border-border flex items-center justify-center disabled:opacity-30 hover:bg-accent"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cycle */}
              <div className="flex bg-accent rounded-xl p-1">
                <button
                  onClick={() => setCycle("monthly")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${cycle === "monthly" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  Mensual
                </button>
                <button
                  onClick={() => setCycle("annual")}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${cycle === "annual" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
                >
                  Anual
                  <span className="text-[10px] text-[#22ab94] font-bold">-17%</span>
                </button>
              </div>

              {/* Total */}
              <div className="bg-accent rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground">
                    {cycle === "annual" ? "Equiv. mensual (anual)" : "Total mensual"}
                  </p>
                  <p className="text-2xl font-black">
                    {formatCLP(cycle === "annual" ? annualMonthly : monthly)}
                    <span className="text-xs font-normal text-muted-foreground">/mes</span>
                  </p>
                  {cycle === "annual" && (
                    <p className="text-[11px] text-muted-foreground">Facturado: {formatCLP(annualTotal)}/año</p>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground text-right">
                  Incluye prueba<br />de 14 días
                </p>
              </div>
            </>
          )}

          {config.cta === "contact" && (
            <p className="text-sm text-muted-foreground bg-accent rounded-xl p-4">
              Para Enterprise contáctanos en <a href="/empresas#contacto" className="text-[#1890FF] font-semibold">/empresas</a>.
            </p>
          )}

          {error && <p className="text-[#f7525f] text-xs">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canCreate || submitting}
            className="w-full bg-[#1890FF] hover:bg-[#0f7be0] disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Creando…</>
            ) : (
              <>Crear y comenzar prueba <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}