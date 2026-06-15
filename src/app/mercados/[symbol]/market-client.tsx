"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Check, Loader2, Briefcase, Trash2, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import TradingViewWidget from "@/components/tradingview-widget";

export default function MarketClient({ symbol }: { symbol: string }) {
  const { user, isAuthenticated } = useAuthStore();
  const openModal = useAuthModalStore((s) => s.openModal);
  const supabase = createClient();

  const [inPortfolio, setInPortfolio] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  
  // Real company name from Yahoo Finance
  const [companyName, setCompanyName] = useState<string>(symbol);

  useEffect(() => {
    checkPortfolioStatus();
    fetchCompanyData();
    fetchNews();
  }, [symbol, isAuthenticated, user]);

  const checkPortfolioStatus = async () => {
    if (!user) {
      setLoadingPortfolio(false);
      return;
    }
    const { data } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", user.id)
      .eq("symbol", symbol)
      .single();
    
    setInPortfolio(!!data);
    setLoadingPortfolio(false);
  };

  const fetchCompanyData = async () => {
    try {
      // Use the existing search endpoint to get the real company name
      const res = await fetch(`/api/finance/search?q=${symbol}`);
      if (res.ok) {
        const data = await res.json();
        const exactMatch = data.quotes?.find((q: any) => q.symbol === symbol);
        if (exactMatch) {
          setCompanyName(exactMatch.shortname || exactMatch.longname || symbol);
        }
      }
    } catch (e) {
      console.error("Failed to fetch company name", e);
    }
  };

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      // Use our existing news endpoint but filtered by symbol tag
      const res = await fetch(`/api/news/fetch?tag=${symbol}&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setNews(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoadingNews(false);
  };

  const handlePortfolioAction = async () => {
    if (!isAuthenticated) {
      openModal("login");
      return;
    }
    
    if (!user) return;
    
    setActionLoading(true);
    
    if (inPortfolio) {
      // Remove
      await supabase.from("portfolios").delete().eq("user_id", user.id).eq("symbol", symbol);
      setInPortfolio(false);
    } else {
      // Add
      await supabase.from("portfolios").insert({
        user_id: user.id,
        symbol: symbol,
        company_name: companyName
      });
      setInPortfolio(true);
    }
    
    setActionLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] pt-[80px] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/portafolio" className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#1890FF] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al Portafolio
          </Link>
        </div>

        {/* Header Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 mb-6 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0 shadow-sm">
              <img 
                src={`https://assets.parqet.com/logos/symbol/${symbol}`} 
                alt={symbol} 
                onError={(e) => { e.currentTarget.src = `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=128`; }}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">{symbol}</h1>
              <p className="text-sm font-medium text-gray-500 mt-1">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePortfolioAction}
              disabled={loadingPortfolio || actionLoading}
              className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all ${
                inPortfolio
                  ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20"
                  : "bg-[#1890FF] text-white hover:opacity-90 shadow-lg shadow-[#1890FF]/25"
              }`}
            >
              {loadingPortfolio || actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : inPortfolio ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {inPortfolio ? "Eliminar del Portafolio" : "Agregar al Portafolio"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-[500px] md:h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#1890FF]" />
                <h2 className="font-bold text-gray-900 dark:text-white">Gráfico Avanzado</h2>
              </div>
              <div className="flex-1 w-full bg-gray-50 dark:bg-[#0F172A]">
                <TradingViewWidget symbol={symbol} />
              </div>
            </div>
          </div>

          {/* Right Column: News & Context */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#1890FF]" />
                Noticias de {symbol}
              </h3>
              
              {loadingNews ? (
                <div className="flex justify-center py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#1890FF]" />
                </div>
              ) : news.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No hay noticias recientes especificas para este símbolo.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <Link key={item.id} href={`/article/${item.id}`} className="block group">
                      <div className="flex gap-4 items-start">
                        {item.image_url && (
                          <div className="w-20 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                            <img src={item.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-[#1890FF] transition-colors leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-1 font-medium uppercase tracking-wider">
                            {new Date(item.published_at).toLocaleDateString()} • {item.source_domain || "Maverlang"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
