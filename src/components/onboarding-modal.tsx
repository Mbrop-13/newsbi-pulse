"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  LayoutGrid,
  List,
  Sparkles,
  Bot,
  Globe,
  Filter,
  Settings2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  X,
  Zap,
  LineChart,
  Shield,
} from "lucide-react";
import { useAuthModalStore } from "@/lib/stores/auth-store";
import { useViewStore, type ViewLayout } from "@/lib/stores/use-view-store";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleTitle?: string;
}

const STEPS = [
  {
    id: "welcome",
    badge: "Bienvenido a Reclu",
    title: "Tu plataforma de noticias inteligente",
    description:
      "Reclu te ofrece noticias financieras, tecnológicas y de impacto global analizadas con inteligencia artificial. Regístrate gratis para acceder a todo el contenido.",
    features: [
      { icon: <Zap className="w-5 h-5" />, label: "Noticias en tiempo real", color: "text-blue-500", bg: "bg-blue-500/10" },
      { icon: <Bot className="w-5 h-5" />, label: "Asistente IA personal", color: "text-purple-500", bg: "bg-purple-500/10" },
      { icon: <Shield className="w-5 h-5" />, label: "Análisis verificado", color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { icon: <Globe className="w-5 h-5" />, label: "Cobertura global", color: "text-amber-500", bg: "bg-amber-500/10" },
    ],
    visual: "welcome",
  },
  {
    id: "views",
    badge: "Modos de Vista",
    title: "Lee como tú prefieras",
    description:
      "Elige entre 3 modos de visualización que se adaptan a tu estilo. Desde la vista tradicional de diario hasta el grid moderno.",
    features: [
      { icon: <Newspaper className="w-5 h-5" />, label: "Vista Tradicional — Estilo periódico editorial", color: "text-rose-500", bg: "bg-rose-500/10" },
      { icon: <LayoutGrid className="w-5 h-5" />, label: "Vista Grid — Cards modernas responsivas", color: "text-blue-500", bg: "bg-blue-500/10" },
      { icon: <List className="w-5 h-5" />, label: "Vista Lista — Lectura enfocada, sin distracciones", color: "text-cyan-500", bg: "bg-cyan-500/10" },
    ],
    visual: "views",
  },
  {
    id: "sections",
    badge: "Secciones",
    title: "Todo lo que necesitas, organizado",
    description:
      "Explora 9 secciones especializadas: desde finanzas e inversiones hasta tech global y predicciones de mercado.",
    features: [
      { icon: <LineChart className="w-5 h-5" />, label: "Finanzas · Inversiones · Economía", color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { icon: <Globe className="w-5 h-5" />, label: "Impacto Global · Tech · Mundo", color: "text-indigo-500", bg: "bg-indigo-500/10" },
      { icon: <Sparkles className="w-5 h-5" />, label: "Predicciones · Asistente IA", color: "text-amber-500", bg: "bg-amber-500/10" },
    ],
    visual: "sections",
  },
  {
    id: "customize",
    badge: "Personalización",
    title: "Hazlo tuyo al 100%",
    description:
      "Filtra por fuente, ajusta el tamaño de texto, la densidad del layout, y activa o desactiva las predicciones. Todo se guarda al instante.",
    features: [
      { icon: <Filter className="w-5 h-5" />, label: "Filtra por fuentes de noticias", color: "text-blue-500", bg: "bg-blue-500/10" },
      { icon: <Settings2 className="w-5 h-5" />, label: "Ajusta densidad, tamaño y layout", color: "text-purple-500", bg: "bg-purple-500/10" },
      { icon: <Sparkles className="w-5 h-5" />, label: "Preferencias persistentes al instante", color: "text-rose-500", bg: "bg-rose-500/10" },
    ],
    visual: "customize",
  },
];

function StepVisual({ visual }: { visual: string }) {
  if (visual === "welcome") {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#1890FF] to-indigo-600 shadow-2xl shadow-blue-500/30 flex items-center justify-center"
        >
          <Zap className="w-12 h-12 text-white" />
        </motion.div>
        {/* Floating particles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -15, 0],
              x: [0, (i % 2 === 0 ? 8 : -8), 0],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{ repeat: Infinity, duration: 3 + i * 0.5, delay: i * 0.3 }}
            className="absolute w-2 h-2 rounded-full bg-[#1890FF]/40"
            style={{
              top: `${20 + i * 15}%`,
              left: `${15 + i * 16}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (visual === "views") {
    return null; // Handled inline in the content area
  }

  if (visual === "sections") {
    const sections = ["Principal", "Finanzas", "Inversiones", "Global", "Economía", "Tech"];
    return (
      <div className="w-full h-full flex flex-wrap items-center justify-center gap-2 p-4">
        {sections.map((s, i) => (
          <motion.div
            key={s}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: i * 0.08 }}
            className="px-3 py-1.5 rounded-full bg-[#1890FF]/10 text-[#1890FF] text-xs font-bold border border-[#1890FF]/20"
          >
            {s}
          </motion.div>
        ))}
      </div>
    );
  }

  // customize
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
        className="w-20 h-20 rounded-full border-4 border-dashed border-[#1890FF]/30 flex items-center justify-center"
      >
        <Settings2 className="w-8 h-8 text-[#1890FF]" />
      </motion.div>
    </div>
  );
}

export function OnboardingModal({ isOpen, onClose, articleTitle }: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const { openModal } = useAuthModalStore();
  const { layout, setLayout } = useViewStore();
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleRegister = () => {
    onClose();
    openModal("register");
  };

  const handleLogin = () => {
    onClose();
    openModal("login");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-[95vw] max-w-[560px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/20 overflow-hidden z-10"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top visual area */}
        <div className="h-[180px] bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 border-b border-gray-100 dark:border-gray-800 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              <StepVisual visual={current.visual} />
            </motion.div>
          </AnimatePresence>

          {/* Step dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? "w-6 bg-[#1890FF]" : "w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1890FF]/10 text-[#1890FF] text-[11px] font-bold uppercase tracking-wider mb-4">
                <Sparkles className="w-3 h-3" />
                {current.badge}
              </span>

              {/* Article hint on first step */}
              {step === 0 && articleTitle && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 font-medium line-clamp-1">
                  Estás intentando leer: <span className="text-gray-700 dark:text-gray-300 font-semibold">"{articleTitle}"</span>
                </p>
              )}

              {/* Title */}
              <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-2">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                {current.description}
              </p>

              {/* Feature list OR interactive view selector */}
              {current.id === "views" ? (
                <div className="flex flex-col gap-3 mb-6">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Selecciona un modo — cambia en tiempo real</p>
                  {([
                    { id: "traditional" as ViewLayout, icon: <Newspaper className="w-5 h-5" />, label: "Tradicional", desc: "Estilo periódico editorial clásico", color: "text-rose-500", bg: "bg-rose-500/10", activeBg: "bg-rose-500" },
                    { id: "grid" as ViewLayout, icon: <LayoutGrid className="w-5 h-5" />, label: "Grid", desc: "Cards modernas y responsivas", color: "text-blue-500", bg: "bg-blue-500/10", activeBg: "bg-blue-500" },
                    { id: "list" as ViewLayout, icon: <List className="w-5 h-5" />, label: "Lista", desc: "Lectura limpia y enfocada", color: "text-cyan-500", bg: "bg-cyan-500/10", activeBg: "bg-cyan-500" },
                  ]).map((view, i) => {
                    const isActive = layout === view.id;
                    return (
                      <motion.button
                        key={view.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setLayout(view.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          isActive
                            ? "bg-[#1890FF]/10 ring-2 ring-[#1890FF] shadow-sm"
                            : "hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
                        }`}
                      >
                        <div className={`p-2.5 rounded-xl shrink-0 ${
                          isActive ? "bg-[#1890FF] text-white" : `${view.bg} ${view.color}`
                        }`}>
                          {view.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${isActive ? "text-[#1890FF]" : "text-gray-700 dark:text-gray-300"}`}>
                              {view.label}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-bold text-[#1890FF] bg-[#1890FF]/10 px-2 py-0.5 rounded-full uppercase">Activo</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">{view.desc}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {current.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className={`p-2 rounded-xl ${feature.bg} ${feature.color} shrink-0`}>
                        {feature.icon}
                      </div>
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        {feature.label}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </button>
            )}

            <div className="flex-1" />

            {!isLast ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1890FF] text-white text-sm font-bold hover:bg-[#1890FF]/90 transition-colors shadow-lg shadow-[#1890FF]/25"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleRegister}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#1890FF]/25"
              >
                Crear Cuenta Gratis
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Login link */}
          <p className="text-center text-xs text-gray-400 mt-4">
            ¿Ya tienes cuenta?{" "}
            <button onClick={handleLogin} className="text-[#1890FF] font-bold hover:underline">
              Inicia sesión
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
