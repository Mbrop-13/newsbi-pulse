"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, ChevronDown, TrendingUp, ExternalLink, RefreshCw, Dot } from 'lucide-react';
import Link from 'next/link';

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

function formatEarningsDate(dateStr: string): { weekday: string; day: string; month: string; isToday: boolean; relative: string } {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { weekday: '-', day: '--', month: '-', isToday: false, relative: '' };
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = new Date(now.getTime() + 86400000).toDateString() === date.toDateString();
  let relative = '';
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86400000);
  if (isToday) relative = 'Hoy';
  else if (isTomorrow) relative = 'Mañana';
  else if (diffDays > 0) relative = `En ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  else if (diffDays < 0) relative = `Hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`;
  return {
    weekday: date.toLocaleDateString('es-CL', { weekday: 'short' }),
    day: String(date.getDate()),
    month: date.toLocaleDateString('es-CL', { month: 'short' }),
    isToday,
    relative,
  };
}

interface EarningsCalendarCardProps {
  result: any;
}

export function EarningsCalendarCard({ result }: EarningsCalendarCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!result || result.error) {
    if (result?.error) {
      return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 w-fit my-3">
          <CalendarClock className="w-4 h-4 shrink-0" />
          {typeof result.error === 'string' ? result.error : (result.error?.message || 'No se pudo cargar el calendario')}
        </div>
      );
    }
    return null;
  }

  const earnings = result.earningsCalendar || result.earnings || [];
  if (!Array.isArray(earnings) || earnings.length === 0) return null;

  // Ordenar por fecha (más próxima primero)
  const sorted = [...earnings].sort((a, b) => new Date(a.nextEarningsDate || a.date).getTime() - new Date(b.nextEarningsDate || b.date).getTime());

  // Fecha del primer earnings para mostrarla destacada en el header
  const firstDate = sorted[0]?.nextEarningsDate || sorted[0]?.date;
  const firstFmt = firstDate ? formatEarningsDate(firstDate) : null;

  return (
    <div className="w-full max-w-md my-3">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all duration-200 ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1890FF] to-cyan-500 flex items-center justify-center shadow-md shrink-0">
          <CalendarClock className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">Calendario de Earnings</p>
          <span className="text-[11px] text-gray-400">
            {sorted.length} {sorted.length === 1 ? 'empresa' : 'empresas'} · {firstFmt?.relative || 'Próximas fechas'}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm divide-y divide-gray-100 dark:divide-white/5 max-h-[420px] overflow-y-auto hidden-scrollbar">
              {sorted.map((item: any, i: number) => {
                const dateStr = item.nextEarningsDate || item.date;
                const fmt = dateStr ? formatEarningsDate(dateStr) : null;
                const symbol = item.symbol;
                const hasEstimates = item.revenueEstimate != null || item.epsEstimate != null;
                const isPast = dateStr && new Date(dateStr).getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <Link
                    key={`${symbol}-${i}`}
                    href={`/mercados/${symbol}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#1890FF]/5 transition-colors group"
                  >
                    {/* Date badge */}
                    {fmt && (
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border ${fmt.isToday ? 'bg-red-500/10 border-red-500/20' : isPast ? 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10' : 'bg-[#1890FF]/5 border-[#1890FF]/10'}`}>
                        <span className={`text-[9px] font-bold uppercase ${fmt.isToday ? 'text-red-500' : 'text-gray-400'}`}>{fmt.weekday}</span>
                        <span className={`text-base font-black leading-none ${fmt.isToday ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>{fmt.day}</span>
                        <span className={`text-[8px] uppercase ${fmt.isToday ? 'text-red-500' : 'text-gray-400'}`}>{fmt.month}</span>
                      </div>
                    )}

                    {/* Logo + Symbol */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-[#1890FF]/30 transition-all">
                      <img
                        src={getLogoUrl(symbol)}
                        alt={symbol}
                        className="w-full h-full object-contain"
                        onError={(e) => { e.currentTarget.src = getFallbackLogo(symbol); }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{symbol}</span>
                        {fmt?.relative && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${fmt.isToday ? 'bg-red-500/10 text-red-500' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'}`}>
                            {fmt.relative}
                          </span>
                        )}
                      </div>
                      {hasEstimates && (
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                          {item.epsEstimate != null && (
                            <span className="flex items-center gap-0.5">
                              <TrendingUp className="w-2.5 h-2.5" />
                              EPS est. ${Number(item.epsEstimate).toFixed(2)}
                            </span>
                          )}
                          {item.revenueEstimate != null && (
                            <span>
                              <Dot className="w-3 h-3 inline -mx-1" />
                              Rev ${(Number(item.revenueEstimate) / 1e9).toFixed(1)}B
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1890FF] shrink-0 transition-colors" />
                  </Link>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#141821]/50 rounded-b-2xl border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] text-gray-400 text-center">
                <CalendarClock className="w-3 h-3 inline mr-1 -mt-0.5" />
                Fechas de reportes de ganancias estimadas · Toca una empresa para ver detalles
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
