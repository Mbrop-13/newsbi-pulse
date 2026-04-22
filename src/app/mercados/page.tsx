"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Flame, Eye, ArrowUpRight, TrendingUp, Newspaper, ExternalLink } from "lucide-react";
import { TickerTape } from "@/components/tradingview/ticker-tape";
import { SymbolOverview, CHILE_SYMBOLS, GLOBAL_SYMBOLS, TENDENCIA_SYMBOLS } from "@/components/tradingview/market-overview";
import { MiniChart } from "@/components/tradingview/mini-chart";
import { createClient } from "@/lib/supabase/client";

/* ── Mini-Charts Data ── */
const SPOTLIGHT_CHILE = [
  { symbol: "BCS:SP_IPSA", label: "IPSA" },
  { symbol: "FX:USDCLP", label: "USD/CLP" },
  { symbol: "CAPITALCOM:COPPER", label: "Cobre" },
  { symbol: "NYSE:SQM", label: "SQM" },
];
const SPOTLIGHT_GLOBAL = [
  { symbol: "FOREXCOM:SPXUSD", label: "S&P 500" },
  { symbol: "FOREXCOM:NSXUSD", label: "Nasdaq" },
  { symbol: "BITSTAMP:BTCUSD", label: "Bitcoin" },
  { symbol: "OANDA:XAUUSD", label: "Oro" },
];

/* ── Finance keywords for news matching ── */
const FINANCE_KEYWORDS = [
  "S&P", "Nasdaq", "IPSA", "Bitcoin", "BTC", "dólar", "cobre", "oro", "petróleo",
  "acciones", "bolsa", "mercado", "Wall Street", "inversión", "Fed", "BCE",
  "inflación", "tasas", "bonos", "rally", "crypto", "Ethereum",
  "SQM", "Falabella", "Copec", "Cencosud", "Enel", "Santander",
  "commodities", "finanzas", "economía",
];

const TABS = [
  { id: "chile" as const, label: "Chile", icon: "🇨🇱", showTrend: false },
  { id: "global" as const, label: "Global", icon: "🌍", showTrend: false },
  { id: "tendencia" as const, label: "Tendencia", icon: null, showTrend: true },
];
type TabId = "chile" | "global" | "tendencia";

