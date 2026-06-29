"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Flame, Eye, ArrowUpRight, TrendingUp, Newspaper, ExternalLink, MoreVertical, Plus, Bell, Loader2, X } from "lucide-react";
import { MarketSearchBar } from "@/components/market-search-bar";
import { SymbolOverview, CHILE_SYMBOLS, GLOBAL_SYMBOLS, TENDENCIA_SYMBOLS } from "@/components/tradingview/market-overview";
import { MiniChart } from "@/components/tradingview/mini-chart";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { SidebarLayout } from "@/components/sidebar/sidebar-layout";
import { AuthGuard } from "@/components/auth-guard";

// Mapping TradingView symbols to Yahoo Finance symbols for portfolio & alerts compatibility
function toYahooSymbol(tvSymbol: string): string {
  const map: Record<string, string> = {
    "BCS:SP_IPSA": "^IPSA",
    "FX:USDCLP": "USDCLP=X",
    "CAPITALCOM:COPPER": "HG=F",
    "NYSE:SQM": "SQM",
    "FOREXCOM:SPXUSD": "^GSPC",
    "FOREXCOM:NSXUSD": "^IXIC",
    "BITSTAMP:BTCUSD": "BTC-USD",
    "OANDA:XAUUSD": "GC=F",
  };
  return map[tvSymbol] || tvSymbol.split(":").pop() || tvSymbol;
}

/* ΓöÇΓöÇ Mini-Charts Data ΓöÇΓöÇ */
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

