"use client";

import { useState, useEffect } from "react";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useFilterStore } from "@/lib/stores/filter-store";
import { LayoutGrid, List, Monitor, LayoutTemplate, Maximize2, Type, Image as ImageIcon, ImageOff, RefreshCw, AlignLeft, TrendingUp, TrendingDown, Clock, CalendarDays, Settings2, Zap, Search, X, Check, Rss } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ViewSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ViewSettingsDialog({ isOpen, onClose }: ViewSettingsDialogProps) {
  const { 
    layout, setLayout,
    density, setDensity,
    fontSize, setFontSize,
    showImages, setShowImages,
    showPredictions, setShowPredictions,
    articleWidth, setArticleWidth,
    timePeriod, setTimePeriod,
    resetToDefaults
  } = useViewStore();
  const { availableSources, selectedSources, toggleSource, clearSources } = useFilterStore();
  const [sourceSearch, setSourceSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const getFavicon = (url: string) => {
    if (!url) return null;
    const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/im);
    return match ? `https://www.google.com/s2/favicons?domain=${match[1]}&sz=32` : null;
  };
  const filteredSrcs = availableSources.filter(s => s.name.toLowerCase().includes(sourceSearch.toLowerCase()));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[460px] overflow-hidden rounded-[2rem] bg-white/95 dark:bg-[#080C16]/95 backdrop-blur-3xl border border-gray-200/50 dark:border-white/5 shadow-2xl shadow-indigo-500/10 dark:shadow-blue-900/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[75vh] overflow-y-auto hidden-scrollbar flex flex-col">
              <div className="p-7 pb-5 border-b border-gray-100 dark:border-white/5 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-white/[0.02] relative">
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-950 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-2xl font-black flex items-center gap-2.5 text-gray-900 dark:text-white tracking-tight">
                  <div className="p-2 bg-[#1890FF]/10 rounded-xl">
                    <Settings2 className="w-5 h-5 text-[#1890FF]" />
                  </div>
                  Preferencias
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                  Ajusta el contenido y el diseño a tu medida. Los cambios se guardan y aplican al instante.
                </p>
              </div>

          <div className="p-7 space-y-9">
          
          {/* Time Period Filter */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-[#1890FF] flex items-center gap-2">
              <Clock className="w-4 h-4" /> Período de Tiempo
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { id: 'recent', label: 'Nuevas', icon: <Zap className="w-4 h-4 mb-1.5 opacity-70" /> },
                { id: '24h', label: '24 hrs', icon: <Clock className="w-4 h-4 mb-1.5 opacity-70" /> },
                { id: '7d', label: '7 Días', icon: <CalendarDays className="w-4 h-4 mb-1.5 opacity-70" /> },
                { id: '30d', label: '30 Días', icon: <CalendarDays className="w-4 h-4 mb-1.5 opacity-70" /> },
                { id: 'all', label: 'Todo', icon: <LayoutGrid className="w-4 h-4 mb-1.5 opacity-70" /> },
              ].map((tp) => {
                const isSelected = timePeriod === tp.id;
                return (
                  <button
                    key={tp.id}
                    onClick={() => setTimePeriod(tp.id as any)}
                    className={`group flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF] shadow-sm shadow-[#1890FF]/20' 
                        : 'border-transparent bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {tp.icon}
                    <span className="text-[11px] font-bold">{tp.label}</span>
                  </button>
                )
              })}
            </div>
          </div>



          {/* Density Toggle */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Maximize2 className="w-4 h-4" /> Densidad de Pantalla
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'compact', label: 'Compacta', gap: 'gap-0.5' },
                { id: 'comfortable', label: 'Cómoda', gap: 'gap-1.5' },
                { id: 'spacious', label: 'Amplia', gap: 'gap-3' },
              ].map((d) => {
                const isSelected = density === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDensity(d.id as any)}
                    className={`group flex flex-col items-center gap-3 p-3 rounded-2xl border-2 transition-all ${
                      isSelected 
                        ? 'border-[#1890FF] bg-blue-50/50 dark:bg-[#1890FF]/10 text-[#1890FF]' 
                        : 'border-transparent bg-gray-50 dark:bg-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-500'
                    }`}
                  >
                    {/* Visual Density Mockup */}
                    <div className={`w-8 h-8 flex flex-col opacity-80 group-hover:opacity-100 transition-all ${d.gap}`}>
                      <div className="w-full flex-1 bg-current rounded-sm" />
                      <div className="w-full flex-1 bg-current rounded-sm opacity-60" />
                    </div>
                    <span className="text-[11px] font-bold">{d.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Type className="w-4 h-4" /> Tamaño de Texto
            </label>
            <div className="flex bg-gray-100/50 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/50 dark:border-white/5 relative">
               <motion.div 
                 className="absolute top-1 bottom-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
                 initial={false}
                 animate={{
                   width: '33.33%',
                   left: fontSize === 'sm' ? '0%' : fontSize === 'base' ? '33.33%' : '66.66%'
                 }}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
               />
               
               {[
                 { id: 'sm', label: 'Pequeño', class: 'text-xs' },
                 { id: 'base', label: 'Mediano', class: 'text-sm' },
                 { id: 'lg', label: 'Grande', class: 'text-base' }
               ].map(size => (
                 <button
                   key={size.id}
                   onClick={() => setFontSize(size.id as any)}
                   className={`relative z-10 flex-1 py-2 font-medium transition-colors ${
                     fontSize === size.id ? 'text-[#1890FF]' : 'text-gray-500'
                   } ${size.class}`}
                 >
                   {size.label}
                 </button>
               ))}
            </div>
           </div>

          {/* Article Width */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" /> Ancho de Lectura
            </label>
            <div className="flex bg-gray-100/50 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/50 dark:border-white/5 relative">
               <motion.div 
                 className="absolute top-1 bottom-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm"
                 initial={false}
                 animate={{
                   width: '33.33%',
                   left: articleWidth === 'normal' ? '0%' : articleWidth === 'wide' ? '33.33%' : '66.66%'
                 }}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
               />
               
               {[
                 { id: 'normal', label: 'Estándar' },
                 { id: 'wide', label: 'Amplio' },
                 { id: 'full', label: 'Completo' }
               ].map(width => (
                 <button
                   key={width.id}
                   onClick={() => setArticleWidth(width.id as any)}
                   className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors ${
                     articleWidth === width.id ? 'text-[#1890FF]' : 'text-gray-500'
                   }`}
                 >
                   {width.label}
                 </button>
               ))}
            </div>
          </div>

          {/* Show Images Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${showImages ? 'bg-blue-100 dark:bg-[#1890FF]/20 text-[#1890FF]' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                {showImages ? <ImageIcon className="w-4 h-4" /> : <ImageOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Mostrar Imágenes</h4>
                <p className="text-xs text-gray-500">Oculta para velocidad pura</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowImages(!showImages)}
              className={`relative w-11 h-6 rounded-full transition-colors ${showImages ? 'bg-[#1890FF]' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <motion.div 
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: showImages ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          {/* Show Predictions Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${showPredictions ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>
                {showPredictions ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">Mercados de Predicción</h4>
                <p className="text-xs text-gray-500">Mantente al tanto de apuestas en eventos</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowPredictions(!showPredictions)}
              className={`relative w-11 h-6 rounded-full transition-colors ${showPredictions ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-700'}`}
            >
              <motion.div 
                className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: showPredictions ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
         </div>

          {/* ── Source Filtering ── */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <Rss className="w-4 h-4" /> Filtrar por Fuentes
            </label>
            {selectedSources.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1890FF]">{selectedSources.length} fuente{selectedSources.length > 1 ? 's' : ''} seleccionada{selectedSources.length > 1 ? 's' : ''}</span>
                <button onClick={clearSources} className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors">Limpiar</button>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fuente..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 rounded-xl border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-[#1890FF] outline-none transition-all"
              />
              {sourceSearch && (
                <button onClick={() => setSourceSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>
              )}
            </div>
            <div className="max-h-[200px] overflow-y-auto hidden-scrollbar flex flex-col gap-1 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] p-2">
              {filteredSrcs.length === 0 ? (
                <p className="text-xs text-center text-gray-400 py-4">No se encontraron fuentes.</p>
              ) : filteredSrcs.map((source) => {
                const isSelected = selectedSources.includes(source.name);
                const favicon = getFavicon(source.url);
                return (
                  <button
                    key={source.name}
                    onClick={() => toggleSource(source.name)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left ${
                      isSelected ? 'bg-[#1890FF]/10 text-[#1890FF] ring-1 ring-[#1890FF]/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {favicon ? (
                      <img src={favicon} alt="" className="w-5 h-5 rounded-full bg-white object-contain shrink-0" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                    )}
                    <span className="truncate flex-1">{source.name}</span>
                    {isSelected && <Check className="w-4 h-4 shrink-0 text-[#1890FF]" />}
                  </button>
                );
              })}
            </div>
          </div>

         </div>
         </div>

        <div className="p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex justify-between items-center rounded-b-[2rem] z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          <button 
            onClick={resetToDefaults}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#1890FF] transition-colors px-4 py-2.5 rounded-xl hover:bg-[#1890FF]/10"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restablecer
          </button>
          
          <button 
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white text-sm font-black shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            Hecho
          </button>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
