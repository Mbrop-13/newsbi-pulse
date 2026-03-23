"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowRight, Bot, X, Search, Loader2 } from "lucide-react";
import { useAssistantStore, Ticker } from "@/lib/stores/assistant-store";

const PREDEFINED_TOPICS = [
  "Tecnología", "Startups", "Criptomonedas", "Finanzas",
  "Política", "Economía", "Derecho", "Negocios Internacionales",
  "Salud", "Energía", "Bienes Raíces", "Medio Ambiente",
  "Mercados Emergentes", "Inteligencia Artificial"
];

export default function AssistantSetupPage() {
  const router = useRouter();
  const { name, setName, topics, addTopic, removeTopic, tickers, addTicker, removeTicker, completeSetup } = useAssistantStore();
  
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ticker[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search for Yahoo Finance
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && topics.length === 0) return; // At least 1 topic

    if (step < 3) {
      setStep(s => s + 1);
    } else {
      completeSetup();
      router.push("/asistente");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-white/10">
        <div className="p-8 md:p-12">
          
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-50 dark:bg-[#1890FF]/10 rounded-full flex items-center justify-center">
              <Bot className="w-8 h-8 text-[#1890FF]" />
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Configura tu Asistente de IA
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Paso {step} de 3
            </p>
          </div>

          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {/* STEP 1: NAME */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-200 text-center">
                    Casi listo, ¿cómo te gustaría llamar a tu asistente?
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Jarvis, Alpha, Mi Analista..."
                    className="w-full text-center text-3xl font-bold bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-[#1890FF] focus:outline-none py-4 transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                  />
                </motion.div>
              )}

              {/* STEP 2: TOPICS */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-200 text-center mb-6">
                    Selecciona los temas de tu interés (Mínimo 1)
                  </label>
                  <div className="flex flex-wrap gap-3 justify-center">
                    {PREDEFINED_TOPICS.map(topic => {
                      const isSelected = topics.includes(topic);
                      return (
                        <button
                          key={topic}
                          onClick={() => isSelected ? removeTopic(topic) : addTopic(topic)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm ${
                            isSelected 
                              ? 'bg-[#1890FF] text-white border-transparent' 
                              : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-[#1890FF]/50'
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 3: TICKERS */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <label className="block text-lg font-medium text-gray-700 dark:text-gray-200 text-center">
                    ¿Tienes acciones o activos específicos en tu portafolio? (Opcional)
                  </label>
                  
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Busca una empresa o ticker (Ej. AAPL, Tesla)..."
                      className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-12 pr-4 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1890FF]/50"
                    />
                    {isSearching && (
                      <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>

                  {/* Dropdown Results */}
                  {searchResults.length > 0 && searchQuery && (
                    <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto hidden-scrollbar">
                      {searchResults.map((result, idx) => (
                        <button
                          key={`${result.symbol}-${idx}`}
                          onClick={() => {
                            addTicker(result);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left border-b border-gray-100 dark:border-white/5 last:border-0"
                        >
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{result.symbol}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{result.name}</div>
                          </div>
                          <div className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded">
                            {result.exchange || 'Market'}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Tickers */}
                  {tickers.length > 0 && (
                    <div className="mt-8">
                      <h4 className="text-sm font-semibold text-gray-500 mb-3 text-center">Tus Activos</h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {tickers.map(t => (
                          <div key={t.symbol} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 rounded-full text-sm font-bold border border-green-200 dark:border-green-500/20">
                            {t.symbol}
                            <button onClick={() => removeTicker(t.symbol)} className="hover:bg-green-200 dark:hover:bg-green-500/20 rounded-full p-0.5 transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-10 flex justify-center">
            <button
              onClick={handleNext}
              disabled={(step === 1 && !name.trim()) || (step === 2 && topics.length === 0)}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#1890FF] hover:bg-[#1890FF]/90 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Finalizar y Ver Dashboard" : "Continuar"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
