"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Zap,
  Shield,
  TrendingUp,
  ChevronDown,
  Crown,
  ArrowRight,
  Star,
  Bot,
  Gem,
  Bell,
  FileText,
  LineChart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { PLAN_CONFIGS, formatCLP, getAnnualMonthlyPrice, type PlanTier } from "@/lib/plan-limits";

const plans = [
  {
    id: "pro" as PlanTier,
    name: "Pro",
    description: "Para usuarios activos.",
    features: [
      { text: "100 consultas IA/mes", included: true, highlight: true },
      { text: "50 audios de noticias/mes", included: true, highlight: true },
      { text: "5 alertas de precio", included: true, highlight: true },
      { text: "25 activos en portafolio", included: true, highlight: true },
      { text: "Diamantes x1", included: true, highlight: true },
      { text: "Soporte por email", included: true, highlight: false },
      { text: "Sin publicidad", included: true, highlight: true },
      { text: "Historial de 10 chats", included: true, highlight: true },
      { text: "Alertas por Email", included: true, highlight: true },
      { text: "Análisis básico de portafolio", included: true, highlight: true },
      { text: "Alertas por SMS", included: false, highlight: false },
      { text: "Informe semanal", included: false, highlight: false },
      { text: "Recomendaciones IA", included: false, highlight: false },
    ],
    cta: "Comenzar prueba gratis",
    popular: false,
    gradient: "from-[#0052CC]/70 to-[#22D3EE]/70",
    icon: Shield,
  },
  {
    id: "max" as PlanTier,
    name: "Max",
    description: "Para inversores exigentes.",
    features: [
      { text: "300 consultas IA/mes", included: true, highlight: true },
      { text: "150 audios de noticias/mes", included: true, highlight: true },
      { text: "15 alertas de precio", included: true, highlight: true },
      { text: "100 activos en portafolio", included: true, highlight: true },
      { text: "Diamantes x2", included: true, highlight: true },
      { text: "Soporte prioritario", included: true, highlight: false },
      { text: "Sin publicidad", included: true, highlight: false },
      { text: "Historial de 50 chats", included: true, highlight: true },
      { text: "Alertas por Email", included: true, highlight: false },
      { text: "Análisis avanzado de portafolio", included: true, highlight: true },
      { text: "Alertas por SMS", included: true, highlight: true },
      { text: "Informe semanal", included: true, highlight: true },
      { text: "Recomendaciones IA", included: true, highlight: true },
    ],
    cta: "Elegir plan Max",
    popular: true,
    gradient: "from-[#0052CC] to-[#22D3EE]",
    icon: Crown,
  },
  {
    id: "ultra" as PlanTier,
    name: "Ultra",
    description: "El máximo poder analítico.",
    features: [
      { text: "600 consultas IA/mes", included: true, highlight: true },
      { text: "300 audios de noticias/mes", included: true, highlight: true },
      { text: "30 alertas de precio", included: true, highlight: true },
      { text: "Activos ilimitados", included: true, highlight: true },
      { text: "Diamantes x5", included: true, highlight: true },
      { text: "Soporte dedicado 24/7", included: true, highlight: true },
      { text: "Sin publicidad", included: true, highlight: false },
      { text: "Historial ilimitado de chats", included: true, highlight: true },
      { text: "Alertas por Email", included: true, highlight: false },
      { text: "Análisis premium de portafolio", included: true, highlight: true },
      { text: "Alertas por SMS", included: true, highlight: false },
      { text: "Informe semanal y reportes", included: true, highlight: true },
      { text: "IA con búsqueda web", included: true, highlight: true },
    ],
    cta: "Elegir plan Ultra",
    popular: false,
    gradient: "from-purple-600 to-pink-500",
    icon: TrendingUp,
  },
];

