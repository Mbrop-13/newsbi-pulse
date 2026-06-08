"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, Brain, Sparkles, Loader2, ExternalLink, Paperclip, BarChart3, Newspaper, Bell, TrendingUp, X, Globe, History, Trash2, Plus, MessageSquare, PanelLeftClose, PanelLeft, Settings, Moon, Sun, Monitor, Type, Maximize, CheckCircle2, Mic, Star, LineChart, PieChart, AreaChart, Target, Scale, Layers, ThumbsUp, ThumbsDown, RefreshCw, Share2, ChevronRight, Clock, Zap, ArrowDown, Lock, Crown, Gift, ArrowRight, FileText, CalendarDays, Briefcase, Users, Search, GripVertical } from "lucide-react";

import { useAIChatStore, ChatMessage, ToolResultUI } from "@/lib/stores/ai-chat-store";

// Global tracking of active swarm executions
const activeSwarmExecutions = new Map<string, boolean>();
import { useAssistantStore } from "@/lib/stores/assistant-store";
import { PREDEFINED_TOPICS } from "./assistant-setup";
import { getPlanConfig, PlanTier, getNextTier } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/stores/auth-store";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useChat } from 'ai/react';
import { AnalyzedNewsCard } from './analyzed-news-card';
import { PortfolioSummaryCard } from './portfolio-summary-card';
import { StockAnalysisCard } from './stock-analysis-card';
import { AIChartCard } from './ai-chart-card';
import { PromptCarousel } from './prompt-carousel';
import { ShareChatDialog } from './share-chat-dialog';
import { MiroFishSandbox } from "./mirofish-sandbox";
import { toast } from "sonner";

const ADVANCED_TOOLS = [
  { id: 'chart_bar', label: 'Gráfico de Barras', icon: BarChart3, category: 'Gráficos' },
  { id: 'chart_line', label: 'Gráfico de Líneas', icon: LineChart, category: 'Gráficos' },
  { id: 'chart_pie', label: 'Gráfico Circular', icon: PieChart, category: 'Gráficos' },
  { id: 'chart_area', label: 'Gráfico de Área', icon: AreaChart, category: 'Gráficos' },
  { id: 'chart_radar', label: 'Gráfico de Radar', icon: Target, category: 'Gráficos' },
  { id: 'analyze_stock', label: 'Análisis Fundamental', icon: TrendingUp, category: 'Análisis' },
  { id: 'compare_stocks', label: 'Comparar Acciones', icon: Scale, category: 'Análisis' },
  { id: 'get_sector_performance', label: 'Rendimiento Sectorial', icon: Layers, category: 'Análisis' },
];

function getGenericAgentName(index: number): string {
  return `Agente ${index + 1}`;
}

function sentimentColor(s: string) {
  if (s === 'bullish') return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20', hex: '#10b981' };
  if (s === 'bearish') return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20', hex: '#ef4444' };
  return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', hex: '#64748b' };
}

interface FullScreenChatProps {
  initialMode?: 'chat' | 'mirofish';
}

export function FullScreenChat({ initialMode = 'chat' }: FullScreenChatProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted) {
    return <div className="flex h-[100dvh] bg-white dark:bg-[#0a0a0a]" />;
  }
  
  return <FullScreenChatInternal initialMode={initialMode} />;
}

