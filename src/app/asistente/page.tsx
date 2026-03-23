"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantStore, Ticker, debouncedSave } from "@/lib/stores/assistant-store";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Loader2, Send, Settings, Sparkles, User as UserIcon, Bot, Search, ArrowRight, X, TrendingDown, TrendingUp, Layers, ChevronRight, ArrowLeft, GripVertical, Trash2, Plus, Moon, Sun } from "lucide-react";
import { NewsCard } from "@/components/news-card";
import Link from "next/link";
import ReactMarkdown from 'react-markdown';
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";

const PREDEFINED_TOPICS = [
  "Tecnología", "Startups", "Criptomonedas", "Inversión en Bolsa",
  "Política", "Economía", "Derecho", "Negocios", "Internacionales",
  "Salud", "Energía", "Bienes Raíces", "Medio Ambiente",
  "Mercados Emergentes", "Inteligencia Artificial"
];

const TOPIC_INTERESTS: Record<string, string[]> = {
  "Tecnología": ["Apple", "Nvidia", "Microsoft", "Google", "Tesla", "Samsung", "TSMC", "ASML", "Intel", "AMD", "Meta", "Amazon", "Oracle", "IBM", "Palantir", "Snowflake", "Databricks", "UiPath", "CrowdStrike"],
  "Startups": ["Seed", "Series A", "Series B", "Unicornios", "Healthtech", "Fintech", "Edtech", "Climate Tech", "Foodtech", "Mobility", "SaaS", "AI Startups", "Deep Tech"],
  "Criptomonedas": ["Bitcoin", "Ethereum", "Solana", "Cardano", "Ripple", "USDT", "USDC", "Binance Coin", "Avalanche", "Polkadot", "Chainlink", "DeFi", "NFT", "Layer-2", "Meme Coins", "Stablecoins"],
  "Inversión en Bolsa": ["CMPC", "SQM-B", "COPEC", "ENEL", "Falabella", "Cencosud", "Latam Airlines", "IPSA", "S&P 500", "Nasdaq", "Dow Jones", "AAPL", "NVDA", "TSLA", "AMZN", "GOOGL", "MSFT", "META"],
  "Política": ["Chile", "Argentina", "Brasil", "México", "Colombia", "Perú", "Ecuador", "Uruguay", "Paraguay", "Bolivia", "Venezuela", "Panamá", "Costa Rica", "República Dominicana", "Estados Unidos", "China", "España", "Reino Unido", "Francia", "Alemania", "Italia", "Japón", "Corea del Sur", "India", "Rusia", "Australia"],
  "Economía": ["Inflación", "Tasa de interés", "PIB", "Dólar", "UF", "Euro", "Yen", "Banco Central de Chile", "Fed (USA)", "BCE (Europa)", "Banco de China", "Empleo", "Desempleo", "IPC", "IMT"],
  "Derecho": ["Derecho Laboral", "Derecho Tributario", "Derecho Corporativo", "Derecho Digital", "Propiedad Intelectual", "Derecho Ambiental", "Derecho Inmobiliario", "Regulación IA", "Compliance", "Litigios"],
  "Negocios": ["Retail", "Minería", "Agroindustria", "Telecomunicaciones", "Energía", "Logística", "Turismo", "Farmacéutica", "Construcción", "Banca", "Seguros", "E-commerce", "Food Delivery"],
  "Internacionales": ["Estados Unidos", "China", "España", "Reino Unido", "Francia", "Alemania", "Italia", "Japón", "Corea del Sur", "India", "Rusia", "Australia", "Brasil", "México", "Argentina", "Colombia", "Perú", "Ecuador", "Uruguay", "Panamá", "Costa Rica"],
  "Salud": ["Medicina General", "Farmacéutica", "Biotecnología", "Telemedicina", "Oncología", "Cardiología", "Salud Mental", "Nutrición", "Dispositivos Médicos", "Isapres", "Fonasa", "Vacunas", "Genómica"],
  "Energía": ["Litio", "Hidrógeno Verde", "Energías Renovables", "Solar", "Eólica", "Petróleo", "Gas", "Nuclear", "Transición Energética", "Enel", "Colbún", "Engie", "Copec", "Shell"],
  "Bienes Raíces": ["Las Condes", "Vitacura", "Providencia", "Ñuñoa", "Santiago Centro", "Viña del Mar", "Concón", "La Serena", "Antofagasta", "Buenos Aires", "Córdoba", "São Paulo", "Río de Janeiro", "CDMX", "Cancún", "Bogotá", "Medellín", "Lima", "Montevideo", "Miami", "Nueva York", "Madrid", "Barcelona", "Lisboa", "Departamento", "Casa", "Terreno", "Oficina", "Local Comercial", "Bodega", "Hotel"],
  "Medio Ambiente": ["Cambio Climático", "Sostenibilidad", "ESG", "Carbono Neutral", "Economía Circular", "Litio Sostenible", "Agua", "Deforestación", "Energías Limpias", "Regulación Ambiental"],
  "Mercados Emergentes": ["Brasil", "México", "Colombia", "Perú", "Argentina", "Chile", "India", "Indonesia", "Turquía", "Sudáfrica", "Nigeria", "Vietnam", "MSCI Emerging Markets", "BRICS"],
  "Inteligencia Artificial": ["OpenAI", "xAI", "Grok", "Anthropic", "DeepSeek", "Google Gemini", "Meta AI", "Midjourney", "Stability AI", "Runway", "Perplexity", "Claude", "GPT", "Llama", "Modelos chinos"]
};