const premiumFeatures = [
  {
    icon: Bot,
    title: "Asistente IA Avanzado",
    desc: "Consulta tus noticias, analiza tu portafolio y recibe recomendaciones de análisis potenciadas por los mejores modelos de IA.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: LineChart,
    title: "Análisis de Portafolio",
    desc: "Cálculos avanzados de rendimiento, volatilidad, distribución de activos y resúmenes semanales automáticos.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: FileText,
    title: "Informes Semanales",
    desc: "Recibe cada lunes un informe con las noticias más importantes de la semana y un resumen de tu portafolio.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Bell,
    title: "Alertas Multicanal",
    desc: "Recibe alertas de precio por email y SMS cuando tus activos alcanzan los objetivos que configuraste.",
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
  },
  {
    icon: Shield,
    title: "Sin Publicidad",
    desc: "Una experiencia de lectura inmersiva y completamente libre de distracciones publicitarias.",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
  },
  {
    icon: Gem,
    title: "Multiplicador de Diamantes",
    desc: "Acelera tus ganancias de diamantes diarios para canjear recompensas exclusivas.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

const faqItems = [
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil. Mantendrás el acceso hasta el final del período de facturación.",
  },
  {
    q: "¿Qué son los diamantes 💎?",
    a: "Los diamantes son la moneda virtual de Reclu. Los ganas diariamente con un multiplicador según tu plan: Free x0.5, Pro x1, Max x2, Ultra x5.",
  },
  {
    q: "¿Hay descuento por pago anual?",
    a: "Sí, todos los planes tienen un 20% de descuento en la modalidad anual.",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos todos los medios de pago de MercadoPago: tarjetas de crédito/débito, transferencia bancaria y más.",
  },
  {
    q: "¿Puedo probar un plan gratis?",
    a: "¡Sí! Todos los nuevos usuarios obtienen 7 días de prueba gratuita en cualquier plan. Si no te convence, cancelas antes y no se te cobrará nada.",
  },
  {
    q: "¿Qué significa 5 consultas IA de por vida?",
    a: "En el plan gratuito, tienes 5 consultas totales al asistente IA para que puedas probarlo. Si quieres más, puedes mejorar a Pro con 100 consultas mensuales.",
  },
];

export default function SuscripcionesPage() {
  const { tier: currentTier } = useSubscriptionStore();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const getPrice = (planId: PlanTier): string => {
    const config = PLAN_CONFIGS[planId];
    if (config.price === 0) return "0";
    if (billingCycle === "annual") {
      return formatCLP(getAnnualMonthlyPrice(planId));
    }
    return formatCLP(config.price);
  };

  const getAnnualTotal = (planId: PlanTier): string | null => {
    if (billingCycle !== "annual") return null;
    const config = PLAN_CONFIGS[planId];
    if (config.price === 0) return null;
    return formatCLP(getAnnualMonthlyPrice(planId) * 12);
  };

  const handleSelectPlan = async (planId: PlanTier) => {
    if (planId === "free" || planId === currentTier) return;
    
    // Redirect to MercadoPago subscription checkout
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      
      if (res.ok) {
        const { url } = await res.json();
        if (url) window.location.href = url;
      } else {
        const err = await res.json();
        console.error("Checkout error:", err);
        alert("Error al iniciar el pago. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      alert("Error de conexión. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] pointer-events-none rounded-full bg-gradient-to-br from-[#0052CC]/10 via-[#22D3EE]/5 to-transparent blur-3xl" />

      <div className="pt-[7rem] md:pt-[9rem] relative z-10" />

      {/* Hero */}
      <section className="relative pb-16">
        <div className="max-w-[1100px] mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-sm font-medium text-accent mb-6 shadow-sm shadow-accent/10">
              <Sparkles className="w-4 h-4" />
              7 días de prueba gratis
            </div>

            <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5 text-foreground">
              Suscripciones que
              <span className="block bg-gradient-to-r from-[#0052CC] to-[#22D3EE] bg-clip-text text-transparent">potencian tu inversión</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Desbloquea análisis IA avanzados, alertas multicanal, cálculos de portafolio y reportes semanales para tomar mejores decisiones.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-secondary border border-border rounded-full p-1 mb-12 shadow-inner">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Anual
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto"
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {plans.map((plan, i) => {
              const isCurrentPlan = plan.id === currentTier;
              const isPopularActive = plan.popular && (hoveredPlan === null || hoveredPlan === plan.id);
              const PlanIcon = plan.icon;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  className={`relative flex flex-col rounded-[2.5rem] border p-8 text-left transition-all duration-500 group ${
                    isPopularActive
                      ? "border-accent bg-accent/[0.03] shadow-[0_20px_60px_-15px_rgba(0,82,204,0.3)] md:scale-105 z-10 hover:border-[#1890FF]"
                      : isCurrentPlan
                      ? "border-emerald-500/50 bg-emerald-500/[0.03] shadow-[0_15px_40px_-15px_rgba(16,185,129,0.2)] hover:border-emerald-400"
                      : "border-border bg-card/40 backdrop-blur-md hover:border-[#1890FF]/40 hover:bg-card hover:shadow-[0_15px_40px_-15px_rgba(24,144,255,0.15)] hover:-translate-y-2"
                  }`}
                >
                  {/* Glassmorphism subtle inner glow */}
                  <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                  {plan.popular && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-gradient-to-r from-[#0052CC] to-[#22D3EE] rounded-full text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-500 ${isPopularActive ? "shadow-xl shadow-[#0052CC]/40 opacity-100" : "opacity-80 saturate-50"}`}>
                      <Star className="w-4 h-4 fill-white/20" />
                      Recomendado
                    </div>
                  )}
                  
                  {isCurrentPlan && !plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-2 bg-emerald-500 rounded-full text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xl shadow-emerald-500/30">
                      <Check className="w-4 h-4" />
                      Tu plan actual
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6 shadow-xl ${isPopularActive ? 'shadow-[#0052CC]/30' : 'shadow-black/5'} relative z-10`}>
                    <PlanIcon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="font-editorial text-2xl font-bold mb-2 text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6 min-h-[40px]">{plan.description}</p>

                  <div className="flex flex-col gap-1 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="font-editorial text-4xl font-bold text-foreground tracking-tight">
                        {getPrice(plan.id)}
                      </span>
                      <span className="text-sm text-muted-foreground font-medium">
                        {plan.id === "free" ? "para siempre" : "/mes"}
                      </span>
                    </div>
                    {billingCycle === "annual" && plan.id !== "free" ? (
                      <span className="text-[12px] text-[#1890FF] font-bold bg-[#1890FF]/10 px-2.5 py-1 rounded-md self-start border border-[#1890FF]/20 shadow-sm">
                        Total {getAnnualTotal(plan.id)} facturado al año
                      </span>
                    ) : (
                      <span className="text-[12px] text-transparent select-none font-medium px-2.5 py-1 self-start">
                        Espaciador
                      </span>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full rounded-2xl h-14 font-bold text-base mb-8 transition-all relative z-10 ${
                      plan.popular
                        ? "bg-gradient-to-r from-[#0052CC] to-[#0066FF] hover:from-[#0052CC]/90 hover:to-[#0066FF]/90 text-white shadow-[0_10px_30px_-10px_rgba(0,82,204,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(0,82,204,0.8)] hover:-translate-y-1"
                        : plan.id === "ultra"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/30 hover:-translate-y-1"
                        : isCurrentPlan
                        ? "bg-emerald-500/10 text-emerald-600 cursor-default border border-emerald-500/20"
                        : "bg-secondary hover:bg-secondary/80 text-foreground border border-border shadow-sm hover:-translate-y-1"
                    }`}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Plan actual" : plan.cta}
                    {plan.popular && !isCurrentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>

                  <div className="space-y-3.5 flex-1">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Beneficios incluidos</p>
                    {plan.features.map((f, fi) => (
                      <div key={fi} className="flex items-start gap-3 text-sm">
                        {f.included ? (
                          <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                        ) : (
                          <div className="mt-0.5 w-5 h-5 flex items-center justify-center shrink-0">
                            <X className="w-3.5 h-3.5 text-muted-foreground/30" />
                          </div>
                        )}
                        <span className={`leading-snug transition-colors duration-300 ${f.included ? "text-foreground font-medium" : "text-muted-foreground/40"} ${f.highlight ? "group-hover:text-[#1890FF] group-hover:font-bold" : ""}`}>
                          {f.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 border-t border-border bg-secondary/20">
        <div className="max-w-[1100px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-editorial text-3xl md:text-5xl font-bold mb-4 text-foreground">
              Todo lo que necesitas para invertir mejor
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cada función está diseñada para darte ventaja informativa en un mundo que se mueve rápido.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-card border border-border rounded-3xl p-8 hover:border-accent/40 hover:shadow-xl hover:shadow-accent/5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Decorative background blur */}
                <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${feat.bg} group-hover:opacity-40 transition-opacity`} />
                
                <div className={`w-14 h-14 ${feat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 relative z-10`}>
                  <feat.icon className={`w-7 h-7 ${feat.color}`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-foreground relative z-10">{feat.title}</h3>
                <p className="text-muted-foreground leading-relaxed relative z-10">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 border-t border-border">
        <div className="max-w-[700px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-editorial text-3xl md:text-4xl font-bold mb-4 text-foreground">Preguntas frecuentes</h2>
            <p className="text-muted-foreground text-lg">
              Resolvemos tus dudas para que puedas empezar con confianza.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-border/60 rounded-2xl overflow-hidden bg-card/30 hover:bg-card/80 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left text-base font-semibold text-foreground"
                >
                  {item.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-foreground" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 border-t border-border bg-gradient-to-b from-transparent to-accent/5">
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0052CC] to-[#22D3EE] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-accent/20">
              <Gem className="w-10 h-10 text-white" />
            </div>
            <h2 className="font-editorial text-4xl md:text-5xl font-bold mb-6 text-foreground">
              ¿Listo para elevar tu juego?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Únete a miles de inversores que usan Reclu para tomar decisiones informadas con Inteligencia Artificial.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => handleSelectPlan("max")}
                className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] hover:from-[#0052CC]/90 hover:to-[#0066FF]/90 text-white font-bold rounded-2xl h-14 px-10 shadow-xl shadow-[#0052CC]/20 text-lg w-full sm:w-auto hover:-translate-y-1 transition-all"
              >
                Comenzar prueba gratis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="rounded-2xl h-14 px-10 font-bold text-lg w-full sm:w-auto hover:bg-secondary border-2">
                  Explorar gratis
                </Button>
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-6 font-medium">
              7 días gratis · Sin compromiso · Cancela cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
