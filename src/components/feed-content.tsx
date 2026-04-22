"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, RefreshCw, Globe, Cpu, TrendingUp, LineChart, PieChart, Landmark, Flame, Eye, ChevronRight } from "lucide-react";
import Link from "next/link";
import { NewsCard } from "@/components/news-card";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useViewStore } from "@/lib/stores/use-view-store";

export type FeedTab = "chile" | "tech_global" | "impacto_global" | "finanzas" | "inversiones" | "economia";

export const TABS: { id: FeedTab; path: string; label: string; icon: React.ReactNode; emoji: string; desc: string }[] = [
  { id: "chile", path: "/", label: "Principal", icon: <TrendingUp className="w-4 h-4" />, emoji: "", desc: "Economía, finanzas y tech local" },
  { id: "finanzas", path: "/finanzas", label: "Finanzas", icon: <Landmark className="w-4 h-4" />, emoji: "🏦", desc: "Corporativo, bancos y fusiones" },
  { id: "inversiones", path: "/inversiones", label: "Inversiones", icon: <LineChart className="w-4 h-4" />, emoji: "📈", desc: "Bolsa, cripto y mercados" },
  { id: "impacto_global", path: "/impacto-global", label: "Impacto Global", icon: <Globe className="w-4 h-4" />, emoji: "🌍", desc: "Eventos que afectan a Chile" },
  { id: "economia", path: "/economia", label: "Economía", icon: <PieChart className="w-4 h-4" />, emoji: "📊", desc: "Macroeconomía e indicadores" },
  { id: "tech_global", path: "/tech-global", label: "Tech Global", icon: <Cpu className="w-4 h-4" />, emoji: "💻", desc: "IA, startups y Big Tech" },
];