function FullScreenChatInternal({ initialMode }: { initialMode: 'chat' | 'mirofish' }) {
  const user = useAuthStore((s) => s.user);
  const userTier = useAuthStore((s) => s.user?.role === "admin" ? "ultra" : (s.user?.tier || "free")) as PlanTier;

  const [isStoreHydrated, setIsStoreHydrated] = useState(false);
  useEffect(() => {
    setIsStoreHydrated(useAIChatStore.persist.hasHydrated());
    const unsub = useAIChatStore.persist.onFinishHydration(() => setIsStoreHydrated(true));
    return () => unsub();
  }, []);

  const {
    messages, addMessage, isLoading, 
    attachedArticles, attachedFiles, attachFile,
    selectedModel, setModel, clearMessages,
    savedChats, loadChat, deleteSavedChat,
    cloudSyncEnabled, setCloudSync,
    favoriteTools, toggleFavoriteTool,
    activeTools, toggleTool, clearTools,
    messageFeedback, setFeedback, currentChatId
  } = useAIChatStore();
  
  const [showUpsell, setShowUpsell] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefTab, setPrefTab] = useState<'apariencia' | 'asistente' | 'datos' | 'cuenta'>('cuenta');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [realUsageCount, setRealUsageCount] = useState(0);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [attachMenuView, setAttachMenuView] = useState<'main' | 'charts' | 'analysis'>('main');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [shareDialog, setShareDialog] = useState({ isOpen: false, question: "", answer: "" });
  const [openReasoning, setOpenReasoning] = useState<Record<string, boolean>>({});
  const [showPortfolioDropdown, setShowPortfolioDropdown] = useState(false);
  const [portfolioDetails, setPortfolioDetails] = useState<any[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [swarmLoading, setSwarmLoading] = useState(false);
  const [collapsedThoughts, setCollapsedThoughts] = useState<Record<string, boolean>>({});

  // Sync swarmLoading with the background execution status for the currentChatId
  useEffect(() => {
    if (currentChatId) {
      setSwarmLoading(!!activeSwarmExecutions.get(currentChatId));
    } else {
      setSwarmLoading(false);
    }
  }, [currentChatId]);

  // ── Mode and Agent states ──
  const [activeChatMode, setActiveChatMode] = useState<'chat' | 'mirofish'>(initialMode);
  const [isMirofishActive, setIsMirofishActive] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState<any | null>(null);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);

  // Custom Platform Settings States
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("es");
  const [swarmDefaultModel, setSwarmDefaultModel] = useState<"fast" | "pro">("fast");
  const [swarmDefaultAgents, setSwarmDefaultAgents] = useState(4);

  // ── Reports State ──
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'reports' | 'agents'>('chats');

  useEffect(() => {
    if (activeChatMode !== 'mirofish') {
      setIsMirofishActive(false);
    }
  }, [activeChatMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const targetPath = activeChatMode === 'mirofish' ? '/ai/agentes' : '/ai';
      if (currentPath !== targetPath) {
        window.history.pushState(null, '', targetPath);
      }
    }
  }, [activeChatMode]);

  const loadSimulations = () => {
    if (typeof window !== "undefined") {
      const loaded = localStorage.getItem("r_swarm_simulations");
      if (loaded) {
        try {
          const parsed = JSON.parse(loaded);
          if (Array.isArray(parsed)) {
            setSavedSimulations(parsed);
            return;
          }
        } catch {}
      }
      setSavedSimulations([]);
    }
  };

  useEffect(() => {
    loadSimulations();
  }, [sidebarTab, activeChatMode]);

  useEffect(() => {
    if (activeChatMode === 'mirofish') {
      setSidebarTab('agents');
    }
  }, [activeChatMode]);

  // Sync custom settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSound = localStorage.getItem("r_sound_effects");
      if (savedSound !== null) setSoundEffectsEnabled(savedSound === "true");
      
      const savedLang = localStorage.getItem("r_language");
      if (savedLang) setSelectedLanguage(savedLang);

      const savedSwarmModel = localStorage.getItem("r_swarm_default_model");
      if (savedSwarmModel) setSwarmDefaultModel(savedSwarmModel as "fast" | "pro");

      const savedSwarmAgents = localStorage.getItem("r_swarm_default_agents");
      if (savedSwarmAgents) setSwarmDefaultAgents(parseInt(savedSwarmAgents) || 4);
    }
  }, []);

  const updateSoundEffects = (val: boolean) => {
    setSoundEffectsEnabled(val);
    localStorage.setItem("r_sound_effects", val ? "true" : "false");
  };

  const updateLanguage = (val: string) => {
    setSelectedLanguage(val);
    localStorage.setItem("r_language", val);
  };

  const updateSwarmDefaultModel = (val: "fast" | "pro") => {
    setSwarmDefaultModel(val);
    localStorage.setItem("r_swarm_default_model", val);
  };

  const updateSwarmDefaultAgents = (val: number) => {
    setSwarmDefaultAgents(val);
    localStorage.setItem("r_swarm_default_agents", val.toString());
  };

  // Fetch Supabase Auth user metadata for creation date
  useEffect(() => {
    if (user) {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          setUserMetadata(data.user);
        }
      });
    }
  }, [user]);

  const handleDeleteProfile = async () => {
    if (deleteConfirmText !== user?.email) {
      alert("Por favor escribe tu correo electrónico correctamente para confirmar.");
      return;
    }
    setIsDeletingProfile(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar el perfil");
      }
      
      // Successfully deleted on server, sign out locally
      useAuthStore.getState().logout();
      setShowDeleteConfirm(false);
      setShowPreferences(false);
      alert("Tu perfil y todos tus datos asociados han sido eliminados de forma permanente.");
      window.location.href = "/";
    } catch (err: any) {
      alert("Ocurrió un error: " + err.message);
    } finally {
      setIsDeletingProfile(false);
    }
  };
  const [reports, setReports] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportLoadingStep, setReportLoadingStep] = useState(0);

  const REPORT_LOADING_MESSAGES = [
    "Conectando con mercados financieros...",
    "Obteniendo cotizaciones en tiempo real...",
    "Calculando indicadores técnicos (RSI, MACD, Bollinger)...",
    "Analizando métricas fundamentales...",
    "Calculando volatilidad y riesgo...",
    "Evaluando valoración Graham...",
    "Consultando noticias recientes...",
    "Generando análisis con IA...",
    "Preparando recomendaciones...",
    "Finalizando informe profesional...",
  ];

  // Ref to always have the latest aiMessages available in callbacks
  const aiMessagesRef = useRef<any[]>([]);

  const { messages: aiMessages, input, handleInputChange, handleSubmit, setMessages: setAiMessages, append, isLoading: aiLoading, setInput, reload, data: streamData } = useChat({
    api: "/api/ai-chat",
    body: {
      articles: attachedArticles,
      files: attachedFiles,
      modelId: selectedModel,
      activeTools: activeTools,
    },
    onFinish: (message) => {
      clearTools();
      // Extract reasoning tokens from current streamData session
      const currentReasoning = streamData
        ?.filter((d: any) => d?.type === 'reasoning')
        ?.map((d: any) => d?.text)
        ?.join('') || '';

      // Use requestAnimationFrame to ensure aiMessages state has been flushed by React
      requestAnimationFrame(() => {
        const latestMessages = aiMessagesRef.current;
        const storeMessages: ChatMessage[] = latestMessages.map((m: any, idx: number) => {
          const isLastAssistant = m.role === 'assistant' && idx === latestMessages.length - 1;
          return {
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(),
            toolInvocations: m.toolInvocations,
            reasoning: isLastAssistant ? currentReasoning : (m.reasoning || undefined),
          };
        });
        useAIChatStore.setState({ messages: storeMessages });
        useAIChatStore.getState().updateCurrentChat();
        setTimeout(() => fetchRealUsage(), 800);
      });
    },
    onError: (error) => {
      console.error("[AI Chat] Stream error:", error);
      toast.error(error.message || "Ocurrió un error al procesar tu solicitud. Por favor intenta nuevamente.");
      // Re-fetch usage to keep client in sync (server only increments on success now)
      setTimeout(() => fetchRealUsage(), 500);
    }
  });

  // Keep the ref always up to date
  useEffect(() => {
    aiMessagesRef.current = aiMessages;
  }, [aiMessages]);

  // Track the last loaded chat to detect switches
  const lastLoadedChatIdRef = useRef<string | null>(null);
  // Track whether the current chat was loaded from history (for timestamp display)
  const isLoadedChatRef = useRef(false);

  // Sync store → aiMessages ONLY when a chat is explicitly loaded or cleared
  useEffect(() => {
    if (currentChatId !== lastLoadedChatIdRef.current) {
      lastLoadedChatIdRef.current = currentChatId;
      if (currentChatId && messages.length > 0) {
        // A saved chat was loaded — sync to useChat
        isLoadedChatRef.current = true;
        setAiMessages(messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolInvocations: m.toolInvocations,
        })) as any);
      } else if (!currentChatId) {
        // New chat / cleared
        isLoadedChatRef.current = false;
        setAiMessages([]);
      }
    }
  }, [currentChatId, messages]);
  
  // Chat Preferences
  const [chatPrefs, setChatPrefs] = useState({
    fontSize: "normal", // normal, large
    width: "standard" // standard, wide
  });
  const { theme, setTheme } = useTheme();
  const [openCitations, setOpenCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabase = createClient();

  const isPremium = userTier === "max" || userTier === "ultra";
  const canUsePro = userTier !== "free"; // Only paid users can use Pro model

  const config = getPlanConfig(userTier);
  const proConfig = getPlanConfig("pro");
  const questionLimit = userTier === "free" ? config.aiLifetimeMessages : config.aiMessagesPerMonth;
  const isUnlimited = questionLimit === -1;
  const reachedQuestionLimit = !isUnlimited && realUsageCount >= questionLimit;
  const nearLimit = !isUnlimited && realUsageCount >= Math.floor(questionLimit * 0.8) && !reachedQuestionLimit;
  
  const MAX_FILES = userTier === "free" ? 1 : userTier === "pro" ? 3 : 10;

  const [hasPortfolio, setHasPortfolio] = useState(false);

  // Fetch real usage from Supabase
  const fetchRealUsage = async () => {
    if (!user) return;
    if (userTier === "free") {
      const { data } = await supabase.from("lifetime_usage").select("ai_messages_total").eq("user_id", user.id).single();
      setRealUsageCount(data?.ai_messages_total || 0);
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
      const { data } = await supabase.from("monthly_usage").select("ai_messages").eq("user_id", user.id).eq("month", currentMonth).single();
      setRealUsageCount(data?.ai_messages || 0);
    }
  };

  useEffect(() => {
    fetchRealUsage();
  }, [user]);

  // Speech Recognition State & Logic
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef("");

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta reconocimiento de voz nativo. Por favor usa Chrome o Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false; // Parar al hacer pausa
      recognition.interimResults = true;
      recognition.lang = 'es-ES';

      let finalTranscript = "";
      baseInputRef.current = input;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInput(baseInputRef.current + (baseInputRef.current ? " " : "") + finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Error de voz:", event.error);
        if (event.error === 'not-allowed') {
           alert("Permiso de micrófono denegado. Por favor permítelo en tu navegador.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error(e);
      alert("Error al iniciar el micrófono.");
      setIsRecording(false);
    }
  };

  // Load preferences
  useEffect(() => {
    const savedPrefs = localStorage.getItem("r_ai_prefs");
    if (savedPrefs) {
      try { setChatPrefs(JSON.parse(savedPrefs)); } catch {}
    }
  }, []);

  // Save preferences
  useEffect(() => {
    localStorage.setItem("r_ai_prefs", JSON.stringify(chatPrefs));
  }, [chatPrefs]);

  // Fetch portfolio details with real-time quotes
  const fetchPortfolioDetails = async () => {
    if (!user) return;
    setLoadingPortfolio(true);
    try {
      const { data: dbAssets, error } = await supabase
        .from("portfolios")
        .select("symbol, company_name, shares")
        .eq("user_id", user.id);
      
      if (error) throw error;
      if (dbAssets && dbAssets.length > 0) {
        const symbols = dbAssets.map((a: any) => a.symbol).filter(Boolean);
        if (symbols.length > 0) {
          const res = await fetch(`/api/finance/portfolio?symbols=${symbols.join(",")}`);
          if (res.ok) {
            const data = await res.json();
            // Merge shares and company name
            const merged = data.map((quote: any) => {
              const dbAsset = dbAssets.find((a: any) => a.symbol.toUpperCase() === quote.symbol.toUpperCase());
              return {
                ...quote,
                shares: dbAsset?.shares || 0,
                companyName: dbAsset?.company_name || quote.symbol
              };
            });
            setPortfolioDetails(merged);
          }
        } else {
          setPortfolioDetails([]);
        }
      } else {
        setPortfolioDetails([]);
      }
    } catch (err) {
      console.error("Error fetching portfolio details:", err);
    } finally {
      setLoadingPortfolio(false);
    }
  };

  // Check if user has portfolio and load initial details
  useEffect(() => {
    if (user) {
      supabase.from("portfolios").select("id").eq("user_id", user.id).limit(1)
        .then(({ data }) => {
          setHasPortfolio(data ? data.length > 0 : false);
        });
      fetchPortfolioDetails();
    }
    
    // Auto-collapse sidebar on mobile
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [user]);

  // ── Reports Functions ──
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/portfolio-report');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (user && sidebarTab === 'reports') fetchReports();
  }, [user, sidebarTab]);

  // Rotate loading messages while generating
  useEffect(() => {
    if (!isGeneratingReport) { setReportLoadingStep(0); return; }
    const interval = setInterval(() => {
      setReportLoadingStep(prev => (prev + 1) % REPORT_LOADING_MESSAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isGeneratingReport]);

  const generateReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    setReportError(null);
    try {
      const res = await fetch('/api/portfolio-report', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || 'Error al generar el informe');
        return;
      }
      await fetchReports();
    } catch (e: any) {
      setReportError(e.message || 'Error de conexión');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const openReport = async (reportId: string) => {
    try {
      const supabaseClient = createClient();
      const { data } = await supabaseClient.from('portfolio_reports')
        .select('*').eq('id', reportId).single();
      if (data) {
        // Mark as read
        await supabaseClient.from('portfolio_reports').update({ is_read: true }).eq('id', reportId);
        fetchReports();
        // Open as interactive chat with report context
        clearMessages();
        setAiMessages([]);
        setSidebarTab('chats');
        if (window.innerWidth < 768) setIsSidebarOpen(false);
        const reportDate = new Date(data.created_at).toLocaleDateString('es-CL', { dateStyle: 'long' });
        const reportContext = `INFORME DE PORTAFOLIO GENERADO (${reportDate}):\n${JSON.stringify(data.report_data, null, 2)}\n\nINSTRUCCIÓN: El usuario acaba de abrir su informe de portafolio. Preséntale el informe completo de forma profesional usando formato markdown con tablas, encabezados y emojis. Estructura: 1) Resumen ejecutivo, 2) Alertas importantes, 3) Análisis por acción con veredictos y fórmulas, 4) Tabla de recomendaciones, 5) Métricas del portafolio, 6) Disclaimer legal completo. El usuario podrá hacerte preguntas de seguimiento sobre este informe.`;
        setTimeout(() => sendMessage("Muéstrame mi informe de portafolio", reportContext), 300);
      }
    } catch {}
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setIsUserAtBottom(scrollHeight - scrollTop - clientHeight < 150);
    }
  };

  // Auto-scroll
  useEffect(() => {
    if (isUserAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, aiLoading, isUserAtBottom]);

  const handleModelSelect = (mId: 'fast' | 'pro' | 'agent') => {
    if (mId === 'pro' && !canUsePro) {
      setShowUpsell(true);
      setShowModelMenu(false);
      return;
    }
    setModel(mId);
    setShowModelMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachedFiles.length >= MAX_FILES) {
      alert(`Has alcanzado el límite de ${MAX_FILES} archivos para tu plan.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        attachFile({
          id: Date.now().toString(),
          name: file.name,
          content: content.slice(0, 15000),
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sendSwarmAgentMessage = async (text: string) => {
    if (swarmLoading || aiLoading) return;
    setIsUserAtBottom(true);

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user' as const,
      content: text,
      timestamp: new Date()
    };

    // Synchronous Chat Creation if currentChatId is null
    let activeChatId = currentChatId;
    const isNewChat = !activeChatId;
    if (isNewChat) {
      activeChatId = Date.now().toString();
      lastLoadedChatIdRef.current = activeChatId;
      const userMsgStore: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      useAIChatStore.setState({
        currentChatId: activeChatId,
        messages: [userMsgStore]
      });
      useAIChatStore.getState().updateCurrentChat();
    }

    const targetChatId = activeChatId as string;
    activeSwarmExecutions.set(targetChatId, true);
    setSwarmLoading(true);

    setAiMessages(prev => [...prev, userMsg as any]);
    setInput("");

    // Thinking message representing the parallel swarm execution
    const thinkingMsgId = `thinking-${Date.now()}`;
    const thinkingMsg = {
      id: thinkingMsgId,
      role: 'assistant' as const,
      content: "",
      isSwarmThinking: true,
      secondsElapsed: 0,
      isCollapsed: false,
      reasoningSteps: [],
      timestamp: new Date()
    };
    setAiMessages(prev => [...prev, thinkingMsg as any]);

    // Background Execution
    (async () => {
      let seconds = 0;
      const interval = setInterval(() => {
        seconds++;
        if (useAIChatStore.getState().currentChatId === targetChatId) {
          setAiMessages(prev =>
            prev.map(m =>
              m.id === thinkingMsgId
                ? { ...m, secondsElapsed: seconds } as any
                : m
            )
          );
        }
      }, 1000);

      try {
        const res = await fetch("/api/agents/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleTitle: text,
            articleContent: attachedFiles.length > 0 ? attachedFiles[0].content : "",
            modelId: selectedModel === 'agent' ? 'pro' : selectedModel,
            rounds: 5,
            agentType: 'financial',
            agentCount: 4
          })
        });
        const data = await res.json();
        clearInterval(interval);

        if (!res.ok || !data.success) {
          throw new Error(data.error || "Error al simular la mesa redonda");
        }

        const finalSeconds = seconds;
        const finalThinkingMsg = {
          id: thinkingMsgId,
          role: 'assistant' as const,
          content: "",
          isSwarmThinking: true,
          isCollapsed: true,
          secondsElapsed: finalSeconds,
          reasoningSteps: data.reasoningSteps || [],
          timestamp: new Date()
        };

        const finalAssistantMsgId = `assistant-${Date.now()}`;
        const finalAssistantMsg = {
          id: finalAssistantMsgId,
          role: 'assistant' as const,
          content: data.finalAnswer,
          timestamp: new Date()
        };

        // Update the Zustand store first
        const currentStoreMessages = useAIChatStore.getState().messages;
        const userMsgIndex = currentStoreMessages.findIndex(m => m.id === userMsgId);
        let nextStoreMessages: ChatMessage[];
        if (userMsgIndex >= 0) {
          nextStoreMessages = [
            ...currentStoreMessages.slice(0, userMsgIndex + 1),
            finalThinkingMsg as any,
            finalAssistantMsg as any
          ];
        } else {
          nextStoreMessages = [
            ...currentStoreMessages,
            finalThinkingMsg as any,
            finalAssistantMsg as any
          ];
        }

        useAIChatStore.setState({ messages: nextStoreMessages });
        useAIChatStore.getState().updateCurrentChat();

        // If the chat is active, update the local state and reset loading
        if (useAIChatStore.getState().currentChatId === targetChatId) {
          setAiMessages(prev => {
            const filtered = prev.filter(m => m.id !== thinkingMsgId);
            return [...filtered, finalThinkingMsg as any, finalAssistantMsg as any];
          });
          setSwarmLoading(false);
        }

        setTimeout(() => fetchRealUsage(), 800);
      } catch (e: any) {
        clearInterval(interval);
        activeSwarmExecutions.delete(targetChatId);
        
        if (useAIChatStore.getState().currentChatId === targetChatId) {
          setSwarmLoading(false);
          toast.error(e.message || "Error al simular agentes");
          setAiMessages(prev => prev.filter(m => m.id !== thinkingMsgId));
        }
      } finally {
        activeSwarmExecutions.delete(targetChatId);
      }
    })();
  };

  const sendMessage = async (textOverride?: string, contextOverride?: string) => {
    const text = textOverride || input.trim();
    if (!text || aiLoading) return;

    if (selectedModel === 'agent') {
      sendSwarmAgentMessage(textOverride || input.trim());
      return;
    }
    
    if (reachedQuestionLimit) {
      setShowUpsell(true);
      return;
    }
    
    setIsUserAtBottom(true);

    // Synchronous Chat Creation if currentChatId is null
    let activeChatId = currentChatId;
    const isNewChat = !activeChatId;
    if (isNewChat) {
      activeChatId = Date.now().toString();
      lastLoadedChatIdRef.current = activeChatId;
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date()
      };
      useAIChatStore.setState({
        currentChatId: activeChatId,
        messages: [userMsg]
      });
      useAIChatStore.getState().updateCurrentChat();
    }

    // ONLY use append — this adds the user message to aiMessages AND triggers the API call.
    // The store sync happens in onFinish after the AI responds.
    append({ role: 'user', content: text }, {
      body: {
        articles: attachedArticles,
        files: attachedFiles,
        modelId: selectedModel,
        activeTools: activeTools,
        contextOverride: contextOverride || undefined
      }
    });
    if (!textOverride) handleInputChange({ target: { value: '' } } as any);
  };

  const shortcuts = [
    { label: "Mi portafolio", id: "portfolio_summary", query: "¿Cómo van mis acciones hoy?" },
    { label: "¿Qué pasó hoy?", id: "top_news", query: "Dame un resumen de las noticias más importantes de hoy." },
    { label: "Análisis de mercado", id: "market_analysis", query: "Analiza mi portafolio frente al mercado hoy." },
  ];

  // Dynamic classes based on preferences
  const maxWClass = chatPrefs.width === "wide" ? "max-w-5xl" : "max-w-3xl";
  const fontSizeClass = chatPrefs.fontSize === "large" ? "prose-lg" : "prose-base";
  const textClass = chatPrefs.fontSize === "large" ? "text-lg" : "text-[15px]";

  return (
    <div className="flex h-[100dvh] bg-white dark:bg-[#0a0a0a] overflow-hidden relative font-sans">
      
      {/* ─── LEFT SIDEBAR (HISTORY) ─── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="h-full border-r border-gray-100 dark:border-white/5 bg-[#FAFAFA] dark:bg-[#0F1117] flex flex-col flex-shrink-0 absolute md:relative z-50 shadow-2xl md:shadow-none overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col">
            <div className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <button 
                  onClick={() => { clearMessages(); setAiMessages([]); if(window.innerWidth < 768) setIsSidebarOpen(false); }}
                  className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-[#1890FF]/30 hover:bg-[#1890FF]/5 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#1890FF]">
                    <Plus className="w-4 h-4" /> Nuevo Chat
                  </div>
                  <Bot className="w-4 h-4 text-gray-400 group-hover:text-[#1890FF]" />
                </button>
                
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors"
                  title="Ocultar menú lateral"
                >
                  <PanelLeftClose className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Sidebar Tabs ── */}
            {/* ── Sidebar Tabs ── */}
            <div className="flex items-center mx-4 mt-1 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
              <button onClick={() => { setSidebarTab('chats'); setActiveChatMode('chat'); }} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${sidebarTab === 'chats' && activeChatMode !== 'mirofish' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <MessageSquare className="w-3.5 h-3.5" /> Chats
              </button>
              <button onClick={() => { setSidebarTab('reports'); setActiveChatMode('chat'); }} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all relative ${sidebarTab === 'reports' && activeChatMode !== 'mirofish' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                <FileText className="w-3.5 h-3.5" /> Informes
                {reports.some(r => !r.is_read) && <span className="absolute top-1 right-2 w-2 h-2 bg-[#1890FF] rounded-full animate-pulse" />}
              </button>
            </div>

            {/* ── Agents Tab (Similar Oval) ── */}
            <div className="flex items-center mx-4 mt-2 bg-gray-100 dark:bg-white/5 rounded-lg p-0.5">
              <button onClick={() => { setSidebarTab('agents'); setActiveChatMode('mirofish'); }} className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${activeChatMode === 'mirofish' ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                Agentes
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 hidden-scrollbar mt-2 pt-2">
              
              {sidebarTab === 'chats' && (
                /* ── Chats Tab ── */
                <>
                  {savedChats.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium border border-dashed border-gray-200 dark:border-gray-800 rounded-xl mx-2">
                      Tus chats recientes aparecerán aquí
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {savedChats.map((chat) => {
                        const chatDate = new Date(chat.timestamp);
                        const timeStr = chatDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                        const isActive = currentChatId === chat.id;
                        return (
                          <div 
                            key={chat.id} 
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                              isActive 
                                ? 'bg-[#1890FF]/10 border border-[#1890FF]/20' 
                                : 'hover:bg-gray-200/50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div className="flex-1 overflow-hidden" onClick={() => { loadChat(chat.id); setActiveChatMode('chat'); if(window.innerWidth < 768) setIsSidebarOpen(false); }}>
                              <p className={`text-[13px] font-semibold truncate pl-1 ${isActive ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'}`}>{chat.title}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1 mt-0.5 font-medium">{timeStr}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); deleteSavedChat(chat.id); }} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {sidebarTab === 'reports' && (
                /* ── Reports Tab ── */
                <div className="space-y-3 px-1">
                  {/* Generate Button */}
                  {userTier !== 'free' ? (
                    <button
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#1890FF]/20"
                    >
                      {isGeneratingReport ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Generando informe...</>
                      ) : (
                        <><FileText className="w-4 h-4" /> Generar Informe Ahora</>
                      )}
                    </button>
                  ) : (
                    <div className="flex flex-col items-center gap-2 px-3 py-4 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center">
                      <Lock className="w-5 h-5 text-gray-400" />
                      <p className="text-xs text-gray-500 font-medium">Informes disponibles desde el plan Pro</p>
                      <Link href="/suscripcion" className="text-[10px] font-bold text-[#1890FF] hover:underline">Actualizar Plan →</Link>
                    </div>
                  )}

                  {reportError && (
                    <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
                      {reportError}
                    </div>
                  )}

                  {isGeneratingReport && (
                    <div className="flex flex-col items-center gap-3 py-6">
                      <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-2 border-[#1890FF]/20" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#1890FF] animate-spin" />
                        <div className="absolute inset-2 rounded-full bg-[#1890FF]/10 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-[#1890FF] animate-pulse" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-900 dark:text-white animate-pulse">{REPORT_LOADING_MESSAGES[reportLoadingStep]}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {REPORT_LOADING_MESSAGES.map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${i <= reportLoadingStep ? 'bg-[#1890FF]' : 'bg-gray-300 dark:bg-gray-700'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Report List */}
                  {reports.length === 0 && !isGeneratingReport ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      Aún no has generado informes
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {reports.map((r) => {
                        const rDate = new Date(r.created_at);
                        const dateLabel = rDate.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
                        const timeLabel = rDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <button
                            key={r.id}
                            onClick={() => openReport(r.id)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#1890FF]/5 transition-colors text-left group border border-transparent hover:border-[#1890FF]/20"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!r.is_read ? 'bg-[#1890FF]/10 text-[#1890FF]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-semibold truncate ${!r.is_read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{r.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-gray-400">{dateLabel} · {timeLabel}</span>
                                <span className="text-[10px] text-gray-400">{r.symbols?.length || 0} activos</span>
                              </div>
                            </div>
                            {!r.is_read && <span className="w-2 h-2 bg-[#1890FF] rounded-full shrink-0 animate-pulse" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {sidebarTab === 'agents' && (
                /* ── Agents Tab ── */
                <>
                  {!Array.isArray(savedSimulations) || savedSimulations.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-400 text-xs font-medium border border-dashed border-gray-200 dark:border-gray-800 rounded-xl mx-2">
                      Tus debates de agentes aparecerán aquí
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {savedSimulations.map((sim: any) => {
                        const dateObj = new Date(sim.timestamp);
                        const timeStr = dateObj.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
                        const dateStr = dateObj.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
                        const isActive = selectedSimulation?.id === sim.id;
                        return (
                          <div 
                            key={sim.id} 
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                              isActive 
                                ? 'bg-[#1890FF]/10 border border-[#1890FF]/20' 
                                : 'hover:bg-gray-200/50 dark:hover:bg-white/5'
                            }`}
                          >
                            <div 
                              className="flex-1 overflow-hidden" 
                              onClick={() => {
                                setSelectedSimulation(sim);
                                setActiveChatMode('mirofish');
                                if (window.innerWidth < 768) setIsSidebarOpen(false);
                              }}
                            >
                              <p className={`text-[13px] font-semibold truncate pl-1 ${isActive ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'}`}>{sim.title}</p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 pl-1 mt-0.5 font-medium">{dateStr} · {timeStr} · {sim.swarmSize} agentes</p>
                            </div>
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                const list = savedSimulations.filter(s => s.id !== sim.id);
                                localStorage.setItem("r_swarm_simulations", JSON.stringify(list));
                                loadSimulations();
                                if (selectedSimulation?.id === sim.id) {
                                  setSelectedSimulation(null);
                                }
                              }} 
                              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1.5 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* User Limits at bottom of sidebar */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5 pb-2">
              <div className="bg-gradient-to-br from-[#1890FF]/5 to-indigo-500/5 rounded-xl p-3 border border-[#1890FF]/10 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Plan {userTier.charAt(0).toUpperCase() + userTier.slice(1)}</span>
                  <span className="text-[10px] font-bold text-[#1890FF]">{realUsageCount} / {isUnlimited ? "∞" : questionLimit}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5">
                  <div className="h-full bg-[#1890FF] rounded-full" style={{ width: `${isUnlimited ? 0 : Math.min(100, (realUsageCount / questionLimit) * 100)}%` }} />
                </div>
                {userTier !== "ultra" && userTier !== "max" && (
                  <Link href="/suscripcion" className="block text-center py-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-colors border border-indigo-100 dark:border-indigo-500/20">
                    Sube de Nivel
                  </Link>
                )}
              </div>
            </div>

            {/* Bottom Profile & Preferences */}
            <div className="p-3 pt-0">
              <button 
                onClick={() => setShowPreferences(true)}
                className="w-full flex items-center justify-between p-3 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1890FF] to-indigo-600 flex items-center justify-center shadow-md">
                    <span className="text-white text-xs font-bold">{user?.name ? user.name.charAt(0) : "U"}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user?.name || "Usuario"}</p>
                    <p className="text-[10px] text-gray-500 font-medium">Configuración</p>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-gray-400 group-hover:text-[#1890FF] group-hover:rotate-45 transition-all" />
              </button>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-white dark:bg-[#0a0a0a]">
        
        {/* Floating Quick Navigation Circles (Noticias, Mercados, Portafolio) */}
        {!isMirofishActive && activeChatMode !== 'mirofish' && (
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <Link 
              href="/noticias"
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#1890FF] hover:scale-105 shadow-sm hover:shadow-md hover:border-[#1890FF]/30 transition-all"
              title="Noticias"
            >
              <Newspaper className="w-4 h-4" />
            </Link>
            <Link 
              href="/mercados"
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 hover:scale-105 shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all"
              title="Mercados"
            >
              <TrendingUp className="w-4 h-4" />
            </Link>
            <div 
              className="relative"
              onMouseEnter={() => {
                setShowPortfolioDropdown(true);
                fetchPortfolioDetails();
              }}
              onMouseLeave={() => setShowPortfolioDropdown(false)}
            >
              <Link 
                href="/portafolio"
                className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-gray-800/80 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:scale-105 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all"
                title="Portafolio"
              >
                <Briefcase className="w-4 h-4" />
              </Link>

              <AnimatePresence>
                {showPortfolioDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-12 right-0 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-4"
                  >
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-150 dark:border-slate-800">
                      <span className="text-xs font-bold text-gray-850 dark:text-white flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                        Mi Portafolio
                      </span>
                      {portfolioDetails.length > 0 && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                          {portfolioDetails.length} Activos
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto hidden-scrollbar">
                      {loadingPortfolio && portfolioDetails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                          <span className="text-[10px] text-gray-400 font-medium">Cargando portafolio...</span>
                        </div>
                      ) : portfolioDetails.length === 0 ? (
                        <div className="text-center py-6 px-4">
                          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Tu portafolio está vacío. Agrega tus acciones para verlas aquí en tiempo real.</p>
                          <Link href="/portafolio" className="inline-block mt-2 text-[10px] font-bold text-emerald-500 hover:underline">Ir a Portafolio →</Link>
                        </div>
                      ) : (
                        portfolioDetails.map((asset) => {
                          const isPositive = asset.changePercent >= 0;
                          return (
                            <div key={asset.symbol} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800/40 border border-transparent hover:border-gray-100 dark:hover:border-slate-800/40 transition-all">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 overflow-hidden flex items-center justify-center shrink-0">
                                  <img 
                                    src={asset.logo} 
                                    alt={asset.symbol}
                                    onError={(e) => {
                                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=10B981&color=fff&bold=true&size=64`;
                                    }}
                                    className="w-6 h-6 object-contain"
                                  />
                                </div>
                                <div className="truncate">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">{asset.symbol}</p>
                                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5 max-w-[120px]">{asset.companyName}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white leading-none">${asset.price?.toFixed(2)}</p>
                                <p className={`text-[10px] font-bold mt-0.5 leading-none ${isPositive ? "text-green-500" : "text-red-500"}`}>
                                  {isPositive ? "+" : ""}{asset.changePercent?.toFixed(2)}%
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-150 dark:border-slate-800">
                      <Link 
                        href="/portafolio"
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shadow-emerald-500/10"
                      >
                        Ver Detalle Completo
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
        {/* Toggle Sidebar Button (Floating) */}
        {!isSidebarOpen && (activeChatMode !== 'mirofish' || !isMirofishActive) && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 flex items-center justify-center text-gray-500 hover:text-[#1890FF] shadow-sm hover:shadow-md transition-all"
            title="Abrir menú lateral"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        )}

        {/* Close Sidebar Mobile Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden absolute inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Main Content Area based on Mode */}
        {activeChatMode === 'mirofish' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-transparent">
            <MiroFishSandbox 
              selectedSimulation={selectedSimulation} 
              onClearSelected={() => setSelectedSimulation(null)} 
              onSimulationSaved={loadSimulations}
              onSimulationActiveChange={(isActive) => {
                setIsSidebarOpen(!isActive);
                setIsMirofishActive(isActive);
              }}
              onGoBack={() => {
                setActiveChatMode('chat');
                setSelectedSimulation(null);
                setSidebarTab('chats');
                setIsSidebarOpen(true);
              }}
            />
          </div>
        ) : (
          <>
            {/* Chat Messages */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto hidden-scrollbar relative pb-24">
          
          {/* ── Prompt Carousel (full width, outside max-w constraint) ── */}
          {isStoreHydrated && aiMessages.length === 0 && !aiLoading && (
            <div className="pt-24 md:pt-40">
              <PromptCarousel onSend={(query, contextOverride) => sendMessage(query, contextOverride)} />
            </div>
          )}

          <div className={`${maxWClass} mx-auto w-full px-4 md:px-8 ${aiMessages.length === 0 ? "pt-0" : "pt-10"} pb-8 transition-all duration-300`}>

            <div className="space-y-8">
              {aiMessages.map((msg, msgIndex) => {
                // Show timestamp ONLY for chats loaded from history
                // isLoadedChatRef.current is true only when navigating to a previously saved chat
                const showTimestamp = isLoadedChatRef.current && msgIndex === 0 && msg.role === 'user' && (msg as any).createdAt;
                const msgTime = (msg as any).createdAt ? new Date((msg as any).createdAt) : new Date();
                
                return (
                <div key={msg.id} className="w-full flex flex-col group">
                  {/* Timestamp — only shown when viewing a previously saved chat */}
                  {showTimestamp && (
                    <div className="flex items-center justify-center mb-3">
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100/80 dark:bg-white/5 px-3 py-1 rounded-full">
                        {msgTime.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} · {msgTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {/* Collapsible Swarm Thinking (R1-style tree) */}
                  {(msg as any).isSwarmThinking && (() => {
                    const isCollapsed = collapsedThoughts[msg.id] !== undefined
                      ? collapsedThoughts[msg.id]
                      : !!(msg as any).isCollapsed;
                    
                    return (
                      <div className="self-start w-full max-w-2xl bg-transparent border-none p-4 mb-4 text-left transition-all">
                        {/* Header */}
                        <button
                          onClick={() => setCollapsedThoughts(prev => ({
                            ...prev,
                            [msg.id]: !isCollapsed
                          }))}
                          className="flex items-center justify-between w-full text-left text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {swarmLoading && !isCollapsed && (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1890FF]" />
                            )}
                            <span>Pensando • {(msg as any).secondsElapsed || 0}s</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${!isCollapsed ? "rotate-90" : ""}`} />
                        </button>

                        {/* Chronological Timeline Tree */}
                        <AnimatePresence initial={false}>
                          {!isCollapsed && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden relative pl-4 border-l border-gray-200 dark:border-slate-800 space-y-4"
                            >
                              {(!(msg as any).reasoningSteps || (msg as any).reasoningSteps.length === 0) ? (
                                <div className="flex items-center gap-2 text-xs text-gray-450 italic">
                                  <Loader2 className="w-3.5 h-3 animate-spin text-[#1890FF]" />
                                  Orquestando agentes paralelos...
                                </div>
                              ) : (
                                (msg as any).reasoningSteps.map((step: any, idx: number) => {
                                  const isSearch = step.type === 'search';
                                  return (
                                    <div key={idx} className="relative flex items-start gap-3 text-xs">
                                      <div className="absolute -left-[22.5px] top-0.5 w-[13px] h-[13px] rounded-full bg-white dark:bg-[#0a0a0a] border border-gray-300 dark:border-slate-700 flex items-center justify-center">
                                        {isSearch ? (
                                          <Search className="w-2 h-2 text-gray-500 dark:text-gray-400" />
                                        ) : (
                                          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-slate-500" />
                                        )}
                                      </div>

                                      {isSearch ? (
                                        <div className="flex-1 flex items-center justify-between gap-4">
                                          <span className="text-gray-700 dark:text-gray-300 font-semibold leading-relaxed">
                                            Buscó en la web: <span className="text-gray-900 dark:text-white font-bold">&ldquo;{step.text}&rdquo;</span>
                                          </span>
                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                                              {step.resultsCount || 10} resultados
                                            </span>
                                            <div className="flex -space-x-1.5">
                                              {step.favicons?.slice(0, 3).map((fav: string, fidx: number) => (
                                                <div
                                                  key={fidx}
                                                  className="w-4.5 h-4.5 rounded-full border border-white dark:border-slate-900 overflow-hidden bg-white shrink-0 flex items-center justify-center shadow-sm"
                                                  style={{ zIndex: 10 - fidx }}
                                                >
                                                  <img
                                                    src={fav}
                                                    alt=""
                                                    className="w-full h-full object-cover bg-white"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                  />
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1 text-gray-500 dark:text-gray-400 italic leading-relaxed">
                                          {step.text}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  {/* Resolved Agent Debate Message */}
                  {(msg as any).isDebateMsg && (
                    <div className="self-start flex gap-4 mb-4 items-start group w-full text-left">
                      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-slate-850 flex items-center justify-center shrink-0 border border-gray-200/80 dark:border-slate-800 text-lg shadow-sm">
                        {(msg as any).agentAvatar}
                      </div>
                      <div className="flex-grow bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-850 rounded-3xl px-5 py-4 max-w-2xl relative shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[10px] font-black text-gray-900 dark:text-white leading-none block">{(msg as any).agentName}</span>
                            <span className="text-[7.5px] text-gray-400 dark:text-gray-550 font-bold block uppercase mt-0.5 tracking-wider">{(msg as any).agentRole}</span>
                          </div>
                          {(() => {
                            const sc = sentimentColor((msg as any).sentiment || 'neutral');
                            return (
                              <span className={`text-[7.5px] font-black uppercase px-1.5 py-0.5 rounded leading-none border ${sc.bg} ${sc.text} ${sc.border}`}>
                                {(msg as any).sentiment}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed font-medium">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Message */}
                  {msg.role === "user" && !(msg as any).isSwarmLoadingPlaceholder && !(msg as any).isThinking && !(msg as any).isDebateMsg ? (
                    <div className="self-end max-w-[85%] bg-gray-100 dark:bg-slate-800 rounded-[2rem] rounded-tr-sm px-6 py-4 shadow-sm border border-black/5 dark:border-white/5">
                      <p className={`${textClass} text-gray-900 dark:text-gray-100 font-medium whitespace-pre-wrap leading-relaxed`}>{msg.content}</p>
                    </div>
                  ) : msg.role === "assistant" && !(msg as any).isSwarmLoadingPlaceholder && !(msg as any).isThinking && !(msg as any).isDebateMsg ? (
                    /* Assistant Message */
                    <div className="flex max-w-full">
                      <div className="flex-1 space-y-3 min-w-0">
                        
                        {/* Native AI SDK Tools */}
                        {msg.toolInvocations?.map((toolInvocation) => {
                          if (toolInvocation.state === 'result') {
                            if (toolInvocation.toolName === 'get_portfolio_summary') {
                              return <PortfolioSummaryCard key={toolInvocation.toolCallId} result={toolInvocation.result} />;
                            }
                            if (['analyze_stock', 'compare_stocks', 'screen_market', 'get_sector_performance'].includes(toolInvocation.toolName)) {
                              return <StockAnalysisCard key={toolInvocation.toolCallId} toolName={toolInvocation.toolName} result={toolInvocation.result} />;
                            }
                            if (toolInvocation.toolName === 'render_chart') {
                              return <AIChartCard key={toolInvocation.toolCallId} result={toolInvocation.result} />;
                            }
                            return <AnalyzedNewsCard key={toolInvocation.toolCallId} toolName={toolInvocation.toolName} result={toolInvocation.result} />;
                          }
                          return (
                            <div key={toolInvocation.toolCallId} className="flex items-center gap-2 px-3 py-1.5 bg-[#1890FF]/5 text-[#1890FF] rounded-xl text-xs font-bold w-fit animate-pulse border border-[#1890FF]/20">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Analizando datos...
                            </div>
                          );
                        })}

                        {/* Reasoning / CoT Collapse Box */}
                        {(() => {
                          const isLastAssistant = msg.id === aiMessages.filter(m => m.role === 'assistant').pop()?.id;
                          // Extract reasoning from streamData if it is actively streaming
                          let streamReasoning = "";
                          if (isLastAssistant && streamData && streamData.length > 0) {
                            streamReasoning = (streamData as any[])
                              .filter((d: any) => d?.type === 'reasoning')
                              .map((d: any) => d?.text)
                              .join('');
                          }
                          const reasoningText = (msg as any).reasoning || streamReasoning;
                          if (!reasoningText) return null;

                          const isReasoningOpen = openReasoning[msg.id] !== false; // open by default

                          return (
                            <div className="bg-transparent border-none p-3.5 mb-2.5 transition-all">
                              <button 
                                onClick={() => setOpenReasoning(prev => ({ ...prev, [msg.id]: !isReasoningOpen }))}
                                className="flex items-center justify-between w-full text-left text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <Brain className="w-4 h-4 text-purple-500" />
                                  <span>Pensamiento de la IA</span>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${isReasoningOpen ? "rotate-90" : ""}`} />
                              </button>
                              
                              <AnimatePresence initial={false}>
                                {isReasoningOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap leading-relaxed border-l-2 border-purple-500/30 pl-3.5">
                                      {reasoningText}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })()}

                        {msg.content && (
                          <div className={`prose ${fontSizeClass} dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed prose-p:my-3 prose-headings:my-5 prose-h1:text-2xl prose-h2:text-xl prose-a:text-[#1890FF] prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-li:my-1`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ children }) => (
                                  <div className="overflow-x-auto my-4 rounded-xl border border-gray-200 dark:border-gray-700/50 shadow-sm">
                                    <table className="w-full text-sm border-collapse">{children}</table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="bg-gray-50 dark:bg-slate-800/80">{children}</thead>
                                ),
                                th: ({ children }) => (
                                  <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">{children}</th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-4 py-2.5 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-100 dark:border-gray-800 font-medium">{children}</td>
                                ),
                                tr: ({ children }) => (
                                  <tr className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">{children}</tr>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Action Bar & Expandable Citations */}
                        {(!aiMessages[msgIndex + 1] || aiMessages[msgIndex + 1].role === 'user') && (
                          <div className="flex flex-col gap-2 mt-3 pt-2">
                            <div className="flex items-center flex-wrap gap-1.5">
                              
                              {/* Sources Pill Widget */}
                              {(() => {
                                // Check per-message annotations first
                                const citationAnnotation = msg.annotations?.find((a: any) => a?.type === 'citations') as any;
                                let citationsList = citationAnnotation?.urls || (msg as any).citations;
                                // Fallback: check streamData (useChat data) for the last assistant message
                                if ((!citationsList || citationsList.length === 0) && streamData && streamData.length > 0) {
                                  const isLastAssistant = msg.id === aiMessages.filter(m => m.role === 'assistant').pop()?.id;
                                  if (isLastAssistant) {
                                    const sdCitation = (streamData as any[]).find((d: any) => d?.type === 'citations');
                                    if (sdCitation?.urls) citationsList = sdCitation.urls;
                                  }
                                }
                                if (!citationsList || citationsList.length === 0) return null;
                                
                                const isOpen = openCitations[msg.id];
                                
                                return (
                                  <button 
                                    onClick={() => setOpenCitations(prev => ({ ...prev, [msg.id]: !isOpen }))}
                                    className="flex items-center gap-1.5 w-fit pl-1.5 pr-2.5 py-1 bg-white hover:bg-gray-50 dark:bg-[#1A1A1A] dark:hover:bg-[#222] border border-gray-200 dark:border-gray-800 rounded-full transition-all cursor-pointer group shadow-sm mr-1.5"
                                  >
                                    <div className="flex -space-x-2">
                                      {citationsList.slice(0, 3).map((url: string, i: number) => {
                                        let hostname = "globe";
                                        try { hostname = new URL(url).hostname; } catch {}
                                        return (
                                          <div
                                            key={i}
                                            className="w-[18px] h-[18px] rounded-full border-[1.5px] border-white dark:border-[#0a0a0a] bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center relative"
                                            style={{ zIndex: 3 - i }}
                                          >
                                            <img 
                                              src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`} 
                                              alt="" 
                                              className="w-full h-full object-cover bg-white" 
                                              onError={(e) => { e.currentTarget.style.display='none'; }}
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <span className="text-[12px] font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                                      {citationsList.length} Sitios
                                    </span>
                                  </button>
                                );
                              })()}

                              {/* Share Button */}
                              <button 
                                onClick={() => {
                                  // Find previous user message
                                  const prevUserMsg = aiMessages.slice(0, msgIndex).reverse().find(m => m.role === 'user');
                                  setShareDialog({ 
                                    isOpen: true, 
                                    question: prevUserMsg ? prevUserMsg.content : "Pregunta sobre inteligencia financiera...", 
                                    answer: msg.content 
                                  });
                                }}
                                className="p-1.5 text-gray-400 hover:text-[#1890FF] hover:bg-[#1890FF]/10 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Compartir"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>

                            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700/50 mx-1" />

                            {/* Like */}
                            <button 
                              onClick={() => setFeedback(msg.id, messageFeedback[msg.id] === 'like' ? null : 'like')}
                              className={`p-1.5 rounded-lg transition-colors ${messageFeedback[msg.id] === 'like' ? "text-green-500 bg-green-500/10" : "text-gray-400 hover:text-green-500 hover:bg-green-500/10"}`}
                              title="Buena respuesta"
                            >
                              <ThumbsUp className={`w-4 h-4 ${messageFeedback[msg.id] === 'like' ? "fill-current" : ""}`} />
                            </button>
                            
                            {/* Dislike */}
                            <button 
                              onClick={() => setFeedback(msg.id, messageFeedback[msg.id] === 'dislike' ? null : 'dislike')}
                              className={`p-1.5 rounded-lg transition-colors ${messageFeedback[msg.id] === 'dislike' ? "text-red-500 bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-500/10"}`}
                              title="Mala respuesta"
                            >
                              <ThumbsDown className={`w-4 h-4 ${messageFeedback[msg.id] === 'dislike' ? "fill-current" : ""}`} />
                            </button>

                            {/* Regenerate (Only on last AI message) */}
                            {msg.id === aiMessages.filter(m => m.role === 'assistant').pop()?.id && !aiLoading && (
                              <>
                                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700/50 mx-1" />
                                <button 
                                  onClick={() => reload()}
                                  className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                                  title="Regenerar respuesta"
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Expanded Citations List */}
                          {(() => {
                            const citationAnnotation = msg.annotations?.find((a: any) => a?.type === 'citations') as any;
                            let citationsList = citationAnnotation?.urls || (msg as any).citations;
                            // Fallback: check streamData for the last assistant message
                            if ((!citationsList || citationsList.length === 0) && streamData && streamData.length > 0) {
                              const isLastAssistant = msg.id === aiMessages.filter(m => m.role === 'assistant').pop()?.id;
                              if (isLastAssistant) {
                                const sdCitation = (streamData as any[]).find((d: any) => d?.type === 'citations') as any;
                                if (sdCitation?.urls) citationsList = sdCitation.urls;
                              }
                            }
                            if (!citationsList || citationsList.length === 0 || !openCitations[msg.id]) return null;
                            
                            return (
                              <AnimatePresence>
                                <motion.div
                                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="bg-gray-50 dark:bg-slate-800/30 border border-gray-200/60 dark:border-gray-800/60 rounded-xl p-3 flex flex-wrap gap-2">
                                    <p className="w-full text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1.5"><Globe className="w-3 h-3" /> Fuentes Citadas</p>
                                    {citationsList.map((url: string, i: number) => {
                                      let hostname = url;
                                      try { hostname = new URL(url).hostname.replace("www.", ""); } catch {}
                                      return (
                                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-400 hover:text-[#1890FF] dark:hover:text-[#1890FF] transition-colors bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 py-1 px-2.5 rounded-lg shadow-sm hover:shadow-md hover:border-[#1890FF]/30">
                                          <ExternalLink className="w-2.5 h-2.5 shrink-0 text-[#1890FF]" /> <span className="truncate max-w-[150px] font-bold">{hostname}</span>
                                        </a>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              </AnimatePresence>
                            );
                          })()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                );
              })}
              {/* Loading State */}
              {(aiLoading || swarmLoading) && (
                <div className="flex items-center gap-2.5 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 select-none">
                  <GripVertical className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 shrink-0 animate-pulse" />
                  <span className="animate-pulse">R-AI está pensando...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </div>
        </div>

        {/* ─── SCROLL TO BOTTOM BUTTON ─── */}
        <AnimatePresence>
          {!isUserAtBottom && aiMessages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setIsUserAtBottom(true);
              }}
              className="absolute bottom-28 right-6 md:right-10 z-40 w-9 h-9 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-[#1890FF] hover:border-[#1890FF]/40 hover:shadow-xl transition-all cursor-pointer"
              title="Ir al final"
            >
              <ArrowDown className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ─── PREMIUM INPUT BAR (REPOSITIONED) ─── */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-[#0a0a0a] dark:via-[#0a0a0a]/90 pt-8 pb-1 px-4 md:px-8 pointer-events-none z-30">
          <div className={`${maxWClass} mx-auto w-full relative pointer-events-auto transition-all duration-300`}>
            
            {/* Near Limit Warning */}
            <AnimatePresence>
              {nearLimit && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mb-2">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>Has usado {realUsageCount} de {questionLimit} consultas gratuitas.</span>
                    </div>
                    <button onClick={() => setShowUpsell(true)} className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shrink-0 shadow-sm shadow-amber-500/20">
                      Ver Opciones
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-end gap-2 bg-white dark:bg-[#111827] border border-gray-200 dark:border-gray-700/50 rounded-3xl p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] focus-within:ring-4 focus-within:ring-[#1890FF]/15 focus-within:border-[#1890FF]/50 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.csv,.json,.ts" />
              
              {/* Active Tool Pills */}
              <AnimatePresence>
                {activeTools.length > 0 && (
                  <div className="absolute bottom-full left-4 mb-2 flex flex-col sm:flex-row gap-2">
                    {activeTools.map(toolId => {
                      const tool = ADVANCED_TOOLS.find(t => t.id === toolId);
                      if (!tool) return null;
                      return (
                        <motion.div
                          key={toolId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-50 dark:bg-[#1890FF]/10 flex items-center justify-center">
                            <tool.icon className="w-3 h-3 text-[#1890FF]" />
                          </div>
                          {tool.label}
                          <button type="button" onClick={() => toggleTool(toolId, tool.category)} className="ml-1 text-gray-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-red-50 dark:hover:bg-red-500/10"><X className="w-3.5 h-3.5" /></button>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatePresence>

              {/* Left Actions */}
              <div className="flex items-center gap-1.5 pb-0.5 pl-1 shrink-0 relative">
                <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors z-30 ${showAttachMenu ? "bg-[#1890FF] text-white shadow-lg" : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500"}`} title="Más opciones">
                  <Plus className={`w-5 h-5 transition-transform duration-300 ${showAttachMenu ? "rotate-45" : ""}`} />
                </button>

                <AnimatePresence>
                  {showAttachMenu && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => { setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-12 left-0 z-40 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[350px]"
                      >
                        <div className="flex-1 overflow-y-auto hidden-scrollbar p-2 space-y-3">
                          
                          {attachMenuView === 'main' && (
                            <motion.div key="main" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                              {/* Archivos */}
                              <div>
                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Archivos</div>
                                <button
                                  type="button"
                                  onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click(); }}
                                  className="w-full flex items-center gap-3 px-2 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-[#1890FF] rounded-xl transition-colors text-left"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                                    <Paperclip className="w-4 h-4" />
                                  </div>
                                  Subir archivo
                                </button>
                              </div>

                              <div className="mt-2">
                                <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Herramientas</div>
                                <button type="button" onClick={() => setAttachMenuView('charts')}
                                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-blue-500 rounded-xl transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><PieChart className="w-4 h-4" /></div>
                                    Gráficos
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                                <button type="button" onClick={() => setAttachMenuView('analysis')}
                                  className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-purple-500 rounded-xl transition-colors mt-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0"><TrendingUp className="w-4 h-4" /></div>
                                    Análisis
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {attachMenuView === 'charts' && (
                            <motion.div key="charts" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                              <button type="button" onClick={() => setAttachMenuView('main')} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 mb-2 transition-colors">
                                <ChevronRight className="w-3 h-3 rotate-180" /> Volver
                              </button>
                              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gráficos</div>
                              <div className="space-y-0.5">
                                {ADVANCED_TOOLS.filter(t => t.category === 'Gráficos').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <div key={tool.id} className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold rounded-xl transition-colors group">
                                      <button type="button" onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} 
                                        className={`flex-1 flex items-center gap-3 text-left ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300 hover:text-[#1890FF]"}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-blue-500/20 text-blue-600" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={`p-1.5 transition-all ${favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-500 opacity-0 group-hover:opacity-100"}`}>
                                        <Star className={`w-4 h-4 ${favoriteTools.includes(tool.id) ? "fill-amber-500" : ""}`} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}

                          {attachMenuView === 'analysis' && (
                            <motion.div key="analysis" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                              <button type="button" onClick={() => setAttachMenuView('main')} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 mb-2 transition-colors">
                                <ChevronRight className="w-3 h-3 rotate-180" /> Volver
                              </button>
                              <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Análisis</div>
                              <div className="space-y-0.5">
                                {ADVANCED_TOOLS.filter(t => t.category === 'Análisis').map(tool => {
                                  const Icon = tool.icon;
                                  const isActive = activeTools.includes(tool.id);
                                  return (
                                    <div key={tool.id} className="w-full flex items-center justify-between px-2 py-2 text-sm font-semibold rounded-xl transition-colors group">
                                      <button type="button" onClick={() => { toggleTool(tool.id, tool.category); setShowAttachMenu(false); setTimeout(() => setAttachMenuView('main'), 200); }} 
                                        className={`flex-1 flex items-center gap-3 text-left ${isActive ? "text-purple-600 dark:text-purple-400" : "text-gray-700 dark:text-gray-300 hover:text-purple-500"}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isActive ? "bg-purple-500/20 text-purple-600" : "bg-purple-500/10 text-purple-600 dark:text-purple-400"}`}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        {tool.label}
                                      </button>
                                      <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteTool(tool.id); }} className={`p-1.5 transition-all ${favoriteTools.includes(tool.id) ? "text-amber-500" : "text-gray-300 hover:text-amber-500 dark:text-gray-600 dark:hover:text-amber-500 opacity-0 group-hover:opacity-100"}`}>
                                        <Star className={`w-4 h-4 ${favoriteTools.includes(tool.id) ? "fill-amber-500" : ""}`} />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}

                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                
                {/* Model Selector */}
                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setShowModelMenu(!showModelMenu)} 
                    className={`h-10 px-3 flex items-center justify-center gap-2 rounded-full transition-colors ${
                      selectedModel === 'pro'
                        ? "bg-amber-500/10 text-amber-500 font-bold" 
                        : selectedModel === 'agent'
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/25"
                        : "bg-gray-50 dark:bg-white/5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                    }`} 
                    title="Seleccionar Modelo AI"
                  >
                    {selectedModel === 'fast' ? <Zap className="w-4 h-4" /> : selectedModel === 'pro' ? <Sparkles className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    <span className="text-xs font-semibold hidden sm:inline">
                      {selectedModel === 'fast' ? 'V2.5 Fast' : selectedModel === 'pro' ? 'V2.5 Pro' : 'V2.6 Agent'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {showModelMenu && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setShowModelMenu(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute bottom-12 left-0 z-40 w-56 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col p-2 space-y-1"
                        >
                          <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Modelo de IA</div>
                          <button
                            type="button"
                            onClick={() => handleModelSelect('fast')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-left ${selectedModel === 'fast' ? 'bg-[#1890FF]/10 text-[#1890FF]' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedModel === 'fast' ? 'bg-[#1890FF]/20 text-[#1890FF]' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                              <Zap className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="leading-none">Reclu v2.5 Fast</div>
                              <div className="text-[10px] text-gray-400 font-normal mt-1">Respuestas rápidas y precisas (Por defecto)</div>
                            </div>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleModelSelect('pro')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-left ${selectedModel === 'pro' ? 'bg-amber-500/10 text-amber-500' : !canUsePro ? 'text-gray-400 dark:text-gray-550 hover:bg-gray-50 dark:hover:bg-white/5' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedModel === 'pro' ? 'bg-amber-500/20 text-amber-500' : !canUsePro ? 'bg-gray-100 dark:bg-slate-800 text-gray-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                              {!canUsePro ? <Lock className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="leading-none flex items-center justify-between">
                                Reclu v2.5 Pro
                                {!canUsePro && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded ml-2 uppercase flex items-center gap-1"><Lock className="w-2.5 h-2.5" />Pro</span>}
                              </div>
                              <div className="text-[10px] text-gray-400 font-normal mt-1">{!canUsePro ? 'Requiere plan Pro o superior' : 'Análisis financiero profundo y razonamiento reflexivo'}</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleModelSelect('agent')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-left ${selectedModel === 'agent' ? 'bg-purple-500/10 text-purple-500' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${selectedModel === 'agent' ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'}`}>
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="leading-none flex items-center justify-between">
                                Reclu v2.6 Agent
                                <span className="text-[9px] bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-1.5 py-0.5 rounded ml-2 uppercase font-black tracking-wider shadow-sm">Swarm</span>
                              </div>
                              <div className="text-[10px] text-gray-400 font-normal mt-1">Orquestación de agentes con razonamiento avanzado</div>
                            </div>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Text Input */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                placeholder={reachedQuestionLimit ? `Límite de consultas alcanzado` : "Pregúntale a R-AI..."}
                className="flex-1 bg-transparent text-[15px] py-3 px-2 max-h-40 min-h-[44px] resize-none outline-none disabled:cursor-not-allowed font-medium text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                disabled={aiLoading || swarmLoading || reachedQuestionLimit}
                rows={1}
              />
              
              {/* Send / Mic Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="w-10 h-10 mb-0.5 mr-0.5 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                  title="Detener grabación"
                >
                  <div className="flex items-center justify-center gap-[3px] h-4">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ["4px", "14px", "4px"] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15, ease: "easeInOut" }}
                        className="w-[3px] bg-white rounded-full"
                      />
                    ))}
                  </div>
                </button>
              ) : input.trim() ? (
                <button
                  type="submit"
                  disabled={aiLoading || swarmLoading || reachedQuestionLimit}
                  className="w-10 h-10 mb-0.5 mr-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleRecording}
                  disabled={aiLoading || swarmLoading || reachedQuestionLimit}
                  className="w-10 h-10 mb-0.5 mr-0.5 rounded-full bg-[#1890FF] text-white flex items-center justify-center disabled:opacity-30 hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                  title="Dictar por voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
            <div className="text-center mt-1">
              <span className="text-[10px] text-gray-400 font-medium">R-AI puede cometer errores. Verifica la información financiera.</span>
            </div>
          </div>
        </div>
      </>
    )}
  </div>

      {/* ─── PREFERENCES MODAL ─── */}
      <AnimatePresence>
        {showPreferences && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 dark:border-white/10">
              
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#1890FF]" /> Preferencias de AI
                </h3>
                <button onClick={() => setShowPreferences(false)} className="text-gray-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-full p-1.5 shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6 space-y-8">
                
                {/* Privacy / Cloud Sync */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Privacidad y Sincronización</label>
                  <div className="bg-gray-50 dark:bg-[#0F1117] rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#1890FF]" />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">Guardar en la Nube</span>
                      </div>
                      <button 
                        onClick={() => setCloudSync(!cloudSyncEnabled)}
                        className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${cloudSyncEnabled ? "bg-[#1890FF]" : "bg-gray-300 dark:bg-gray-700"}`}
                      >
                        <motion.div 
                          animate={{ x: cloudSyncEnabled ? 24 : 0 }} 
                          className="w-5 h-5 bg-white rounded-full shadow-sm" 
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      Tus chats se guardan <strong className="text-gray-700 dark:text-gray-300">localmente en este dispositivo</strong> para proteger tu privacidad. Activa esto para guardarlos de forma segura en nuestros servidores y poder verlos en tu celular u otros dispositivos.
                    </p>
                  </div>
                </div>

                {/* Theme */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Apariencia</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => setTheme("light")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Sun className="w-6 h-6" /> <span className="text-xs font-bold">Claro</span>
                    </button>
                    <button onClick={() => setTheme("dark")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Moon className="w-6 h-6" /> <span className="text-xs font-bold">Oscuro</span>
                    </button>
                    <button onClick={() => setTheme("system")} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Monitor className="w-6 h-6" /> <span className="text-xs font-bold">Sistema</span>
                    </button>
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Tamaño de Texto</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setChatPrefs({...chatPrefs, fontSize: "normal"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.fontSize === 'normal' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Type className="w-4 h-4" /> <span className="text-sm font-bold">Normal</span>
                    </button>
                    <button onClick={() => setChatPrefs({...chatPrefs, fontSize: "large"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.fontSize === 'large' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Type className="w-5 h-5" /> <span className="text-sm font-bold">Grande</span>
                    </button>
                  </div>
                </div>

                {/* Chat Width */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">Ancho del Chat</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setChatPrefs({...chatPrefs, width: "standard"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.width === 'standard' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Monitor className="w-4 h-4" /> <span className="text-sm font-bold">Estándar</span>
                    </button>
                    <button onClick={() => setChatPrefs({...chatPrefs, width: "wide"})} className={`flex items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all ${chatPrefs.width === 'wide' ? 'border-[#1890FF] bg-[#1890FF]/5 text-[#1890FF]' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-600 dark:text-gray-400'}`}>
                      <Maximize className="w-4 h-4" /> <span className="text-sm font-bold">Amplio</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── UPSELL MODAL (TRIAL FOCUSED) ─── */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setShowUpsell(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0F1117] rounded-[2.5rem] p-8 max-w-md w-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative border border-gray-100 dark:border-white/10 text-center overflow-hidden">
              
              {/* Background Glow */}
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#1890FF]/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 blur-[60px] rounded-full pointer-events-none" />

              <button onClick={() => setShowUpsell(false)} className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-full p-2 z-10">
                <X className="w-4 h-4" />
              </button>
              
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-[#1890FF] to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl ring-8 ring-[#1890FF]/10">
                  <Crown className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">
                  {reachedQuestionLimit ? "Límite de IA alcanzado" : "Desbloquea R-AI Pro"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[300px] mx-auto font-medium">
                  {reachedQuestionLimit 
                    ? `Has usado tus ${questionLimit} consultas. Prueba Pro gratis y obtén ${proConfig.aiMessagesPerMonth} al mes.`
                    : "Activa el modo Pro con razonamiento avanzado y búsqueda web. 7 días gratis."
                  }
                </p>

                {/* Limit comparison */}
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-5">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Tu plan actual vs Pro</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-gray-100 dark:border-white/10">
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Gratuito</div>
                      <div className="text-lg font-black text-gray-900 dark:text-white">{questionLimit}</div>
                      <div className="text-[10px] text-gray-400">consultas</div>
                    </div>
                    <div className="bg-gradient-to-br from-[#1890FF]/10 to-indigo-500/10 rounded-xl p-3 border border-[#1890FF]/20">
                      <div className="text-[10px] font-bold text-[#1890FF] uppercase">Pro</div>
                      <div className="text-lg font-black text-[#1890FF]">{proConfig.aiMessagesPerMonth}</div>
                      <div className="text-[10px] text-[#1890FF]/70">consultas/mes</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2.5 text-left mb-6 px-1">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Modelo Pro con razonamiento avanzado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">50 audios de noticias al mes</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-green-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sin publicidad + 5 alertas de precio</span>
                  </div>
                </div>
                
                <Link href="/suscripcion" onClick={() => setShowUpsell(false)} className="block w-full py-4 rounded-2xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white font-black text-base hover:shadow-lg hover:shadow-[#1890FF]/30 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Prueba 7 días gratis →
                </Link>

                {/* Referral alternative */}
                <div className="mt-4 relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-800" /></div>
                  <div className="relative flex justify-center"><span className="bg-white dark:bg-[#0F1117] px-3 text-[10px] text-gray-400 font-bold">o gratis</span></div>
                </div>
                <Link href="/referidos" onClick={() => setShowUpsell(false)} className="mt-3 w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-sm font-bold text-emerald-600 dark:text-emerald-400 transition-all group">
                  <Gift className="w-4 h-4" />
                  Refiere 1 amigo = 10 días Pro
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                <button onClick={() => setShowUpsell(false)} className="mt-3 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  Ahora no
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Share Dialog */}
      <ShareChatDialog 
        isOpen={shareDialog.isOpen} 
        onClose={() => setShareDialog({ ...shareDialog, isOpen: false })}
        question={shareDialog.question}
        answer={shareDialog.answer}
      />
    </div>
  );
}

// ── Shared UI Components ─────────

function ThinkingAnimation() {
  return (
    <div className="flex items-center gap-1.5 h-6">
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]/50" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]/80" />
      <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-2.5 h-2.5 rounded-full bg-[#1890FF]" />
    </div>
  );
}

function ToolResultPill({ result }: { result: ToolResultUI }) {
  const [isOpen, setIsOpen] = useState(false);

  const icons = {
    portfolio: <BarChart3 className="w-4 h-4" />,
    stock_info: <TrendingUp className="w-4 h-4" />,
    news: <Newspaper className="w-4 h-4" />,
    alerts: <Bell className="w-4 h-4" />,
  };

  const renderPillContent = () => {
    if (result.tool === "portfolio" && Array.isArray(result.data) && result.data.length > 0) {
      const avgChange = result.data.reduce((sum: number, s: any) => sum + (s.changePercent || 0), 0) / result.data.length;
      return (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-1">
            {result.data.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="relative z-10 w-5 h-5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-white dark:bg-slate-700">
                <img src={item.logo} alt={item.symbol} onError={(e) => { e.currentTarget.src = item.fallbackLogo || `https://ui-avatars.com/api/?name=${item.symbol}&background=1890FF&color=fff&bold=true&size=96`; }} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <span>{result.data.length} activos</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className={avgChange >= 0 ? "text-green-500" : "text-red-500"}>
            {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(2)}%
          </span>
        </div>
      );
    }

    if (result.tool === "stock_info" && result.data) {
      const item = result.data;
      return (
        <div className="flex items-center gap-2">
          <div className="relative w-5 h-5 rounded-full shadow-sm ring-2 ring-white dark:ring-slate-900 overflow-hidden bg-white dark:bg-slate-700">
            <img src={item.logo} alt={item.symbol} onError={(e) => { e.currentTarget.src = item.fallbackLogo || `https://ui-avatars.com/api/?name=${item.symbol}&background=1890FF&color=fff&bold=true&size=96`; }} className="w-full h-full object-cover" />
          </div>
          <span>{item.symbol}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className={item.changePercent >= 0 ? "text-green-500" : "text-red-500"}>
            {item.changePercent >= 0 ? "+" : ""}{item.changePercent?.toFixed(2)}%
          </span>
        </div>
      );
    }

    if (result.tool === "news" && Array.isArray(result.data) && result.data.length > 0) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 mr-1">
            {result.data.slice(0, 3).map((item: any, i: number) => (
              item.image_url ? (
                <img key={i} src={item.image_url} alt="" className="w-5 h-5 rounded-full object-cover shadow-sm ring-2 ring-white dark:ring-slate-900 z-10" />
              ) : (
                <div key={i} className="w-5 h-5 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center shadow-sm ring-2 ring-white dark:ring-slate-900 z-10">
                  <Newspaper className="w-2.5 h-2.5 text-gray-400" />
                </div>
              )
            ))}
          </div>
          <span>{result.data.length} noticias analizadas</span>
        </div>
      );
    }

    return (
      <>
        {icons[result.tool] || <Sparkles className="w-4 h-4" />}
        {result.summary}
      </>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-xl border text-[11px] md:text-xs font-bold transition-all shadow-sm ${
          isOpen 
            ? "border-[#1890FF] bg-[#1890FF]/10 text-[#1890FF]" 
            : "border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 hover:border-[#1890FF]/50 hover:bg-gray-50 dark:hover:bg-slate-800"
        }`}
      >
        {renderPillContent()}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-[320px] md:w-[400px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40 z-50 p-4 max-h-[350px] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Contexto Analizado ({result.tool})</span>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-red-500 bg-gray-100 dark:bg-slate-800 rounded-full p-1"><X className="w-3 h-3" /></button>
            </div>
            
            <div className="space-y-2">
              {result.tool === "portfolio" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-700 shrink-0">
                      <img src={item.logo} alt={item.symbol} onError={(e) => { e.currentTarget.src = item.fallbackLogo || `https://ui-avatars.com/api/?name=${item.symbol}&background=1890FF&color=fff&bold=true&size=96`; }} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{item.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">${item.price?.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${item.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {item.changePercent >= 0 ? "+" : ""}{item.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}

              {result.tool === "stock_info" && result.data && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full shadow-sm border border-gray-100 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-700 shrink-0">
                      <img src={result.data.logo} alt={result.data.symbol} onError={(e) => { e.currentTarget.src = result.data.fallbackLogo || `https://ui-avatars.com/api/?name=${result.data.symbol}&background=1890FF&color=fff&bold=true&size=96`; }} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{result.data.symbol}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">${result.data.price?.toFixed(2)}</div>
                    <div className={`text-[11px] font-bold ${result.data.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {result.data.changePercent >= 0 ? "+" : ""}{result.data.changePercent?.toFixed(2)}%
                    </div>
                  </div>
                </div>
              )}

              {result.tool === "news" && Array.isArray(result.data) && result.data.map((item: any, i: number) => (
                <a key={i} href={item.url || `/?tag=${item.slug}`} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 hover:bg-[#1890FF]/5 hover:border-[#1890FF]/20 border border-transparent transition-colors group">
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border border-gray-200 dark:border-gray-700">
                      <Newspaper className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex flex-col justify-between py-0.5">
                    <h4 className="text-[13px] font-bold line-clamp-2 leading-snug mb-1 text-gray-900 dark:text-white group-hover:text-[#1890FF]">{item.title}</h4>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><ExternalLink className="w-3 h-3 text-[#1890FF]" /> {item.source || "Reclu"}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
