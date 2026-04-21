"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, RefreshCw, ArrowRight, TrendingUp, X, Search, Flame, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewsCard } from "@/components/news-card";
import { NewsCardSkeleton } from "@/components/news-card-skeleton";
import { TagSkeleton } from "@/components/tag-skeleton";
import { createClient } from "@/lib/supabase/client";
import { TABS, FeedTab } from "@/components/feed-content";
import { useFilterStore } from "@/lib/stores/filter-store";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { PredictionsSidebar } from "@/components/predictions-sidebar";
import { TraditionalNewspaper } from "@/components/traditional-newspaper";
import { HomepageOnboarding } from "@/components/homepage-onboarding";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  initialFeed?: string;
  initialFilter?: 'tendencia' | 'breaking' | 'nuevo';
  searchTag?: string;
}

export function CountryFeedPage({ initialFeed, initialFilter, searchTag }: Props) {
  const router = useRouter();
  const defaultTab: FeedTab = (initialFeed as FeedTab) || "chile";
  const [activeTab, setActiveTab] = useState<FeedTab>(defaultTab);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [visibleCount, setVisibleCount] = useState(25);
  const [filterMode, setFilterMode] = useState<'tendencia' | 'breaking' | 'nuevo' | null>(initialFilter || null);
  const { selectedSources, setAvailableSources, toggleSource } = useFilterStore();
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchTag ? [decodeURIComponent(searchTag)] : []
  );
  const [isTransitioning, setIsTransitioning] = useState(true);
  const supabase = createClient();
  const { layout: viewLayout, density, showPredictions } = useViewStore();
  const userRole = useAuthStore(s => s.user?.role);

  const gapClass =
    density === 'compact' ? 'gap-3' :
    density === 'spacious' ? 'gap-8 lg:gap-10' :
    'gap-6';

  const gridClass = viewLayout === 'list' 
    ? 'grid-cols-1 max-w-3xl mx-auto'
    : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  const bottomGridClass = viewLayout === 'list'
    ? 'grid-cols-1 max-w-3xl mx-auto'
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  const toggleTag = (tag: string) => {
    const lowerTag = tag.trim().toLowerCase();
    setSelectedTags(prev => 
      prev.some(t => t.toLowerCase() === lowerTag) 
        ? prev.filter(t => t.toLowerCase() !== lowerTag) 
        : [...prev, tag.trim()]
    );
  };

  useEffect(() => {
    if (searchTag) {
      const decoded = decodeURIComponent(searchTag).toLowerCase();
      setSelectedTags(prev => prev.some(t => t.toLowerCase() === decoded) ? prev : [...prev, decodeURIComponent(searchTag)]);
    }
  }, [searchTag]);

  // Fetch articles on mount
  useEffect(() => {
    const fetchNews = async () => {
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .neq('is_hidden', true)
        .order('published_at', { ascending: false })
        .limit(200);

      if (data && !error) {
        setDbArticles(data);
      }
      // Small artificial delay for initial load premium feel
      setTimeout(() => setIsTransitioning(false), 500);
    };
    fetchNews();

    const channel = supabase.channel('public:news_articles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' }, (payload) => {
        setDbArticles(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Filter by feed_tag / searchTag
  const feedArticles = useMemo(() => {
    // When on the main "Principal" tab, show ALL articles 
    if (activeTab === 'chile') {
      return dbArticles;
    }

    // Then filter by feed_tag for specific sections
    const byTag = dbArticles.filter(a => a.feed_tag === activeTab);
    if (byTag.length > 0) return byTag;

    // Fallback: match by category for legacy articles
    const categoryMap: Record<FeedTab, string[]> = {
      chile: ["chile", "business"],
      tech_global: ["tech", "technology"],
      impacto_global: ["world", "politics"],
      finanzas: ["business", "politics"],
      inversiones: ["business"],
      economia: ["business"],
    };
    return dbArticles.filter(a => categoryMap[activeTab]?.includes(a.category?.toLowerCase()));
  }, [dbArticles, activeTab, searchTag]);

  // Extract unique sources for the filter UI based on current feed
  const uniqueSources = useMemo(() => {
    const srcMap = new Map<string, string>();
    feedArticles.forEach(a => {
      if (Array.isArray(a.sources)) {
        a.sources.forEach((s: any) => {
          if (s.name && s.url) srcMap.set(s.name, s.url);
        });
      }
    });
    return Array.from(srcMap.entries()).map(([name, url]) => ({ name, url })).sort((a, b) => a.name.localeCompare(b.name));
  }, [feedArticles]);

  useEffect(() => {
    setAvailableSources(uniqueSources);
  }, [uniqueSources, setAvailableSources]);

  // Apply source and tag filters BEFORE sorting
  const filteredFeedArticles = useMemo(() => {
    let result = feedArticles;
    
    // 1. Filter by Sources (AND condition on article side)
    if (selectedSources.length > 0) {
      result = result.filter(a => 
        Array.isArray(a.sources) && a.sources.some((s: any) => selectedSources.includes(s.name))
      );
    }

    // 2. Filter by Selected Tags (OR condition to broaden search)
    if (selectedTags.length > 0) {
      const lowerSelected = selectedTags.map(st => st.toLowerCase());
      result = result.filter(a => 
        Array.isArray(a.tags) && a.tags.some((t: string) => lowerSelected.includes(t.toLowerCase()))
      );
    }
    
    return result;
  }, [feedArticles, selectedSources, selectedTags]);

  const sortedArticles = useMemo(() => {
    return [...filteredFeedArticles].sort((a, b) => {
      if (filterMode === 'tendencia') {
        const aViews = a.views || 0;
        const bViews = b.views || 0;
        if (aViews !== bViews) return bViews - aViews;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      }
      if (filterMode === 'breaking') {
        const aRel = a.relevance_score || 0;
        const bRel = b.relevance_score || 0;
        if (aRel !== bRel) return bRel - aRel;
        return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
      }
      return new Date(b.published_at || 0).getTime() - new Date(a.published_at || 0).getTime();
    });
  }, [filteredFeedArticles, filterMode]);

  const { topTags, remainingTags } = useMemo(() => {
    const tagMap = new Map<string, number>();
    
    // We derive tags from feedArticles (filtered only by sources) 
    // so that selecting a tag doesn't collapse the available topics horizontally!
    const baseArticles = selectedSources.length > 0 
      ? feedArticles.filter(a => Array.isArray(a.sources) && a.sources.some((s: any) => selectedSources.includes(s.name)))
      : feedArticles;

    baseArticles.forEach(a => {
      const views = a.views || 0;
      if (Array.isArray(a.tags)) {
        a.tags.forEach((t: string) => tagMap.set(t, (tagMap.get(t) || 0) + views + 1));
      }
    });

    const sorted = Array.from(tagMap.entries())
      .map(entry => entry[0])
      .sort((a, b) => {
        // Force selected tags to always float to the front!
        const lowerSelected = selectedTags.map(st => st.toLowerCase());
        const aSelected = lowerSelected.includes(a.toLowerCase());
        const bSelected = lowerSelected.includes(b.toLowerCase());
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        // Otherwise sort by tag frequency/views
        return (tagMap.get(b) || 0) - (tagMap.get(a) || 0);
      });

    return { topTags: sorted.slice(0, 10), remainingTags: sorted.slice(10) };
  }, [feedArticles, selectedSources, selectedTags]);

  const visibleArticles = sortedArticles.slice(0, visibleCount);
  const hasMore = visibleCount < sortedArticles.length;

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

  const triggerTransition = () => {
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 600);
  };

  const handleTabChange = (tab: FeedTab) => {
    triggerTransition();
    setActiveTab(tab);
    setFilterMode(null);
    setSelectedTags([]); // Clear tag selections when navigating to a new tab/country
    setVisibleCount(25);
    // Root-level URLs for global feed
    if (tab === 'chile') {
      router.push('/');
    } else {
      const feedSlug = tab.replace('_', '-');
      router.push(`/${feedSlug}`);
    }
  };

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];

  // Build the "go to section" URL
  const sectionUrl = searchTag
    ? `/tema/${searchTag}`
    : activeTab === 'chile'
      ? `/`
      : `/${activeTab.replace('_', '-')}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 font-sans">
      {/* Homepage onboarding for non-registered users */}
      <div className="pt-[72px]">
        <HomepageOnboarding />
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">

        {/* ── Filter Bar ── */}
        <div className="-mx-4 px-4 pt-2 pb-3 bg-gray-50 dark:bg-[#0F172A] border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap">
              {/* Timing filters */}
              <button 
                onClick={() => { triggerTransition(); setFilterMode('tendencia'); router.push('/tendencia'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  filterMode === 'tendencia' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                {filterMode === 'tendencia' && <TrendingUp className="w-3.5 h-3.5" />}
                Tendencia
              </button>
              <button 
                onClick={() => { triggerTransition(); setFilterMode('breaking'); router.push('/breaking'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  filterMode === 'breaking' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                Breaking
              </button>
              <button 
                onClick={() => { triggerTransition(); setFilterMode('nuevo'); router.push('/nuevo'); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shrink-0 ${
                  filterMode === 'nuevo' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                Nuevo
              </button>

              {/* Divider */}
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 shrink-0" />

              {/* Trending Tags */}
              {topTags.length === 0 || isTransitioning ? (
                <>
                  <TagSkeleton />
                  <TagSkeleton />
                  <TagSkeleton />
                </>
              ) : (
                topTags.map((tag) => {
                  const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
                  return (
                    <button 
                      key={tag} 
                      onClick={() => toggleTag(tag)}
                      className={`group relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap overflow-hidden flex items-center justify-center shrink-0
                        ${isSelected 
                          ? "bg-[#1890FF] text-white pr-7 shadow-sm ring-1 ring-[#1890FF]/50" 
                          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                    >
                      <span className={`${isSelected ? "transform -translate-x-1" : ""} transition-transform`}>{tag}</span>
                      {isSelected && (
                        <span className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}

              {remainingTags.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger className="px-4 py-1.5 rounded-full text-xs font-bold text-[#1890FF] bg-blue-50 hover:bg-blue-100 dark:bg-[#1890FF]/10 dark:hover:bg-[#1890FF]/20 transition-all outline-none focus:ring-2 focus:ring-[#1890FF] shadow-sm shrink-0">
                    Ver todos
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px] rounded-xl border-gray-200 dark:border-gray-800 shadow-2xl p-2 bg-white dark:bg-slate-900 mt-2">
                    <div className="px-2 py-2 mb-1 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-[#1890FF]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Explorar Temas</h4>
                    </div>
                    <div className="px-2 mb-2 relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar tema..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#1890FF] transition-all"
                      />
                    </div>
                    <div className="max-h-[350px] overflow-y-auto hidden-scrollbar flex flex-col gap-1 px-1 mt-1 pb-4">
                      {remainingTags
                        .filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()))
                        .map(tag => (
                        <DropdownMenuItem 
                          key={tag} 
                          className="cursor-pointer text-sm font-medium px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between group outline-none" 
                          onSelect={() => {
                            toggleTag(tag.trim());
                            setTagSearch("");
                          }}
                        >
                          <span className="truncate pr-4 group-hover:text-[#1890FF] transition-colors">{tag}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-[#1890FF] transition-colors opacity-0 group-hover:opacity-100" />
                        </DropdownMenuItem>
                      ))}
                      {remainingTags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
                        <div className="py-4 text-center text-xs text-gray-500">No se encontraron temas.</div>
                      )}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 shrink-0">
              {selectedSources.length > 0 && (
                <div className="hidden md:flex items-center gap-1.5 mr-2">
                  {selectedSources.map(source => (
                    <div key={source} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-[#1890FF]/10 border border-[#1890FF]/20 text-[#1890FF] text-[11px] font-bold">
                      <span className="max-w-[120px] truncate">{source}</span>
                      <button onClick={() => toggleSource(source)} className="hover:bg-blue-100 dark:hover:bg-[#1890FF]/25 rounded-md p-0.5 ml-1 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

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
        </div>


        {/* ── Feed Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`global-${activeTab}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {isTransitioning ? (
              <div className="flex flex-col gap-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8">
                    <NewsCardSkeleton index={0} className="h-[400px]" />
                  </div>
                  <div className="lg:col-span-4 hidden lg:flex flex-col gap-6">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" /> En Tendencia
                    </h3>
                    <div className="flex flex-col gap-4">
                      <NewsCardSkeleton index={1} className="h-[120px]" />
                      <NewsCardSkeleton index={2} className="h-[120px]" />
                    </div>
                  </div>
                </div>
                <div className={`grid ${bottomGridClass} ${gapClass}`}>
                  <NewsCardSkeleton index={3} className="h-[280px]" />
                  <NewsCardSkeleton index={4} className="h-[280px]" />
                  <NewsCardSkeleton index={5} className="h-[280px]" />
                </div>
              </div>
            ) : visibleArticles.length > 0 ? (
              <div className={`flex flex-col ${gapClass}`}>
                {/* Hero: First article large (Grid Mode Only) */}
                {viewLayout === 'grid' && visibleArticles[0] && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                      <NewsCard article={visibleArticles[0]} index={0} layout="featured" />
                    </div>
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      {visibleArticles[1] && (
                        <NewsCard article={visibleArticles[1]} index={1} layout="compact" />
                      )}
                      {visibleArticles[2] && (
                        <NewsCard article={visibleArticles[2]} index={2} layout="compact" />
                      )}
                    </div>
                  </div>
                )}

                {/* List mode for first 3 items */}
                {viewLayout === 'list' && visibleArticles.length > 0 && (
                  <div className={`grid ${bottomGridClass} ${gapClass}`}>
                    {visibleArticles.slice(0, 3).map((article, i) => (
                      <NewsCard key={article.id} article={article} index={i} />
                    ))}
                  </div>
                )}

                {/* Traditional mode for all items */}
                {viewLayout === 'traditional' && visibleArticles.length > 0 && (
                  <TraditionalNewspaper articles={visibleArticles} />
                )}

                {/* ── MAIN CONTENT + TRENDING SIDEBAR (TOP SECTION) ── */}
                {viewLayout !== 'traditional' && visibleArticles.length > 3 && (
                  <div className={`flex flex-col lg:flex-row ${gapClass}`}>
                    {/* Left: First batch of news (6 items = 2 rows of 3) */}
                    <div className="flex-1 min-w-0">
                      <div className={`grid ${gridClass} ${gapClass}`}>
                        {visibleArticles.slice(3, 9).map((article, i) => (
                          <NewsCard key={article.id} article={article} index={i + 3} />
                        ))}
                      </div>
                    </div>

                    {/* Right: Trending / Most Viewed Panel */}
                    {viewLayout !== 'list' && (
                      <div className="lg:w-[340px] xl:w-[380px] flex-shrink-0">
                        <div className="space-y-5 lg:sticky lg:top-24">
                          <TrendingPanel articles={feedArticles} />
                          {showPredictions && <PredictionsSidebar />}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── FULL WIDTH BOTTOM GRID ── */}
                {viewLayout !== 'traditional' && visibleArticles.length > 9 && (
                  <div className={`grid ${bottomGridClass} ${gapClass}`}>
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
                  Presiona &quot;Actualizar&quot; para que la IA busque las últimas noticias.
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
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="font-bold text-sm text-gray-900 dark:text-white">Más Relevantes</h3>
      </div>

      {/* Horizontal scroll on mobile */}
      <div className="lg:hidden overflow-x-auto scrollbar-hide">
        <div className="flex gap-4 p-4" style={{ width: 'max-content' }}>
          {trending.map((article) => (
            <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex-shrink-0 w-[260px] group">
              <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-gray-700/50 p-3 hover:border-[#1890FF]/30 transition-all h-full flex gap-3">
                {article.image_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                    <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">{article.title}</p>
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
          <Link key={article.id} href={`/article/${article.slug || article.id}`} className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group">
            <span className="text-lg font-black text-gray-200 dark:text-gray-700 w-6 flex-shrink-0 text-right tabular-nums">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">{article.title}</p>
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
