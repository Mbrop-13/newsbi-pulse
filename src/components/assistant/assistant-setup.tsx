"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, ArrowLeft, Loader2, X, TrendingUp, Check } from "lucide-react";
import { useAssistantStore, Ticker } from "@/lib/stores/assistant-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export const PREDEFINED_TOPICS = [
  "Tecnología", "Startups", "Criptomonedas", "Inversión en Bolsa",
  "Política", "Economía", "Derecho", "Negocios", "Internacionales",
  "Salud", "Energía", "Bienes Raíces", "Medio Ambiente",
  "Mercados Emergentes", "Inteligencia Artificial"
];

export const TOPIC_INTERESTS: Record<string, string[]> = {
  "Tecnología": ["Apple", "Nvidia", "Microsoft", "Google", "Tesla", "Samsung", "TSMC", "ASML", "Intel", "AMD", "Meta", "Amazon", "Oracle", "IBM", "Palantir", "Snowflake", "Databricks", "UiPath", "CrowdStrike"],
  "Startups": ["Seed", "Series A", "Series B", "Unicornios", "Healthtech", "Fintech", "Edtech", "Climate Tech", "Foodtech", "Mobility", "SaaS", "AI Startups", "Deep Tech"],
  "Criptomonedas": ["Bitcoin", "Ethereum", "Solana", "Cardano", "Ripple", "USDT", "USDC", "Binance Coin", "Avalanche", "Polkadot", "Chainlink", "DeFi", "NFT", "Layer-2", "Meme Coins", "Stablecoins"],
  "Inversión en Bolsa": ["CMPC", "SQM-B", "COPEC", "ENEL", "Falabella", "Cencosud", "Latam Airlines", "IPSA", "S&P 500", "Nasdaq", "Dow Jones", "AAPL", "NVDA", "TSLA", "AMZN", "GOOGL", "MSFT", "META"],
  "Política": ["Chile", "Argentina", "Brasil", "México", "Colombia", "Perú", "Ecuador", "Uruguay", "Estados Unidos", "China", "España", "Reino Unido", "Francia", "Alemania", "Rusia"],
  "Economía": ["Inflación", "Tasa de interés", "PIB", "Dólar", "UF", "Euro", "Banco Central", "Fed (USA)", "BCE", "Empleo", "Desempleo", "IPC", "IMT"],
  "Derecho": ["Derecho Laboral", "Derecho Tributario", "Derecho Corporativo", "Derecho Digital", "Propiedad Intelectual", "Derecho Ambiental", "Derecho Inmobiliario", "Compliance"],
  "Negocios": ["Retail", "Minería", "Agroindustria", "Telecomunicaciones", "Energía", "Logística", "Turismo", "Farmacéutica", "Construcción", "Banca", "Seguros", "E-commerce"],
  "Internacionales": ["Estados Unidos", "China", "Europa", "Medio Oriente", "Asia Pacífico", "América Latina", "Conflictos Geopolíticos", "Comercio Internacional"],
  "Salud": ["Farmacéutica", "Biotecnología", "Telemedicina", "Oncología", "Dispositivos Médicos", "Isapres", "Fonasa", "Vacunas"],
  "Energía": ["Litio", "Hidrógeno Verde", "Renovables", "Solar", "Eólica", "Petróleo", "Gas", "Nuclear", "Transición Energética", "Enel", "Colbún"],
  "Bienes Raíces": ["Las Condes", "Vitacura", "Providencia", "Santiago Centro", "Miami", "Madrid", "Residencial", "Comercial", "Fondos Inmobiliarios"],
  "Medio Ambiente": ["Cambio Climático", "Sostenibilidad", "ESG", "Carbono Neutral", "Economía Circular", "Litio Sostenible", "Agua", "Regulación Ambiental"],
  "Mercados Emergentes": ["Latam", "India", "Sudeste Asiático", "África", "BRICS", "Mercados Frontera"],
  "Inteligencia Artificial": ["OpenAI", "Anthropic", "Google Gemini", "Meta AI", "Modelos Abiertos", "Regulación IA", "Hardware IA", "Inversión IA"]
};

const STEP_LABELS = ["Nombre", "Temas", "Enfoque", "Portafolio"];

