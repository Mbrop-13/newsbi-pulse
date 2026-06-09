"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Check, AlertTriangle, ArrowUpRight, ArrowDownRight, Mail } from 'lucide-react';

interface PriceAlertCardProps {
  result: any;
}

export function PriceAlertCard({ result }: PriceAlertCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!result) return null;

  const { success, alert, message, error } = result;

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
            {success ? `${alert?.symbol || ''} · Creada` : 'No se pudo crear'}
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
            <div className="bg-white dark:bg-[#141821] border border-t-0 border-gray-200/80 dark:border-white/10 rounded-b-2xl shadow-sm p-4 text-left space-y-3">
              {success ? (
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-55/40 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.05] rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className="text-sm font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg">
                        {alert.symbol}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Precio objetivo
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          {alert.condition === 'above' ? (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              Si sube de
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                              Si baja de
                            </>
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

                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal flex items-start gap-1.5 pl-0.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                    <span>Te enviaremos un correo electrónico inmediatamente cuando el precio alcance este valor.</span>
                  </p>
                </>
              ) : (
                <div className="space-y-2.5">
                  <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/10 dark:border-rose-500/20 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 leading-snug">
                        {error || 'No se pudo crear la alerta'}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-normal mt-1">
                        {message || 'Por favor verifica que no hayas excedido el límite de alertas activas de tu plan.'}
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
