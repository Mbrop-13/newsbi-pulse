"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Sparkles, ArrowRight, Calendar, Minus, Plus } from "lucide-react";
import {
  ENTERPRISE_PLANS,
  ENTERPRISE_PLAN_ORDER,
  calculateAnnualTotal,
  calculateSeatTotal,
  getAnnualEquivalentMonthly,
  getAnnualSavings,
  formatCLP,
  type EnterprisePlan,
  type BillingCycle,
} from "@/lib/plan-limits";

interface EmpresasPricingProps {
  onSelectPlan: (plan: EnterprisePlan, seats: number, cycle: BillingCycle) => void;
}

const COMPARISON_ROWS: {
  label: string;
  values: Record<EnterprisePlan, boolean | string>;
}[] = [
  { label: "Asientos incluidos", values: { team: "3–20", business: "5–100", enterprise: "100+" } },
  { label: "Mensajes IA / asiento / mes", values: { team: "200", business: "500", enterprise: "2.000" } },
  { label: "Tokens IA / asiento / mes", values: { team: "2 M", business: "5 M", enterprise: "20 M" } },
  { label: "Alertas activas / asiento", values: { team: "15", business: "30", enterprise: "100" } },
  { label: "Activos portafolio / asiento", values: { team: "75", business: "150", enterprise: "500" } },
  { label: "Búsqueda web IA", values: { team: false, business: true, enterprise: true } },
  { label: "Análisis avanzado de IA", values: { team: true, business: true, enterprise: true } },
  { label: "Sin publicidad", values: { team: true, business: true, enterprise: true } },
  { label: "Workspaces compartidos", values: { team: true, business: true, enterprise: true } },
  { label: "Alertas centralizadas", values: { team: true, business: true, enterprise: true } },
  { label: "Agentes de IA compartidos", values: { team: false, business: true, enterprise: true } },
  { label: "Facturación centralizada", values: { team: true, business: true, enterprise: true } },
  { label: "Auditoría y logs", values: { team: true, business: true, enterprise: true } },
  { label: "Panel de administración", values: { team: true, business: true, enterprise: true } },
  { label: "Auto-join por dominio", values: { team: false, business: true, enterprise: true } },
  { label: "Acceso a API", values: { team: false, business: "Básico", enterprise: "Completo" } },
  { label: "SSO (email)", values: { team: true, business: true, enterprise: true } },
  { label: "SSO SAML / SCIM", values: { team: false, business: false, enterprise: true } },
  { label: "Data residency", values: { team: false, business: false, enterprise: true } },
  { label: "Soporte prioritario", values: { team: true, business: true, enterprise: true } },
  { label: "CSM dedicado", values: { team: false, business: true, enterprise: true } },
  { label: "Onboarding guiado", values: { team: false, business: true, enterprise: true } },
  { label: "SLA", values: { team: "24h", business: "4h + 99.9%", enterprise: "99.99% dedicado" } },
];

