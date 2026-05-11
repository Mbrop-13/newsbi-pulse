"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, TrendingUp, Newspaper, BarChart3, Globe, PieChart,
  Zap, Brain, Shield, DollarSign, LineChart, AlertTriangle,
  Star, Heart, ArrowRight, Landmark, Cpu, BookOpen, Scale,
  Briefcase, Target, Layers, Gem
} from "lucide-react";

// ── PROMPT DATA ──────────────────────────────────────────

interface PromptItem {
  id: string;
  label: string;
  query: string;
  icon: React.ReactNode;
  gradient: string; // tailwind bg gradient for the pill icon circle
}

const ROW_A: PromptItem[] = [
  { id: "portfolio",      label: "¿Cómo va mi portafolio?",      query: "¿Cómo van mis acciones hoy?",     icon: <BarChart3 className="w-3.5 h-3.5" />,  gradient: "from-blue-500 to-cyan-400" },
  { id: "top_news",       label: "Noticias del día",             query: "Dame un resumen de las noticias más importantes de hoy.", icon: <Newspaper className="w-3.5 h-3.5" />,  gradient: "from-amber-500 to-orange-400" },
  { id: "market",         label: "¿Cómo va el mercado?",         query: "¿Qué acciones subieron y bajaron más hoy en el mercado?",  icon: <TrendingUp className="w-3.5 h-3.5" />,  gradient: "from-emerald-500 to-green-400" },
  { id: "sectors",        label: "Rendimiento por sector",       query: "Muéstrame el rendimiento de los sectores del mercado hoy.", icon: <PieChart className="w-3.5 h-3.5" />,    gradient: "from-purple-500 to-violet-400" },
  { id: "crypto",         label: "¿Cómo va el crypto?",          query: "¿Cómo están Bitcoin, Ethereum y Solana hoy?",  icon: <Gem className="w-3.5 h-3.5" />,         gradient: "from-yellow-500 to-amber-400" },
  { id: "analyze_apple",  label: "Analizar Apple",               query: "Hazme un análisis fundamental completo de AAPL.", icon: <Target className="w-3.5 h-3.5" />,      gradient: "from-slate-500 to-zinc-400" },
  { id: "analyze_tesla",  label: "Analizar Tesla",               query: "Hazme un análisis fundamental completo de TSLA.", icon: <Zap className="w-3.5 h-3.5" />,         gradient: "from-red-500 to-rose-400" },
  { id: "portfolio_month",label: "Portafolio último mes",        query: "¿Cuánto subieron o bajaron mis acciones el último mes? Grafícalo.", icon: <LineChart className="w-3.5 h-3.5" />,   gradient: "from-indigo-500 to-blue-400" },
  { id: "earnings",       label: "Próximos reportes",            query: "¿Cuándo reportan ganancias las empresas de mi portafolio?", icon: <BookOpen className="w-3.5 h-3.5" />,    gradient: "from-teal-500 to-cyan-400" },
  { id: "compare_faang",  label: "Comparar FAANG",               query: "Compara AAPL, GOOGL, AMZN, META y MSFT en el último mes.", icon: <Scale className="w-3.5 h-3.5" />,       gradient: "from-fuchsia-500 to-pink-400" },
];

const ROW_B: PromptItem[] = [
  { id: "portfolio_news", label: "Noticias de mi portafolio",    query: "¿Qué noticias recientes hay sobre las empresas de mi portafolio?", icon: <Globe className="w-3.5 h-3.5" />,       gradient: "from-cyan-500 to-sky-400" },
  { id: "sp500",          label: "¿Cómo va el S&P 500?",        query: "Analiza el rendimiento del S&P 500 (SPY) hoy.", icon: <Landmark className="w-3.5 h-3.5" />,    gradient: "from-emerald-600 to-teal-400" },
  { id: "nvidia",         label: "Análisis de Nvidia",           query: "Hazme un análisis fundamental completo de NVDA.", icon: <Cpu className="w-3.5 h-3.5" />,         gradient: "from-green-500 to-lime-400" },
  { id: "risk",           label: "Riesgo de mi portafolio",      query: "Analiza el riesgo y la diversificación de mi portafolio actual.", icon: <Shield className="w-3.5 h-3.5" />,      gradient: "from-orange-500 to-yellow-400" },
  { id: "dividends",      label: "Mejores dividendos",           query: "¿Cuáles de mis acciones pagan mejores dividendos?", icon: <DollarSign className="w-3.5 h-3.5" />,  gradient: "from-green-600 to-emerald-400" },
  { id: "global",         label: "Impacto global hoy",           query: "¿Qué eventos geopolíticos están afectando los mercados hoy?", icon: <Globe className="w-3.5 h-3.5" />,       gradient: "from-rose-500 to-pink-400" },
  { id: "tech",           label: "Sector tecnología",            query: "¿Cómo le va al sector tecnología hoy? Muéstrame las principales.", icon: <Cpu className="w-3.5 h-3.5" />,         gradient: "from-violet-500 to-purple-400" },
  { id: "portfolio_year", label: "Portafolio último año",        query: "¿Cuánto subieron o bajaron mis acciones en el último año? Grafícalo.", icon: <LineChart className="w-3.5 h-3.5" />,   gradient: "from-sky-500 to-blue-400" },
  { id: "warren",         label: "Consejo de inversión",         query: "Basándote en mi portafolio, ¿qué recomendaciones de inversión me darías hoy?", icon: <Brain className="w-3.5 h-3.5" />,       gradient: "from-amber-600 to-yellow-400" },
  { id: "alerts",         label: "Alertas importantes",          query: "¿Hay alguna alerta o evento importante hoy que afecte mis inversiones?", icon: <AlertTriangle className="w-3.5 h-3.5" />, gradient: "from-red-600 to-orange-400" },
];

