"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, TrendingDown, Bell, BarChart3, ExternalLink, Trash2, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";

export function LandingPortfolioDemo() {
  const [shares, setShares] = useState(50);
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="py-24 bg-white border-b border-slate-100 text-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-sm font-bold tracking-widest text-[#1890FF] uppercase mb-3">
            MOCKUP DEL PORTAFOLIO
          </h2>
          <p className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Control exacto sobre tus activos
          </p>
          <p className="mt-4 text-slate-500 text-base md:text-lg">
            Monitorea el rendimiento de tus inversiones, crea alertas y genera tu agenda económica mediante IA tal como se ve dentro de la plataforma.
          </p>
        </div>

        {/* Portfolio Interface Mockup */}
        <div className="max-w-6xl mx-auto bg-slate-50 border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl">
          
          {/* Summary metrics row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Valor Portafolio</p>
              <p className="text-2xl font-black text-slate-900">$78,245.50</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Cambio Promedio</p>
              <p className="text-2xl font-black text-green-500 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> +8.45%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Assets list) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Search Bar */}
              <div className="flex items-center bg-white rounded-2xl border border-slate-200/60 px-4 py-3 shadow-sm">
                <Search className="w-5 h-5 text-slate-400 mr-3" />
                <input
                  type="text"
                  disabled
                  placeholder="Buscar símbolo o empresa (ej. AAPL, Tesla, MSFT)..."
                  className="flex-1 bg-transparent text-sm outline-none text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Assets list wrapper */}
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-lg">Tus Activos (3)</h3>

                {/* NVDA Asset */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:px-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                      <img src="https://assets.parqet.com/logos/symbol/NVDA" alt="NVDA" onError={(e) => e.currentTarget.style.display='none'} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">NVDA</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">NVIDIA Corporation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">$875.12</div>
                    <div className="text-xs font-semibold text-green-500 flex items-center justify-end gap-1">
                      <TrendingUp className="w-3 h-3" /> +4.25%
                    </div>
                  </div>
                </div>

                {/* AAPL Asset (EXPANDED BY DEFAULT TO SHOW ACTIONS) */}
                <div className="bg-white rounded-2xl border border-[#1890FF]/40 shadow-md overflow-hidden">
                  <button 
                    onClick={() => setExpanded(!expanded)} 
                    className="w-full p-4 sm:px-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                        <img src="https://assets.parqet.com/logos/symbol/AAPL" alt="AAPL" onError={(e) => e.currentTarget.style.display='none'} className="w-8 h-8 object-contain" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">AAPL</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Apple Inc.</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">$172.50</div>
                      <div className="text-xs font-semibold text-green-500 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> +1.45%
                      </div>
                    </div>
                  </button>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="px-5 pb-4 pt-1 border-t border-slate-100 bg-slate-50/50">
                          <div className="flex items-center gap-3 mt-3 mb-3">
                            <div className="flex-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Acciones</label>
                              <input
                                type="number"
                                value={shares}
                                onChange={(e) => setShares(parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 rounded-lg border border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF] text-sm font-bold outline-none"
                              />
                            </div>
                            <div className="flex-1 text-right">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Posición</label>
                              <p className="text-sm font-black text-slate-950">${(shares * 172.50).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-semibold">
                              <Bell className="w-3.5 h-3.5" /> Alerta
                            </button>
                            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 text-xs font-semibold">
                              <BarChart3 className="w-3.5 h-3.5" /> Mercado
                            </button>
                            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 text-purple-600 text-xs font-semibold">
                              <ExternalLink className="w-3.5 h-3.5" /> Noticias
                            </button>
                            <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-semibold">
                              <Trash2 className="w-3.5 h-3.5" /> Eliminar
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* TSLA Asset */}
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 sm:px-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 border border-slate-100">
                      <img src="https://assets.parqet.com/logos/symbol/TSLA" alt="TSLA" onError={(e) => e.currentTarget.style.display='none'} className="w-8 h-8 object-contain" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">TSLA</h4>
                      <p className="text-xs text-slate-500 line-clamp-1">Tesla, Inc.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">$175.40</div>
                    <div className="text-xs font-semibold text-red-500 flex items-center justify-end gap-1">
                      <TrendingDown className="w-3 h-3" /> -2.10%
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Right Column (AI Calendar & Alerts) */}
            <div className="space-y-6">
              
              {/* AI Calendar */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 flex flex-col h-[320px] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#1890FF] flex items-center justify-center text-white shadow-sm">
                      <Calendar className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-none">Calendario IA</h4>
                      <span className="text-[10px] text-[#1890FF] font-semibold">Agenda de activos</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#1890FF]/30 rounded-lg text-[10px] font-bold text-[#1890FF] shadow-xs">
                    <Sparkles className="w-2.5 h-2.5" /> Hacer Calendario
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto hidden-scrollbar pb-2">
                  <div className="bg-white/80 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5 shadow-2xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0 animate-pulse" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Ganancias Q2 • NVDA</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Hoy — Publicación del reporte tras el cierre del mercado.</p>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-xl p-3 border border-slate-100 flex items-start gap-2.5 shadow-2xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">Presentación Keynote • AAPL</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">5 jun. 2026 — Lanzamiento de nuevas herramientas de IA.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts */}
              <div className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm">
                <h4 className="font-bold text-slate-900 text-sm mb-4">Alertas de Precio (1)</h4>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-xs">
                      ▲
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">AAPL</p>
                      <p className="text-[10px] text-slate-500">Por encima de $185.00</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-red-500 text-xs font-bold">✕</button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
