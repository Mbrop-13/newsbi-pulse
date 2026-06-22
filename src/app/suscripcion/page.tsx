"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  ChevronDown,
  Gift,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { createClient } from "@/lib/supabase/client";
import { PLAN_CONFIGS, getAnnualMonthlyPrice, isPromoX2Active, type PlanTier } from "@/lib/plan-limits";

function SubscriptionPageContent() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const { tier: currentTier } = useSubscriptionStore();
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

  const isInferiorPlan = (planId: PlanTier) => {
    const order: PlanTier[] = ["free", "pro", "max", "ultra", "ultra_x20"];
    const currentIdx = order.indexOf(currentTier);
    const planIdx = order.indexOf(planId);
    return planIdx < currentIdx;
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

  const getPlanDescription = (planId: PlanTier): string => {
    const isUltra = planId === "ultra";
    const actualPlanId = isUltra && isUltraX20Toggled ? "ultra_x20" : planId;
    const config = PLAN_CONFIGS[actualPlanId];
    
    const baseMonthlyPrice = config.price;
    const discountPrice = isReferred ? Math.round(baseMonthlyPrice * 0.8) : baseMonthlyPrice;
    const finalMonthlyPrice = billingCycle === "annual" 
      ? (isReferred ? Math.round(getAnnualMonthlyPrice(actualPlanId) * 0.8) : getAnnualMonthlyPrice(actualPlanId))
      : discountPrice;

    // Only Pro has 7 days free trial, and only if user is currently Free and billing is monthly
    if (planId === "pro" && currentTier === "free" && billingCycle === "monthly") {
      return `Prueba 7 días por $0, luego $${finalMonthlyPrice.toLocaleString("es-CL")} mensual`;
    }
    
    return `$${finalMonthlyPrice.toLocaleString("es-CL")} mensual`;
  };

  const getAnnualTotal = (planId: PlanTier): string => {
    const actualPlanId = planId === "ultra" && isUltraX20Toggled ? "ultra_x20" : planId;
    const config = PLAN_CONFIGS[actualPlanId];
    let basePrice = config.price;
    if (isReferred) basePrice = Math.round(basePrice * 0.8);
    // Annual total is 10 times the monthly price (because of 2 months free!)
    return Math.round(basePrice * 10).toLocaleString("es-CL");
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
      a: "¡Sí! Si seleccionas la facturación anual, obtienes el equivalente a 2 meses gratis por año en todos los planes de pago.",
    },
    {
      q: "¿Qué métodos de pago aceptan?",
      a: "Todos nuestros pagos se procesan de forma segura a través de MercadoPago, permitiéndote pagar con tarjetas de crédito, débito, transferencias y más.",
    },
    {
      q: "¿Cómo funciona la prueba gratuita?",
      a: "Nuestra prueba gratuita de 7 días está disponible de forma exclusiva para el plan Pro en la modalidad mensual. Puedes cancelar antes de terminar los 7 días y no se realizará ningún cargo.",
    },
    {
      q: "¿Qué es la opción Ultra x20?",
      a: "Es una ampliación exclusiva para el plan Ultra orientada a analistas intensivos y profesionales. Duplica el costo mensual pero multiplica por 20 todos los límites base del plan Pro, ofreciendo 20M de tokens, 1000 audios y 100 alertas activas.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f8fb] dark:bg-zinc-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300 relative overflow-hidden pb-24 animate-fade-in">
      {/* Floating Close Button in top right corner */}
      <Link
        href="/home"
        className="absolute top-6 right-6 p-2 rounded-full bg-neutral-200/60 hover:bg-neutral-200 dark:bg-zinc-850/60 dark:hover:bg-zinc-800 text-neutral-500 hover:text-neutral-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-all duration-300 z-50 shadow-sm border border-neutral-300/20 dark:border-zinc-700/20"
      >
        <X className="w-5 h-5" />
      </Link>

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
          
          {currentTier === "free" ? (
            <>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-6 mb-3 text-neutral-900 dark:text-white leading-tight">
                Planes y Suscripciones Premium
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs md:text-sm max-w-lg mt-1">
                Elige la facturación que prefieras. El plan Pro incluye 7 días de prueba gratis en la modalidad mensual.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight mt-6 mb-3 text-neutral-900 dark:text-white leading-tight">
                Gestiona tu Suscripción Premium
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs md:text-sm max-w-lg mt-1">
                Sube el nivel de tu cuenta para continuar operando con las máximas capacidades financieras.
              </p>
            </>
          )}

          {currentTier === "free" && isReferred && (
            <div className="inline-flex items-center gap-2 mt-4 mb-2 px-4 py-1.5 rounded-full bg-neutral-200/50 dark:bg-zinc-800 border border-neutral-350 dark:border-zinc-700 text-neutral-800 dark:text-neutral-200 text-xs font-black shadow-sm">
              <Gift className="w-4 h-4" />
              ¡Descuento de referido aplicado! 20% OFF en todos los planes.
            </div>
          )}

          {currentTier === "free" && isPromoX2Active() && (
            <div className="inline-flex items-center gap-2 mt-4 mb-2 px-4 py-1.5 rounded-full bg-neutral-200/50 dark:bg-zinc-800 border border-neutral-350 dark:border-zinc-700 text-neutral-800 dark:text-neutral-200 text-xs font-black shadow-sm">
              <Zap className="w-4 h-4" />
              ¡PROMO ACTIVA! Doble de consultas IA y audios en planes de pago este mes.
            </div>
          )}
        </div>

        {/* Mensual vs Anual Toggle Switch at the top */}
        <div className="flex justify-center mt-6">
          <div className="inline-flex p-1 bg-neutral-200/60 dark:bg-zinc-800 rounded-full border border-neutral-300/40 dark:border-zinc-700/40 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBillingCycle("annual")}
              className={`px-6 py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-300 flex items-center gap-2.5 ${
                billingCycle === "annual"
                  ? "bg-white dark:bg-zinc-700 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Anual
              <span className="px-2 py-0.5 bg-neutral-950 text-white dark:bg-white dark:text-black text-[9px] font-black rounded-full shadow-sm">
                2 Meses Gratis
              </span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Plan 1: Pro */}
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-[32px] p-8 shadow-sm flex flex-col justify-between transition-all duration-300 relative group ${
              isInferiorPlan("pro")
                ? "opacity-40 grayscale bg-neutral-100/30 dark:bg-zinc-900/10 pointer-events-none select-none border-dashed border-neutral-300 dark:border-zinc-800"
                : currentTier === "pro"
                ? "border-2 border-neutral-900 dark:border-white shadow-md"
                : "border-neutral-200/80 dark:border-zinc-800/80 hover:shadow-md"
            }`}
          >
            {isInferiorPlan("pro") && (
              <div className="absolute top-4 left-6 bg-neutral-250 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-neutral-300 dark:border-zinc-700 uppercase">
                Plan Superado
              </div>
            )}

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
                  {getPlanDescription("pro")}
                </p>
                {billingCycle === "annual" && (
                  <p className="text-[10px] md:text-[11px] font-black text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
                    Total ${getAnnualTotal("pro")} facturado al año
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleSelectPlan("pro")}
                disabled={isInferiorPlan("pro") || currentTier === "pro" || loadingPlan === "pro"}
                className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-900 dark:text-white mb-8"
              >
                {loadingPlan === "pro" ? (
                  <span className="animate-pulse">Cargando...</span>
                ) : currentTier === "pro" ? (
                  "Plan Actual"
                ) : isInferiorPlan("pro") ? (
                  "Ya Incluido"
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
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-[32px] p-8 shadow-sm flex flex-col justify-between transition-all duration-300 relative group ${
              isInferiorPlan("max")
                ? "opacity-40 grayscale bg-neutral-100/30 dark:bg-zinc-900/10 pointer-events-none select-none border-dashed border-neutral-300 dark:border-zinc-800"
                : currentTier === "max"
                ? "border-2 border-neutral-900 dark:border-white shadow-md"
                : "border-neutral-900/50 dark:border-neutral-100/30 hover:shadow-md"
            }`}
          >
            {isInferiorPlan("max") && (
              <div className="absolute top-4 left-6 bg-neutral-250 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-neutral-300 dark:border-zinc-700 uppercase">
                Plan Superado
              </div>
            )}
            
            {!isInferiorPlan("max") && (
              <div className="absolute -top-3.5 right-6 bg-neutral-950 text-white dark:bg-white dark:text-black text-[10px] md:text-[11px] font-extrabold px-3 py-1 rounded-full border border-neutral-800 dark:border-neutral-200 uppercase tracking-wider">
                Recomendado
              </div>
            )}

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
                  {getPlanDescription("max")}
                </p>
                {billingCycle === "annual" && (
                  <p className="text-[10px] md:text-[11px] font-black text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
                    Total ${getAnnualTotal("max")} facturado al año
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleSelectPlan("max")}
                disabled={isInferiorPlan("max") || currentTier === "max" || loadingPlan === "max"}
                className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 mb-8"
              >
                {loadingPlan === "max" ? (
                  <span className="animate-pulse">Cargando...</span>
                ) : currentTier === "max" ? (
                  "Plan Actual"
                ) : isInferiorPlan("max") ? (
                  "Ya Incluido"
                ) : (
                  "Adquirir Plan Max"
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
          <div
            className={`bg-white dark:bg-zinc-900 border rounded-[32px] p-8 shadow-sm flex flex-col justify-between transition-all duration-300 relative group ${
              isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra")
                ? "opacity-40 grayscale bg-neutral-100/30 dark:bg-zinc-900/10 pointer-events-none select-none border-dashed border-neutral-300 dark:border-zinc-800"
                : (isUltraX20Toggled ? currentTier === "ultra_x20" : currentTier === "ultra")
                ? "border-2 border-neutral-900 dark:border-white shadow-md"
                : "border-neutral-250/80 dark:border-zinc-800/80 hover:shadow-md"
            }`}
          >
            {isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra") && (
              <div className="absolute top-4 left-6 bg-neutral-250 dark:bg-zinc-800 text-neutral-800 dark:text-neutral-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-neutral-300 dark:border-zinc-700 uppercase">
                Plan Superado
              </div>
            )}

            {!isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra") && (
              <div className="absolute -top-3.5 right-6 bg-neutral-950 text-white dark:bg-white dark:text-black text-[10px] md:text-[11px] font-extrabold px-3 py-1 rounded-full border border-neutral-800 dark:border-neutral-200 uppercase tracking-wider">
                {isUltraX20Toggled ? "Límites Máximos x20" : "Límites Máximos"}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  {isUltraX20Toggled ? "Ultra x20" : "Ultra"}
                </h3>
              </div>

              {/* Dynamic Option Selector Switch (x5 vs x20) inside Ultra card header */}
              <div className="flex justify-start mt-2 mb-6">
                <div className="inline-flex p-0.5 bg-neutral-100 dark:bg-zinc-800 rounded-full border border-neutral-200 dark:border-zinc-700/50 shadow-inner">
                  <button
                    onClick={() => setIsUltraX20Toggled(false)}
                    disabled={isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra")}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                      !isUltraX20Toggled
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    x5
                  </button>
                  <button
                    onClick={() => setIsUltraX20Toggled(true)}
                    disabled={isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra")}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
                      isUltraX20Toggled
                        ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950 shadow-sm"
                        : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900"
                    }`}
                  >
                    x20
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
                    ${getDisplayPrice(isUltraX20Toggled ? "ultra_x20" : "ultra")}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm">CLP/mes</span>
                </div>
                <p className="text-[12px] md:text-xs font-semibold text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                  {getPlanDescription(isUltraX20Toggled ? "ultra_x20" : "ultra")}
                </p>
                {billingCycle === "annual" && (
                  <p className="text-[10px] md:text-[11px] font-black text-neutral-400 dark:text-neutral-500 mt-1 uppercase tracking-wider">
                    Total ${getAnnualTotal("ultra")} facturado al año
                  </p>
                )}
              </div>

              <Button
                onClick={() => handleSelectPlan("ultra")}
                disabled={
                  isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra") ||
                  (isUltraX20Toggled ? currentTier === "ultra_x20" : currentTier === "ultra") ||
                  loadingPlan === "ultra"
                }
                className="w-full h-11 rounded-full font-bold text-sm transition-all duration-300 bg-neutral-950 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-100 mb-8"
              >
                {loadingPlan === "ultra" ? (
                  <span className="animate-pulse">Cargando...</span>
                ) : (isUltraX20Toggled ? currentTier === "ultra_x20" : currentTier === "ultra") ? (
                  "Plan Actual"
                ) : isInferiorPlan(isUltraX20Toggled ? "ultra_x20" : "ultra") ? (
                  "Ya Incluido"
                ) : (
                  "Adquirir Plan Ultra"
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
        </div>

        {/* Saving details text below grid */}
        {billingCycle === "annual" && (
          <div className="flex justify-center mt-12 mb-6">
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-bold bg-neutral-100 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-850 px-5 py-2.5 rounded-full shadow-sm">
              💡 La suscripción anual te descuenta el equivalente a 2 meses completos por año.
            </p>
          </div>
        )}

        {/* FAQ Section */}
        <section className="mt-16 max-w-3xl mx-auto border-t border-neutral-200 dark:border-zinc-800 pt-16">
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
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center text-neutral-900 dark:text-white mx-auto mb-6">
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