export function FeedContent({ currentFeed }: { currentFeed: FeedTab }) {
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [visibleCount, setVisibleCount] = useState(12);
  const supabase = createClient();
  const userRole = useAuthStore(s => s.user?.role);
  const { timePeriod } = useViewStore();

  // Fetch all articles on mount
  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .order('published_at', { ascending: false })
        .limit(200);

      if (data && !error) setDbArticles(data);
    };
    fetchNews();

    const channel = supabase.channel('public:news_articles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' }, (payload) => {
        setDbArticles(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Filter by feed_tag
  const feedArticles = useMemo(() => {
    // 1. Time Period Filter
    let timeFiltered = dbArticles;
    if (timePeriod !== 'all') {
      const now = new Date().getTime();
      const cutoffs: Record<string, number> = {
        'recent': 60 * 60 * 1000, // 1 hour
        '24h': 24 * 60 * 60 * 1000, // 24 hours
        '7d': 7 * 24 * 60 * 60 * 1000, // 7 days
        '30d': 30 * 24 * 60 * 60 * 1000, // 30 days
      };
      const cutoff = cutoffs[timePeriod] || cutoffs['24h'];
      timeFiltered = dbArticles.filter(a => {
        const d = new Date(a.published_at).getTime();
        return (now - d) <= cutoff;
      });
    }

    // 2. Category / Tag Filter
    let categoryFiltered = timeFiltered.filter(a => a.feed_tag === currentFeed);
    if (categoryFiltered.length === 0) {
      const categoryMap: Record<FeedTab, string[]> = {
        chile: ["chile", "business"],
        tech_global: ["tech", "technology"],
        impacto_global: ["world", "politics"],
        finanzas: ["business", "politics"],
        inversiones: ["business"],
        economia: ["business"],
      };
      categoryFiltered = timeFiltered.filter(a => categoryMap[currentFeed]?.includes(a.category?.toLowerCase()));
    }

    // 3. Sorting
    if (timePeriod === "recent") {
      // recent is strictly chronological
      return categoryFiltered.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    } else {
      // 24h, 7d, 30d, and all prioritize relevance score
      return categoryFiltered.sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }
  }, [dbArticles, currentFeed, timePeriod]);

  const visibleArticles = feedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < feedArticles.length;

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus('idle');
    try {
      const res = await fetch('/api/cron?manual=true');
      if (!res.ok) throw new Error("Sync failed");
      setSyncStatus('success');
    } catch (e) {
      console.error("Failed to sync", e);
      setSyncStatus('error');
    }
    setIsSyncing(false);
    setTimeout(() => setSyncStatus('idle'), 4000);
  };

  const activeTabData = TABS.find(t => t.id === currentFeed)!;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-24 pb-16">

        {/* ── Section Navigation (Not sticky) ── */}
        <div className="-mx-4 px-4 py-3 bg-gray-50 dark:bg-[#0F172A] border-b border-gray-200/50 dark:border-white/5 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar flex-nowrap">
              {TABS.map(tab => (
                <Link
                  key={tab.id}
                  href={tab.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                    currentFeed === tab.id
                      ? "bg-[#1890FF] text-white shadow-lg shadow-[#1890FF]/25"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="inline">{tab.label}</span>
                </Link>
              ))}
            </div>

            {/* Sync button */}
            {userRole === "admin" && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  syncStatus === 'success' ? 'bg-green-500 hover:bg-green-600' :
                  syncStatus === 'error' ? 'bg-red-500 hover:bg-red-600' :
                  'bg-[#1890FF] hover:bg-[#1890FF]/90'
                } text-white shrink-0`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing ? 'Procesando IA...' :
                   syncStatus === 'success' ? '¡Actualizado!' :
                   syncStatus === 'error' ? 'Error' :
                   'Actualizar'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* ── Section Header ── */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-[#1890FF] to-[#93C5FD] dark:to-white bg-clip-text text-transparent">
              {activeTabData.label}
            </span>
          </h1>
          <p className="mt-2 text-base text-gray-500 dark:text-gray-400 max-w-lg">
            {activeTabData.desc}
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-gray-400 dark:text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            {feedArticles.length} noticias • Actualización en tiempo real
          </div>
        </div>

        {/* ── Feed Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentFeed}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {visibleArticles.length > 0 ? (
              <div className="flex flex-col gap-12">
                {/* ── HERO SECTION ── */}
                {visibleArticles[0] && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Main Featured Article */}
                    <div className="lg:col-span-8">
                      <NewsCard article={visibleArticles[0]} index={0} layout="featured" />
                    </div>
                    {/* Side Articles */}
                    <div className="lg:col-span-4 flex flex-col gap-5">
                      {visibleArticles[1] && (
                        <NewsCard article={visibleArticles[1]} index={1} layout="compact" />
                      )}
                      {visibleArticles[2] && (
                        <NewsCard article={visibleArticles[2]} index={2} layout="compact" />
                      )}
                    </div>
                  </div>
                )}

                {/* ── MAIN CONTENT + TRENDING SIDEBAR (TOP SECTION) ── */}
                {visibleArticles.length > 3 && (
                  <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left: First batch of news (6 items = 2 rows of 3) */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleArticles.slice(3, 9).map((article, i) => (
                          <NewsCard key={article.id} article={article} index={i + 3} />
                        ))}
                      </div>
                    </div>

                    {/* Right: Trending / Most Viewed Panel */}
                    <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0">
                      <div>
                        <TrendingPanel articles={feedArticles} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── FULL WIDTH BOTTOM GRID ── */}
                {visibleArticles.length > 9 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleArticles.slice(9).map((article, i) => (
                      <NewsCard key={article.id} article={article} index={i + 9} />
                    ))}
                  </div>
                )}

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <button
                      onClick={() => setVisibleCount(v => v + 12)}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-[#1890FF]/50 hover:text-[#1890FF] transition-all shadow-sm"
                    >
                      <Loader2 className="w-4 h-4" />
                      Cargar más noticias
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center w-full bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200/50 dark:border-white/5">
                <MessageSquare className="w-12 h-12 text-[#1890FF]/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sin noticias aún</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto text-sm">
                  Presiona &quot;Actualizar&quot; para que la IA busque las últimas noticias de esta sección.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Trending / Most Viewed Panel ── */
function TrendingPanel({ articles }: { articles: any[] }) {
  const trending = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 10); // Limit to 10 to approximate height of 2 rows of images
  }, [articles]);

  if (trending.length === 0) return null;

  const fmtDate = (d: string) => {
    try {
      const date = new Date(d);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `hace ${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `hace ${hrs}h`;
      return `hace ${Math.floor(hrs / 24)}d`;
    } catch { return ""; }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Más Relevantes</h3>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="lg:hidden overflow-x-auto hide-scrollbar">
        <div className="flex gap-4 p-4" style={{ width: 'max-content' }}>
          {trending.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug || article.id}`}
              className="flex-shrink-0 w-[260px] group"
            >
              <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-gray-700/50 p-3 hover:border-[#1890FF]/30 transition-all h-full flex gap-3">
                {article.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">
                    {article.title}
                  </p>
                  <span className="text-[10px] text-gray-400 mt-1 block">{fmtDate(article.published_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Vertical list on desktop */}
      <div className="hidden lg:block divide-y divide-gray-50 dark:divide-gray-800">
        {trending.map((article, i) => (
          <Link
            key={article.id}
            href={`/article/${article.slug || article.id}`}
            className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
          >
            <span className="text-lg font-black text-gray-200 dark:text-gray-700 w-6 flex-shrink-0 text-right tabular-nums">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">
                {article.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400">{fmtDate(article.published_at)}</span>
                {article.relevance_score > 0 && (
                  <span className="text-[10px] font-bold text-orange-500/70 flex items-center gap-0.5">
                    <Eye className="w-3 h-3" /> {Math.round(article.relevance_score * 100)}%
                  </span>
                )}
              </div>
            </div>
            {article.image_url && (
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                <img src={article.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
