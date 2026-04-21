"use client";

import { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Bot, TrendingUp, ArrowRight, Target,
  Briefcase, ChevronRight, ChevronLeft, BarChart3
} from "lucide-react";

interface AssistantLandingProps {
  onAuthReq: (view: "login" | "register") => void;
}

const SLIDES = [
  {
    id: "intro",
    badge: "Bienvenido",
    title: "Tu Analista IA Personal",
    description: "Reclu Assistant escanea en tiempo real miles de fuentes globales y te entrega inteligencia accionable. Sin ruido. Sin sesgo. Solo señal.",
    icon: Bot,
    color: "#1890FF",
    mockup: "chat" as const,
  },
  {
    id: "who",
    badge: "¿Para quién?",
    title: "Inversionistas sin Tiempo",
    description: "Ideal para traders, ejecutivos y analistas que necesitan alertas estratégicas sin leer cientos de artículos cada mañana.",
    icon: Briefcase,
    color: "#1890FF",
    mockup: "profile" as const,
  },
  {
    id: "impact",
    badge: "Tecnología",
    title: "Impacto Alcista o Bajista",
    description: "Nuestra IA evalúa cada noticia y calcula un score de impacto directo sobre los activos de tu portafolio. Antes de que el mercado se mueva.",
    icon: BarChart3,
    color: "#1890FF",
    mockup: "impact" as const,
  },
  {
    id: "filters",
    badge: "Personalización",
    title: "Filtros Quirúrgicos",
    description: "Configura los temas, países y acciones que te interesan. Tu asistente ignora todo lo demás y vigila lo que realmente importa.",
    icon: Target,
    color: "#1890FF",
    mockup: "filters" as const,
  },
];

export function AssistantLanding({ onAuthReq }: AssistantLandingProps) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const go = (to: number) => { setDir(to > step ? 1 : -1); setStep(to); };
  const next = () => step < SLIDES.length - 1 && go(step + 1);
  const prev = () => step > 0 && go(step - 1);

  const variants: Variants = {
    enter: (d: number) => ({ x: d > 0 ? 500 : -500, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 260, damping: 26 } },
    exit: (d: number) => ({ x: d < 0 ? 500 : -500, opacity: 0, transition: { duration: 0.2 } }),
  };

  const s = SLIDES[step];
  const Icon = s.icon;
  const isLast = step === SLIDES.length - 1;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden px-4">

      {/* ── BLURRED PLATFORM MOCKUP BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute inset-0 blur-[8px] opacity-40 dark:opacity-25 scale-105">
          <PlatformMockup />
        </div>
        {/* Overlay to wash out the background */}
        <div className="absolute inset-0 bg-gray-100/70 dark:bg-slate-950/75" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center py-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 dark:text-white/30 mb-3">Reclu</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
            Conoce tu Asistente
          </h1>
        </motion.div>

        {/* ── CARD ── */}
        <div className="w-full max-w-4xl relative" style={{ minHeight: 420 }}>
          <AnimatePresence initial={false} custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full rounded-[2rem] overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-slate-900 shadow-2xl"
            >
              <div className="flex flex-col md:flex-row">

                {/* Left: text */}
                <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
                  <span
                    className="inline-flex items-center gap-1.5 self-start text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-6"
                    style={{ background: `${s.color}12`, color: s.color }}
                  >
                    <Icon className="w-3.5 h-3.5" /> {s.badge}
                  </span>

                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-5">
                    {s.title}
                  </h2>
                  <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-medium mb-8 max-w-lg">
                    {s.description}
                  </p>

                  {isLast && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-col sm:flex-row gap-3">
                      <button onClick={() => onAuthReq("register")} className="px-7 py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg" style={{ background: s.color }}>
                        Crear Asistente Gratis <ArrowRight className="w-4 h-4" />
                      </button>
                      <button onClick={() => onAuthReq("login")} className="px-7 py-3.5 rounded-xl font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all">
                        Iniciar Sesión
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Right: mini-mockup */}
                <div className="flex-shrink-0 w-full md:w-[340px] lg:w-[400px] p-6 md:p-8 flex items-center justify-center bg-gray-50 dark:bg-white/[0.02] border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/[0.05]">
                  <SlideMockup type={s.mockup} color={s.color} />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Nav arrows */}
          <button onClick={prev} className={`absolute left-0 md:-left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white shadow-lg transition-all hover:scale-110 ${step === 0 ? "hidden" : ""}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} className={`absolute right-0 md:-right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white shadow-lg transition-all hover:scale-110 ${isLast ? "hidden" : ""}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="flex gap-2.5 mt-8">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => go(i)} className="group p-1">
              <div className={`rounded-full transition-all duration-400 ${step === i ? "w-7 h-1.5" : "w-1.5 h-1.5 bg-gray-300 dark:bg-white/20 group-hover:bg-gray-400 dark:group-hover:bg-white/40"}`} style={step === i ? { background: s.color } : {}} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Blurred Platform Mockup (behind everything) ── */
