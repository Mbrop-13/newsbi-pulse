"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, TrendingUp, TrendingDown, ExternalLink, Activity, DollarSign, Shield, Layers, Plus, Check, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

function formatNum(val: any, decimals = 2): string {
  if (val == null || isNaN(val)) return 'N/A';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (Math.abs(val) < 1 && val !== 0) return `${(val * 100).toFixed(1)}%`;
    return val.toFixed(decimals);
  }
  return String(val);
}

function metricColor(val: any, goodHigh = true): string {
  if (val == null || isNaN(val)) return 'text-gray-400';
  if (goodHigh) return val >= 0 ? 'text-emerald-500' : 'text-red-500';
  return val <= 0.5 ? 'text-emerald-500' : val <= 1 ? 'text-amber-500' : 'text-red-500';
}

interface StockAnalysisCardProps {
  toolName: string;
  result: any;
}

export function StockAnalysisCard({ toolName, result }: StockAnalysisCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inPortfolio, setInPortfolio] = useState<Record<string, boolean>>({});
  const [addingAsset, setAddingAsset] = useState<Record<string, boolean>>({});

  // Check if stocks are in portfolio on mount
  useEffect(() => {
    const checkPortfolio = async () => {
      if (!result || result.error) return;
      
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const symbolsToCheck: string[] = [];
      if (toolName === 'analyze_stock' && result.symbol) symbolsToCheck.push(result.symbol);
      if (toolName === 'compare_stocks' && result.comparison) {
        result.comparison.forEach((s: any) => { if (!s.error) symbolsToCheck.push(s.symbol); });
      }

      if (symbolsToCheck.length > 0) {
        const { data } = await supabase.from('portfolios').select('symbol').eq('user_id', user.id).in('symbol', symbolsToCheck);
        if (data) {
          const inPort: Record<string, boolean> = {};
          data.forEach(p => { inPort[p.symbol] = true; });
          setInPortfolio(inPort);
        }
      }
    };
    checkPortfolio();
  }, [result, toolName]);

  const handleAddToPortfolio = async (e: React.MouseEvent, symbol: string, companyName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (addingAsset[symbol]) return;
    
    setAddingAsset(prev => ({ ...prev, [symbol]: true }));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase.from('portfolios').insert({
        user_id: user.id,
        symbol,
        company_name: companyName
      });
      
      if (!error) {
        setInPortfolio(prev => ({ ...prev, [symbol]: true }));
      }
    }
    setAddingAsset(prev => ({ ...prev, [symbol]: false }));
  };

  if (!result || result.error) {
    if (result?.error) {
      return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 w-fit">
          <Activity className="w-4 h-4 shrink-0" />
          {result.error}
        </div>
      );
    }
    return null;
  }

  // ── analyze_stock ──
  if (toolName === 'analyze_stock') {
    const { symbol, company_name, sector, price, valuation, profitability, financial_health, dividends, risk } = result;
    const isPositive = (price?.changePercent || 0) >= 0;

    return (
      <div className="w-full max-w-md my-3">
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all duration-200 ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800">
            <img src={getLogoUrl(symbol)} alt={symbol} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(symbol); }} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{company_name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{symbol}</span>
              <span className="text-[10px] text-gray-400">{sector}</span>
              <span className={`text-[11px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                ${price?.current?.toFixed(2)} ({isPositive ? '+' : ''}{price?.changePercent?.toFixed(2)}%)
              </span>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm overflow-hidden">
                {/* Valuation */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2"><DollarSign className="w-3.5 h-3.5 text-[#1890FF]" /><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Valoración</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['P/E', valuation?.pe_trailing], ['P/B', valuation?.pb], ['PEG', valuation?.peg]].map(([label, val]) => (
                      <div key={label as string} className="text-center"><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs font-bold text-gray-900 dark:text-white">{formatNum(val)}</p></div>
                    ))}
                  </div>
                </div>
                {/* Profitability */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rentabilidad</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['ROE', profitability?.roe], ['Margen', profitability?.profit_margin], ['Op. Margin', profitability?.operating_margin]].map(([label, val]) => (
                      <div key={label as string} className="text-center"><p className="text-[10px] text-gray-400">{label}</p><p className={`text-xs font-bold ${metricColor(val)}`}>{formatNum(val)}</p></div>
                    ))}
                  </div>
                </div>
                {/* Financial Health */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2"><Shield className="w-3.5 h-3.5 text-amber-500" /><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Salud Financiera</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    {[['D/E', financial_health?.debt_to_equity], ['Current', financial_health?.current_ratio], ['Div. Yield', dividends?.yield]].map(([label, val]) => (
                      <div key={label as string} className="text-center"><p className="text-[10px] text-gray-400">{label}</p><p className="text-xs font-bold text-gray-900 dark:text-white">{formatNum(val)}</p></div>
                    ))}
                  </div>
                </div>
                {/* Risk */}
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2 mb-2"><Activity className="w-3.5 h-3.5 text-purple-500" /><span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Riesgo</span></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center"><p className="text-[10px] text-gray-400">Beta</p><p className="text-xs font-bold text-gray-900 dark:text-white">{formatNum(risk?.beta)}</p></div>
                    <div className="text-center"><p className="text-[10px] text-gray-400">52w High</p><p className="text-xs font-bold text-gray-900 dark:text-white">${risk?.fifty_two_week_high?.toFixed(2) || 'N/A'}</p></div>
                    <div className="text-center"><p className="text-[10px] text-gray-400">52w Low</p><p className="text-xs font-bold text-gray-900 dark:text-white">${risk?.fifty_two_week_low?.toFixed(2) || 'N/A'}</p></div>
                  </div>
                </div>
                {/* Link to market page & Add to portfolio */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#141821]/50">
                  <Link href={`/mercados/${symbol}`} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-200 dark:bg-white/5 text-gray-900 dark:text-white text-xs font-bold hover:bg-gray-300 dark:hover:bg-white/10 transition-colors">
                    <BarChart3 className="w-3.5 h-3.5" /> Ver Mercado
                  </Link>
                  
                  {inPortfolio[symbol] ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20">
                      <Check className="w-3.5 h-3.5" /> En tu portafolio
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => handleAddToPortfolio(e, symbol, company_name)}
                      disabled={addingAsset[symbol]}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1890FF] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#1890FF]/20"
                    >
                      {addingAsset[symbol] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {addingAsset[symbol] ? 'Agregando...' : 'Agregar al portafolio'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── compare_stocks ──
  if (toolName === 'compare_stocks' && result.comparison) {
    const stocks = result.comparison.filter((s: any) => !s.error);
    if (stocks.length === 0) return null;

    return (
      <div className="w-full max-w-lg my-3">
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Comparación de Acciones</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="flex -space-x-2">
                {stocks.slice(0, 5).map((s: any, i: number) => (
                  <div key={s.symbol} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#141821] overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0" style={{ zIndex: 5 - i }}>
                    <img src={getLogoUrl(s.symbol)} alt={s.symbol} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(s.symbol); }} />
                  </div>
                ))}
              </div>
              <span className="text-[11px] font-semibold text-gray-400 ml-1">{stocks.map((s: any) => s.symbol).join(' vs ')}</span>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm overflow-x-auto">
                <div className="max-h-[400px] overflow-y-auto hidden-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                  {stocks.map((stock: any) => {
                    const pos = (stock.changePercent || 0) >= 0;
                    return (
                      <Link key={stock.symbol} href={`/mercados/${stock.symbol}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#1890FF]/5 transition-colors group">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-[#1890FF]/30 transition-all">
                          <img src={getLogoUrl(stock.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(stock.symbol); }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{stock.name || stock.symbol}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{stock.symbol}</span>
                            <span className="text-[10px] text-gray-400">P/E: {formatNum(stock.pe)}</span>
                            <span className="text-[10px] text-gray-400">ROE: {formatNum(stock.roe)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-gray-900 dark:text-white tabular-nums">${stock.price?.toFixed(2)}</p>
                            <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                              {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              <span className="text-[10px] font-bold tabular-nums">{pos ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%</span>
                            </div>
                          </div>
                          {/* Add to Portfolio Mini Button */}
                          {!inPortfolio[stock.symbol] ? (
                            <button 
                              onClick={(e) => handleAddToPortfolio(e, stock.symbol, stock.name || stock.symbol)}
                              disabled={addingAsset[stock.symbol]}
                              className="flex items-center gap-1 px-2 py-1 bg-[#1890FF]/10 text-[#1890FF] rounded-md text-[10px] font-bold hover:bg-[#1890FF]/20 transition-colors disabled:opacity-50"
                            >
                              {addingAsset[stock.symbol] ? <RefreshCw className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />}
                              Agregar
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-md text-[10px] font-bold">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── screen_market ──
  if (toolName === 'screen_market' && (result.gainers || result.losers)) {
    return (
      <div className="w-full max-w-md my-3">
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1890FF] to-cyan-500 flex items-center justify-center shadow-md shrink-0">
            <Activity className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">Screener del Mercado</p>
            <span className="text-[11px] text-gray-400">{result.market_summary?.positive_count}/{result.market_summary?.total_tracked} al alza · Promedio: {result.market_summary?.avg_change?.toFixed(2)}%</span>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-500/5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">🚀 Top Ganadores</span>
                </div>
                {result.gainers?.map((s: any) => (
                  <Link key={s.symbol} href={`/mercados/${s.symbol}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1890FF]/5 transition-colors group border-b border-gray-50 dark:border-white/[0.03]">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                      <img src={getLogoUrl(s.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(s.symbol); }} />
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-[#1890FF]">{s.name || s.symbol}</p></div>
                    <span className="text-xs font-bold text-emerald-500 tabular-nums">+{s.changePercent?.toFixed(2)}%</span>
                  </Link>
                ))}
                <div className="px-4 py-2 bg-red-50/50 dark:bg-red-500/5 border-b border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">📉 Top Perdedores</span>
                </div>
                {result.losers?.map((s: any) => (
                  <Link key={s.symbol} href={`/mercados/${s.symbol}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1890FF]/5 transition-colors group border-b border-gray-50 dark:border-white/[0.03]">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                      <img src={getLogoUrl(s.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(s.symbol); }} />
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-900 dark:text-white group-hover:text-[#1890FF]">{s.name || s.symbol}</p></div>
                    <span className="text-xs font-bold text-red-500 tabular-nums">{s.changePercent?.toFixed(2)}%</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ── get_sector_performance ──
  if (toolName === 'get_sector_performance' && result.sectors) {
    return (
      <div className="w-full max-w-md my-3">
        <button onClick={() => setIsOpen(!isOpen)} className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-md shrink-0">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <div className="flex-1 text-left"><p className="text-sm font-bold text-gray-900 dark:text-white">Rendimiento por Sector</p><span className="text-[11px] text-gray-400">{result.sectors.length} sectores</span></div>
          <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm divide-y divide-gray-100 dark:divide-white/5">
                {result.sectors.map((s: any) => {
                  const pos = (s.changePercent || 0) >= 0;
                  return (
                    <div key={s.etf} className="flex items-center justify-between px-4 py-3 hover:bg-[#1890FF]/5 transition-colors">
                      <div><p className="text-xs font-semibold text-gray-900 dark:text-white">{s.sector}</p><p className="text-[10px] text-gray-400">{s.etf}</p></div>
                      <div className={`flex items-center gap-1 ${pos ? 'text-emerald-500' : 'text-red-500'}`}>
                        {pos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        <span className="text-xs font-bold tabular-nums">{pos ? '+' : ''}{(s.changePercent || 0).toFixed(2)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