// ── ROTATING GREETINGS ──────────────────────────────────

const GREETINGS = [
  "¿Qué quieres saber hoy?",
  "Pregúntame lo que sea",
  "Tu asistente financiero",
  "Explora los mercados",
  "¿Cómo te ayudo hoy?",
  "Analicemos juntos",
  "Todo sobre tus inversiones",
  "Información en tiempo real",
];

// ── MAIN COMPONENT ───────────────────────────────────────

interface PromptCarouselProps {
  onSend: (query: string) => void;
}

export function PromptCarousel({ onSend }: PromptCarouselProps) {
  const [greetingIdx, setGreetingIdx] = useState(0);

  // Rotate greeting
  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (item: PromptItem) => {
    onSend(item.query);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full mt-12 md:mt-12 mb-6 md:mb-8 select-none">

      {/* ── Rotating Greeting ── */}
      <div className="h-10 md:h-12 flex items-center justify-center mb-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.h2
            key={greetingIdx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="text-xl md:text-2xl font-black text-gray-900 dark:text-white tracking-tight text-center"
          >
            {GREETINGS[greetingIdx]}
          </motion.h2>
        </AnimatePresence>
      </div>
      <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mb-7 md:mb-10 font-medium text-center px-4">
        Toca un tema para iniciar
      </p>

      {/* ── Scrolling Row A (→ direction) ── */}
      <div className="w-full max-w-4xl mx-auto overflow-hidden mb-3 relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ScrollingRow items={ROW_A} direction="left" onSend={onSend} onClick={handleClick} />
      </div>

      {/* ── Scrolling Row B (← direction) ── */}
      <div className="w-full max-w-4xl mx-auto overflow-hidden mb-6 relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <ScrollingRow items={ROW_B} direction="right" onSend={onSend} onClick={handleClick} />
      </div>
    </div>
  );
}

// ── SCROLLING ROW COMPONENT ──────────────────────────────

interface ScrollingRowProps {
  items: PromptItem[];
  direction: "left" | "right";
  onSend: (query: string) => void;
  onClick: (item: PromptItem) => void;
}

function ScrollingRow({ items, direction, onSend, onClick }: ScrollingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const animRef = useRef<number>(0);
  const speedRef = useRef(direction === "left" ? 0.4 : -0.4);

  // Duplicate items for seamless loop
  const displayItems = [...items, ...items, ...items];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initialize scroll position to the middle set for seamless looping
    const singleWidth = el.scrollWidth / 3;
    el.scrollLeft = singleWidth;

    const animate = () => {
      if (el) {
        if (!isPausedRef.current) {
          el.scrollLeft += speedRef.current;
        }

        // Seamless loop: jump back when we've scrolled past one full set
        if (el.scrollLeft >= singleWidth * 2) {
          el.scrollLeft -= singleWidth;
        } else if (el.scrollLeft <= 0) {
          el.scrollLeft += singleWidth;
        }
      }
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [direction]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2.5 overflow-x-auto px-4 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      style={{ scrollBehavior: "auto" }}
      onPointerEnter={() => { isPausedRef.current = true; }}
      onPointerLeave={() => { isPausedRef.current = false; }}
      onTouchStart={() => { isPausedRef.current = true; }}
      onTouchEnd={() => { isPausedRef.current = false; }}
    >
      {displayItems.map((item, idx) => {
        return (
          <button
            key={`${item.id}-${idx}`}
            onClick={() => onClick(item)}
            className={`
              relative flex items-center gap-2 px-3.5 py-2.5 rounded-full whitespace-nowrap shrink-0
              border transition-all duration-200 group cursor-pointer
              bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-[#1890FF]/30 hover:bg-[#1890FF]/[0.04]
              active:scale-95
            `}
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-sm`}>
              {item.icon}
            </div>
            <span className={`text-[12px] md:text-[13px] font-semibold text-gray-700 dark:text-gray-300 group-hover:text-[#1890FF] dark:group-hover:text-[#1890FF] transition-colors`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