function PlatformMockup() {
  return (
    <div className="w-full h-full flex gap-0">
      {/* Sidebar Nav */}
      <div className="w-16 h-full bg-gray-900 flex flex-col items-center gap-4 py-6">
        <div className="w-8 h-8 rounded-lg bg-[#1890FF]/30" />
        <div className="w-6 h-6 rounded bg-white/10" />
        <div className="w-6 h-6 rounded bg-white/10" />
        <div className="w-6 h-6 rounded bg-white/10" />
        <div className="w-6 h-6 rounded bg-white/10" />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white dark:bg-slate-900 flex flex-col">
        {/* Top Nav Bar */}
        <div className="h-14 border-b border-gray-100 dark:border-white/5 flex items-center px-6 gap-4">
          <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded-full" />
          <div className="h-3 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
          <div className="h-3 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
          <div className="h-3 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
          <div className="ml-auto flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5" />
            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5" />
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 p-6 grid grid-cols-3 gap-5 auto-rows-[180px]">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full w-3/4" />
                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-full" />
                <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full w-5/6" />
              </div>
              <div className="flex gap-2 mt-auto">
                <div className="h-5 w-12 rounded bg-gray-100 dark:bg-white/5" />
                <div className="h-5 w-8 rounded bg-blue-50 dark:bg-blue-500/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Mini-mockup illustrations for each slide ── */
function SlideMockup({ type, color }: { type: string; color: string }) {
  const base = "w-full max-w-[300px] rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] overflow-hidden";

  if (type === "chat") {
    return (
      <div className={base}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-transparent">
          <div className="w-6 h-6 rounded-full" style={{ background: `${color}25` }} />
          <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-white/20" />
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" />
        </div>
        <div className="p-4 space-y-3 bg-white dark:bg-transparent">
          <div className="flex justify-start"><div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/[0.06] space-y-1.5 max-w-[80%]"><div className="h-1.5 w-32 bg-gray-200 dark:bg-white/15 rounded-full" /><div className="h-1.5 w-24 bg-gray-200 dark:bg-white/15 rounded-full" /></div></div>
          <div className="flex justify-end"><div className="px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[75%] space-y-1.5" style={{ background: `${color}15` }}><div className="h-1.5 w-28 rounded-full" style={{ background: `${color}40` }} /><div className="h-1.5 w-20 rounded-full" style={{ background: `${color}40` }} /></div></div>
          <div className="flex justify-start"><div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/[0.06] space-y-1.5 max-w-[85%]"><div className="h-1.5 w-36 bg-gray-200 dark:bg-white/15 rounded-full" /><div className="h-1.5 w-28 bg-gray-200 dark:bg-white/15 rounded-full" /><div className="h-1.5 w-16 bg-gray-200 dark:bg-white/15 rounded-full" /></div></div>
        </div>
        <div className="px-4 pb-4 bg-white dark:bg-transparent"><div className="h-9 rounded-xl bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06]" /></div>
      </div>
    );
  }

  if (type === "profile") {
    return (
      <div className={base}>
        <div className="p-5 flex flex-col items-center gap-3 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-transparent">
          <div className="w-12 h-12 rounded-full border-2" style={{ borderColor: `${color}40`, background: `${color}10` }} />
          <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-white/20" />
          <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-white/10" />
        </div>
        <div className="p-4 space-y-2.5 bg-white dark:bg-transparent">
          {["Trader", "Ejecutivo", "Analista", "Estudiante"].map((r) => (
            <div key={r} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04]">
              <div className="w-5 h-5 rounded-md" style={{ background: `${color}15` }} />
              <span className="text-[11px] font-bold text-gray-400 dark:text-white/40">{r}</span>
              <div className="ml-auto w-3 h-3 rounded-full border border-gray-200 dark:border-white/10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "impact") {
    return (
      <div className={base}>
        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] flex items-center gap-2 bg-white dark:bg-transparent">
          <BarChart3 className="w-4 h-4" style={{ color }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Análisis de Impacto</span>
        </div>
        <div className="p-4 space-y-3 bg-white dark:bg-transparent">
          {[{ label: "AAPL", score: 4, up: true }, { label: "BTC", score: 3, up: false }, { label: "NVDA", score: 5, up: true }].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.04]">
              <span className="text-xs font-black text-gray-600 dark:text-white/60 w-10">{item.label}</span>
              <div className="flex-1 flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 h-4 rounded-[3px]" style={{ background: i <= item.score ? (item.up ? "#22C55E" : "#EF4444") + "60" : "rgba(0,0,0,0.04)" }} />
                ))}
              </div>
              <TrendingUp className={`w-3.5 h-3.5 ${item.up ? "text-green-500" : "text-red-500 rotate-180"}`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // filters
  return (
    <div className={base}>
      <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.06] bg-white dark:bg-transparent">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/30">Tus Filtros Activos</span>
      </div>
      <div className="p-4 flex flex-wrap gap-2 bg-white dark:bg-transparent">
        {["Tecnología", "Cripto", "AAPL", "Chile", "IA", "NVDA", "S&P 500", "Salud"].map((t) => (
          <span key={t} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border" style={{ color, background: `${color}08`, borderColor: `${color}20` }}>
            {t}
          </span>
        ))}
      </div>
      <div className="px-4 pb-4 pt-2 bg-white dark:bg-transparent">
        <div className="h-8 rounded-lg border border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center">
          <span className="text-[10px] text-gray-300 dark:text-white/20 font-bold">+ Agregar filtro</span>
        </div>
      </div>
    </div>
  );
}
