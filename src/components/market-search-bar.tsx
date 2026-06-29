"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, TrendingUp, TrendingDown, X, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol.split(".")[0]}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

// Sugerencias populares cuando el input está vacío (cinta reimaginada como accesos directos elegantes)
const POPULAR_SYMBOLS = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms", exchange: "NASDAQ" },
  { symbol: "BTC-USD", name: "Bitcoin", exchange: "CCC" },
];

export function MarketSearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useCallback((term: string) => {
    setQuery(term);
    setHasError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 1) { setResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setResults(data.quotes || []);
      } catch {
        setResults([]);
        setHasError(true);
      }
      setIsSearching(false);
    }, 350);
  }, []);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = isFocused && (query.trim().length > 0 || results.length === 0);
  const showPopular = isFocused && query.trim().length === 0;

  return (
    <div ref={containerRef} className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-2 pb-3 relative z-30">
      <div className="relative">
        {/* Search input */}
        <div className={`flex items-center bg-white dark:bg-[#141821] rounded-2xl border shadow-sm transition-all duration-200 px-4 h-12 ${isFocused ? "border-[#1890FF] ring-2 ring-[#1890FF]/15" : "border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"}`}>
          <Search className={`w-[18px] h-[18px] mr-3 transition-colors ${isFocused ? "text-[#1890FF]" : "text-gray-400"}`} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="Buscar acciones, ETFs, criptos... (ej. AAPL, Bitcoin, NVIDIA)"
            className="flex-1 bg-transparent text-sm font-medium outline-none text-gray-900 dark:text-white placeholder:text-gray-400 placeholder:font-normal"
          />
          {isSearching && <Loader2 className="w-4 h-4 animate-spin text-[#1890FF] ml-2" />}
          {query && !isSearching && (
            <button onClick={() => { setQuery(""); setResults([]); }} className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {(showDropdown || showPopular) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[420px] overflow-y-auto hidden-scrollbar"
            >
              {/* Popular (cuando vacío) */}
              {showPopular && (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Más buscados</span>
                  </div>
                  {POPULAR_SYMBOLS.map((s) => (
                    <SearchResultItem key={s.symbol} symbol={s.symbol} name={s.name} exchange={s.exchange} onClick={() => setIsFocused(false)} />
                  ))}
                </>
              )}

              {/* Resultados de búsqueda */}
              {showDropdown && (
                <>
                  {hasError ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-gray-500">Error al buscar. Intenta de nuevo.</p>
                    </div>
                  ) : isSearching ? (
                    <div className="px-4 py-6 flex items-center justify-center gap-2 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Search className="w-7 h-7 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No se encontraron resultados para &quot;{query}&quot;</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{results.length} resultados</span>
                      </div>
                      {results.map((res: any) => (
                        <SearchResultItem
                          key={res.symbol}
                          symbol={res.symbol}
                          name={res.shortname || res.longname || res.symbol}
                          exchange={res.exchDisp || res.exchange}
                          onClick={() => setIsFocused(false)}
                        />
                      ))}
                    </>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SearchResultItem({ symbol, name, exchange, onClick }: { symbol: string; name: string; exchange?: string; onClick?: () => void }) {
  return (
    <Link
      href={`/mercados/${encodeURIComponent(symbol)}`}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1890FF]/5 transition-colors group border-b border-gray-50 dark:border-white/[0.03] last:border-0"
    >
      <div className="w-9 h-9 rounded-lg group-hover:rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700 transition-all duration-300">
        <img src={getLogoUrl(symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(symbol); }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{symbol}</span>
          {exchange && <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{exchange}</span>}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{name}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#1890FF] shrink-0 transition-colors" />
    </Link>
  );
}
