"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, RefreshCw, ArrowRight, TrendingUp, X, Search, Flame, Eye, Briefcase, Sparkles, Clock as ClockIcon, ChevronDown, Share2, Settings2, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewsCard } from "@/components/news-card";
import { PromoBanner } from "@/components/promo-banner";
import { NewsCardSkeleton } from "@/components/news-card-skeleton";
import { TagSkeleton } from "@/components/tag-skeleton";
import { createClient } from "@/lib/supabase/client";
import { TABS, FeedTab } from "@/components/feed-content";
import { useFilterStore } from "@/lib/stores/filter-store";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useInterestStore } from "@/lib/stores/interest-store";
import { useSidebar } from "@/components/ui/sidebar";
import { useActiveArticleStore } from "@/lib/stores/active-article-store";
import { ExpandableSources } from "@/components/expandable-sources";
import { MarketSidebar } from "@/components/market-sidebar";
import { WeatherWidget } from "@/components/weather-widget";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  initialFeed?: string;
  initialFilter?: 'para_ti' | 'nuevo' | 'portafolio';
  searchTag?: string;
}

export function CountryFeedPage({ initialFeed, initialFilter, searchTag }: Props) {
  const router = useRouter();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";
  const defaultTab: FeedTab = (initialFeed as FeedTab) || "chile";
  const [activeTab, setActiveTab] = useState<FeedTab>(defaultTab);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [visibleCount, setVisibleCount] = useState(25);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [filterMode, setFilterMode] = useState<'para_ti' | 'reciente' | 'tendencia' | 'portafolio' | null>(
    initialFilter === 'nuevo' ? 'reciente' : (initialFilter || 'para_ti')
  );
  const [portfolioSymbols, setPortfolioSymbols] = useState<string[]>([]);
  const [portfolioLoaded, setPortfolioLoaded] = useState(false);
  const currentUser = useAuthStore(s => s.user);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const { selectedSources, setAvailableSources, toggleSource } = useFilterStore();
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchTag ? [decodeURIComponent(searchTag)] : []
  );
  const [isTransitioning, setIsTransitioning] = useState(true);
  const supabase = createClient();
  const { layout: viewLayout, density } = useViewStore();
  const userRole = useAuthStore(s => s.user?.role);
  const getInterestScore = useInterestStore(state => state.getInterestScore);

  const gapClass =
    density === 'compact' ? 'gap-3' :
    density === 'spacious' ? 'gap-8 lg:gap-10' :
    'gap-6';

  const gridClass = isExpanded
      ? 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3';

  const bottomGridClass = isExpanded
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
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
      setIsTransitioning(false);
    };
    fetchNews();

    const channel = supabase.channel('public:news_articles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'news_articles' }, (payload) => {
        setDbArticles(prev => [payload.new, ...prev]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  // Timer for drip-feed
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch portfolio symbols for the "Portafolio" filter
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!currentUser) { setPortfolioLoaded(true); return; }
      const { data } = await supabase.from("portfolios").select("symbol").eq("user_id", currentUser.id);
      if (data) setPortfolioSymbols(data.map(d => d.symbol));
      setPortfolioLoaded(true);
    };
    fetchPortfolio();
  }, [currentUser, supabase]);

  // Filter by feed_tag / searchTag
  const feedArticles = useMemo(() => {
    // 0. Publication Time Filter
    const publishedOnly = dbArticles.filter(a => new Date(a.published_at).getTime() <= currentTime);

    // When on the main "Principal" tab, show ALL articles 
    if (activeTab === 'chile') {
      return publishedOnly;
    }

    // Then filter by feed_tag for specific sections
    const byTag = publishedOnly.filter(a => a.feed_tag === activeTab);
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
    return publishedOnly.filter(a => categoryMap[activeTab]?.includes(a.category?.toLowerCase()));
  }, [dbArticles, activeTab, searchTag, currentTime]);

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

    // 3. Filter by Portfolio symbols when in portfolio mode
    if (filterMode === 'portafolio' && portfolioSymbols.length > 0) {
      const lowerSymbols = portfolioSymbols.map(s => s.toLowerCase());
      result = result.filter(a => {
        const tagsMatch = Array.isArray(a.tags) && a.tags.some((t: string) => lowerSymbols.includes(t.toLowerCase()));
        const titleMatch = lowerSymbols.some(s => (a.title || '').toLowerCase().includes(s));
        return tagsMatch || titleMatch;
      });
    }
    
    return result;
  }, [feedArticles, selectedSources, selectedTags, filterMode, portfolioSymbols]);

  const sortedArticles = useMemo(() => {
    return [...filteredFeedArticles].sort((a, b) => {
      const aDate = new Date(a.published_at || 0).getTime();
      const bDate = new Date(b.published_at || 0).getTime();

      if (filterMode === 'reciente' || filterMode === 'portafolio') {
        // Chronological order for Reciente and Portafolio
        return bDate - aDate;
      }

      if (filterMode === 'tendencia') {
        // Trending: sorted by views (most clicked/interacted) + relevance score
        const aPopularity = (a.views || 0) * 10 + (a.relevance_score || 0);
        const bPopularity = (b.views || 0) * 10 + (b.relevance_score || 0);
        if (aPopularity !== bPopularity) {
          return bPopularity - aPopularity;
        }
        return bDate - aDate;
      }

      if (filterMode === 'para_ti' || !filterMode) {
        const now = Date.now();
        const aAgeHours = (now - aDate) / (1000 * 60 * 60);
        const bAgeHours = (now - bDate) / (1000 * 60 * 60);

        // 1. Base Score from AI
        let aScore = a.relevance_score || 50;
        let bScore = b.relevance_score || 50;

        // 2. Personalization: Interests (Tags & Categories)
        aScore += getInterestScore(a.category, a.tags || []);
        bScore += getInterestScore(b.category, b.tags || []);

        // 3. Personalization: Portfolio Boost (+50 points)
        if (portfolioSymbols.length > 0) {
          const lowerSymbols = portfolioSymbols.map(s => s.toLowerCase());
          const aMatch = (Array.isArray(a.tags) && a.tags.some((t: string) => lowerSymbols.includes(t.toLowerCase()))) || lowerSymbols.some(s => (a.title || '').toLowerCase().includes(s));
          const bMatch = (Array.isArray(b.tags) && b.tags.some((t: string) => lowerSymbols.includes(t.toLowerCase()))) || lowerSymbols.some(s => (b.title || '').toLowerCase().includes(s));
          
          if (aMatch) aScore += 50;
          if (bMatch) bScore += 50;
        }

        // 4. Time Decay (-2 points per hour old)
        aScore -= aAgeHours * 2;
        bScore -= bAgeHours * 2;

        return bScore - aScore;
      }

      // Default fallback chronological
      return bDate - aDate;
    });
  }, [filteredFeedArticles, filterMode, getInterestScore, portfolioSymbols]);

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
    // No artificial transition delay for snappy local changes
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

  const formatTimeAgo = (d: string) => {
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

  const { openArticle } = useActiveArticleStore();

  // Build the "go to section" URL
  const sectionUrl = searchTag
    ? `/tema/${searchTag}`
    : activeTab === 'chile'
      ? `/`
      : `/${activeTab.replace('_', '-')}`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* ── Google News Header Bar ── */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border/80">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Empty spacer (no Descubre title) */}
          <div className="flex items-center gap-3">
          </div>

          {/* Center: Navigation Tabs */}
          <div className="flex items-center gap-6 text-sm font-semibold h-full relative">
            <button
              onClick={() => {
                triggerTransition();
                setFilterMode('para_ti');
                router.push('/para-ti');
              }}
              className={`h-full border-b-2 flex items-center px-1 transition-all relative ${
                filterMode === 'para_ti'
                  ? 'border-foreground text-foreground font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Para ti
              {filterMode === 'para_ti' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => {
                triggerTransition();
                setFilterMode('tendencia');
              }}
              className={`h-full border-b-2 flex items-center px-1 transition-all relative ${
                filterMode === 'tendencia'
                  ? 'border-foreground text-foreground font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Tendencia
              {filterMode === 'tendencia' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => {
                triggerTransition();
                setFilterMode('reciente');
              }}
              className={`h-full border-b-2 flex items-center px-1 transition-all relative ${
                filterMode === 'reciente'
                  ? 'border-foreground text-foreground font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Reciente
              {filterMode === 'reciente' && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger className="h-full border-b-2 border-transparent text-muted-foreground hover:text-foreground flex items-center gap-1 transition-all outline-none">
                Temas <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[180px] rounded-xl bg-card border border-border shadow-xl p-1.5 mt-1">
                {TABS.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => {
                      setFilterMode(null);
                      handleTabChange(tab.id);
                    }}
                    className={`cursor-pointer px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted ${
                      activeTab === tab.id && filterMode === null ? 'bg-muted text-[#1890FF] font-bold' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tab.emoji || "📰"}</span>
                      <span>{tab.label}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push('/configuracion')}
              className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
              title="Configuración"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Enlace de la página copiado al portapapeles.");
              }}
              className="flex items-center gap-1.5 px-4 py-1.75 rounded-full border border-border text-xs.5 font-bold hover:bg-muted transition-all text-foreground shrink-0 shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              Compartir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16 pt-4">

        {/* Active source filters and Admin Sync Row */}
        {(selectedSources.length > 0 || userRole === "admin") && (
          <div className="flex items-center justify-end gap-2 mb-6">
            {selectedSources.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 mr-2">
                {selectedSources.map(source => (
                  <div key={source} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-[#1890FF]/10 border border-[#1890FF]/20 text-[#1890FF] text-[10px] font-bold">
                    <span className="max-w-[120px] truncate">{source}</span>
                    <button onClick={() => toggleSource(source)} className="hover:bg-blue-100 dark:hover:bg-[#1890FF]/25 rounded-full p-0.5 ml-1 transition-colors">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {userRole === "admin" && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
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
        )}


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
                      <Sparkles className="w-4 h-4" /> Recomendados
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
            ) : filterMode === 'portafolio' && (!isAuthenticated || portfolioSymbols.length === 0) ? (
              <div className="py-24 text-center w-full bg-white dark:bg-white/[0.02] rounded-3xl border border-gray-200/50 dark:border-white/5">
                <Briefcase className="w-16 h-16 text-[#1890FF]/20 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                  {!isAuthenticated ? "Inicia sesión para ver tu portafolio" : "Comienza a seguir tus acciones"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto text-sm mb-6">
                  {!isAuthenticated 
                    ? "Regístrate o inicia sesión para agregar acciones a tu portafolio y ver las noticias más relevantes para tus inversiones."
                    : "Agrega acciones a tu portafolio y aquí aparecerán automáticamente las noticias que afectan a tus inversiones."}
                </p>
                <Link href="/portafolio" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#1890FF] text-white font-bold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-[#1890FF]/25">
                  <Briefcase className="w-4 h-4" /> Ir a Mi Portafolio
                </Link>
              </div>
            ) : visibleArticles.length > 0 ? (
              <div className={`flex flex-col ${gapClass}`}>
                {/* ── DISCOVER LAYOUT: 2-Column (Main + Sidebar) ── */}
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* ── Main Content Column ── */}
                  <div className="flex-1 min-w-0 flex flex-col gap-6">
                    {/* Hero Article: Google Discover style (text left, image right) */}
                    {visibleArticles[0] && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-500">{visibleArticles[0].category}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <span className="text-xs text-gray-500 font-medium">Publicado {formatTimeAgo(visibleArticles[0].published_at)}</span>
                          </div>
                          <h2 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors cursor-pointer"
                            onClick={() => openArticle(visibleArticles[0].id, visibleArticles[0])}>
                            {visibleArticles[0].title}
                          </h2>
                          <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                            {visibleArticles[0].summary}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-gray-400 font-medium mt-auto">
                            <ExpandableSources sources={visibleArticles[0].sources || []} />
                          </div>
                        </div>
                        {visibleArticles[0].image_url && (
                          <div className="md:col-span-5 aspect-[4/3] md:aspect-auto overflow-hidden cursor-pointer" onClick={() => openArticle(visibleArticles[0].id, visibleArticles[0])}>
                            <img src={visibleArticles[0].image_url} alt={visibleArticles[0].title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Row of 3 Square Cards */}
                    {visibleArticles.length > 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {visibleArticles.slice(1, 4).map((article, i) => (
                          <NewsCard key={article.id} article={article} index={i + 1} />
                        ))}
                      </div>
                    )}

                    {/* Horizontal Articles */}
                    {visibleArticles.slice(4).map((article, i) => (
                      <article
                        key={article.id}
                        className="group flex gap-4 bg-card rounded-xl border border-border p-4 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer"
                        onClick={() => openArticle(article.id, article)}
                      >
                        {article.image_url && (
                          <div className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">{article.category}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                            <span className="text-[11px] text-gray-400 font-medium">{article.sources?.[0]?.name}</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-500 transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1 hidden sm:block">{article.summary}</p>
                          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-1">
                            <ExpandableSources sources={article.sources || []} />
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* ── Right Sidebar (Desktop Only) ── */}
                  <div className="hidden lg:block lg:w-[320px] xl:w-[360px] flex-shrink-0">
                    <div className="sticky top-24 space-y-4">
                      <WeatherWidget />
                      <MarketSidebar />
                      {/* Trending Panel below market */}
                      <TrendingPanel articles={feedArticles} />
                    </div>
                  </div>
                </div>

                {/* Load more */}
                {hasMore && (
                  <div className="flex justify-center py-6">
                    <button
                      onClick={() => setVisibleCount(v => v + 12)}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:border-blue-500/50 hover:text-blue-500 transition-all shadow-sm"
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
  const { openArticle } = useActiveArticleStore();
  const trending = useMemo(() => {
    return [...articles]
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, 10); // Limit to 10 to approximate height of 2 rows of images
  }, [articles]);

  const handleArticleClick = (article: any) => (e: React.MouseEvent) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      openArticle(article.id, article);
    }
  };

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
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
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
              onClick={handleArticleClick(article)}
              className="flex-shrink-0 w-[260px] group"
            >
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
          <Link 
            key={article.id} 
            href={`/article/${article.slug || article.id}`} 
            onClick={handleArticleClick(article)}
            className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
          >
            <span className="text-lg font-black text-gray-200 dark:text-gray-700 w-6 flex-shrink-0 text-right tabular-nums">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">{article.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-gray-400">{fmtDate(article.published_at)}</span>
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
