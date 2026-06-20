"use client";

import { useEffect, useState } from "react";
import { BarChart3, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

interface MarketData {
  markets: MarketItem[];
  trending: MarketItem[];
}

function Sparkline({ changePercent, isPositive }: { changePercent: number; isPositive: boolean }) {
  const pointsCount = 10;
  const data: number[] = [];
  const absChange = Math.abs(changePercent);
  
  // Seeded random number generator based on changePercent to keep graphs stable
  let seed = Math.abs(Math.sin(changePercent)) * 1000;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  let val = 50;
  data.push(val);
  for (let i = 1; i < pointsCount; i++) {
    const step = (isPositive ? 1 : -1) * (absChange * 1.5) + (random() - 0.5) * 10;
    val += step;
    data.push(val);
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const width = 120;
  const height = 28;
  const padding = 2;
  const svgHeight = height - padding * 2;

  const svgPoints = data.map((p, idx) => {
    const x = (idx / (pointsCount - 1)) * width;
    const y = height - ((p - min) / range) * svgHeight - padding;
    return `${x},${y}`;
  });

  const pathD = `M ${svgPoints.join(" L ")}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;
  
  const strokeColor = isPositive ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)";
  const gradientId = `grad-${Math.abs(changePercent).toString().replace(".", "-")}-${Math.floor(random() * 1000)}`;

  return (
    <svg className="w-full h-7 mt-1.5 overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradientId})`} />
      <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MarketSidebar() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/market-overview");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to fetch market data", e);
      }
      setLoading(false);
    };
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, currency: string) => {
    if (price >= 10000) return `${(price / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })}K`;
    if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChange = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  const getCompanyDomain = (symbol: string) => {
    const map: Record<string, string> = {
      AAPL: "apple.com",
      MSFT: "microsoft.com",
      GOOGL: "google.com",
      NVDA: "nvidia.com",
      TSLA: "tesla.com",
      AMZN: "amazon.com",
      META: "meta.com",
    };
    return map[symbol.toUpperCase()] || null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
          <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* ── Market Overview ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="px-4.5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1890FF]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">Perspectiva del mercado</h3>
          </div>
          <Link href="/mercados" className="text-[11px] text-[#1890FF] hover:underline font-bold transition-colors">
            Ver más
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border/40 dark:bg-border/20">
          {data.markets.map((item) => {
            const isPositive = item.changePercent >= 0;
            return (
              <div key={item.symbol} className="bg-card p-3.5 flex flex-col gap-1 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors overflow-hidden">
                <div className="flex items-center justify-between gap-1 min-w-0">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{item.name}</span>
                  <span className={`text-[11px] font-bold flex items-center gap-0.5 shrink-0 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? "↑" : "↓"}
                    {Math.abs(item.changePercent).toFixed(2)}%
                  </span>
                </div>
                
                <div className="flex flex-col gap-0.5 mt-0.5">
                  <span className="text-base font-black tracking-tight text-gray-900 dark:text-white tabular-nums leading-none">
                    {formatPrice(item.price, item.currency)}
                  </span>
                  <span className={`text-[10px] font-bold tracking-wide tabular-nums leading-none ${isPositive ? 'text-emerald-500/80' : 'text-red-500/80'}`}>
                    {item.change >= 0 ? "+" : ""}{item.change.toFixed(2)} {item.currency === "USD" ? "USD" : item.currency}
                  </span>
                </div>

                <Sparkline changePercent={item.changePercent} isPositive={isPositive} />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Trending Companies ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="px-4.5 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-sans">Empresas en tendencia</h3>
          </div>
          <Link href="/mercados" className="text-[11px] text-[#1890FF] hover:underline font-bold transition-colors">
            Ver más
          </Link>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-gray-800/40">
          {data.trending.slice(0, 6).map((item) => {
            const isPositive = item.changePercent >= 0;
            const domain = getCompanyDomain(item.symbol);
            const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

            return (
              <div key={item.symbol} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  {faviconUrl ? (
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-border/60 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                      <img src={faviconUrl} alt="" className="w-4.5 h-4.5 object-contain" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 border border-border/60 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400 shrink-0 shadow-sm">
                      {item.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex flex-col">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{item.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 leading-none mt-0.5">{item.symbol}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3 flex flex-col items-end">
                  <p className="text-xs font-black text-gray-900 dark:text-white tabular-nums leading-tight">
                    {formatPrice(item.price, item.currency)} <span className="text-[9px] font-medium text-gray-400">{item.currency === "USD" ? "USD" : item.currency}</span>
                  </p>
                  <p className={`text-[10px] font-bold tabular-nums leading-none mt-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {formatChange(item.changePercent)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