export function EmpresasPricing({ onSelectPlan }: EmpresasPricingProps) {
  const [activePlan, setActivePlan] = useState<EnterprisePlan>("business");
  const [seats, setSeats] = useState(ENTERPRISE_PLANS.business.recommendedSeats);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [showComparison, setShowComparison] = useState(false);

  const config = ENTERPRISE_PLANS[activePlan];
  const monthlyTotal = calculateSeatTotal(activePlan, seats);
  const annualTotal = calculateAnnualTotal(activePlan, seats);
  const annualMonthly = getAnnualEquivalentMonthly(activePlan, seats);
  const savings = getAnnualSavings(activePlan, seats);

  const handlePlanChange = (plan: EnterprisePlan) => {
    setActivePlan(plan);
    const pc = ENTERPRISE_PLANS[plan];
    const clamped = Math.max(pc.minSeats, Math.min(seats, pc.maxSeats === -1 ? seats : pc.maxSeats));
    setSeats(clamped);
  };

  const incrementSeats = () => {
    const pc = ENTERPRISE_PLANS[activePlan];
    if (pc.maxSeats !== -1 && seats >= pc.maxSeats) return;
    setSeats(seats + 1);
  };
  const decrementSeats = () => {
    const pc = ENTERPRISE_PLANS[activePlan];
    if (seats <= pc.minSeats) return;
    setSeats(seats - 1);
  };

  return (
    <section id="planes" className="bg-white text-slate-900 py-24 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="text-xs font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            Planes para empresas
          </h2>
          <p className="text-3xl md:text-4xl font-black tracking-tight">
            Precios por asiento, escala con tu equipo
          </p>
          <p className="mt-4 text-slate-500 text-lg">
            Paga solo por los usuarios que activan. Sin contratos forzosos, sin letra pequeña.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
          {ENTERPRISE_PLAN_ORDER.map((planId) => {
            const pc = ENTERPRISE_PLANS[planId];
            const isActive = planId === activePlan;
            const isPopular = pc.highlighted;
            return (
              <button
                key={planId}
                onClick={() => handlePlanChange(planId)}
                className={`relative text-left rounded-2xl p-7 border-2 transition-all ${
                  isActive
                    ? "border-[#1890FF] bg-[#1890FF]/[0.03] shadow-xl shadow-[#1890FF]/10"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#1890FF] text-white text-[10px] font-extrabold uppercase px-3.5 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Popular
                  </span>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold">{pc.name}</h3>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isActive ? "border-[#1890FF] bg-[#1890FF]" : "border-slate-300"
                    }`}
                  >
                    {isActive && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed min-h-[40px]">{pc.tagline}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  {pc.pricePerSeat === 0 ? (
                    <span className="text-3xl font-black">Hablemos</span>
                  ) : (
                    <>
                      <span className="text-3xl font-black">{formatCLP(pc.pricePerSeat)}</span>
                      <span className="text-xs text-slate-400">/ asiento / mes</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  {pc.maxSeats === -1
                    ? `${pc.minSeats}+ asientos`
                    : `${pc.minSeats}–${pc.maxSeats} asientos`}
                </p>
              </button>
            );
          })}
        </div>

        {/* Calculator */}
        <motion.div
          key={activePlan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-3xl mx-auto bg-slate-50 rounded-3xl border border-slate-200 p-8 md:p-10"
        >
          {/* Cycle toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-white rounded-xl border border-slate-200 p-1">
              <button
                onClick={() => setCycle("monthly")}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition ${
                  cycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setCycle("annual")}
                className={`px-5 py-2 text-sm font-bold rounded-lg transition flex items-center gap-1.5 ${
                  cycle === "annual" ? "bg-slate-900 text-white" : "text-slate-500"
                }`}
              >
                Anual
                <span className="text-[10px] bg-[#22ab94] text-white px-1.5 py-0.5 rounded">-17%</span>
              </button>
            </div>
          </div>

          {config.cta === "contact" ? (
            <div className="text-center py-6">
              <p className="text-slate-600 mb-4">
                Plan a medida para grandes organizaciones. Te ayudamos a diseñar la configuración ideal.
              </p>
              <button
                onClick={() => onSelectPlan(activePlan, seats, cycle)}
                className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white font-bold px-7 py-3.5 rounded-xl"
              >
                Contactar a ventas
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Seats stepper */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-1">Número de asientos</p>
                  <p className="text-xs text-slate-400">Mínimo {config.minSeats}{config.maxSeats !== -1 ? ` · Máximo ${config.maxSeats}` : ""}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={decrementSeats}
                    disabled={seats <= config.minSeats}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-slate-100 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={seats}
                    min={config.minSeats}
                    max={config.maxSeats === -1 ? undefined : config.maxSeats}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || config.minSeats;
                      const clamped = Math.max(config.minSeats, config.maxSeats === -1 ? v : Math.min(v, config.maxSeats));
                      setSeats(clamped);
                    }}
                    className="w-20 text-center text-2xl font-black border border-slate-200 rounded-xl py-1.5 focus:outline-none focus:border-[#1890FF]"
                  />
                  <button
                    onClick={incrementSeats}
                    disabled={config.maxSeats !== -1 && seats >= config.maxSeats}
                    className="w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center disabled:opacity-30 hover:bg-slate-100 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">
                    {cycle === "annual" ? "Equivalente mensual (anual)" : "Total mensual"}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">
                      {formatCLP(cycle === "annual" ? annualMonthly : monthlyTotal)}
                    </span>
                    <span className="text-sm text-slate-400">/ mes</span>
                  </div>
                  {cycle === "annual" && monthlyTotal > 0 && (
                    <p className="text-xs text-[#22ab94] font-semibold mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Ahorras {formatCLP(savings)} al año
                    </p>
                  )}
                  {cycle === "annual" && (
                    <p className="text-xs text-slate-400 mt-1">
                      Facturado anualmente: {formatCLP(annualTotal)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => onSelectPlan(activePlan, seats, cycle)}
                  className="w-full md:w-auto bg-[#1890FF] hover:bg-[#0f7be0] text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-[#1890FF]/30 inline-flex items-center justify-center gap-2"
                >
                  Comenzar prueba de 14 días
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </motion.div>

        {/* Comparison table toggle */}
        <div className="max-w-5xl mx-auto mt-10">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full text-center text-sm font-semibold text-[#1890FF] hover:underline py-3"
          >
            {showComparison ? "Ocultar comparativa" : "Ver comparativa completa de funciones"}
          </button>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="overflow-x-auto mt-2"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-3 font-semibold text-slate-500">Función</th>
                    {ENTERPRISE_PLAN_ORDER.map((p) => (
                      <th key={p} className="text-center py-3 px-3 font-bold">{ENTERPRISE_PLANS[p].name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.label} className="border-b border-slate-100">
                      <td className="py-3 px-3 text-slate-600">{row.label}</td>
                      {ENTERPRISE_PLAN_ORDER.map((p) => {
                        const val = row.values[p];
                        return (
                          <td key={p} className="text-center py-3 px-3">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="w-4 h-4 text-[#22ab94] mx-auto" strokeWidth={3} />
                              ) : (
                                <X className="w-4 h-4 text-slate-300 mx-auto" />
                              )
                            ) : (
                              <span className="text-xs font-medium text-slate-600">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}