export default function AssistantDashboardPage() {
  const router = useRouter();
  const { 
    name, setName, 
    topics, addTopic, removeTopic, 
    tickers, addTicker, removeTicker, 
    interests, toggleInterest,
    hasCompletedSetup, completeSetup,
    showPreferences, setShowPreferences,
    showSettings, setShowSettings,
    assistantTone, setAssistantTone,
    assistantRole, setAssistantRole
  } = useAssistantStore();
  
  const [articles, setArticles] = useState<any[]>([]);
  const [impactScores, setImpactScores] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isScoring, setIsScoring] = useState(false);
  
  // Setup Wizard State
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Ticker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Preferences Overlay State
  const [prefView, setPrefView] = useState<"main" | string>("main");

  // Layout resizing state
  const [chatWidth, setChatWidth] = useState(28); // Initial 28%
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((mouseMoveEvent: MouseEvent) => {
    if (isResizing) {
      const newWidth = (mouseMoveEvent.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) { // Safety bounds
        setChatWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);
  
  // Chat state — now driven by the Zustand store (synced with Supabase)
  const { messages, addMessage, clearMessages, loadMessages, saveMessage, clearMessagesSupabase, setMessages: setStoreMessages, loadFromSupabase, saveToSupabase, isLoadingConfig, resetSetup } = useAssistantStore();
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { theme, setTheme } = useTheme();
  const [showChatSearch, setShowChatSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Hydrate from Supabase on mount
  useEffect(() => {
    if (user?.id) {
      loadFromSupabase(user.id);
      loadMessages(user.id);
    }
  }, [user?.id]);

  const supabase = createClient();

  useEffect(() => {
    fetchPersonalizedNews();
  }, [hasCompletedSetup]);

  // Debounced search for Setup Wizard
  useEffect(() => {
    if (!searchQuery.trim() || hasCompletedSetup) {
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
  }, [searchQuery, hasCompletedSetup]);

  const totalSteps = 2 + topics.length + 1; // Name + Topic Selection + Detailed Topics + Yahoo Search

  const handleNextSetup = () => {
    if (step === 1 && !name.trim()) return;
    if (step === 2 && topics.length === 0) return;
    
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      completeSetup();
      // Save config to Supabase
      if (user?.id) {
        setTimeout(() => saveToSupabase(user.id), 100);
      }
    }
  };

  const handleBackSetup = () => {
    if (step > 1) setStep(s => s - 1);
  };

  const fetchPersonalizedNews = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('news_articles')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(60);

    if (data) {
      if (!hasCompletedSetup) {
        // If in setup mode, just show generic top news for the blurred background effect
        setArticles(data.slice(0, 10));
        setIsLoading(false);
        return;
      }

      // Filter by topics, tickers, or specific sub-interests
      const filtered = data.filter(a => {
        let match = false;
        if (Array.isArray(a.tags)) {
          // Check broad topics
          if (topics.some(t => a.tags.includes(t))) match = true;
          // Check specific tickers
          if (tickers.some(t => a.tags.includes(t.symbol))) match = true;
          // Check granular sub-interests across all selected topics
          Object.values(interests).forEach(subList => {
            if (subList.some(s => a.tags.includes(s))) match = true;
          });
        }
        
        // Fallback: title/content matching for tickers and interests
        if (!match) {
          const content = `${a.title || ''} ${a.summary || ''}`.toLowerCase();
          
          if (tickers.some(t => content.includes(t.symbol.toLowerCase()) || content.includes(t.name.toLowerCase()))) {
            match = true;
          }
          
          if (!match) {
             Object.values(interests).flat().forEach(interest => {
               if (content.includes(interest.toLowerCase())) match = true;
             });
          }
        }
        return match;
      });

      const top10 = filtered.slice(0, 10);
      setArticles(top10);
      setIsLoading(false);
      
      if (top10.length > 0) {
        evaluateImpact(top10);
      }
    } else {
      setIsLoading(false);
    }
  };

  const evaluateImpact = async (newsDocs: any[]) => {
    setIsScoring(true);
    try {
      const payload = {
        articles: newsDocs.map(a => ({ id: a.id, title: a.title, summary: a.summary })),
        userProfile: { topics, tickers, interests }
      };
      const res = await fetch('/api/ai/impact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const scores = await res.json();
        setImpactScores(scores);
      }
    } catch (e) {
      console.error("Impact parsing error", e);
    } finally {
      setIsScoring(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const userMessage = inputMsg;
    const userMsg = { role: 'user' as const, content: userMessage };
    addMessage(userMsg);
    if (user?.id) saveMessage(user.id, userMsg);
    setInputMsg('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          profile: { name, topics, tickers },
          contextArticles: articles.slice(0, 5)
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg = { role: 'assistant' as const, content: data.reply };
        addMessage(aiMsg);
        if (user?.id) saveMessage(user.id, aiMsg);
      } else {
        const errMsg = { role: 'assistant' as const, content: 'Lo siento, he perdido la conexión a mis servidores core.' };
        addMessage(errMsg);
        if (user?.id) saveMessage(user.id, errMsg);
      }
    } catch (error) {
      const errMsg = { role: 'assistant' as const, content: 'Lo siento, hubo un error de red.' };
      addMessage(errMsg);
      if (user?.id) saveMessage(user.id, errMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-gray-100 font-sans">
      
      {/* ── ALARMINGLY BEAUTIFUL SETUP OVERLAY ── */}
      <AnimatePresence>
        {!hasCompletedSetup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 relative max-h-[95vh] flex flex-col"
            >
              <div className="p-6 md:p-10 relative overflow-y-auto hidden-scrollbar flex-1">
                <div className="flex justify-center mb-6">
                  <div className="w-14 h-14 bg-blue-50 dark:bg-[#1890FF]/10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-md">
                    <Bot className="w-7 h-7 text-[#1890FF]" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    Configura tu IA
                  </h1>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1890FF] bg-blue-50 dark:bg-[#1890FF]/10 inline-block px-3 py-1 rounded-full">
                    Paso {step} de {totalSteps}
                  </p>
                </div>

                <div className="relative min-h-[380px]">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6 flex flex-col items-center justify-center h-full pt-12"
                      >
                        <label className="block text-xl font-medium text-gray-700 dark:text-gray-200 text-center">
                          ¿Qué nombre le darás a tu asistente?
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ej. Alpha, Jarvis..."
                          className="w-full max-w-md text-center text-4xl font-black bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:border-[#1890FF] focus:outline-none py-4 transition-colors placeholder:text-gray-300 dark:placeholder:text-gray-700"
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleNextSetup()}
                        />
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-200 text-center mb-6">
                           ¿Qué temas quieres que monitoree tu IA? Selecciona hasta 5
                        </label>
                        <div className="flex flex-wrap gap-2 justify-center max-h-[320px] overflow-y-auto pr-2 scrollbar-thin pt-2">
                          {PREDEFINED_TOPICS.map(topic => {
                            const isSelected = topics.includes(topic);
                            const isDisabled = !isSelected && topics.length >= 5;
                            return (
                              <button
                                key={topic}
                                onClick={() => isSelected ? removeTopic(topic) : addTopic(topic)}
                                disabled={isDisabled}
                                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                                  isSelected 
                                    ? 'bg-[#1890FF] text-white ring-2 ring-[#1890FF] ring-offset-2 dark:ring-offset-slate-900 scale-105' 
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-[#1890FF]/50 disabled:opacity-30'
                                }`}
                              >
                                {topic}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Step Dynamic: Sub-Interests for each topic */}
                    {step > 2 && step <= 2 + topics.length && (() => {
                      const topicIndex = step - 3;
                      const currentTopic = topics[topicIndex];
                      const options = TOPIC_INTERESTS[currentTopic] || [];
                      const selectedInterests = interests[currentTopic] || [];

                      return (
                        <motion.div
                          key={`step-topic-${currentTopic}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-6"
                        >
                          <div className="text-center mb-4">
                            <span className="text-[10px] font-bold text-[#1890FF] uppercase tracking-[0.2em] block mb-2">Interés Específico</span>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white line-clamp-1">{currentTopic}</h2>
                            <p className="text-sm text-gray-500 mt-2 italic px-8">Selecciona los elementos que te gustaría rastrear en esta categoría</p>
                          </div>

                          <div className="flex flex-wrap gap-2 justify-center max-h-[280px] overflow-y-auto pr-2 scrollbar-thin pt-2">
                            {options.map(opt => {
                              const isSelected = selectedInterests.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  onClick={() => toggleInterest(currentTopic, opt)}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                                    isSelected
                                      ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF] shadow-md shadow-blue-500/10 scale-105'
                                      : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700 hover:border-blue-200'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                            {options.length === 0 && (
                              <div className="py-10 text-center text-gray-500 italic">
                                La IA monitoreará este tema globalmente sin filtros adicionales.
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}

                    {step === totalSteps && (
                      <motion.div
                        key="step-final"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                      >
                        <label className="block text-lg font-medium text-gray-700 dark:text-gray-200 text-center">
                          Búsqueda Global de Activos
                        </label>
                        <p className="text-xs text-center text-gray-500 italic mb-4">Agrega empresas específicas para el seguimiento bursátil</p>
                        
                        <div className="relative z-50">
                          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ej. AAPL, Tesla, Microsoft..."
                            className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-12 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1890FF] focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
                          />
                          {isSearching && (
                            <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-[#1890FF] animate-spin" />
                          )}

                          {searchResults.length > 0 && searchQuery && (
                            <div className="absolute w-full mt-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-h-40 overflow-y-auto hidden-scrollbar transform origin-top animate-in slide-in-from-top-2">
                              {searchResults.map((result, idx) => (
                                <button
                                  key={`${result.symbol}-${idx}`}
                                  onClick={() => {
                                    addTicker(result);
                                    setSearchQuery("");
                                    setSearchResults([]);
                                  }}
                                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-blue-50 dark:hover:bg-[#1890FF]/10 transition-colors text-left border-b border-gray-100 dark:border-white/5 last:border-0 group"
                                >
                                  <div>
                                    <div className="font-bold text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{result.symbol}</div>
                                    <div className="text-sm text-gray-500 line-clamp-1">{result.name}</div>
                                  </div>
                                  <div className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-slate-900 px-2 py-1.5 rounded uppercase tracking-wider">
                                    {result.exchange || 'Market'}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {tickers.length > 0 && (
                          <div className="mt-4 pt-6 border-t border-gray-100 dark:border-slate-800">
                            <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest mb-4 text-center">Portafolio Estrella</h4>
                            <div className="flex flex-wrap gap-2.5 justify-center">
                              {tickers.map(t => (
                                <motion.div initial={{scale:0.8}} animate={{scale:1}} key={t.symbol} className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-[#1890FF]/10 to-blue-500/10 text-[#1890FF] rounded-xl text-xs font-bold border border-[#1890FF]/20 shadow-sm backdrop-blur-sm">
                                  {t.symbol}
                                  <button onClick={() => removeTicker(t.symbol)} className="bg-[#1890FF]/20 hover:bg-[#1890FF]/40 rounded-full p-1 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="mt-10 mb-6 flex items-center justify-center gap-4">
                  {step > 1 && (
                    <button
                      onClick={handleBackSetup}
                      className="px-8 py-4 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-2xl font-bold transition-all shadow-sm active:scale-95"
                    >
                      Atrás
                    </button>
                  )}
                  <button
                    onClick={handleNextSetup}
                    disabled={(step === 1 && !name.trim()) || (step === 2 && topics.length === 0)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-4 bg-[#1890FF] hover:bg-blue-600 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {step === totalSteps ? "Comenzar Experiencia" : "Continuar"}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALARMINGLY BEAUTIFUL PREFERENCES OVERLAY ── */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 relative"
            >
              {/* Close Modal Button */}
              <button 
                onClick={() => { 
                  setShowPreferences(false); 
                  if (user?.id) debouncedSave(user.id); 
                }} 
                className="absolute top-6 right-6 p-2 bg-gray-100/50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 z-10 group"
              >
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="p-8 md:p-12 relative overflow-hidden min-h-[400px]">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {prefView === "main" && (
                      <motion.div key="main" initial={{opacity: 0, scale: 0.95}} animate={{opacity: 1, scale: 1}} exit={{opacity: 0, scale: 0.95}} transition={{ duration: 0.2 }} className="space-y-4">
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-blue-50 dark:bg-[#1890FF]/10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-md">
                            <Layers className="w-8 h-8 text-[#1890FF]" />
                          </div>
                        </div>

                        <div className="text-center mb-6">
                          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                            Preferencias de IA
                          </h2>
                          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Afinando tu radar de noticias
                          </p>
                        </div>

                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4 mt-6">Temáticas Escaneadas ({topics.length})</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                          {topics.length > 0 ? topics.map(topic => (
                            <button
                              key={topic}
                              onClick={() => setPrefView(topic)}
                              className="flex items-center justify-between p-4 bg-gray-50 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 rounded-xl transition-all group border border-gray-100 dark:border-slate-700/50 shadow-sm hover:shadow-md"
                            >
                              <span className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-[#1890FF] transition-colors">{topic}</span>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1890FF] transition-colors" />
                            </button>
                          )) : (
                            <div className="col-span-1 sm:col-span-2 text-center py-8 text-gray-500 italic">No tienes temas configurados.</div>
                          )}
                        </div>
                        <div className="pt-6 mt-4 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                          <button 
                            onClick={() => { 
                              setShowPreferences(false); 
                              resetSetup(); 
                              if (user?.id) saveToSupabase(user.id); 
                            }}
                            className="flex w-full sm:w-auto justify-center items-center gap-2 text-[#1890FF] text-sm font-bold bg-blue-50 hover:bg-blue-100 dark:bg-[#1890FF]/10 dark:hover:bg-[#1890FF]/20 px-8 py-3.5 rounded-xl transition-colors"
                          >
                            <Bot className="w-4 h-4" /> Añadir Nuevos Temas o Redefinir AI
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {prefView !== "main" && (
                      <motion.div key="detail" initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}} transition={{ duration: 0.2 }} className="space-y-6">
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800">
                          <button onClick={() => setPrefView("main")} className="p-3 bg-gray-50 hover:bg-gray-200 dark:bg-slate-800/50 dark:hover:bg-slate-700 rounded-full text-gray-600 hover:text-[#1890FF] transition-colors flex-shrink-0 shadow-sm">
                            <ArrowLeft className="w-5 h-5" />
                          </button>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Ajustes de Interés</span>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">{prefView}</h3>
                          </div>
                        </div>

                        {(() => {
                          const options = TOPIC_INTERESTS[prefView] || [];
                          const selectedInterests = interests[prefView] || [];

                          return (
                            <div className="space-y-6">
                              {prefView === "Inversión en Bolsa" && (
                                <div className="mb-8">
                                   <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                     <TrendingUp className="w-4 h-4 text-[#1890FF]" /> Activos en Tiempo Real
                                   </h4>
                                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin mb-4">
                                     {tickers.length > 0 ? tickers.map(ticker => (
                                       <div key={ticker.symbol} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-700/50 rounded-xl group shadow-sm hover:shadow-md transition-shadow">
                                         <div>
                                           <div className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#1890FF] transition-colors">{ticker.symbol}</div>
                                           <div className="text-[10px] text-gray-500 line-clamp-1">{ticker.name}</div>
                                         </div>
                                         <button onClick={() => removeTicker(ticker.symbol)} className="text-gray-400 hover:text-red-500 p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all rounded-full hover:bg-red-50 dark:hover:bg-red-500/10">
                                           <X className="w-4 h-4" />
                                         </button>
                                       </div>
                                     )) : (
                                       <div className="col-span-1 sm:col-span-2 text-sm text-gray-500 italic py-4">No hay activos manuales configurados.</div>
                                     )}
                                   </div>
                                   <button 
                                      onClick={() => { setShowPreferences(false); resetSetup(); }}
                                      className="text-xs font-bold text-[#1890FF] hover:underline flex items-center gap-1"
                                    >
                                      + Agregar Ticker Personalizado (Yahoo Finance)
                                    </button>
                                </div>
                              )}

                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#1890FF]" /> Mapeo de Sub-Intereses
                                </h4>
                                <div className="flex flex-wrap gap-2.5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                  {options.map(opt => {
                                    const isSelected = selectedInterests.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => toggleInterest(prefView, opt)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                          isSelected
                                            ? 'bg-blue-50 dark:bg-[#1890FF]/10 text-[#1890FF] border-[#1890FF] shadow-sm scale-105'
                                            : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700 hover:border-blue-100'
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                  {options.length === 0 && (
                                    <div className="w-full py-8 text-center text-gray-400 italic text-sm border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-2xl">
                                      Este tema se monitorea de forma global. No hay filtros específicos disponibles.
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="pt-8 mt-4 border-t border-gray-100 dark:border-slate-800">
                                <button onClick={() => { removeTopic(prefView); setPrefView("main"); }} className="w-full py-4 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-2xl transition-all shadow-sm active:scale-95">
                                  Dejar de seguir {prefView}
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ALARMINGLY BEAUTIFUL SETTINGS OVERLAY ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/70 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 relative"
            >
              {/* Close Modal Button */}
              <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 bg-gray-100/50 hover:bg-gray-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500 z-10 group">
                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>

              <div className="p-8 md:p-12 relative overflow-y-auto max-h-[85vh] scrollbar-thin">
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-md">
                    <Settings className="w-8 h-8 text-indigo-500" />
                  </div>
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">
                    ADN del Asistente
                  </h2>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Modifica el nombre, tono y enfoque predictivo de tu IA.
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Name Input */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                       <UserIcon className="w-4 h-4 text-indigo-500" /> Identidad Visual
                    </label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombra a tu IA (ej. Arquímedes)"
                      className="w-full bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 rounded-xl px-4 py-3.5 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
                    />
                  </div>

                  {/* Tone Selectors */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                       <Bot className="w-4 h-4 text-indigo-500" /> Tono de Respuesta
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {["Analítico", "Sarcástico", "Directo", "Empático"].map((tone) => (
                        <button 
                          key={tone}
                          onClick={() => setAssistantTone(tone)}
                          className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${
                            assistantTone === tone 
                              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/50 shadow-sm'
                              : 'bg-white dark:bg-slate-800/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {tone}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role Selectors */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-3 flex items-center gap-2">
                       <Sparkles className="w-4 h-4 text-indigo-500" /> Arquetipo Estratégico
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["Mentor Financiero", "Observador Global", "Analista de Riesgos", "Oráculo Cripto"].map((role) => (
                        <button 
                          key={role}
                          onClick={() => setAssistantRole(role)}
                          className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all text-left flex items-center justify-between ${
                            assistantRole === role 
                              ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 ring-1 ring-indigo-500/50 shadow-sm'
                              : 'bg-white dark:bg-slate-800/40 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          {role}
                          {assistantRole === role && <div className="w-2 h-2 rounded-full bg-indigo-500" />}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="pt-8 mt-8 border-t border-gray-100 dark:border-slate-800 flex justify-center">
                  <button 
                    onClick={() => {
                      setShowSettings(false);
                      if (user?.id) debouncedSave(user.id);
                    }}
                    className="flex w-full sm:w-auto justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-10 py-4 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]"
                  >
                    Guardar Configuración y Volver
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CHAT SEARCH MODAL ── */}
      <AnimatePresence>
        {showChatSearch && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 relative">
              <div className="p-6 border-b border-gray-100 dark:border-white/5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input autoFocus placeholder="Buscar en tus chats anteriores..." className="w-full bg-gray-100 dark:bg-slate-800 rounded-2xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#1890FF]" />
                </div>
              </div>
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 mb-3">Chats Recientes</div>
                {[1, 2, 3].map(i => (
                  <button key={i} onClick={() => setShowChatSearch(false)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all flex items-center justify-between group">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Análisis de Mercado #{i}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">¿Cómo afectará la subida de tasas a las tecnológicas en...</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1890FF]" />
                  </button>
                ))}
              </div>
              <button onClick={() => setShowChatSearch(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── BACKGROUND DASHBOARD (Blurred when !hasCompletedSetup) ── */}
      <div className={`flex flex-col h-full w-full pt-16 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        (!hasCompletedSetup || showPreferences || showSettings || showChatSearch)
          ? "filter blur-md opacity-40 grayscale-[0.8] scale-[0.98] pointer-events-none select-none" 
          : "scale-100"
      }`}>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* LEFT PANEL: CHAT */}
          <div 
            style={{ width: `${chatWidth}%` }}
            className="flex flex-col border-r border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#0B1120]/50 backdrop-blur-sm relative min-w-[300px]"
          >
            {/* Chat header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-[#1890FF] to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-2 ring-white dark:ring-slate-800">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white leading-tight">{name || 'Mi Asistente'}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => { if(user?.id) clearMessagesSupabase(user.id); else clearMessages(); }} className="w-9 h-9 bg-[#1890FF]/10 text-[#1890FF] hover:bg-[#1890FF]/20 rounded-xl transition-all shadow-sm flex items-center justify-center group" title="Nuevo chat">
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 hidden-scrollbar">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-60 px-8">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-[#1890FF]/10 rounded-3xl flex items-center justify-center mb-6 ring-4 ring-white dark:ring-slate-900 shadow-sm">
                    <Sparkles className="w-8 h-8 text-[#1890FF]" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Hola, soy {name || 'tu asistente'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                     Analizo noticias de {topics.slice(0, 3).join(', ')} para darte una visión estratégica. ¿En qué puedo ayudarte hoy?
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-tr from-[#1890FF] to-blue-500 text-white border-[#1890FF] rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800/80 backdrop-blur-md text-gray-800 dark:text-gray-200 border-gray-100 dark:border-white/5 rounded-tl-none'
                    }`}>
                      <div className={`prose prose-sm dark:prose-invert max-w-none ${msg.role === 'user' ? 'text-white prose-headings:text-white prose-p:text-white prose-strong:text-white' : ''}`}>
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="m-0 whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md border border-gray-100 dark:border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 items-center shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '200ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '400ms' }} />
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 md:p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-t border-gray-100 dark:border-white/5">
              <form onSubmit={sendMessage} className="relative group">
                <input 
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder="Pregunta sobre los mercados o tus intereses..."
                  className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-2xl pl-5 pr-14 py-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1890FF] transition-all shadow-lg shadow-gray-200/50 dark:shadow-none"
                />
                <button type="submit" disabled={!inputMsg.trim() || isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#1890FF] hover:bg-blue-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 group-hover:scale-105 disabled:bg-gray-400">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* RESIZE HANDLE */}
          <div 
            onMouseDown={startResizing}
            className={`hidden md:flex absolute top-0 bottom-0 z-50 w-1.5 cursor-col-resize items-center justify-center group hover:bg-[#1890FF] transition-colors`}
            style={{ left: `${chatWidth}%`, transform: 'translateX(-50%)' }}
          >
            <div className="w-6 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <GripVertical className="w-4 h-4 text-gray-400 group-hover:text-[#1890FF]" />
            </div>
          </div>

          {/* RIGHT PANEL: NEWS FEED */}
          <div 
            style={{ width: `${100 - chatWidth}%` }}
            className="flex flex-col bg-gray-50/30 dark:bg-black/20 backdrop-blur-md overflow-hidden relative min-w-[300px]"
          >
            <div className="flex-1 overflow-y-auto hidden-scrollbar">
              <div className="max-w-3xl mx-auto p-4 md:p-8 md:pt-10">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                  <div>
                    <h2 className="text-3xl font-black flex items-center gap-2 text-gray-900 dark:text-white tracking-tight">
                      Feed Caleidoscópico <Sparkles className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                    </h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
                      Noticias y eventos decodificados exclusivamente para tu portafolio.
                    </p>
                  </div>
                  
                  <AnimatePresence>
                    {isScoring && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2 text-xs font-bold text-[#1890FF] bg-blue-50 dark:bg-[#1890FF]/10 px-4 py-2 rounded-full border border-blue-200 dark:border-[#1890FF]/20 shadow-sm"
                      >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Evaluando Impacto IA
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-32 text-gray-500">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-[#1890FF]/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50 dark:ring-[#1890FF]/5">
                      <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
                    </div>
                    <p className="font-semibold text-lg tracking-tight">Sincronizando espectros bursátiles...</p>
                  </div>
                ) : articles.length > 0 ? (
                  <div className="space-y-8 pb-20">
                    {articles.map((article, idx) => {
                      const impactCode = impactScores[article.id];
                      return (
                        <div key={article.id} className="relative group perspective">
                          <div className="transition-transform duration-500 ease-out group-hover:scale-[1.01]">
                            <NewsCard article={article} index={idx} />
                          </div>
                          
                          <AnimatePresence>
                            {impactCode && (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.8, x: -20, rotateY: 90 }}
                                animate={{ opacity: 1, scale: 1, x: 0, rotateY: 0 }}
                                transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                                className="absolute -right-4 -top-4 z-20 pointer-events-none"
                              >
                                <ImpactVisualizer code={impactCode} />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2rem] border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Espectro Vacío</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto font-medium">
                      Por ahora no hemos procesado artículos que coincidan de lleno con tus tags estrictos. Vuelve más tarde cuando la IA filtre nuevas publicaciones.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Visualizer Component for Impact Codes (N1-N5, P1-P5, NU) ──
function ImpactVisualizer({ code }: { code: string }) {
  const isPositive = code.startsWith('P');
  const isNegative = code.startsWith('N') && code !== 'NU';
  const isNeutral = code === 'NU';
  
  const intensityMatch = code.match(/\d+/);
  const intensity = intensityMatch ? parseInt(intensityMatch[0], 10) : 0;
  
  if (isNeutral) {
    return (
      <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/50 dark:border-slate-700/50 rounded-2xl px-4 py-3 flex items-center gap-3">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Impacto Neutral</span>
        <div className="w-10 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    );
  }

  const activeColor = isPositive ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.4)]';
  const inactiveColor = 'bg-gray-100 dark:bg-slate-700/50';

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-white/50 dark:border-slate-700/50 rounded-2xl p-4 flex flex-col gap-2 items-center min-w-[100px]">
      <div className="flex items-center gap-1.5 mb-1">
        {isPositive ? <TrendingUp className="w-3.5 h-3.5 text-green-500" /> : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
        <span className={`text-[10px] font-black uppercase tracking-[0.2em] leading-none ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isPositive ? 'Alza' : 'Alerta'}
        </span>
      </div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(level => (
          <div 
            key={level} 
            className={`w-3 h-4 rounded-[3px] transition-all duration-500 ${level <= intensity ? activeColor : inactiveColor} ${level <= intensity && isPositive ? 'animate-pulse-slow' : ''}`}
          />
        ))}
      </div>
      <div className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
        Nivel {intensity}/5
      </div>
    </div>
  );
}
