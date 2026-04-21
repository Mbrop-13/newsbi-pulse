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
  Globe,
  Headphones,
  BarChart3,
  TrendingUp,
  Newspaper,
  ChevronDown,
  Crown,
  ArrowRight,
  Star,
  Bot,
  Radio,
  Gem,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores/auth-store";

const plans = [
  {
    id: "free",
    name: "Gratuito",
    price: "0",
    period: "para siempre",
    description: "Para dar tus primeros pasos en la plataforma.",
    features: [
      { text: "3 preguntas a R-ai", included: true },
      { text: "10 audios (resúmenes)", included: true },
      { text: "1 apuesta (Máx 10💎)", included: true },
      { text: "Alertas por Email", included: false },
      { text: "Análisis de Portafolio", included: false },
      { text: "Reportes periódicos", included: false },
      { text: "API Privada", included: false },
      { text: "Soporte dedicado", included: false },
      { text: "Alertas por WhatsApp", included: false },
    ],
    cta: "Plan actual",
    popular: false,
    gradient: "from-slate-500 to-slate-600",
  },
  {
    id: "pro",
    name: "Pro",
    price: "11.99",
    period: "/mes",
    description: "Ideal para usuarios activos.",
    features: [
      { text: "40 preguntas a R-ai/mes", included: true },
      { text: "50 audios/mes", included: true },
      { text: "Apuestas ilimitadas", included: true },
      { text: "Alertas por Email", included: true },
      { text: "Análisis Básico", included: true },
      { text: "Reporte semanal", included: true },
      { text: "API Privada", included: false },
      { text: "Soporte dedicado", included: false },
      { text: "Alertas por WhatsApp", included: false },
    ],
    cta: "Comenzar prueba gratis",
    popular: false,
    gradient: "from-[#0052CC]/70 to-[#22D3EE]/70",
  },
  {
    id: "max",
    name: "Max",
    price: "23.99",
    period: "/mes",
    description: "Para inversores y profesionales exigentes.",
    features: [
      { text: "100 preguntas a R-ai/mes", included: true },
      { text: "100 audios/mes", included: true },
      { text: "Apuestas ilimitadas", included: true },
      { text: "Alertas por Email", included: true },
      { text: "Análisis Pro", included: true },
      { text: "Reporte diario y semanal", included: true },
      { text: "API Privada", included: false },
      { text: "Soporte dedicado", included: false },
      { text: "Alertas por WhatsApp", included: false },
    ],
    cta: "Elegir plan Max",
    popular: true,
    gradient: "from-[#0052CC] to-[#22D3EE]",
  },
  {
    id: "ultra",
    name: "Ultra",
    price: "37.99",
    period: "/mes",
    description: "Para equipos y análisis profundo.",
    features: [
      { text: "Preguntas Ilimitadas", included: true },
      { text: "Audios Ilimitados", included: true },
      { text: "Apuestas ilimitadas", included: true },
      { text: "Alertas por Email", included: true },
      { text: "Alertas por WhatsApp", included: true },
      { text: "Análisis Ultra", included: true },
      { text: "Reporte en tiempo real", included: true },
      { text: "API Privada & Comunidad", included: true },
      { text: "Soporte dedicado 24/7", included: true },
    ],
    cta: "Elegir plan Ultra",
    popular: false,
    gradient: "from-purple-600 to-pink-500",
  },
];

const premiumFeatures = [
  {
    icon: Bot,
    title: "IA Sin Límites",
    desc: "Análisis de artículos, resúmenes y enriquecimiento potenciado por los mejores modelos de IA del mundo.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Headphones,
    title: "Audio Inteligente",
    desc: "Convierte cualquier artículo en audio de alta fidelidad con Amazon Polly. Escucha las noticias mientras te desplazas.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: TrendingUp,
    title: "Predicciones Pro",
    desc: "Accede a mercados exclusivos, datos históricos avanzados y análisis de sentimiento de mercado en tiempo real.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BarChart3,
    title: "Mercados Premium",
    desc: "Widgets de TradingView avanzados, screeners financieros y alertas personalizadas para activos.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    icon: Globe,
    title: "Cobertura Global",
    desc: "Noticias de primera mano de más de 50 países con traducción automática y filtros geográficos.",
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
];

const faqItems = [
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, puedes cancelar tu suscripción Max en cualquier momento desde tu perfil. Mantendrás el acceso hasta el final del período de facturación.",
  },
  {
    q: "¿Qué son los diamantes 💎?",
    a: "Los diamantes son la moneda virtual de Reclu. Los usas para participar en mercados de predicción. Los usuarios Max reciben 500💎 mensuales adicionales.",
  },
  {
    q: "¿Hay descuento por pago anual?",
    a: "Sí, el plan anual tiene un 20% de descuento. Pagas $95.90/año en lugar de $119.88 (ahorro de $23.98).",
  },
  {
    q: "¿Qué métodos de pago aceptan?",
    a: "Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal y transferencia bancaria para planes Enterprise.",
  },
  {
    q: "¿Puedo probar Max gratis?",
    a: "¡Sí! Todos los nuevos usuarios Max obtienen 7 días de prueba gratuita. Si no te convence, cancelas antes y no se te cobrará nada.",
  },
];

