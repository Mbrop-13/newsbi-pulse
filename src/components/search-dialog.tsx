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
} from "lucide-react";
import { MOCK_ARTICLES } from "@/lib/mock-data";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const router = useRouter();

  // Load recents from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = localStorage.getItem("newsbi-recent-searches");
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

  // Search results (debounced client-side search on mock data)
  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return MOCK_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.summary || (a as any).description || '').toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [query]);

  const saveSearch = useCallback((term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("newsbi-recent-searches", JSON.stringify(updated));
  }, [recentSearches]);

  const handleSelect = (articleId: string) => {
    if (query.trim()) saveSearch(query.trim());
    onClose();
    router.push(`/article/${articleId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (results.length > 0) {
      handleSelect(results[0].id);
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
                placeholder="Buscar noticias, temas, categorías..."
                className="flex-1 bg-transparent text-[15px] placeholder:text-muted-foreground/50 outline-none"
              />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-secondary/60 border border-border/50 rounded-md text-[10px] text-muted-foreground font-mono">
                ESC
              </kbd>
            </form>

            {/* Results / Empty state */}
            <div className="max-h-[400px] overflow-y-auto">
              {query.length >= 2 && results.length > 0 ? (
                <div className="py-2">
                  <p className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Resultados
                  </p>
                  {results.map((article, i) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelect(article.id)}
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
              ) : query.length >= 2 && results.length === 0 ? (
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No se encontraron resultados para &quot;{query}&quot;</p>
                </div>
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
                            localStorage.removeItem("newsbi-recent-searches");
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
