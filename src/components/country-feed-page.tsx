"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageSquare, RefreshCw, ArrowRight, TrendingUp, X, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewsCard } from "@/components/news-card";
import { NewsCardSkeleton } from "@/components/news-card-skeleton";
import { TagSkeleton } from "@/components/tag-skeleton";
import { createClient } from "@/lib/supabase/client";
import { TABS, FeedTab } from "@/components/feed-content";
import { getCountry } from "@/lib/country-config";
import { useFilterStore } from "@/lib/stores/filter-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  countrySlug: string;
  initialFeed?: string;
  initialFilter?: 'tendencia' | 'breaking' | 'nuevo';
  searchTag?: string;
}

export function CountryFeedPage({ countrySlug, initialFeed, initialFilter, searchTag }: Props) {
  const country = getCountry(countrySlug);
  const router = useRouter();
  const defaultTab: FeedTab = (initialFeed as FeedTab) || "chile";
  const [activeTab, setActiveTab] = useState<FeedTab>(defaultTab);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [visibleCount, setVisibleCount] = useState(12);
  const [filterMode, setFilterMode] = useState<'tendencia' | 'breaking' | 'nuevo' | null>(initialFilter || null);
  const { selectedSources, setAvailableSources, toggleSource } = useFilterStore();
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchTag ? [decodeURIComponent(searchTag)] : []
  );
  const [isTransitioning, setIsTransitioning] = useState(true);
  const supabase = createClient();

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

  // Filter by country_code + feed_tag / searchTag
  const feedArticles = useMemo(() => {
    // First filter by country
    let countryArticles = dbArticles.filter(a => a.country_code === country?.code);
    
    // If no country-tagged articles, fall back to all (for legacy/transition)
    if (countryArticles.length === 0) {
      countryArticles = dbArticles;
    }

    // When on the main "Principal" tab, show ALL articles for this country (all sections)
    if (activeTab === 'chile') {
      return countryArticles;
    }

    // Then filter by feed_tag for specific sections
    const byTag = countryArticles.filter(a => a.feed_tag === activeTab);
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
    return countryArticles.filter(a => categoryMap[activeTab]?.includes(a.category?.toLowerCase()));
  }, [dbArticles, activeTab, country?.code, searchTag]);

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
    setVisibleCount(12);
    // For Chile (default country), use root-level URLs
    if (countrySlug === 'chile') {
      if (tab === 'chile') {
        router.push('/');
      } else {
        const feedSlug = tab.replace('_', '-');
        router.push(`/${feedSlug}`);
      }
    } else {
      if (tab === 'chile') {
        router.push(`/${countrySlug}`);
      } else {
        const feedSlug = tab.replace('_', '-');
        router.push(`/${countrySlug}/${feedSlug}`);
      }
    }
  };

  const activeTabData = TABS.find(t => t.id === activeTab) || TABS[0];

  // Build the "go to section" URL
  const sectionUrl = searchTag
    ? `/${countrySlug}/tema/${searchTag}`
    : activeTab === 'chile'
      ? `/${countrySlug}`
      : `/${countrySlug}/${activeTab.replace('_', '-')}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 font-sans">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-[72px] pb-16">

        {/* ── Section Navigation ── */}
        <div className="-mx-4 px-4 pt-2 pb-4 bg-gray-50 dark:bg-[#0F172A] border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide flex-nowrap">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#1890FF] text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab.emoji && <span className="text-lg">{tab.emoji}</span>}
                  <span className="sm:inline">{tab.label}</span>
                </button>
              ))}
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
            </div>
          </div>

          {/* ── Secondary Navigation (Trending/Timing) ── */}
          <div className="mt-4 flex items-center justify-between overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-4 flex-nowrap min-w-max">
              {/* Timing filters */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { triggerTransition(); setFilterMode('tendencia'); router.push('/tendencia'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filterMode === 'tendencia' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {filterMode === 'tendencia' && <TrendingUp className="w-3.5 h-3.5" />}
                  Tendencia
                </button>
                <button 
                  onClick={() => { triggerTransition(); setFilterMode('breaking'); router.push('/breaking'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filterMode === 'breaking' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  Breaking
                </button>
                <button 
                  onClick={() => { triggerTransition(); setFilterMode('nuevo'); router.push('/nuevo'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filterMode === 'nuevo' ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  Nuevo
                </button>
              </div>
              
              {/* Divider */}
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 shrink-0" />
              
              {/* Trending Topics */}
              <div className="flex items-center justify-between flex-1 gap-4">
                <div className="flex items-center gap-2">
                  {topTags.length === 0 || isTransitioning ? (
                    <div className="flex items-center gap-2">
                      <TagSkeleton />
                      <TagSkeleton />
                      <TagSkeleton />
                    </div>
                  ) : (
                    topTags.map((tag) => {
                      const isSelected = selectedTags.some(t => t.toLowerCase() === tag.toLowerCase());
                      return (
                        <button 
                          key={tag} 
                          onClick={() => toggleTag(tag)}
                          className={`group relative px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap overflow-hidden flex items-center justify-center 
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
                </div>
                
                {remainingTags.length > 0 && (
                  <div className="ml-auto flex-shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="px-4 py-1.5 rounded-full text-xs font-bold text-[#1890FF] bg-blue-50 hover:bg-blue-100 dark:bg-[#1890FF]/10 dark:hover:bg-[#1890FF]/20 transition-all outline-none focus:ring-2 focus:ring-[#1890FF] shadow-sm">
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
                                setTagSearch(""); // Clear search to reset dropdown state for next opening
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
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Section Header ── */}
        <div className="mb-6 flex items-center flex-wrap gap-4 mt-6">
          <Link href={sectionUrl} className="group hover:opacity-80 transition-opacity">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <span className="text-[#1890FF] flex flex-wrap gap-2">
                {searchTag 
                  ? `#${decodeURIComponent(searchTag)}` 
                  : selectedTags.length > 0 
                  ? selectedTags.map(t => `#${t}`).join(', ')
                  : activeTabData.label}
              </span>
            </h1>
          </Link>
          
          <Link href={sectionUrl} className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:border-[#1890FF] text-sm font-semibold hover:text-[#1890FF] transition-colors shrink-0">
            Ir a sección completa <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Feed Content ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${countrySlug}-${activeTab}`}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  <NewsCardSkeleton index={3} className="h-[280px]" />
                  <NewsCardSkeleton index={4} className="h-[280px]" />
                  <NewsCardSkeleton index={5} className="h-[280px]" />
                </div>
              </div>
            ) : visibleArticles.length > 0 ? (
              <div className="flex flex-col gap-12">
                {/* Hero: First article large */}
                {visibleArticles[0] && (
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

                {/* Grid: Rest of articles */}
                {visibleArticles.length > 3 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {visibleArticles.slice(3).map((article, i) => (
                      <NewsCard key={article.id} article={article} index={i + 3} />
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
                  Presiona &quot;Actualizar&quot; para que la IA busque las últimas noticias de {country?.name}.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
