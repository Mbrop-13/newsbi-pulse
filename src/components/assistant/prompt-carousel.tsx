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

// ── FAVORITES KEY ────────────────────────────────────────

const FAV_STORAGE_KEY = "r_ai_fav_prompts";

// ── MAIN COMPONENT ───────────────────────────────────────

interface PromptCarouselProps {
  onSend: (query: string) => void;
}

export function PromptCarousel({ onSend }: PromptCarouselProps) {
  const [greetingIdx, setGreetingIdx] = useState(0);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [longPressId, setLongPressId] = useState<string | null>(null);
  const [showFavToast, setShowFavToast] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(FAV_STORAGE_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
  }, []);

  // Save favorites
  const saveFavorites = useCallback((newFavs: string[]) => {
    setFavorites(newFavs);
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(newFavs));
  }, []);

  // Rotate greeting
  useEffect(() => {
    const interval = setInterval(() => {
      setGreetingIdx((prev) => (prev + 1) % GREETINGS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Long press handlers
  const handlePointerDown = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressId(id);
      // Toggle favorite
      const newFavs = favorites.includes(id)
        ? favorites.filter((f) => f !== id)
        : [...favorites, id];
      saveFavorites(newFavs);
      setShowFavToast(id);
      setTimeout(() => setShowFavToast(null), 1500);

      // Vibrate on mobile if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setLongPressId(null);
  };

  const handleClick = (item: PromptItem) => {
    // Only fire click if it wasn't a long press
    if (longPressId === item.id) return;
    onSend(item.query);
  };

  // Get all prompts for favorites lookup
  const allPrompts = [...ROW_A, ...ROW_B];
  const favoritePrompts = favorites
    .map((id) => allPrompts.find((p) => p.id === id))
    .filter(Boolean) as PromptItem[];

  return (
    <div className="flex flex-col items-center justify-center w-full mt-4 md:mt-16 mb-6 md:mb-10 select-none">
      {/* ── Logo ── */}
      <div className="relative mb-5 md:mb-7">
        <div className="absolute inset-0 bg-[#1890FF] blur-3xl opacity-15 rounded-full scale-150" />
        <div className="relative w-14 h-14 md:w-[4.5rem] md:h-[4.5rem] bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-2xl md:rounded-[1.6rem] flex items-center justify-center shadow-2xl ring-4 ring-white/80 dark:ring-[#0B0F1A]/80">
          <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-white" />
        </div>
      </div>

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
        Toca un tema para iniciar · Mantén presionado para fijar
      </p>

      {/* ── Scrolling Row A (→ direction) ── */}
      <div className="w-full overflow-hidden mb-3 relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-20 bg-gradient-to-r from-white dark:from-[#0a0a0a] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-20 bg-gradient-to-l from-white dark:from-[#0a0a0a] to-transparent z-10" />
        <ScrollingRow items={ROW_A} direction="left" favorites={favorites} onSend={onSend} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onClick={handleClick} showFavToast={showFavToast} />
      </div>

      {/* ── Scrolling Row B (← direction) ── */}
      <div className="w-full overflow-hidden mb-6 relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-20 bg-gradient-to-r from-white dark:from-[#0a0a0a] to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-20 bg-gradient-to-l from-white dark:from-[#0a0a0a] to-transparent z-10" />
        <ScrollingRow items={ROW_B} direction="right" favorites={favorites} onSend={onSend} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onClick={handleClick} showFavToast={showFavToast} />
      </div>

      {/* ── Pinned Favorites ── */}
      <AnimatePresence>
        {favoritePrompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full max-w-2xl px-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Favoritos</span>
            </div>
            <div className="flex gap-2 overflow-x-auto hidden-scrollbar pb-2">
              {favoritePrompts.map((item) => (
                <motion.button
                  key={item.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  onClick={() => onSend(item.query)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    saveFavorites(favorites.filter((f) => f !== item.id));
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/5 border border-amber-500/20 rounded-full whitespace-nowrap hover:bg-amber-500/10 hover:border-amber-500/40 transition-all group shrink-0"
                >
                  <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {item.label}
                  </span>
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SCROLLING ROW COMPONENT ──────────────────────────────

interface ScrollingRowProps {
  items: PromptItem[];
  direction: "left" | "right";
  favorites: string[];
  onSend: (query: string) => void;
  onPointerDown: (id: string) => void;
  onPointerUp: () => void;
  onClick: (item: PromptItem) => void;
  showFavToast: string | null;
}

function ScrollingRow({ items, direction, favorites, onSend, onPointerDown, onPointerUp, onClick, showFavToast }: ScrollingRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
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
      if (!isPaused && el) {
        el.scrollLeft += speedRef.current;

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
  }, [isPaused, direction]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2.5 overflow-x-auto hidden-scrollbar px-4 py-1"
      style={{ scrollBehavior: "auto" }}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => { setIsPaused(false); onPointerUp(); }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => { setIsPaused(false); onPointerUp(); }}
    >
      {displayItems.map((item, idx) => {
        const isFav = favorites.includes(item.id);
        const isToasting = showFavToast === item.id;

        return (
          <button
            key={`${item.id}-${idx}`}
            onPointerDown={() => onPointerDown(item.id)}
            onPointerUp={() => { onPointerUp(); onClick(item); }}
            onPointerCancel={onPointerUp}
            className={`
              relative flex items-center gap-2 px-3.5 py-2.5 rounded-full whitespace-nowrap shrink-0
              border transition-all duration-200 group cursor-pointer
              ${isFav
                ? "bg-amber-500/5 border-amber-500/25 hover:bg-amber-500/10"
                : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/[0.08] hover:border-[#1890FF]/30 hover:bg-[#1890FF]/[0.04]"
              }
              active:scale-95
            `}
          >
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shadow-sm`}>
              {item.icon}
            </div>
            <span className={`text-[12px] md:text-[13px] font-semibold ${isFav ? "text-amber-700 dark:text-amber-300" : "text-gray-700 dark:text-gray-300"} group-hover:text-[#1890FF] dark:group-hover:text-[#1890FF] transition-colors`}>
              {item.label}
            </span>
            {isFav && (
              <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
            )}

            {/* Toast on favorite */}
            <AnimatePresence>
              {isToasting && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.8 }}
                  animate={{ opacity: 1, y: -28, scale: 1 }}
                  exit={{ opacity: 0, y: -36, scale: 0.8 }}
                  className="absolute left-1/2 -translate-x-1/2 top-0 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg whitespace-nowrap pointer-events-none z-20"
                >
                  {isFav ? "⭐ Fijado" : "Removido"}
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
