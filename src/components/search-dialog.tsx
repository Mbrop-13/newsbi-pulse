"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Clock,
  ArrowRight,
  X,
  Flame,
  Newspaper,
  LineChart,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [newsResults, setNewsResults] = useState<any[]>([]);
  const [assetResults, setAssetResults] = useState<any[]>([]);
  const [predictionResults, setPredictionResults] = useState<any[]>([]);
  const [isSearchingNews, setIsSearchingNews] = useState(false);
  const [isSearchingAssets, setIsSearchingAssets] = useState(false);
  const [isSearchingPredictions, setIsSearchingPredictions] = useState(false);
  const [includeNews, setIncludeNews] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('reclu-search-news') !== 'false';
    return true;
  });
  const [includeAssets, setIncludeAssets] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('reclu-search-assets') !== 'false';
    return true;
  });
  const [includePredictions, setIncludePredictions] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('reclu-search-predictions') === 'true';
    return false;
  });
  const isSearching = isSearchingNews || isSearchingAssets || isSearchingPredictions;
  const router = useRouter();
  const supabase = createClient();

  // Load recents from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("reclu-recent-searches");
        if (stored) setRecentSearches(JSON.parse(stored));
      } catch {}
      setQuery("");
    }
  }, [isOpen]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Instant News Search Effect
  useEffect(() => {
    async function searchNews() {
      if (!includeNews || !query.trim() || query.length < 2) {
        setNewsResults([]);
        setIsSearchingNews(false);
        return;
      }
      setIsSearchingNews(true);
      
      try {
        const q = query.toLowerCase();
        const { data } = await supabase
          .from("news_articles")
          .select("id, slug, title, summary, image_url, category, sources")
          .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
          .order("published_at", { ascending: false })
          .limit(4);
          
        setNewsResults(data || []);
      } catch (err) {
        console.error("News search error:", err);
      } finally {
        setIsSearchingNews(false);
      }
    }
    
    searchNews();
  }, [query, supabase, includeNews]);

  // Debounced Asset Search Effect
  useEffect(() => {
    async function searchAssets() {
      if (!includeAssets || !debouncedQuery.trim() || debouncedQuery.length < 2) {
        setAssetResults([]);
        setIsSearchingAssets(false);
        return;
      }
      setIsSearchingAssets(true);
      
      try {
        const q = debouncedQuery.toLowerCase();
        const assetsData = await fetch(`/api/finance/search?q=${encodeURIComponent(q)}`)
          .then(res => res.json())
          .catch(() => []);

        if (Array.isArray(assetsData)) {
          setAssetResults(assetsData.slice(0, 3));
        } else {
          setAssetResults([]);
        }
      } catch (err) {
        console.error("Asset search error:", err);
      } finally {
        setIsSearchingAssets(false);
      }
    }
    
    searchAssets();
  }, [debouncedQuery, includeAssets]);

  // Debounced Predictions Search Effect
  useEffect(() => {
    async function searchPredictions() {
      if (!includePredictions || !debouncedQuery.trim() || debouncedQuery.length < 2) {
        setPredictionResults([]);
        setIsSearchingPredictions(false);
        return;
      }
      setIsSearchingPredictions(true);

      try {
        const res = await fetch(`/api/predictions?status=active`);
        const data = await res.json();
        if (data.predictions) {
          const q = debouncedQuery.toLowerCase();
          const matched = data.predictions.filter((p: any) =>
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.tags?.some((t: string) => t.toLowerCase().includes(q))
          ).slice(0, 3);
          setPredictionResults(matched);
        } else {
          setPredictionResults([]);
        }
      } catch {
        setPredictionResults([]);
      } finally {
        setIsSearchingPredictions(false);
      }
    }

    searchPredictions();
  }, [debouncedQuery, includePredictions]);

  const toggleNews = () => {
    setIncludeNews(prev => {
      const next = !prev;
      localStorage.setItem('reclu-search-news', String(next));
      if (!next) { setNewsResults([]); setIsSearchingNews(false); }
      return next;
    });
  };

  const toggleAssets = () => {
    setIncludeAssets(prev => {
      const next = !prev;
      localStorage.setItem('reclu-search-assets', String(next));
      if (!next) { setAssetResults([]); setIsSearchingAssets(false); }
      return next;
    });
  };

  const togglePredictions = () => {
    setIncludePredictions(prev => {
      const next = !prev;
      localStorage.setItem('reclu-search-predictions', String(next));
      if (!next) { setPredictionResults([]); setIsSearchingPredictions(false); }
      return next;
    });
  };

  const saveSearch = useCallback((term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("reclu-recent-searches", JSON.stringify(updated));
  }, [recentSearches]);

  const handleSelectNews = (articleIdOrSlug: string) => {
    if (query.trim()) saveSearch(query.trim());
    onClose();
    router.push(`/article/${articleIdOrSlug}`);
  };

  const handleSelectAsset = (symbol: string) => {
    if (query.trim()) saveSearch(query.trim());
    onClose();
    router.push(`/mercados/${symbol}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (assetResults.length > 0) {
      handleSelectAsset(assetResults[0].symbol);
    } else if (newsResults.length > 0) {
      handleSelectNews(newsResults[0].slug || newsResults[0].id);
    }
  };

  const trendingTopics = ["GPT-5", "Bitcoin", "Chile IA", "SpaceX", "Apple Vision Pro"];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-[580px] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 h-14 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar noticias, activos, temas o fuentes..."
                className="flex-1 bg-transparent text-[15px] placeholder:text-muted-foreground/50 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-secondary/60 border border-border/50 rounded-md text-[10px] text-muted-foreground font-mono">
                ESC
              </kbd>
            </form>

            {/* Search mode toggle */}
            <div className="flex items-center gap-1.5 px-5 py-2 border-b border-border bg-secondary/10">
              <span className="text-[10px] text-muted-foreground font-medium mr-1">Buscar en:</span>
              <button
                onClick={toggleNews}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  includeNews
                    ? 'bg-[#1890FF]/10 text-[#1890FF] ring-1 ring-[#1890FF]/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <Newspaper className="w-3 h-3" />
                Noticias
                <span className={`ml-0.5 w-1.5 h-1.5 rounded-full transition-colors ${includeNews ? 'bg-[#1890FF]' : 'bg-gray-300 dark:bg-gray-600'}`} />
              </button>
              <button
                onClick={toggleAssets}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  includeAssets
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <LineChart className="w-3 h-3" />
                Activos
                <span className={`ml-0.5 w-1.5 h-1.5 rounded-full transition-colors ${includeAssets ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              </button>
              <button
                onClick={togglePredictions}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  includePredictions
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Predicciones
                <span className={`ml-0.5 w-1.5 h-1.5 rounded-full transition-colors ${includePredictions ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
              </button>
            </div>

            {/* Results / Empty state */}
            <div className="max-h-[400px] overflow-y-auto">
              {query.length >= 2 ? (
                (newsResults.length > 0 || assetResults.length > 0 || predictionResults.length > 0 || isSearchingNews || isSearchingAssets || isSearchingPredictions) ? (
                  <div className="py-2">
                    {/* News Section — appears instantly */}
                    {includeNews && (isSearchingNews && newsResults.length === 0 ? (
                      <div className="px-5 py-4 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Buscando noticias...</span>
                      </div>
                    ) : newsResults.length > 0 ? (
                      <div className="mb-2">
                        <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Newspaper className="w-3.5 h-3.5" /> Noticias
                        </p>
                        {newsResults.map((article) => (
                          <button
                            key={article.id}
                            onClick={() => handleSelectNews(article.slug || article.id)}
                            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-secondary/50 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-secondary/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {article.image_url ? (
                                <img src={article.image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <Newspaper className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{article.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {article.sources?.[0]?.name || "Noticias"} · {article.category}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-muted-foreground transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : null)}

                    {/* Divider */}
                    {newsResults.length > 0 && (assetResults.length > 0 || isSearchingAssets) && (
                      <div className="mx-5 border-t border-border/50" />
                    )}

                    {/* Assets Section — loads with debounce */}
                    {includeAssets && (isSearchingAssets ? (
                      <div className="px-5 py-4 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Buscando activos financieros...</span>
                      </div>
                    ) : assetResults.length > 0 ? (
                      <div className="mb-2">
                        <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1890FF] flex items-center gap-1.5">
                          <LineChart className="w-3.5 h-3.5" /> Activos
                        </p>
                        {assetResults.map((asset) => (
                          <button
                            key={asset.symbol}
                            onClick={() => handleSelectAsset(asset.symbol)}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#1890FF]/5 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#1890FF]/10 text-[#1890FF] flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold">{asset.symbol.substring(0, 3)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{asset.symbol} <span className="text-xs font-medium text-muted-foreground ml-1">{asset.exchange}</span></p>
                              <p className="text-[11px] text-muted-foreground truncate">{asset.name}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-[#1890FF] transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : null)}

                    {/* Divider */}
                    {(newsResults.length > 0 || assetResults.length > 0) && (predictionResults.length > 0 || isSearchingPredictions) && (
                      <div className="mx-5 border-t border-border/50" />
                    )}

                    {/* Predictions Section — loads with debounce */}
                    {includePredictions && (isSearchingPredictions ? (
                      <div className="px-5 py-4 flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-xs">Buscando predicciones...</span>
                      </div>
                    ) : predictionResults.length > 0 ? (
                      <div className="mb-2">
                        <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5" /> Predicciones
                        </p>
                        {predictionResults.map((pred: any) => (
                          <button
                            key={pred.id}
                            onClick={() => { onClose(); router.push('/predicciones'); }}
                            className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-amber-500/5 transition-colors text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                              <TrendingUp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{pred.title}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {pred.tags?.slice(0, 3).join(' · ') || 'Predicción'}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/0 group-hover:text-amber-500 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : null)}
                  </div>
                ) : !isSearchingNews && !isSearchingAssets && !isSearchingPredictions ? (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No se encontraron resultados para &quot;{query}&quot;</p>
                  </div>
                ) : null
              ) : (
                <div className="py-3">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between px-5 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Recientes
                        </p>
                        <button
                          onClick={() => {
                            setRecentSearches([]);
                            localStorage.removeItem("reclu-recent-searches");
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => setQuery(term)}
                          className="w-full flex items-center gap-3 px-5 py-2 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
                          <span className="text-sm">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trending */}
                  <div>
                    <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <Flame className="w-3 h-3" />
                      Tendencias
                    </p>
                    <div className="px-5 pb-3 flex flex-wrap gap-2">
                      {trendingTopics.map((topic) => (
                        <button
                          key={topic}
                          onClick={() => setQuery(topic)}
                          className="px-3 py-1.5 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-full text-[12px] font-medium transition-colors"
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-border bg-secondary/20 text-[10px] text-muted-foreground">
              <span>
                <kbd className="px-1.5 py-0.5 bg-secondary/60 border border-border/50 rounded text-[9px] font-mono mr-1">↵</kbd>
                Seleccionar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-secondary/60 border border-border/50 rounded text-[9px] font-mono mr-1">⌘K</kbd>
                Buscar
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