export default function MercadosPage() {
  const [activeTab, setActiveTab] = useState<TabId>("chile");
  const [articles, setArticles] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("news_articles")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(200);
      if (data) setArticles(data);
    };
    fetchNews();
  }, []);

  // Filter articles that match finance keywords
  const financeNews = useMemo(() => {
    return articles.filter(a => {
      const text = `${a.title} ${a.summary}`.toLowerCase();
      return FINANCE_KEYWORDS.some(kw => text.includes(kw.toLowerCase()));
    }).slice(0, 15);
  }, [articles]);

  const featuredArticle = financeNews[0];

  const detectTicker = (article: any): string | null => {
    if (!article) return null;
    const text = `${article.title} ${article.summary}`.toLowerCase();
    const map: [string, string][] = [
      ["s&p", "FOREXCOM:SPXUSD"], ["nasdaq", "FOREXCOM:NSXUSD"], ["dow jones", "FOREXCOM:DJI"],
      ["bitcoin", "BITSTAMP:BTCUSD"], ["btc", "BITSTAMP:BTCUSD"], ["ethereum", "BITSTAMP:ETHUSD"],
      ["ipsa", "BCS:SP_IPSA"], ["sqm", "NYSE:SQM"], ["falabella", "BCS:FALABELLA"],
      ["copec", "BCS:COPEC"], ["cencosud", "BCS:CENCOSUD"], ["enel", "BCS:ENELCHILE"],
      ["dólar", "FX:USDCLP"], ["dolar", "FX:USDCLP"], ["cobre", "CAPITALCOM:COPPER"],
      ["oro", "OANDA:XAUUSD"], ["petróleo", "NYMEX:CL1!"], ["petroleo", "NYMEX:CL1!"],
    ];
    for (const [keyword, ticker] of map) {
      if (text.includes(keyword)) return ticker;
    }
    return null;
  };

  const featuredTicker = detectTicker(featuredArticle);

  const fmtDate = (d: string) => {
    try {
      const date = new Date(d);
      const diff = Date.now() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `hace ${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `hace ${hrs}h`;
      return `hace ${Math.floor(hrs / 24)}d`;
    } catch { return ""; }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-[#0F0F13] pt-16">
      {/* ── TICKER TAPE ── */}
      <TickerTape />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 pb-16">

        {/* ══════════════════════════════════════════════════ */}
        {/* TAB BAR (Home-page style pills)                   */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="flex items-center gap-4 overflow-x-auto hide-scrollbar mb-6 pt-2">
          {/* Tab pills */}
          <div className="flex items-center gap-2">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF]"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {tab.showTrend && <TrendingUp className="w-3.5 h-3.5 text-green-500" />}
                {tab.icon && <span className="text-base">{tab.icon}</span>}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 shrink-0" />

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            En Vivo
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ROW 1: Symbol Overview Chart + Top Finance News    */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* LEFT: Symbol Overview (with visible chart and symbol tabs) */}
          <div className="xl:col-span-2 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SymbolOverview
                  symbols={
                    activeTab === "chile" ? CHILE_SYMBOLS 
                    : activeTab === "global" ? GLOBAL_SYMBOLS 
                    : TENDENCIA_SYMBOLS
                  }
                  height={520}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* RIGHT: Top Finance News Panel */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden h-full flex flex-col" style={{ maxHeight: 552 }}>
              <div className="px-5 py-3.5 border-b border-gray-100 dark:border-white/5 flex items-center gap-2 flex-shrink-0">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Top Noticias Financieras</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-white/5">
                {financeNews.length === 0 ? (
                  <div className="p-8 flex flex-col gap-4">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-5 h-4 rounded bg-gray-100 dark:bg-white/5 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-full" />
                          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  financeNews.slice(0, 10).map((article, i) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug || article.id}`}
                      className="flex gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      <span className="text-base font-black text-gray-200 dark:text-gray-700 w-5 flex-shrink-0 text-right tabular-nums mt-0.5">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">
                          {article.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[10px] text-gray-400">{fmtDate(article.published_at)}</span>
                          {article.relevance_score > 0 && (
                            <span className="text-[10px] font-bold text-orange-500/70 flex items-center gap-0.5">
                              <Eye className="w-3 h-3" /> {Math.round(article.relevance_score * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                      {article.image_url && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-white/5">
                          <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ROW 2: Featured News + Related Stock Widget        */}
        {/* ══════════════════════════════════════════════════ */}
        {featuredArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Featured Article (big) */}
            <Link
              href={`/article/${featuredArticle.slug || featuredArticle.id}`}
              className="lg:col-span-3 group"
            >
              <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
                {featuredArticle.image_url && (
                  <div className="w-full h-48 sm:h-56 overflow-hidden bg-gray-100 dark:bg-white/5">
                    <img src={featuredArticle.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#1890FF] bg-[#1890FF]/10 px-2 py-1 rounded">Destacado</span>
                    <span className="text-[10px] text-gray-400">{fmtDate(featuredArticle.published_at)}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors leading-tight mb-3">
                    {featuredArticle.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {featuredArticle.summary}
                  </p>
                </div>
              </div>
            </Link>

            {/* Related Stock Chart + Second Article */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              {featuredTicker && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#1890FF]" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Activo Relacionado</span>
                  </div>
                  <Link href={`/mercados/${encodeURIComponent(featuredTicker)}`} className="relative block">
                    <MiniChart symbol={featuredTicker} height={220} />
                    {/* Full overlay for navigation */}
                    <div className="absolute inset-0 z-10 cursor-pointer rounded-2xl hover:bg-[#1890FF]/5 transition-colors" />
                  </Link>
                </div>
              )}
              {financeNews[1] && (
                <Link href={`/article/${financeNews[1].slug || financeNews[1].id}`} className="group flex-1">
                  <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl border border-gray-200 dark:border-white/5 p-5 hover:shadow-md transition-shadow h-full flex flex-col justify-center">
                    <span className="text-[10px] text-gray-400 mb-2">{fmtDate(financeNews[1].published_at)}</span>
                    <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors leading-snug line-clamp-3">
                      {financeNews[1].title}
                    </p>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ROW 3: Mini Charts (clickeable)                    */}
        {/* ══════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#1890FF]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {activeTab === "chile" ? "Mercado Chileno en Vivo" : activeTab === "global" ? "Mercados Globales en Vivo" : "Tendencias en Vivo"}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeTab === "chile" ? SPOTLIGHT_CHILE : SPOTLIGHT_GLOBAL).map(s => (
              <Link key={s.symbol} href={`/mercados/${encodeURIComponent(s.symbol)}`} className="relative group block">
                <MiniChart symbol={s.symbol} height={200} />
                {/* Full-height transparent overlay — redirects to our page instead of TradingView */}
                <div className="absolute inset-0 z-10 cursor-pointer rounded-2xl group-hover:bg-[#1890FF]/5 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ROW 4: More News Grid                              */}
        {/* ══════════════════════════════════════════════════ */}
        {financeNews.length > 2 && (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Newspaper className="w-4 h-4 text-[#1890FF]" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Más Noticias del Mercado</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {financeNews.slice(2, 8).map((article) => {
                const relatedTicker = detectTicker(article);
                return (
                  <div key={article.id} className="bg-white dark:bg-[#1A1A1E] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <Link href={`/article/${article.slug || article.id}`} className="group">
                      {article.image_url && (
                        <div className="w-full h-36 overflow-hidden bg-gray-100 dark:bg-white/5">
                          <img src={article.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] text-gray-400">{fmtDate(article.published_at)}</span>
                          {relatedTicker && (
                            <span className="text-[10px] font-bold text-[#1890FF] bg-[#1890FF]/10 px-1.5 py-0.5 rounded">
                              {relatedTicker.split(":").pop()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors leading-snug line-clamp-2">
                          {article.title}
                        </p>
                      </div>
                    </Link>
                    {relatedTicker && (
                      <div className="px-4 pb-4">
                        <Link href={`/mercados/${encodeURIComponent(relatedTicker)}`} className="flex items-center gap-1.5 text-[11px] font-bold text-[#1890FF] hover:underline">
                          <ArrowUpRight className="w-3 h-3" />
                          Ver {relatedTicker.split(":").pop()}
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
