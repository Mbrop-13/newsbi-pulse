"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PredictionCard } from "@/components/prediction-card";
import { TrendingUp, Gem, Filter, Loader2, Zap, Clock, Flame, BarChart3, ChevronDown, Check } from "lucide-react";

interface Prediction {
  id: string;
  title: string;
  description: string;
  rules: string;
  resolution_method: string;
  option_a_label: string;
  option_b_label: string;
  pool_a: number;
  pool_b: number;
  prob_a: number;
  prob_b: number;
  total_volume: number;
  resolution_date: string | null;
  status: string;
  winner: string | null;
  category: string;
  tags: string[];
  image_url: string | null;
  created_at: string;
  slug: string;
  history?: { date: string; probA: number }[];
}

const CATEGORIES = [
  { id: "", label: "Todos los Mercados", icon: Flame },
  { id: "politics", label: "Política", icon: Zap },
  { id: "economy", label: "Economía", icon: BarChart3 },
  { id: "world", label: "Mundo", icon: Gem },
  { id: "technology", label: "Tecnología", icon: Loader2 }, // fallback icon
  { id: "sports", label: "Deportes", icon: Clock },
];

export default function PrediccionesPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "resolved">("active");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<"volume" | "newest" | "closing">("volume");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: tab });
    try {
      const res = await fetch(`/api/predictions?${params}`);
      const data = await res.json();
      if (!data.error) setPredictions(data.predictions || []);
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchPredictions();
  }, [tab]);

  // Filter and Sort
  const processedPredictions = predictions
    .filter(p => category === "" || p.category === category)
    .sort((a, b) => {
      if (sortBy === "volume") {
        const volA = a.total_volume + a.pool_a + a.pool_b;
        const volB = b.total_volume + b.pool_a + b.pool_b;
        return volB - volA; // Highest volume first
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "closing") {
        if (!a.resolution_date && !b.resolution_date) return 0;
        if (!a.resolution_date) return 1;
        if (!b.resolution_date) return -1;
        return new Date(a.resolution_date).getTime() - new Date(b.resolution_date).getTime();
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-background pt-[104px] pb-20">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar (Categories) - Desktop Only */}
        <aside className="hidden lg:block w-64 shrink-0 mt-2">
          <div className="sticky top-32 space-y-8">
            {/* Status toggle */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3 px-2">Estado</h3>
              <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setTab("active")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tab === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Activos
                </button>
                <button
                  onClick={() => setTab("resolved")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    tab === "resolved" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Resueltos
                </button>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Categorías</h3>
              <ul className="space-y-1">
                {CATEGORIES.map(c => {
                  const Icon = c.icon;
                  const isActive = category === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => setCategory(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all group ${
                          isActive 
                            ? "bg-[#1890FF]/10 text-[#1890FF] font-bold" 
                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#1890FF]" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {c.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          
          {/* Top Bar (Title + Sort) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-30">
            <h1 className="text-2xl font-bold text-foreground capitalize">
              {category === "" ? "Todos los Mercados" : CATEGORIES.find(c => c.id === category)?.label}
            </h1>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Mobile Filters Dropdown */}
              <div className="relative lg:hidden flex-1 sm:flex-none">
                <button
                  onClick={() => setShowFiltersMobile(!showFiltersMobile)}
                  className={`w-full flex items-center justify-center gap-2 border rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    showFiltersMobile || category !== "" || tab !== "active"
                      ? "bg-[#1890FF]/10 border-[#1890FF]/30 text-[#1890FF]"
                      : "bg-background border-border text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filtros
                </button>
                
                <AnimatePresence>
                  {showFiltersMobile && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
                        onClick={() => setShowFiltersMobile(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="absolute right-0 sm:right-auto sm:left-0 top-[calc(100%+0.5rem)] w-[280px] bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-50 p-5"
                      >
                        {/* Status toggle */}
                        <div className="mb-6">
                          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Estado</h3>
                          <div className="flex bg-muted/30 p-1 rounded-xl border border-border">
                            <button
                              onClick={() => { setTab("active"); setShowFiltersMobile(false); }}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                tab === "active" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Activos
                            </button>
                            <button
                              onClick={() => { setTab("resolved"); setShowFiltersMobile(false); }}
                              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                                tab === "resolved" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Resueltos
                            </button>
                          </div>
                        </div>

                        {/* Categories */}
                        <div>
                          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Categorías</h3>
                          <ul className="space-y-1">
                            {CATEGORIES.map(c => {
                              const Icon = c.icon;
                              const isActive = category === c.id;
                              return (
                                <li key={c.id}>
                                  <button
                                    onClick={() => { setCategory(c.id); setShowFiltersMobile(false); }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all group ${
                                      isActive 
                                        ? "bg-[#1890FF]/10 text-[#1890FF] font-bold" 
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Icon className={`w-4 h-4 ${isActive ? "text-[#1890FF]" : "text-muted-foreground"}`} />
                                      {c.label}
                                    </div>
                                    {isActive && <Check className="w-4 h-4 text-[#1890FF]" />}
                                  </button>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort By Dropdown */}
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-background border border-border rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-foreground hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-[#1890FF]/50 transition-colors cursor-pointer"
                >
                  <option value="volume">Volumen</option>
                  <option value="newest">Más Nuevos</option>
                  <option value="closing">Cierre Próximo</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
            </div>
          ) : processedPredictions.length === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border/50">
              <Filter className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm font-medium">
                {tab === "active" ? "No se encontraron mercados activos." : "No se encontraron mercados resueltos."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {processedPredictions.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <PredictionCard prediction={p} onBetPlaced={fetchPredictions} />
                </motion.div>
              ))}
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