/* ΓöÇΓöÇ Finance keywords for news matching ΓöÇΓöÇ */
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

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [alertModal, setAlertModal] = useState<{ open: boolean; symbol: string; currentPrice?: number }>({ open: false, symbol: "" });
  const [alertPrice, setAlertPrice] = useState<string>("");
  const [alertCondition, setAlertCondition] = useState<"above" | "below">("above");
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
      }
    });
  }, []);

  const handleAddToPortfolio = async (symbol: string, companyName: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para agregar activos a tu portafolio.");
      return;
    }
    try {
      const { data: existing } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .eq("symbol", symbol)
        .maybeSingle();

      if (existing) {
        toast.error(`${symbol} ya está en tu portafolio.`);
        return;
      }

      const { error } = await supabase.from("portfolios").insert({
        user_id: user.id,
        symbol,
        company_name: companyName
      });
      if (error) throw error;
      toast.success(`${symbol} agregado a tu portafolio con éxito.`);
    } catch (e: any) {
      toast.error("Error al agregar a portafolio: " + (e.message || String(e)));
    }
  };

  const handleOpenAlertModal = async (symbol: string) => {
    setAlertModal({ open: true, symbol });
    setAlertPrice("");
    setAlertCondition("above");
    try {
      const res = await fetch(`/api/finance/portfolio?symbols=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const price = data[0].price || 0;
          setAlertModal({ open: true, symbol, currentPrice: price });
          setAlertPrice(price.toFixed(2));
        }
      }
    } catch (e) {
      console.error("Error fetching price for alert:", e);
    }
  };

  const handleCreateAlert = async () => {
    if (!user || !alertModal.symbol) return;
    const targetPrice = parseFloat(alertPrice);
    if (isNaN(targetPrice) || targetPrice <= 0) {
      toast.error("Por favor ingresa un precio objetivo válido.");
      return;
    }
    setIsCreatingAlert(true);
    try {
      const { error } = await supabase.from("price_alerts").insert({
        user_id: user.id,
        symbol: alertModal.symbol,
        target_price: targetPrice,
        condition: alertCondition,
        is_active: true
      });
      if (error) throw error;
      toast.success(`Alerta creada para ${alertModal.symbol} a $${targetPrice}`);
      setAlertModal({ open: false, symbol: "" });
    } catch (e: any) {
      toast.error("Error al crear la alerta: " + (e.message || String(e)));
    } finally {
      setIsCreatingAlert(false);
    }
  };

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
      ["d├│lar", "FX:USDCLP"], ["dolar", "FX:USDCLP"], ["cobre", "CAPITALCOM:COPPER"],
      ["oro", "OANDA:XAUUSD"], ["petr├│leo", "NYMEX:CL1!"], ["petroleo", "NYMEX:CL1!"],
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
    <SidebarLayout>
    <AuthGuard>
    <div className="min-h-screen bg-background pt-4">
      {/* ── SEARCH BAR (reemplaza la cinta giratoria) ── */}
      <MarketSearchBar />

      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 pt-4 pb-16">

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {/* TAB BAR (Home-page style pills)                   */}
        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
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

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {/* ROW 1: Symbol Overview Chart + Top Finance News    */}
        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-full flex flex-col" style={{ maxHeight: 552 }}>
              <div className="px-5 py-3.5 border-b border-border flex items-center gap-2 flex-shrink-0">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Top Noticias Financieras</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border">
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

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {/* ROW 2: Featured News + Related Stock Widget        */}
        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {featuredArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Featured Article (big) */}
            <Link
              href={`/article/${featuredArticle.slug || featuredArticle.id}`}
              className="lg:col-span-3 group"
            >
              <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-xl transition-shadow h-full flex flex-col">
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

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {/* ROW 3: Mini Charts (clickeable)                    */}
        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#1890FF]" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {activeTab === "chile" ? "Mercado Chileno en Vivo" : activeTab === "global" ? "Mercados Globales en Vivo" : "Tendencias en Vivo"}
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(activeTab === "chile" ? SPOTLIGHT_CHILE : SPOTLIGHT_GLOBAL).map(s => {
              const yahooSymbol = toYahooSymbol(s.symbol);
              return (
                <div key={s.symbol} className="relative group rounded-2xl overflow-hidden bg-card border border-border shadow-sm hover:border-[#1890FF]/30 transition-all duration-300">
                  {/* Clickable Area for Mini Chart */}
                  <Link href={`/mercados/${encodeURIComponent(s.symbol)}`} className="block">
                    <MiniChart symbol={s.symbol} height={200} />
                    {/* Visual Overlay */}
                    <div className="absolute inset-0 z-0 cursor-pointer rounded-2xl group-hover:bg-[#1890FF]/5 transition-colors" />
                  </Link>

                  {/* Floating Action Button (Three dots / Gear) */}
                  <div className="absolute top-3 right-3 z-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === s.symbol ? null : s.symbol);
                      }}
                      className="p-1.5 rounded-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 shadow-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    
                    {/* Context Dropdown */}
                    <AnimatePresence>
                      {activeDropdown === s.symbol && (
                        <>
                          {/* Backdrop to close click */}
                          <div 
                            className="fixed inset-0 z-30" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveDropdown(null);
                            }} 
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-lg border border-gray-150 dark:border-gray-800/80 shadow-xl z-40 py-1 overflow-hidden"
                          >
                            <button
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdown(null);
                                await handleAddToPortfolio(yahooSymbol, s.label);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-[#1890FF]/10 hover:text-[#1890FF] transition-colors flex items-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar a Cartera
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdown(null);
                                handleOpenAlertModal(yahooSymbol);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-orange-500/10 hover:text-orange-500 transition-colors flex items-center gap-2"
                            >
                              <Bell className="w-3.5 h-3.5" /> Crear Alerta
                            </button>
                            <Link
                              href={`/?tag=${encodeURIComponent(yahooSymbol)}`}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-purple-500/10 hover:text-purple-500 transition-colors flex items-center gap-2"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <Newspaper className="w-3.5 h-3.5" /> Ver Noticias
                            </Link>
                            <Link
                              href={`/mercados/${encodeURIComponent(s.symbol)}`}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors flex items-center gap-2"
                              onClick={() => setActiveDropdown(null)}
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver Detalle
                            </Link>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
        {/* ROW 4: More News Grid                              */}
        {/* ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ */}
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
                  <div key={article.id} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
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

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertModal({ open: false, symbol: "" })}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-card rounded-3xl border border-border p-6 shadow-2xl overflow-hidden z-10"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-orange-500" /> Crear Alerta de Precio
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {alertModal.symbol} {alertModal.currentPrice !== undefined && `• Precio actual: $${alertModal.currentPrice.toFixed(2)}`}
                  </p>
                </div>
                <button
                  onClick={() => setAlertModal({ open: false, symbol: "" })}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-655 dark:hover:text-white hover:bg-gray-150/10 dark:hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Condition Selector */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAlertCondition("above")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    alertCondition === "above"
                      ? "border-green-500 bg-green-500/10 text-green-655 dark:text-green-400"
                      : "border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  Sube por encima de
                </button>
                <button
                  onClick={() => setAlertCondition("below")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    alertCondition === "below"
                      ? "border-red-500 bg-red-500/10 text-red-655 dark:text-red-400"
                      : "border-gray-200 dark:border-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  Baja por debajo de
                </button>
              </div>

              {/* Input Target Price */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">Precio Objetivo ($)</label>
                <input
                  type="number"
                  step="any"
                  value={alertPrice}
                  onChange={(e) => setAlertPrice(e.target.value)}
                  placeholder={alertModal.currentPrice !== undefined ? alertModal.currentPrice.toFixed(2) : "0.00"}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-lg font-bold outline-none focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/20 transition-all"
                />
                <p className="text-[11px] text-gray-450 dark:text-gray-500 mt-2">
                  Te enviaremos un correo electrónico cuando <strong>{alertModal.symbol}</strong> alcance este precio objetivo.
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleCreateAlert}
                disabled={isCreatingAlert || !alertPrice}
                className="w-full py-3 bg-[#1890FF] text-white rounded-2xl font-bold text-sm hover:bg-[#1890FF]/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1890FF]/25 disabled:opacity-50"
              >
                {isCreatingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                {isCreatingAlert ? "Guardando..." : "Crear Alerta"}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
    </AuthGuard>
    </SidebarLayout>
  );
}
