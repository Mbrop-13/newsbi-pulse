"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
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
  Gift,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { createClient } from "@/lib/supabase/client";
import { PLAN_CONFIGS, formatCLP, getAnnualMonthlyPrice, isPromoX2Active, type PlanTier } from "@/lib/plan-limits";

function SubscriptionPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const planParam = searchParams.get("plan");

  const { tier: currentTier } = useSubscriptionStore();
  const [activeSegment, setActiveSegment] = useState<"individual" | "empresarial">("individual");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isUltraX20Toggled, setIsUltraX20Toggled] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isReferred, setIsReferred] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function checkReferred() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("referrals").select("id").eq("referred_id", user.id).maybeSingle();
      if (data) setIsReferred(true);
    }
    checkReferred();
  }, []);

  useEffect(() => {
    if (statusParam === "success") {
      setShowSuccessModal(true);
    }
  }, [statusParam]);

  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

  const handleSelectPlan = async (planId: PlanTier) => {
    if (planId === "free" || planId === currentTier) return;
    
    // If selecting Ultra, check if x20 is toggled
    const targetPlanId = planId === "ultra" && isUltraX20Toggled ? "ultra_x20" : planId;
    
    setLoadingPlan(planId);
    setCheckoutError("");
    
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlanId }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data);
        setCheckoutError(data.error || "Error al iniciar el pago. Intenta de nuevo.");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setCheckoutError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const getDisplayPrice = (planId: PlanTier): string => {
    const config = PLAN_CONFIGS[planId];
    if (config.price === 0) return "0";
    
    let basePrice = config.price;
    if (isReferred) basePrice = Math.round(basePrice * 0.8);
    
    if (billingCycle === "annual") {
      const annualPrice = getAnnualMonthlyPrice(planId);
      return (isReferred ? Math.round(annualPrice * 0.8) : annualPrice).toLocaleString("es-CL");
    }
    return basePrice.toLocaleString("es-CL");
  };

  const getTrialSubtitle = (planId: PlanTier): string => {
    const isUltra = planId === "ultra";
    const actualPlanId = isUltra && isUltraX20Toggled ? "ultra_x20" : planId;
    const config = PLAN_CONFIGS[actualPlanId];
    
    const baseMonthlyPrice = config.price;
    const discountPrice = isReferred ? Math.round(baseMonthlyPrice * 0.8) : baseMonthlyPrice;
    const finalMonthlyPrice = billingCycle === "annual" 
      ? (isReferred ? Math.round(getAnnualMonthlyPrice(actualPlanId) * 0.8) : getAnnualMonthlyPrice(actualPlanId))
      : discountPrice;

    if (isUltra && isUltraX20Toggled) {
      return `Prueba 7 días por $0, luego $${finalMonthlyPrice.toLocaleString("es-CL")} mensual`;
    }
    if (planId === "pro") {
      return "Sigue chateando con acceso básico y herramientas";
    }
    if (planId === "max") {
      return `Prueba 7 días por $0, luego $${finalMonthlyPrice.toLocaleString("es-CL")} mensual`;
    }
    return `Prueba 7 días por $0, luego $${finalMonthlyPrice.toLocaleString("es-CL")} mensual`;
  };

  // Build features dynamically based on states
  const getPlanFeatures = (planId: PlanTier) => {
    if (planId === "pro") {
      return [
        { text: "1.000.000 tokens IA al mes", included: true },
        { text: "50 audios de noticias/mes", included: true },
        { text: "5 alertas de precio activas", included: true },
        { text: "25 activos en portafolio", included: true },
        { text: "Diamantes x1 multiplicador", included: true },
        { text: "Sin publicidad", included: true },
        { text: "Soporte por email", included: true },
      ];
    }
    if (planId === "max") {
      return [
        { text: "2.000.000 tokens IA (x2 Pro)", included: true },
        { text: "100 audios al mes (x2 Pro)", included: true },
        { text: "10 alertas de precio (x2 Pro)", included: true },
        { text: "50 activos en portafolio (x2 Pro)", included: true },
        { text: "Diamantes x2 multiplicador", included: true },
        { text: "Informe semanal y Recomendaciones IA", included: true },
        { text: "Soporte prioritario", included: true },
      ];
    }
    
    // Plan Ultra
    if (isUltraX20Toggled) {
      return [
        { text: "Todas las funciones de Plan Ultra", included: true },
        { text: "20.000.000 tokens IA (x20 Pro)", included: true },
        { text: "1.000 audios al mes (x20 Pro)", included: true },
        { text: "100 alertas de precio (x20 Pro)", included: true },
        { text: "500 activos en portafolio (x20 Pro)", included: true },
        { text: "Diamantes x20 multiplicador", included: true },
        { text: "IA con búsqueda web activa", included: true },
        { text: "Soporte dedicado 24/7", included: true },
      ];
    }
    return [
      { text: "Todas las funciones de Plan Max", included: true },
      { text: "5.000.000 tokens IA (x5 Pro)", included: true },
      { text: "250 audios al mes (x5 Pro)", included: true },
      { text: "25 alertas de precio (x5 Pro)", included: true },
      { text: "125 activos en portafolio (x5 Pro)", included: true },
      { text: "Diamantes x5 multiplicador", included: true },
      { text: "IA con búsqueda web activa", included: true },
      { text: "Soporte dedicado 24/7", included: true },
    ];
  };

  const faqItems = [
    {
      q: "¿Puedo cancelar en cualquier momento?",
      a: "Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil. Mantendrás el acceso a todos tus beneficios premium hasta el final del período de facturación actual.",
    },
    {
      q: "¿Qué son los diamantes 💎?",
      a: "Los diamantes son la moneda virtual de la plataforma. Con ellos puedes canjear recompensas y beneficios exclusivos. Los ganas diariamente y tu multiplicador depende de tu plan: Pro x1, Max x2, Ultra x5, Ultra x20 x20.",
    },
    {
      q: "¿Hay descuento por pago anual?",
      a: "¡Sí! Si seleccionas la facturación anual, obtienes un 20% de descuento automático en la mensualidad de todos los planes de pago.",
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Todos nuestros pagos se procesan de forma segura a través de MercadoPago, permitiéndote pagar con tarjetas de crédito, débito, transferencias y más.",
    },
    {
      q: "¿Cómo funciona la prueba gratuita?",
      a: "Todos nuestros planes de pago incluyen 7 días de prueba gratuita. Se te pedirá ingresar un medio de pago al registrarte, pero no se realizará ningún cargo hasta que termine el periodo de prueba. Puedes cancelar antes sin pagar nada.",
    },
    {
      q: "¿Qué es la opción Ultra x20?",
      a: "Es una ampliación exclusiva para el plan Ultra orientada a analistas intensivos y profesionales. Duplica el costo mensual pero multiplica por 20 todos los límites base del plan Pro, ofreciendo 20M de tokens, 1000 audios y 100 alertas activas.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 relative overflow-hidden pb-24">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1400px] h-[500px] pointer-events-none rounded-full bg-gradient-to-b from-neutral-200/30 via-transparent to-transparent dark:from-zinc-900/40 blur-3xl" />

      {/* Centered Header */}
      <header className="max-w-4xl mx-auto text-center pt-20 pb-6 px-4 relative z-10">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2.5 mb-2 hover:scale-105 transition-transform duration-300">
            <div className="w-9 h-9 rounded-xl bg-neutral-950 dark:bg-white flex items-center justify-center text-white dark:text-black shadow-md">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">Maverlang</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-6 mb-3 text-neutral-900 dark:text-white leading-tight">
            Pruébalo por <span className="text-orange-500 font-extrabold">$0</span> durante 7 días
          </h1>

          {isReferred && (
            <div className="inline-flex items-center gap-2 mt-2 mb-4 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black shadow-sm shadow-emerald-500/5">
              <Gift className="w-4 h-4" />
              ¡Descuento de referido aplicado! 20% OFF en todos los planes.
            </div>
          )}

          {isPromoX2Active() && (
            <div className="inline-flex items-center gap-2 mt-2 mb-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black shadow-sm shadow-amber-500/5">
              <Zap className="w-4 h-4 animate-bounce" />
              ¡PROMO ACTIVA! Doble de consultas IA y audios en planes de pago este mes.
            </div>
          )}
        </div>

        {/* Individual vs Empresarial Selector */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1 bg-neutral-200/60 dark:bg-zinc-800 rounded-full border border-neutral-300/40 dark:border-zinc-700/40 shadow-inner">
            <button
              onClick={() => setActiveSegment("individual")}
              className={`px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                activeSegment === "individual"
                  ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Individual
            </button>
            <button
              onClick={() => setActiveSegment("empresarial")}
              className={`px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                activeSegment === "empresarial"
                  ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Empresarial
            </button>
          </div>
        </div>
      </header>

      {/* Checkout Error Banner */}
      <AnimatePresence>
        {checkoutError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 max-w-xl mx-auto p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs md:text-sm font-bold rounded-2xl border border-red-200 dark:border-red-500/20 flex items-center gap-3 relative z-10"
          >
            <X className="w-5 h-5 shrink-0" />
            <span>{checkoutError}</span>
            <button onClick={() => setCheckoutError("")} className="ml-auto p-1 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-4 relative z-10">
        <AnimatePresence mode="wait">
          {activeSegment === "individual" ? (
            <motion.div
              key="individual-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch"
            >
              {/* Plan 1: Pro */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white">Pro</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                        ${getDisplayPrice("pro")}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">CLP/mes</span>
                    </div>
                    <p className="text-[12px] md:text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                      {getTrialSubtitle("pro")}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan("pro")}
                    disabled={currentTier === "pro" || loadingPlan === "pro"}
                    className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white mb-8"
                  >
                    {loadingPlan === "pro" ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : currentTier === "pro" ? (
                      "Plan Actual"
                    ) : (
                      "Mejorar a Pro"
                    )}
                  </Button>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      ¿Qué incluye?
                    </p>
                    <ul className="space-y-3">
                      {getPlanFeatures("pro").map((feat, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs md:text-sm">
                          <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-neutral-200/50 dark:border-zinc-700/50 mt-0.5">
                            <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                          </div>
                          <span className="text-neutral-600 dark:text-neutral-300 leading-snug">{feat.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Plan 2: Max */}
              <div className="bg-white dark:bg-zinc-900 border-2 border-orange-500/50 dark:border-orange-500/30 rounded-[32px] p-8 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300 relative group">
                <div className="absolute -top-3.5 right-6 bg-[#ffede6] dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] md:text-[11px] font-extrabold px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30 uppercase tracking-wider">
                  Oferta por tiempo limitado
                </div>

                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white">Plan Max</h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                        ${getDisplayPrice("max")}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">CLP/mes</span>
                    </div>
                    <p className="text-[12px] md:text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                      {getTrialSubtitle("max")}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan("max")}
                    disabled={currentTier === "max" || loadingPlan === "max"}
                    className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 mb-8"
                  >
                    {loadingPlan === "max" ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : currentTier === "max" ? (
                      "Plan Actual"
                    ) : (
                      "Aprovechar oferta de $0.00"
                    )}
                  </Button>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      ¿Qué incluye?
                    </p>
                    <ul className="space-y-3">
                      {getPlanFeatures("max").map((feat, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs md:text-sm">
                          <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-neutral-200/50 dark:border-zinc-700/50 mt-0.5">
                            <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                          </div>
                          <span className="text-neutral-600 dark:text-neutral-300 leading-snug font-medium">{feat.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Plan 3: Ultra */}
              <div className="bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-8 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-300 group relative">
                <div className="absolute -top-3.5 right-6 bg-[#ffede6] dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-[10px] md:text-[11px] font-extrabold px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30 uppercase tracking-wider">
                  67% de descuento por 3 meses
                </div>

                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                      {isUltraX20Toggled ? "Ultra x20" : "Ultra"}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                        ${getDisplayPrice(isUltraX20Toggled ? "ultra_x20" : "ultra")}
                      </span>
                      <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">CLP/mes</span>
                    </div>
                    <p className="text-[12px] md:text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                      {getTrialSubtitle("ultra")}
                    </p>
                  </div>

                  {/* Ultra x20 Toggle Checkbox */}
                  <div className="mb-6 p-4 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-900/30 rounded-2xl">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isUltraX20Toggled}
                        onChange={(e) => setIsUltraX20Toggled(e.target.checked)}
                        className="w-5 h-5 mt-0.5 accent-orange-500 rounded border-neutral-300 dark:border-zinc-700"
                      />
                      <div>
                        <div className="text-xs font-black text-neutral-900 dark:text-white flex items-center gap-1.5">
                          Ultra x20 (+ límite aumentado)
                          <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-[9px] font-black text-orange-600 dark:text-orange-400 rounded">x2 costo</span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                          Cuesta el doble pero ofrece x20 límites de el plan pro.
                        </p>
                      </div>
                    </label>
                  </div>

                  <Button
                    onClick={() => handleSelectPlan("ultra")}
                    disabled={(isUltraX20Toggled ? currentTier === "ultra_x20" : currentTier === "ultra") || loadingPlan === "ultra"}
                    className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 mb-8"
                  >
                    {loadingPlan === "ultra" ? (
                      <span className="animate-pulse">Cargando...</span>
                    ) : (isUltraX20Toggled ? currentTier === "ultra_x20" : currentTier === "ultra") ? (
                      "Plan Actual"
                    ) : (
                      "Aprovechar oferta"
                    )}
                  </Button>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                      ¿Qué incluye?
                    </p>
                    <ul className="space-y-3">
                      {getPlanFeatures("ultra").map((feat, index) => (
                        <li key={index} className="flex items-start gap-3 text-xs md:text-sm">
                          <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-neutral-200/50 dark:border-zinc-700/50 mt-0.5">
                            <Check className="w-3 h-3 text-neutral-900 dark:text-white" />
                          </div>
                          <span className="text-neutral-600 dark:text-neutral-300 leading-snug">{feat.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empresarial-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border border-neutral-200/80 dark:border-zinc-800/80 rounded-[32px] p-8 md:p-12 text-center shadow-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center mx-auto mb-6 text-orange-600">
                <Crown className="w-7 h-7" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-4">
                Planes Empresariales & Corporativos
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8 leading-relaxed text-sm md:text-base">
                Ofrecemos integraciones a medida, multi-agentes personalizados, límites corporativos de tokens de IA y soporte prioritario 24/7 para equipos de análisis financiero.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="mailto:soporte@maverlang.cl?subject=Consulta Plan Empresarial" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8 py-5 bg-neutral-950 hover:bg-neutral-800 dark:bg-neutral-50 dark:hover:bg-neutral-200 text-white dark:text-black font-extrabold rounded-2xl shadow-sm transition-all text-sm">
                    Contactar a Ventas
                  </Button>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Facturación Anual switch at the bottom */}
        {activeSegment === "individual" && (
          <div className="flex flex-col items-center justify-center mt-16 mb-20 text-center">
            <div className="flex items-center gap-3 bg-neutral-200/60 dark:bg-zinc-800/80 p-1.5 rounded-full border border-neutral-300/40 dark:border-zinc-700/40 shadow-inner">
              <span className={`text-xs md:text-sm font-bold px-3 transition-colors ${billingCycle === "monthly" ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                Mensual
              </span>
              <button
                onClick={() => setBillingCycle(c => c === "monthly" ? "annual" : "monthly")}
                className="w-11 h-6 rounded-full bg-neutral-950 dark:bg-white p-0.5 transition-colors relative flex items-center"
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white dark:bg-neutral-950 shadow-sm transition-transform duration-300 transform ${
                    billingCycle === "annual" ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className={`text-xs md:text-sm font-bold px-3 flex items-center gap-1.5 transition-colors ${billingCycle === "annual" ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>
                Anual
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-full">
                  Ahorra 20%
                </span>
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-widest mt-4">
              Ahorra con facturación anual
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <section className="mt-12 max-w-3xl mx-auto border-t border-neutral-200 dark:border-zinc-800 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">Preguntas frecuentes</h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
              Resolvemos tus dudas para que puedas empezar con confianza.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="border border-neutral-200/70 dark:border-zinc-800/70 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 hover:bg-neutral-50/50 dark:hover:bg-zinc-900/50 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left text-sm md:text-base font-bold text-neutral-900 dark:text-white"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180 text-neutral-900 dark:text-white" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="px-6 pb-6 text-xs md:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowSuccessModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-[32px] p-8 max-w-md w-full text-center relative shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-6">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white mb-2">
                ¡Suscripción Completada!
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Tu plan ha sido actualizado con éxito. Ya puedes disfrutar de todos los límites y herramientas financieras premium.
              </p>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full h-11 bg-neutral-950 dark:bg-white text-white dark:text-black font-extrabold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-md"
              >
                Comenzar
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SuscripcionesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8fb] dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutral-950 dark:border-white" />
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