export default function SuscripcionPage() {
  const { isAuthenticated } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getAnnualPrice = (monthlyStr: string) => {
    if (monthlyStr === "0") return "0";
    const monthly = parseFloat(monthlyStr);
    return (monthly * 12 * 0.8 / 12).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradient behind everything */}
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full text-sm font-medium text-accent mb-6">
              <Sparkles className="w-4 h-4" />
              Nuevo: 7 días de prueba gratis
            </div>

            <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] mb-5">
              Información que
              <span className="block gradient-text">mueve mercados</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Desbloquea el poder completo de Reclu con análisis IA ilimitados, predicciones avanzadas y una experiencia sin interrupciones.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-secondary/50 border border-border rounded-full p-1 mb-12">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-background shadow-sm text-foreground"
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-[1200px] xl:max-w-[1400px] mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border p-6 text-left transition-all ${
                  plan.popular
                    ? "border-accent bg-accent/[0.02] shadow-xl shadow-accent/5 scale-[1.02]"
                    : "border-border bg-card hover:border-border/80"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#0052CC] to-[#22D3EE] rounded-full text-white text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="w-3 h-3" />
                    Más popular
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  {plan.id === "free" && <Zap className="w-5 h-5 text-white" />}
                  {plan.id === "pro" && <Shield className="w-5 h-5 text-white" />}
                  {plan.id === "max" && <Crown className="w-5 h-5 text-white" />}
                  {plan.id === "ultra" && <TrendingUp className="w-5 h-5 text-white" />}
                </div>

                <h3 className="font-editorial text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.description}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  {plan.price !== "Contacto" ? (
                    <>
                      <span className="font-editorial text-4xl font-bold">
                        ${billingCycle === "annual" ? getAnnualPrice(plan.price) : plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </>
                  ) : (
                    <span className="font-editorial text-3xl font-bold">{plan.price}</span>
                  )}
                </div>

                <Button
                  className={`w-full rounded-xl h-11 font-bold text-sm mb-6 ${
                    plan.popular
                      ? "bg-gradient-to-r from-[#0052CC] to-[#0066FF] hover:from-[#0052CC]/90 hover:to-[#0066FF]/90 text-white shadow-lg shadow-accent/20"
                      : plan.id === "ultra"
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : plan.id === "pro"
                      ? "bg-secondary hover:bg-secondary/80 text-foreground"
                      : "bg-secondary/50 text-muted-foreground cursor-default"
                  }`}
                  disabled={plan.id === "free"}
                >
                  {plan.cta}
                  {plan.popular && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>

                <div className="space-y-3">
                  {plan.features.map((f, fi) => (
                    <div key={fi} className="flex items-center gap-3 text-sm">
                      {f.included ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                      )}
                      <span className={f.included ? "text-foreground" : "text-muted-foreground/50"}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-20 border-t border-border">
        <div className="max-w-[1000px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="font-editorial text-3xl md:text-4xl font-bold mb-3">
              Todo lo que necesitas, nada que te sobre
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Cada función está diseñada para darte ventaja informativa en un mundo que se mueve rápido.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {premiumFeatures.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
              >
                <div className={`w-11 h-11 ${feat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feat.icon className={`w-5 h-5 ${feat.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-border">
        <div className="max-w-[650px] mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-editorial text-3xl font-bold mb-3">Preguntas frecuentes</h2>
            <p className="text-muted-foreground text-sm">
              ¿Tienes dudas? Aquí encontrarás las respuestas más comunes.
            </p>
          </motion.div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border border-border rounded-xl overflow-hidden bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-secondary/30 transition-colors"
                >
                  {item.q}
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">
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
      <section className="py-20 border-t border-border">
        <div className="max-w-[700px] mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0052CC] to-[#22D3EE] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/20">
              <Gem className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-editorial text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para elevar tu juego?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Únete a miles de profesionales que ya usan Reclu Pro para tomar decisiones informadas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button className="bg-gradient-to-r from-[#0052CC] to-[#0066FF] hover:from-[#0052CC]/90 hover:to-[#0066FF]/90 text-white font-bold rounded-xl h-12 px-8 shadow-lg shadow-accent/20 text-base">
                Comenzar prueba gratis
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Link href="/">
                <Button variant="outline" className="rounded-xl h-12 px-8 font-medium text-base">
                  Explorar gratis
                </Button>
              </Link>
            </div>
            <p className="text-[11px] text-muted-foreground mt-4">
              7 días gratis · Sin compromiso · Cancela cuando quieras
            </p>
          </motion.div>
        </div>
      </section>

      <div className="pb-16" />
    </div>
  );
}
