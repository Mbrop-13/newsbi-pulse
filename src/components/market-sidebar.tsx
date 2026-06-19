"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Flame, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, currency: string) => {
    if (price >= 10000) return `${(price / 1000).toFixed(1)}K`;
    if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatChange = (val: number) => {
    const sign = val >= 0 ? "+" : "";
    return `${sign}${val.toFixed(2)} %`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Market skeleton */}
        <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
        {/* Trending skeleton */}
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
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Perspectiva del mercado</h3>
          </div>
          <Link href="/ai" className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            Ver más →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-px bg-border">
          {data.markets.map((item) => {
            const isPositive = item.changePercent >= 0;
            return (
              <div key={item.symbol} className="bg-card p-3.5 flex flex-col gap-1.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate">{item.name}</span>
                  <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {formatChange(item.changePercent)}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                  {formatPrice(item.price, item.currency)}
                </span>
                <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                  {item.currency === "USD" ? "US$" : item.currency}{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}
                </span>
                {/* Mini sparkline bar */}
                <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-0.5">
                  <div 
                    className={`h-full rounded-full transition-all ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(Math.abs(item.changePercent) * 20, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Trending Companies ── */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">Empresas en tendencia</h3>
          </div>
          <Link href="/ai" className="text-xs text-blue-500 hover:text-blue-600 font-semibold transition-colors">
            Ver más →
          </Link>
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-800/50">
          {data.trending.slice(0, 6).map((item) => {
            const isPositive = item.changePercent >= 0;
            return (
              <div key={item.symbol} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                    isPositive ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{item.name}</p>
                    <p className="text-[10px] font-medium text-gray-400">{item.symbol}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                    {formatPrice(item.price, item.currency)} {item.currency === "USD" ? "US$" : item.currency}
                  </p>
                  <p className={`text-xs font-bold tabular-nums ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
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
