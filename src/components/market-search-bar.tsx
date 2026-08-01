"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol.split(".")[0]}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

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

interface MarketSearchBarProps {
  /** full = mercados (móvil / standalone); compact = top bar PC */
  variant?: "full" | "compact";
  className?: string;
}

export function MarketSearchBar({ variant = "full", className }: MarketSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [hasError, setHasError] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = variant === "compact";

  const handleSearch = useCallback((term: string) => {
    setQuery(term);
    setHasError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.trim().length < 1) {
      setResults([]);
      setIsSearching(false);
      return;
    }
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const showDropdown = isFocused && query.trim().length > 0;
  const showPopular = isFocused && query.trim().length === 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative z-50",
        isCompact ? "w-full" : "w-full max-w-[720px] mx-auto px-4 sm:px-0",
        className
      )}
    >
      {/* Pastilla ovalada liquid glass — sobrepuesta */}
      <div
        className={cn(
          "group relative flex items-center rounded-full transition-all duration-300 ease-out",
          "market-search-pill",
          isCompact ? "h-10 px-3.5 gap-2" : "h-12 sm:h-14 px-4 sm:px-5 gap-2.5",
          isFocused
            ? "ring-2 ring-[#1890FF]/35 shadow-[0_8px_32px_rgba(24,144,255,0.18),0_2px_12px_rgba(0,0,0,0.08)] scale-[1.01]"
            : "shadow-[0_4px_24px_rgba(15,23,42,0.08),0_1px_0_rgba(255,255,255,0.6)_inset] hover:shadow-[0_8px_28px_rgba(15,23,42,0.12)]"
        )}
      >
        {/* Brillo superior sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/20"
        />

        <div
          className={cn(
            "flex items-center justify-center rounded-full shrink-0 transition-colors",
            isCompact ? "w-7 h-7" : "w-8 h-8",
            isFocused
              ? "bg-[#1890FF]/15 text-[#1890FF]"
              : "bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 dark:text-gray-400"
          )}
        >
          {isSearching ? (
            <Loader2 className={cn("animate-spin", isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          ) : (
            <Search className={cn(isCompact ? "w-3.5 h-3.5" : "w-4 h-4")} strokeWidth={2.25} />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={
            isCompact
              ? "Buscar acciones, ETFs, cripto…"
              : "Buscar acciones, ETFs, criptos… (AAPL, Bitcoin, NVIDIA)"
          }
          className={cn(
            "flex-1 min-w-0 bg-transparent font-medium outline-none",
            "text-gray-900 dark:text-white",
            "placeholder:text-gray-400/90 dark:placeholder:text-gray-500 placeholder:font-normal",
            isCompact ? "text-[13px]" : "text-sm sm:text-[15px]"
          )}
        />

        <AnimatePresence>
          {query && !isSearching && (
            <motion.button
              type="button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="shrink-0 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/10 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Dropdown liquid glass */}
      <AnimatePresence>
        {(showDropdown || showPopular) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "absolute top-full left-0 right-0 mt-2.5 z-50",
              "market-search-dropdown rounded-[22px] overflow-hidden",
              "max-h-[min(420px,70vh)] overflow-y-auto hidden-scrollbar",
              isCompact && "min-w-[min(100%,360px)]"
            )}
          >
            {showPopular && (
              <>
                <div className="px-4 py-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
                    Más buscados
                  </span>
                </div>
                {POPULAR_SYMBOLS.map((s) => (
                  <SearchResultItem
                    key={s.symbol}
                    symbol={s.symbol}
                    name={s.name}
                    exchange={s.exchange}
                    onClick={() => setIsFocused(false)}
                  />
                ))}
              </>
            )}

            {showDropdown && (
              <>
                {hasError ? (
                  <div className="px-4 py-10 text-center">
                    <p className="text-sm text-gray-500">Error al buscar. Intenta de nuevo.</p>
                  </div>
                ) : isSearching ? (
                  <div className="px-4 py-8 flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1890FF]" /> Buscando…
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                    </div>
                    <p className="text-sm text-gray-500">
                      Sin resultados para &quot;{query}&quot;
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.12em]">
                        {results.length} resultados
                      </span>
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
  );
}

function SearchResultItem({
  symbol,
  name,
  exchange,
  onClick,
}: {
  symbol: string;
  name: string;
  exchange?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={`/mercados/${encodeURIComponent(symbol)}`}
      onClick={onClick}
      className="flex items-center gap-3 px-3.5 py-2.5 mx-1.5 my-0.5 rounded-2xl hover:bg-[#1890FF]/08 dark:hover:bg-[#1890FF]/12 transition-colors group"
    >
      <div className="w-9 h-9 rounded-full bg-white dark:bg-white/10 flex items-center justify-center overflow-hidden shrink-0 border border-black/[0.06] dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform duration-200">
        <img
          src={getLogoUrl(symbol)}
          alt=""
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            e.currentTarget.src = getFallbackLogo(symbol);
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">
            {symbol}
          </span>
          {exchange && (
            <span className="text-[9px] font-bold text-gray-400 bg-black/[0.04] dark:bg-white/[0.08] px-1.5 py-0.5 rounded-full">
              {exchange}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{name}</p>
      </div>
      <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#1890FF] shrink-0 transition-colors" />
    </Link>
  );
}