export function AssistantSetup() {
  const { user } = useAuthStore();
  const {
    name, setName,
    topics, addTopic, removeTopic,
    tickers, addTicker, removeTicker,
    interests, toggleInterest,
    completeSetup, cancelSetup, saveToSupabase
  } = useAssistantStore();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ticker[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [topicSearchQuery, setTopicSearchQuery] = useState("");
  const [topicSearchResults, setTopicSearchResults] = useState<Ticker[]>([]);
  const [isTopicSearching, setIsTopicSearching] = useState(false);

  const totalSteps = 2 + topics.length + 1;

  // Determine which "phase" we're in for the step indicator
  const getPhase = () => {
    if (step === 1) return 0;
    if (step === 2) return 1;
    if (step > 2 && step <= 2 + topics.length) return 2;
    return 3;
  };

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) setSearchResults(await res.json());
      } catch (err) { console.error("Search error", err); }
      finally { setIsSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!topicSearchQuery.trim()) { setTopicSearchResults([]); return; }
    const t = setTimeout(async () => {
      setIsTopicSearching(true);
      try {
        const res = await fetch(`/api/finance/search?q=${encodeURIComponent(topicSearchQuery)}`);
        if (res.ok) setTopicSearchResults(await res.json());
      } catch (err) { console.error("Topic Search error", err); }
      finally { setIsTopicSearching(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [topicSearchQuery]);

  const handleNext = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && topics.length === 0) return;
    if (step < totalSteps) { setStep(s => s + 1); }
    else { completeSetup(); if (user?.id) setTimeout(() => saveToSupabase(user.id), 100); }
  };

  const handleBack = () => { if (step > 1) setStep(s => s - 1); };

  const phase = getPhase();
  const subInterestIndex = step > 2 && step <= 2 + topics.length ? step - 3 : -1;
  const currentTopic = subInterestIndex >= 0 ? topics[subInterestIndex] : "";
  const subOptions = currentTopic ? (TOPIC_INTERESTS[currentTopic] || []) : [];
  const selectedSubs = currentTopic ? (interests[currentTopic] || []) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* ── Mock Dashboard Background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div className="w-full h-full flex">
          {/* Mock Chat Panel */}
          <div className="w-[35%] h-full bg-white dark:bg-[#0F1629] border-r border-gray-100 dark:border-white/5 flex flex-col">
            {/* Mock Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1890FF] to-indigo-600" />
              <div className="w-px h-7 bg-gray-200 dark:bg-white/10" />
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#1890FF] to-indigo-500" />
              <div className="space-y-1">
                <div className="h-2.5 w-20 bg-gray-200 dark:bg-white/10 rounded-full" />
                <div className="h-1.5 w-12 bg-green-200 dark:bg-green-500/20 rounded-full" />
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5" />
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5" />
                <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-white/5" />
                <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
            {/* Mock Messages */}
            <div className="flex-1 p-4 space-y-4">
              <div className="flex justify-start"><div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/5 px-4 py-3 space-y-1.5"><div className="h-2 w-44 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-32 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-24 bg-gray-200 dark:bg-white/10 rounded-full" /></div></div>
              <div className="flex justify-end"><div className="max-w-[70%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#1890FF] to-blue-600 px-4 py-3 space-y-1.5"><div className="h-2 w-36 bg-white/30 rounded-full" /><div className="h-2 w-28 bg-white/30 rounded-full" /></div></div>
              <div className="flex justify-start"><div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/5 px-4 py-3 space-y-1.5"><div className="h-2 w-48 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-40 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-28 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-20 bg-gray-200 dark:bg-white/10 rounded-full" /></div></div>
              <div className="flex justify-end"><div className="max-w-[60%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-[#1890FF] to-blue-600 px-4 py-3 space-y-1.5"><div className="h-2 w-32 bg-white/30 rounded-full" /></div></div>
              <div className="flex justify-start"><div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-white/5 px-4 py-3 space-y-1.5"><div className="h-2 w-40 bg-gray-200 dark:bg-white/10 rounded-full" /><div className="h-2 w-36 bg-gray-200 dark:bg-white/10 rounded-full" /></div></div>
            </div>
            {/* Mock Input */}
            <div className="p-4"><div className="h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10" /></div>
          </div>

          {/* Mock News Panel */}
          <div className="flex-1 h-full bg-[#F8F9FB] dark:bg-[#080C16] flex flex-col">
            {/* Mock News Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-3">
              <div className="h-3 w-20 bg-gray-300 dark:bg-white/15 rounded-full" />
              <div className="h-5 w-16 bg-gray-100 dark:bg-white/5 rounded-full" />
            </div>
            {/* Mock Topic Chips */}
            <div className="px-6 py-2.5 flex gap-2 border-b border-gray-100 dark:border-white/5">
              <div className="h-7 w-14 rounded-lg bg-[#1890FF] opacity-70" />
              <div className="h-7 w-20 rounded-lg bg-gray-100 dark:bg-white/5" />
              <div className="h-7 w-24 rounded-lg bg-gray-100 dark:bg-white/5" />
              <div className="h-7 w-16 rounded-lg bg-gray-100 dark:bg-white/5" />
            </div>
            {/* Mock News Cards */}
            <div className="flex-1 p-6 space-y-5 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 p-5 flex gap-4">
                  <div className="flex-1 space-y-2.5">
                    <div className="flex gap-2"><div className="h-4 w-12 rounded bg-blue-100 dark:bg-blue-500/10" /><div className="h-4 w-16 rounded bg-gray-100 dark:bg-white/5" /></div>
                    <div className="h-3 w-full bg-gray-200 dark:bg-white/10 rounded-full" />
                    <div className="h-3 w-4/5 bg-gray-200 dark:bg-white/10 rounded-full" />
                    <div className="h-2 w-3/5 bg-gray-100 dark:bg-white/5 rounded-full" />
                  </div>
                  <div className="w-24 h-20 rounded-xl bg-gray-100 dark:bg-white/5 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blur + darken overlay */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xl" />
      </div>

      {/* ── White Popup Card (on top) ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-black/30 border border-gray-200/50 dark:border-white/10 flex flex-col p-8 md:p-10 overflow-hidden mx-4"
      >
        {/* Cancel / Close button */}
        <button 
          onClick={cancelSetup}
          className="absolute top-5 right-5 p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all z-20 hover:rotate-90"
          title="Cancelar y volver"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-8 w-full max-w-md mx-auto">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  i < phase ? "bg-[#1890FF] text-white" :
                  i === phase ? "bg-[#1890FF] text-white ring-4 ring-[#1890FF]/20" :
                  "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500"
                }`}>
                  {i < phase ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[10px] font-bold mt-1.5 ${i <= phase ? "text-[#1890FF]" : "text-gray-400"}`}>{label}</span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div className={`h-[2px] flex-1 mx-1 -mt-4 transition-colors ${i < phase ? "bg-[#1890FF]" : "bg-gray-100 dark:bg-slate-800"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait">

            {/* STEP 1: Name */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
                  Ponle nombre a tu asistente
                </h2>
                <p className="text-gray-400 text-sm mb-10 max-w-sm">Dale una identidad única a tu analista personal de IA.</p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Alpha, Jarvis..."
                  className="w-full max-w-md text-center text-4xl md:text-5xl font-black bg-transparent border-b-2 border-gray-200 dark:border-slate-700 focus:border-[#1890FF] focus:outline-none py-4 transition-colors text-gray-900 dark:text-white placeholder:text-gray-200 dark:placeholder:text-slate-700"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              </motion.div>
            )}

            {/* STEP 2: Topics */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">¿Qué temas quieres monitorear?</h2>
                  <p className="text-gray-400 text-sm mt-1">Selecciona hasta 5 dominios clave</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[340px] overflow-y-auto pr-1 scrollbar-thin">
                  {PREDEFINED_TOPICS.map(topic => {
                    const sel = topics.includes(topic);
                    const dis = !sel && topics.length >= 5;
                    return (
                      <button key={topic} onClick={() => sel ? removeTopic(topic) : addTopic(topic)} disabled={dis}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold text-left transition-all border ${
                          sel ? "bg-[#1890FF] text-white border-[#1890FF] shadow-md" :
                          "bg-white dark:bg-slate-800/60 text-gray-700 dark:text-gray-300 border-gray-100 dark:border-slate-700 hover:border-[#1890FF]/40 disabled:opacity-25"
                        }`}>
                        <div className="flex items-center justify-between">
                          <span>{topic}</span>
                          {sel && <Check className="w-4 h-4 flex-shrink-0" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Sub-Interests */}
            {step > 2 && step <= 2 + topics.length && (
              <motion.div key={`sub-${currentTopic}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 flex flex-col items-center">
                <div className="text-center mb-6">
                  <span className="text-[10px] font-bold text-[#1890FF] uppercase tracking-widest">{currentTopic}</span>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1 tracking-tight">¿Qué te interesa específicamente?</h2>
                  <p className="text-gray-400 text-sm mt-1">Selecciona los subtemas relevantes (opcional)</p>
                </div>
                {currentTopic === "Inversión en Bolsa" && (
                  <div className="relative w-full max-w-lg mx-auto z-50 mb-6">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" value={topicSearchQuery} onChange={(e) => setTopicSearchQuery(e.target.value)} placeholder="Buscar acciones o ETF (Ej: AAPL, SPY)..."
                      className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#1890FF] transition-all font-medium shadow-sm" />
                    {isTopicSearching && <Loader2 className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#1890FF] animate-spin" />}
                    
                    {topicSearchResults.length > 0 && topicSearchQuery && (
                      <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto z-50 text-sm">
                        {topicSearchResults.map((r, idx) => (
                          <button key={`ts-${r.symbol}-${idx}`} onClick={() => { 
                              if (!interests[currentTopic]?.includes(r.symbol)) { 
                                toggleInterest(currentTopic, r.symbol); 
                                addTicker(r);
                              }
                              setTopicSearchQuery(""); setTopicSearchResults([]); 
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-left border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white">{r.symbol}</div>
                              <div className="text-xs text-gray-400 line-clamp-1">{r.name}</div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded uppercase">{r.exchange || "Market"}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 justify-center max-h-[280px] overflow-y-auto scrollbar-thin">
                  {Array.from(new Set([...subOptions, ...selectedSubs])).map(opt => {
                    const sel = selectedSubs.includes(opt);
                    return (
                      <button key={opt} onClick={() => {
                          toggleInterest(currentTopic, opt);
                          if (currentTopic === "Inversión en Bolsa") {
                            if (sel) removeTicker(opt);
                            else addTicker({ symbol: opt, name: opt, exchange: "Listado" });
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border flex items-center gap-1.5 ${
                          sel ? "bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF]/40" :
                          "bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700 hover:border-[#1890FF]/30"
                        }`}>
                        {opt}
                        {sel && <X className="w-3 h-3 text-[#1890FF]/70" />}
                      </button>
                    );
                  })}
                  {subOptions.length === 0 && (
                    <div className="py-10 text-center w-full">
                      <p className="text-gray-400 font-medium">Sin subfiltros predefinidos.</p>
                      <p className="text-xs text-gray-300 mt-1">La IA analizará todo el contexto de {currentTopic}.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Final: Tickers */}
            {step === totalSteps && (
              <motion.div key="sf" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 flex flex-col">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Portafolio (Opcional)</h2>
                  <p className="text-gray-400 text-sm mt-1">Agrega acciones o criptos específicas para un seguimiento directo</p>
                </div>

                <div className="relative w-full max-w-lg mx-auto z-50 mb-6">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar activo bursátil..."
                    className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl pl-12 pr-12 py-4 text-gray-900 dark:text-white focus:outline-none focus:border-[#1890FF] transition-all font-medium shadow-sm" />
                  {isSearching && <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#1890FF] animate-spin" />}
                  
                  {searchResults.length > 0 && searchQuery && (
                    <div className="absolute w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-52 overflow-y-auto z-50">
                      {searchResults.map((r, idx) => (
                        <button key={`${r.symbol}-${idx}`} onClick={() => { addTicker(r); setSearchQuery(""); setSearchResults([]); }}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 text-left border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white">{r.symbol}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">{r.name}</div>
                          </div>
                          <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-900 px-2 py-1 rounded uppercase">{r.exchange || "Market"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {tickers.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                    {tickers.map(t => (
                      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} key={t.symbol}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1890FF]/10 text-[#1890FF] rounded-lg text-sm font-bold border border-[#1890FF]/20">
                        {t.symbol}
                        <button onClick={() => removeTicker(t.symbol)} className="hover:bg-[#1890FF]/20 rounded-full p-0.5 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="w-full flex items-center justify-between pt-6 mt-auto border-t border-gray-100 dark:border-slate-800">
          <div>
            {step > 1 && (
              <button onClick={handleBack} className="flex items-center gap-1.5 px-5 py-3 text-gray-400 hover:text-gray-700 dark:hover:text-white font-semibold transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
            )}
          </div>
          <button onClick={handleNext} disabled={(step === 1 && !name.trim()) || (step === 2 && topics.length === 0)}
            className="flex items-center gap-2 px-8 py-3.5 bg-[#1890FF] hover:bg-blue-600 text-white rounded-xl font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg hover:-translate-y-0.5 active:translate-y-0">
            {step === totalSteps ? "Comenzar" : "Continuar"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
