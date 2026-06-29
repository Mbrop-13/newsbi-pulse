"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Check, AlertTriangle, ArrowUpRight, ArrowDownRight, Mail, Trash2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function getLogoUrl(symbol: string): string {
  return `https://assets.parqet.com/logos/symbol/${symbol}`;
}
function getFallbackLogo(symbol: string): string {
  return `https://ui-avatars.com/api/?name=${symbol}&background=1890FF&color=fff&bold=true&size=96`;
}

interface PriceAlertCardProps {
  result: any;
}

export function PriceAlertCard({ result }: PriceAlertCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [existingAlerts, setExistingAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const symbol = result?.alert?.symbol;
  const success = result?.success;

  // Cargar alertas activas del usuario (especialmente las del símbolo recién alertado)
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        setLoadingAlerts(true);
        const query = supabase
          .from('price_alerts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        // Si creamos una alerta para un símbolo concreto, mostramos las de ese símbolo primero
        const { data } = symbol
          ? await query.eq('symbol', symbol).limit(10)
          : await query.limit(5);
        if (data) setExistingAlerts(data);
      } catch {
        // tabla puede no existir; fallar silenciosamente
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, [symbol, success]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setExistingAlerts(prev => prev.filter(a => a.id !== id));
    try {
      const supabase = createClient();
      await supabase.from('price_alerts').delete().eq('id', id);
    } catch {
      /* ignore */
    } finally {
      setDeletingId(null);
    }
  };

  if (!result) return null;

  const { alert, message, error } = result;

  return (
    <div className="w-full max-w-sm my-3 transition-all duration-300">
      {/* Header */}
      <div className={`flex items-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-[#141821] border border-gray-200/80 dark:border-white/10 rounded-2xl shadow-sm ${isOpen ? 'rounded-b-none border-b-0 shadow-none' : ''}`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md shrink-0 bg-gradient-to-br ${success ? 'from-[#1890FF] to-indigo-600 text-white' : 'from-amber-500 to-orange-600 text-white'}`}>
          {success ? (
            <Bell className="w-4.5 h-4.5 animate-bounce" />
          ) : (
            <AlertTriangle className="w-4.5 h-4.5" />
          )}
        </div>

        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
            {success ? 'Alerta de Precio' : 'Error en Alerta'}
          </p>
          <span className="text-[11px] text-gray-400">
            {success ? `${alert?.symbol || ''} · Creada${existingAlerts.length > 1 ? ` · ${existingAlerts.length} activas` : ''}` : 'No se pudo crear'}
          </span>
        </div>

        <button onClick={() => setIsOpen(!isOpen)} className="p-1">
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Content Body */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm text-left">
              {success ? (
                <div className="p-4 space-y-3">
                  {/* Alerta recién creada */}
                  <div className="flex items-center justify-between p-3 bg-[#1890FF]/5 dark:bg-white/[0.02] border border-[#1890FF]/10 dark:border-white/[0.05] rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        <img src={getLogoUrl(alert.symbol)} alt={alert.symbol} className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(alert.symbol); }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          {alert.symbol} · Precio objetivo
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          {alert.condition === 'above' ? (
                            <><ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> Si sube de</>
                          ) : (
                            <><ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" /> Si baja de</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-black text-[#1890FF] tabular-nums">
                        ${Number(alert.target_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Activa
                      </span>
                    </div>
                  </div>

                  {/* Lista de alertas activas existentes */}
                  {existingAlerts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Bell className="w-3 h-3" /> Alertas activas
                      </p>
                      <div className="space-y-1.5">
                        {existingAlerts.map((a) => {
                          const isCreated = a.id === alert?.id;
                          return (
                            <div key={a.id} className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${isCreated ? 'bg-[#1890FF]/5' : 'bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04]'}`}>
                              <div className="w-6 h-6 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                                <img src={getLogoUrl(a.symbol)} alt="" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.src = getFallbackLogo(a.symbol); }} />
                              </div>
                              <span className="text-[11px] font-bold text-gray-900 dark:text-white">{a.symbol}</span>
                              {a.condition === 'above'
                                ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                : <ArrowDownRight className="w-3 h-3 text-rose-500" />}
                              <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 tabular-nums flex-1">
                                ${Number(a.target_price).toFixed(2)}
                              </span>
                              {isCreated && <Check className="w-3 h-3 text-emerald-500" />}
                              <button
                                onClick={() => handleDelete(a.id)}
                                disabled={deletingId === a.id}
                                className="text-gray-300 hover:text-red-500 transition-colors p-0.5 disabled:opacity-50"
                                title="Eliminar alerta"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {loadingAlerts && (
                    <div className="flex items-center justify-center py-2">
                      <RefreshCw className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                    </div>
                  )}

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal flex items-start gap-1.5 pl-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <span>Te avisaremos cuando el precio alcance el valor objetivo.</span>
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2.5">
                  <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 leading-snug">
                        {error || 'No se pudo crear la alerta'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mt-1">
                        {message || 'Verifica que no hayas excedido el límite de alertas de tu plan.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
