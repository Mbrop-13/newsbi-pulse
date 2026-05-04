"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, TrendingUp, TrendingDown, DollarSign, Briefcase } from 'lucide-react';

interface PortfolioSummaryCardProps {
  result: any;
}

export function PortfolioSummaryCard({ result }: PortfolioSummaryCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!result || (!result.assets && !result.summary)) return null;
  if (result.error) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 w-fit">
        <Briefcase className="w-4 h-4 shrink-0" />
        {result.error}
      </div>
    );
  }

  const assets = result.assets || [];
  const summary = result.summary || {};
  const totalValue = summary.total_value || 0;
  const totalPnl = summary.total_pnl || 0;
  const avgChange = summary.average_daily_change || 0;
  const isPositive = avgChange >= 0;

  // Preview: top 3 tickers
  const previewTickers = assets.slice(0, 4).map((a: any) => a.symbol);

  return (
    <div className="w-full max-w-md my-3">
      {/* ── Collapsed Toggle Button ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 w-full px-4 py-3.5
          bg-white dark:bg-[#141821]
          border border-gray-200/80 dark:border-white/10
          rounded-2xl shadow-sm
          hover:shadow-md hover:border-[#1890FF]/30 dark:hover:border-[#1890FF]/30
          transition-all duration-200
          ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}
        `}
      >
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 ${
          isPositive 
            ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
            : 'bg-gradient-to-br from-red-500 to-rose-600'
        }`}>
          <BarChart3 className="w-4.5 h-4.5 text-white" />
        </div>

        {/* Text + Tickers */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Resumen del Portafolio</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-semibold text-gray-400">{assets.length} activos</span>
            <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
            <span className={`text-[11px] font-bold ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{avgChange.toFixed(2)}% hoy
            </span>
          </div>
        </div>

        {/* Chevron */}
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ── Expanded Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="
              bg-white dark:bg-[#141821]
              border border-t-0 border-gray-200/80 dark:border-white/10
              rounded-b-2xl shadow-sm
              overflow-hidden
            ">
              {/* Summary row */}
              <div className="px-4 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Valor Total</span>
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {totalPnl !== 0 && (
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[11px] text-gray-400">Ganancia/Pérdida Total</span>
                    <span className={`text-xs font-bold ${totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>

              {/* Scrollable assets list */}
              <div className="max-h-[340px] overflow-y-auto hidden-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                {assets.map((asset: any) => {
                  const changePositive = (asset.changePercent || 0) >= 0;
                  return (
                    <div key={asset.symbol} className="flex items-center gap-3 px-4 py-3 hover:bg-[#1890FF]/5 transition-colors">
                      {/* Symbol badge */}
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0 ring-2 ring-gray-100 dark:ring-gray-800">
                        <span className="text-[10px] font-black text-gray-600 dark:text-gray-300">{asset.symbol.slice(0, 4)}</span>
                      </div>

                      {/* Name + Shares */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug truncate">
                          {asset.company_name || asset.symbol}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-medium text-gray-400">{asset.shares} acciones</span>
                          {asset.position_value > 0 && (
                            <>
                              <span className="text-[10px] text-gray-300 dark:text-gray-600">•</span>
                              <span className="text-[10px] font-medium text-gray-400">
                                ${asset.position_value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price + Change */}
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-gray-900 dark:text-white tabular-nums">
                          ${(asset.price || 0).toFixed(2)}
                        </p>
                        <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${changePositive ? 'text-emerald-500' : 'text-red-500'}`}>
                          {changePositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span className="text-[10px] font-bold tabular-nums">
                            {changePositive ? '+' : ''}{(asset.changePercent || 0).toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom gradient fade hint */}
              {assets.length > 5 && (
                <div className="h-1 bg-gradient-to-r from-transparent via-[#1890FF]/20 to-transparent" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
