"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, TrendingDown, Plus, Trash2, Calendar, BellRing, Briefcase, RefreshCw, X, AlertTriangle, ExternalLink, Bell, ChevronRight, BarChart3, ArrowUp, ArrowDown, Check, Sparkles } from "lucide-react";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { useSubscriptionStore } from "@/lib/stores/subscription-store";
import { useConversionStore } from "@/lib/stores/conversion-store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface PriceAlert {
  id: string;
  symbol: string;
  target_price: number;
  condition: "above" | "below";
  is_active: boolean;
  created_at: string;
}

interface PortfolioAsset {
  id: string;
  symbol: string;
  company_name: string;
  shares?: number;
  average_price?: number;
  price?: number;
  change?: number;
  changePercent?: number;
  logo?: string;
}

// Multiple logo sources for best coverage
function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

export default function PortfolioClient() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [addError, setAddError] = useState("");
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [alertModal, setAlertModal] = useState<{ open: boolean; symbol: string; price: number }>({ open: false, symbol: "", price: 0 });
  const [alertForm, setAlertForm] = useState<{ targetPrice: string; condition: "above" | "below" }>({ targetPrice: "", condition: "above" });
  const [alertSaving, setAlertSaving] = useState(false);
  const { user, isAuthenticated, isLoaded } = useAuthStore();
  const openAuthModal = useAuthModalStore((s) => s.openModal);
  const { tier } = useSubscriptionStore();
  const { openModal: openConversionModal } = useConversionStore();
  const supabase = createClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    fetchPortfolio();
    fetchAlerts();
  }, [isAuthenticated, user]);

  const fetchAlerts = async () => {
    if (!user) return;
    const { data } = await supabase.from("price_alerts").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false });
    if (data) setAlerts(data);
  };

  const fetchPortfolio = async () => {
    if (!user) return;
    setLoading(true);
    const { data: dbAssets } = await supabase.from("portfolios").select("*").eq("user_id", user.id);
    if (dbAssets && dbAssets.length > 0) {
      const symbols = dbAssets.map(a => a.symbol).join(",");
      try {
        const res = await fetch(`/api/finance/portfolio?symbols=${symbols}`);
        if (res.ok) {
          const liveData = await res.json();
          const enriched = dbAssets.map(dbA => {
            const live = liveData.find((l: any) => l.symbol === dbA.symbol) || {};
            return { ...dbA, price: live.price || 0, change: live.change || 0, changePercent: live.changePercent || 0, shares: dbA.shares || 0, average_price: dbA.average_price || 0, logo: getLogoUrl(dbA.symbol) };
          });
          setAssets(enriched);
          // Check price alerts with live data
          checkAlerts(liveData);
        } else { setAssets(dbAssets.map(a => ({ ...a, logo: getLogoUrl(a.symbol) }))); }
      } catch { setAssets(dbAssets.map(a => ({ ...a, logo: getLogoUrl(a.symbol) }))); }
      
      // Fetch AI calendar events
      setCalendarLoading(true);
      try {
        const calRes = await fetch('/api/finance/calendar-ai');
        if (calRes.ok) {
          const calData = await calRes.json();
          setCalendarEvents(calData.events || []);
          if (calData.last_updated) {
            localStorage.setItem(`ai_cal_last_updated_${user.id}`, calData.last_updated);
          }
        }
      } catch (e) {
        console.error("Error fetching AI calendar:", e);
      } finally {
        setCalendarLoading(false);
      }

    } else { setAssets([]); setCalendarEvents([]); }
    setLoading(false);
  };

  const generateAICalendar = async () => {
    if (!user || assets.length === 0) return;
    setCalendarLoading(true);
    try {
      const symbols = assets.map(a => a.symbol);
      const res = await fetch('/api/finance/calendar-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols })
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarEvents(data.events || []);
        localStorage.setItem(`ai_cal_last_updated_${user.id}`, new Date().toISOString());
      } else {
        const err = await res.json();
        setAddError(err.error || "Error al generar calendario IA");
      }
    } catch (e) {
      setAddError("Error de conexión al generar calendario IA");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setSearchError(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (term.length < 2) { setSearchResults([]); setIsSearching(false); return; }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(term)}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(data.quotes || []);
      } catch { setSearchResults([]); setSearchError(true); }
      setIsSearching(false);
    }, 400);
  }, []);

  const addAsset = async (symbol: string, companyName: string) => {
    if (!user) return;
    setAddError("");

    // Check portfolio limit for free tier
    const PORTFOLIO_LIMIT = tier === "free" ? 5 : tier === "pro" ? 25 : tier === "max" ? 100 : 9999;
    if (assets.length >= PORTFOLIO_LIMIT) {
      openConversionModal("portfolio");
      return;
    }
    if (tier === "free" && assets.length === PORTFOLIO_LIMIT - 1) {
      toast("Último activo gratuito", {
        description: "Prueba el plan Pro para seguir hasta 25 activos.",
        icon: <Briefcase className="w-4 h-4 text-[#1890FF]" />,
      });
    }

    // Optimistic: add immediately to UI
    const tempAsset: PortfolioAsset = { id: `temp-${Date.now()}`, symbol, company_name: companyName, price: 0, change: 0, changePercent: 0, logo: getLogoUrl(symbol) };
    setAssets(prev => [tempAsset, ...prev]);
    setSearchTerm("");
    setSearchResults([]);

    const { error } = await supabase.from("portfolios").insert({ user_id: user.id, symbol, company_name: companyName });
    if (error) {
      // Revert optimistic add
      setAssets(prev => prev.filter(a => a.id !== tempAsset.id));
      if (error.code === "42P01") {
        setAddError("La tabla 'portfolios' no existe. Ejecuta el SQL de migración en Supabase.");
      } else if (error.code === "23505") {
        setAddError(`${symbol} ya está en tu portafolio.`);
      } else {
        setAddError(`Error al agregar ${symbol}: ${error.message}`);
      }
      setTimeout(() => setAddError(""), 5000);
      return;
    }
    // Refresh with real data
    fetchPortfolio();
  };

  const removeAsset = async (symbol: string) => {
    if (!user) return;
    setAssets(prev => prev.filter(a => a.symbol !== symbol));
    await supabase.from("portfolios").delete().eq("user_id", user.id).eq("symbol", symbol);
  };

  const checkAlerts = async (liveData: any[]) => {
    if (!user) return;
    const { data: activeAlerts } = await supabase.from("price_alerts").select("*").eq("user_id", user.id).eq("is_active", true);
    if (!activeAlerts || activeAlerts.length === 0) return;
    for (const alert of activeAlerts) {
      const live = liveData.find((l: any) => l.symbol === alert.symbol);
      if (!live) continue;
      const triggered = (alert.condition === "above" && live.price >= alert.target_price) || (alert.condition === "below" && live.price <= alert.target_price);
      if (triggered) {
        await supabase.from("price_alerts").update({ is_active: false }).eq("id", alert.id);
        await supabase.from("notifications").insert({
          user_id: user.id, type: "price_alert",
          title: `🔔 Alerta: ${alert.symbol} ${alert.condition === "above" ? "superó" : "bajó de"} $${alert.target_price}`,
          message: `${alert.symbol} ahora está en $${live.price.toFixed(2)}. Tu alerta de ${alert.condition === "above" ? "por encima de" : "por debajo de"} $${alert.target_price} se ha activado.`
        });
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
      }
    }
  };

  const createAlert = async () => {
    if (!user || !alertForm.targetPrice) return;
    setAlertSaving(true);
    const { error } = await supabase.from("price_alerts").insert({
      user_id: user.id, symbol: alertModal.symbol,
      target_price: parseFloat(alertForm.targetPrice), condition: alertForm.condition,
    });
    if (!error) {
      setAlertModal({ open: false, symbol: "", price: 0 });
      setAlertForm({ targetPrice: "", condition: "above" });
      fetchAlerts();
    } else {
      setAddError(`Error al crear alerta: ${error.message}`);
      setTimeout(() => setAddError(""), 4000);
    }
    setAlertSaving(false);
  };

  const deleteAlert = async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    await supabase.from("price_alerts").delete().eq("id", id);
  };

  const totalValue = assets.reduce((sum, a) => sum + ((a.price || 0) * (a.shares || 0)), 0);
  
  let hasShares = false;
  assets.forEach(a => { if ((a.shares || 0) > 0) hasShares = true; });
  let totalChange = 0;

  if (hasShares) {
    let prevTotalValue = 0;
    let totalAbsoluteChange = 0;
    assets.forEach(a => {
      const shares = a.shares || 0;
      if (shares > 0) {
        const currentPosValue = (a.price || 0) * shares;
        const prevPrice = (a.price || 0) - (a.change || 0);
        const prevPosValue = prevPrice * shares;
        prevTotalValue += prevPosValue;
        totalAbsoluteChange += (a.change || 0) * shares;
      }
    });
    totalChange = prevTotalValue > 0 ? (totalAbsoluteChange / prevTotalValue) * 100 : 0;
  } else {
    // Si no hay acciones (solo en seguimiento), calculamos un promedio simple
    totalChange = assets.length > 0 ? assets.reduce((sum, a) => sum + (a.changePercent || 0), 0) / assets.length : 0;
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-24 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-8 h-8 rounded-full border-4 border-[#1890FF]/30 border-t-[#1890FF] animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-24 pb-16 px-4 flex flex-col items-center justify-center text-center">
        <Briefcase className="w-16 h-16 text-[#1890FF] mb-6 opacity-20" />
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Tu Portafolio de Inversión</h1>
        <p className="text-gray-500 max-w-md mx-auto mb-8">Únete a Reclu para crear tu portafolio personalizado, recibir alertas de precio y obtener un calendario de eventos impulsado por IA.</p>
        <button onClick={() => openAuthModal("register")} className="px-8 py-3 rounded-full bg-[#1890FF] text-white font-bold hover:opacity-90 transition-opacity shadow-lg shadow-[#1890FF]/25">Crear cuenta gratis</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] pt-[72px] md:pt-[80px] pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header removed as requested to clean up UI */}

        {/* Error Toast */}
        <AnimatePresence>
          {addError && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" /> {addError}
              <button onClick={() => setAddError("")} className="ml-auto"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        {assets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Desktop: Two separate cards. Mobile: Hidden */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Valor Portafolio</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Cambio Promedio</p>
              <p className={`text-2xl font-black flex items-center gap-2 ${totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />} {totalChange.toFixed(2)}%
              </p>
            </div>

            {/* Mobile: One combined card */}
            <div className="md:hidden bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Valor Portafolio</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Cambio Promedio</p>
                <p className={`text-2xl font-black flex items-center justify-end gap-2 ${totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalChange >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />} {totalChange.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-[#1890FF]/20 focus-within:border-[#1890FF] transition-all">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <input type="text" placeholder="Buscar símbolo o empresa (ej. AAPL, Tesla, MSFT)..." value={searchTerm} onChange={(e) => handleSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none text-gray-900 dark:text-white placeholder:text-gray-400" />
                {isSearching && <RefreshCw className="w-4 h-4 animate-spin text-[#1890FF] ml-2" />}
                {searchTerm.length > 0 && !isSearching && (
                  <button onClick={() => { setSearchTerm(""); setSearchResults([]); }} className="ml-2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                )}
              </div>
              <AnimatePresence>
                {(searchResults.length > 0 || (searchTerm.length >= 2 && !isSearching && searchResults.length === 0)) && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-[320px] overflow-y-auto">
                    {searchError ? (
                      <div className="px-4 py-6 text-center text-sm text-red-500 flex flex-col items-center gap-2"><AlertTriangle className="w-5 h-5" />Error al buscar.</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">No se encontraron resultados para &quot;{searchTerm}&quot;</div>
                    ) : (
                      searchResults.map((res: any) => {
                        const alreadyAdded = assets.some(a => a.symbol === res.symbol);
                        return (
                          <button key={res.symbol} onClick={() => !alreadyAdded && addAsset(res.symbol, res.shortname || res.longname || res.symbol)} disabled={alreadyAdded}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between group transition-colors ${alreadyAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-50 dark:hover:bg-slate-800"}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700 shrink-0">
                                <img src={getLogoUrl(res.symbol)} alt="" onError={(e) => { e.currentTarget.src = getFallbackLogo(res.symbol); }} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors text-sm">{res.symbol}</div>
                                <div className="text-[11px] text-gray-500 line-clamp-1">{res.shortname || res.longname} • {res.exchDisp || res.exchange}</div>
                              </div>
                            </div>
                            {alreadyAdded ? (<span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">✓ Agregado</span>) : (<Plus className="w-5 h-5 text-gray-400 group-hover:text-[#1890FF] shrink-0" />)}
                          </button>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assets List */}
            <div className="space-y-3">
              <h2 className="font-bold text-gray-900 dark:text-white text-lg">Tus Activos ({assets.length})</h2>
              {loading && assets.length === 0 ? (
                <div className="p-12 flex justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800"><RefreshCw className="w-8 h-8 animate-spin text-[#1890FF]" /></div>
              ) : assets.length === 0 ? (
                <div className="p-12 text-center text-gray-500 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="font-semibold">Aún no tienes activos en tu portafolio.</p>
                  <p className="text-sm mt-1">Busca una empresa arriba para agregarla.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assets.map((asset) => {
                    const isPositive = (asset.changePercent || 0) >= 0;
                    const isExpanded = expandedAsset === asset.symbol;
                    return (
                      <motion.div key={asset.id} layout className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden hover:border-[#1890FF]/30 transition-colors">
                        {/* Main Row */}
                        <button onClick={() => setExpandedAsset(isExpanded ? null : asset.symbol)} className="w-full p-4 sm:px-5 flex items-center justify-between text-left">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                              <img src={asset.logo || getLogoUrl(asset.symbol)} alt={asset.symbol} onError={(e) => { e.currentTarget.src = getFallbackLogo(asset.symbol); }} className="w-full h-full object-contain" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{asset.symbol}</h3>
                              <p className="text-xs text-gray-500 line-clamp-1 max-w-[150px] sm:max-w-xs">{asset.company_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-bold text-gray-900 dark:text-white tabular-nums">${asset.price?.toFixed(2) || "0.00"}</div>
                              <div className={`text-xs font-semibold flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isPositive ? "+" : ""}{asset.changePercent?.toFixed(2)}%
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </div>
                        </button>

                        {/* Expanded Actions Panel */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                              <div className="px-5 pb-4 pt-1 border-t border-gray-100 dark:border-gray-800">
                                {/* Shares Row */}
                                <div className="flex items-center gap-3 mt-3 mb-3">
                                  <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Acciones</label>
                                    <input type="number" step="any" min="0" placeholder="0" defaultValue={asset.shares || ""}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.currentTarget.blur();
                                        }
                                      }}
                                      onBlur={async (e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setAssets(prev => prev.map(a => a.id === asset.id ? { ...a, shares: val } : a));
                                        await supabase.from("portfolios").update({ shares: val }).eq("id", asset.id);
                                      }}
                                      className={`w-full px-3 py-2 rounded-lg border text-sm font-bold outline-none transition-all ${
                                        (asset.shares || 0) > 0 
                                          ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF] focus:bg-white dark:focus:bg-slate-800 focus:text-gray-900 dark:focus:text-white focus:border-[#1890FF]" 
                                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:border-[#1890FF]"
                                      }`} />
                                  </div>
                                  {(asset.shares || 0) > 0 && (asset.price || 0) > 0 && (
                                    <div className="flex-1 text-right">
                                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Posición</label>
                                      <p className="text-sm font-black text-gray-900 dark:text-white">${((asset.shares || 0) * (asset.price || 0)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); setAlertModal({ open: true, symbol: asset.symbol, price: asset.price || 0 }); setAlertForm({ targetPrice: "", condition: "above" }); }} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors">
                                    <Bell className="w-3.5 h-3.5" /> Alerta de Precio
                                  </button>
                                  <Link href={`/mercados/${asset.symbol}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                                    <BarChart3 className="w-3.5 h-3.5" /> Ver Mercado
                                  </Link>
                                  <Link href={`/?tag=${asset.symbol}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors">
                                    <ExternalLink className="w-3.5 h-3.5" /> Noticias
                                  </Link>
                                  <button onClick={() => removeAsset(asset.symbol)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#1890FF]/10 to-indigo-500/10 rounded-2xl border border-[#1890FF]/20 p-6 relative overflow-hidden flex flex-col h-[400px]">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#1890FF]/20 blur-3xl rounded-full" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1890FF] flex items-center justify-center shadow-lg shadow-[#1890FF]/30 shrink-0"><Calendar className="w-5 h-5 text-white" /></div>
                  <div><h3 className="font-bold text-gray-900 dark:text-white">Calendario IA</h3><p className="text-[11px] text-[#1890FF] font-semibold">Eventos de tus activos</p></div>
                </div>
                
                {/* Generate AI Calendar Button */}
                {(() => {
                  const lastUpdated = user ? localStorage.getItem(`ai_cal_last_updated_${user.id}`) : null;
                  const daysSinceUpdate = lastUpdated ? (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24) : 999;
                  const canUpdate = daysSinceUpdate >= 30; // 30 days monthly cooldown
                  const daysLeft = Math.ceil(30 - daysSinceUpdate);
                  
                  return (
                    <button 
                      onClick={generateAICalendar} 
                      disabled={!canUpdate || calendarLoading || assets.length === 0}
                      className="group relative flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-[#1890FF]/30 rounded-lg text-xs font-bold text-[#1890FF] hover:bg-[#1890FF] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900 disabled:hover:text-[#1890FF]"
                    >
                      {calendarLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {calendarLoading ? "Generando..." : "Hacer Calendario"}
                      
                      {/* Tooltip for Cooldown */}
                      {!canUpdate && !calendarLoading && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                          Disponible en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}. Se actualiza mensualmente para ahorrar recursos.
                        </div>
                      )}
                    </button>
                  );
                })()}
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto hidden-scrollbar pb-2">
                {calendarLoading ? (
                  <div className="flex justify-center p-4"><RefreshCw className="w-5 h-5 text-[#1890FF] animate-spin" /></div>
                ) : calendarEvents.length > 0 ? (
                  calendarEvents.map((event, i) => {
                    const eventDate = new Date(event.date);
                    const isToday = eventDate.toDateString() === new Date().toDateString();
                    return (
                      <div key={i} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-3 border border-white/20 dark:border-white/5 flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isToday ? 'bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} />
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{event.type} • {event.symbol}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5">{eventDate.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })} {event.description ? `— ${event.description}` : ''}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl p-4 border border-white/20 dark:border-white/5 text-center flex flex-col items-center justify-center h-full">
                    <Sparkles className="w-8 h-8 text-[#1890FF]/40 mb-2" />
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">No hay eventos en tu calendario.</p>
                    <p className="text-[10px] text-gray-500 mt-1">Presiona "Hacer Calendario" para que la IA busque los próximos eventos de tus activos.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><BellRing className="w-5 h-5 text-orange-500" /></div>
                <div><h3 className="font-bold text-gray-900 dark:text-white">Alertas de Precio</h3><p className="text-[11px] text-gray-500">{alerts.length} activas</p></div>
              </div>
              {alerts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">No tienes alertas configuradas.</p>
                  <p className="text-xs text-gray-400">Abre un activo y presiona "Alerta de Precio".</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl group">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${alert.condition === 'above' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                          {alert.condition === 'above' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{alert.symbol}</p>
                          <p className="text-[10px] text-gray-500">{alert.condition === 'above' ? 'Por encima de' : 'Por debajo de'} ${alert.target_price}</p>
                        </div>
                      </div>
                      <button onClick={() => deleteAlert(alert.id)} className="text-gray-400 hover:text-red-500 transition-colors p-2 -mr-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Price Alert Modal */}
      <AnimatePresence>
        {alertModal.open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setAlertModal({ open: false, symbol: "", price: 0 })} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Bell className="w-5 h-5 text-orange-500" /></div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Nueva Alerta</h3>
                    <p className="text-xs text-gray-500">{alertModal.symbol} • Precio actual: ${alertModal.price.toFixed(2)}</p>
                  </div>
                </div>
                <button onClick={() => setAlertModal({ open: false, symbol: "", price: 0 })} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setAlertForm(f => ({ ...f, condition: "above" }))} className={`p-3 rounded-xl border-2 text-center transition-all ${alertForm.condition === 'above' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
                    <ArrowUp className={`w-5 h-5 mx-auto mb-1 ${alertForm.condition === 'above' ? 'text-green-500' : 'text-gray-400'}`} />
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Por encima de</p>
                  </button>
                  <button onClick={() => setAlertForm(f => ({ ...f, condition: "below" }))} className={`p-3 rounded-xl border-2 text-center transition-all ${alertForm.condition === 'below' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : 'border-gray-200 dark:border-gray-700'}`}>
                    <ArrowDown className={`w-5 h-5 mx-auto mb-1 ${alertForm.condition === 'below' ? 'text-red-500' : 'text-gray-400'}`} />
                    <p className="text-xs font-bold text-gray-900 dark:text-white">Por debajo de</p>
                  </button>
                </div>

                {(() => {
                  const parsedTarget = parseFloat(alertForm.targetPrice);
                  const isInvalidAbove = alertForm.condition === 'above' && parsedTarget <= alertModal.price;
                  const isInvalidBelow = alertForm.condition === 'below' && parsedTarget >= alertModal.price;
                  const priceError = alertForm.targetPrice && !isNaN(parsedTarget) ? (isInvalidAbove ? "El precio debe ser mayor al actual." : isInvalidBelow ? "El precio debe ser menor al actual." : null) : null;
                  
                  return (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Precio objetivo (USD)</label>
                        <input type="number" step="0.01" value={alertForm.targetPrice} onChange={(e) => setAlertForm(f => ({ ...f, targetPrice: e.target.value }))} placeholder={alertModal.price.toFixed(2)} className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white text-lg font-bold outline-none transition-all ${priceError ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-gray-200 dark:border-gray-700 focus:border-[#1890FF] focus:ring-2 focus:ring-[#1890FF]/20'}`} />
                        {priceError && <p className="text-xs text-red-500 mt-1.5 font-medium">{priceError}</p>}
                      </div>

                      {alertForm.targetPrice && !priceError && (
                        <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-xs text-blue-700 dark:text-blue-300">
                          Te notificaremos cuando <strong>{alertModal.symbol}</strong> {alertForm.condition === 'above' ? 'suba por encima de' : 'baje por debajo de'} <strong>${parseFloat(alertForm.targetPrice).toFixed(2)}</strong>
                        </div>
                      )}

                      <button onClick={createAlert} disabled={!alertForm.targetPrice || alertSaving || !!priceError} className="w-full py-3 rounded-xl bg-[#1890FF] text-white font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1890FF]/25 mt-2">
                        {alertSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        {alertSaving ? 'Guardando...' : 'Crear Alerta'}
                      </button>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
