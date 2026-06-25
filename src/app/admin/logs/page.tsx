"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Database, 
  Ghost, 
  Terminal, 
  Search, 
  BarChart3, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  RefreshCw,
  Clock,
  Filter
} from "lucide-react";
import { toast } from "sonner";

interface LogEntry {
  id: string;
  trace_id: string;
  step: string;
  model: string;
  prompt: string;
  response: string;
  tokens_used: number;
  created_at: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [stepFilter, setStepFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<{ id: string; type: "prompt" | "response" } | null>(null);

  const supabase = createClient();

  const fetchLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const { data, error } = await supabase
      .from("ai_pipeline_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (data) setLogs(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchLogs();

    // Subscribe to real-time logs
    const channel = supabase
      .channel("ai_logs_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ai_pipeline_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as LogEntry, ...prev.slice(0, 79)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Copy helper
  const handleCopy = async (id: string, text: string, type: "prompt" | "response") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId({ id, type });
      toast.success(type === "prompt" ? "Prompt copiado" : "Respuesta copiada");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  // Helper formatting for dates
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    
    if (diffSec < 60) return "hace segundos";
    if (diffMin < 60) return `hace ${diffMin} ${diffMin === 1 ? "min" : "mins"}`;
    if (diffHr < 24) return `hace ${diffHr} ${diffHr === 1 ? "hora" : "horas"}`;
    return date.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // Stats computation
  const stats = useMemo(() => {
    if (logs.length === 0) return { total: 0, avgTokens: 0, clusteringCount: 0, summaryCount: 0 };
    const total = logs.length;
    const totalTokens = logs.reduce((acc, log) => acc + (log.tokens_used || 0), 0);
    const avgTokens = Math.round(totalTokens / total);
    const clusteringCount = logs.filter(l => l.step?.toLowerCase().includes("cluster")).length;
    const summaryCount = logs.filter(l => l.step?.toLowerCase().includes("summar") || l.step?.toLowerCase().includes("sintet")).length;

    return { total, avgTokens, clusteringCount, summaryCount };
  }, [logs]);

  // Filtering list
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.response?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.step?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStep = 
        stepFilter === "all" || 
        (stepFilter === "clustering" && log.step?.toLowerCase().includes("cluster")) ||
        (stepFilter === "summarization" && (log.step?.toLowerCase().includes("summar") || log.step?.toLowerCase().includes("sintet")));

      return matchesSearch && matchesStep;
    });
  }, [logs, searchTerm, stepFilter]);

  // Unique step categories for dropdown list
  const stepsList = ["all", "clustering", "summarization"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#09090b] transition-colors">
        <div className="flex flex-col items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full"
          />
          <span className="text-xs font-bold text-zinc-400 font-mono">Conectando con Observabilidad...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 pt-24 font-mono transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ═══════════════════════════════════════════════════ */}
        {/*  HEADER BAR                                       */}
        {/* ═══════════════════════════════════════════════════ */}
        <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black flex items-center gap-2.5 tracking-tight">
              <Terminal className="text-[#1890FF] w-6 h-6 animate-pulse" />
              AI Observability <span className="text-[#1890FF]">Console</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-500 text-xs font-sans font-medium">
              Monitorización de Prompts, Respuestas de LLM y Consumo de Tokens en Tiempo Real.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(true)}
              disabled={refreshing}
              className="h-9 px-3 flex items-center justify-center rounded-xl border border-zinc-200 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900 transition-all font-sans text-xs font-bold gap-1.5 cursor-pointer text-zinc-650 dark:text-zinc-400"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
              Recargar
            </button>
            <div className="h-9 bg-emerald-500/10 border border-emerald-500/20 px-3.5 flex items-center rounded-xl">
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>
          </div>
        </header>

        {/* ═══════════════════════════════════════════════════ */}
        {/*  METRICS DASHBOARD BOARD                           */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Card 1: Total logs */}
          <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm space-y-1 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500">
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Trazas</span>
            </div>
            <div className="text-xl font-bold font-sans tracking-tight">{stats.total}</div>
          </div>

          {/* Card 2: Average tokens */}
          <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm space-y-1 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500">
              <Coins className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Media Tokens</span>
            </div>
            <div className="text-xl font-bold font-sans tracking-tight">{stats.avgTokens}</div>
          </div>

          {/* Card 3: Clustering pipeline count */}
          <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm space-y-1 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500">
              <Cpu className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Agrupación</span>
            </div>
            <div className="text-xl font-bold font-sans tracking-tight">{stats.clusteringCount}</div>
          </div>

          {/* Card 4: Summarization count */}
          <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm space-y-1 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-zinc-450 dark:text-zinc-500">
              <Database className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Sintetización</span>
            </div>
            <div className="text-xl font-bold font-sans tracking-tight">{stats.summaryCount}</div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/*  FILTERS & SEARCH BAR                              */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-sm">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar prompt, respuesta o modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none font-sans text-xs focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          {/* Dropdown filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={stepFilter}
              onChange={(e) => setStepFilter(e.target.value)}
              className="py-2 pl-3 pr-8 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none font-sans text-xs focus:ring-1 focus:ring-blue-500/50 cursor-pointer appearance-none relative"
            >
              <option value="all">Todas las Etapas</option>
              <option value="clustering">Agrupación (Clustering)</option>
              <option value="summarization">Sintetización (Summarization)</option>
            </select>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/*  LOGS LISTING                                      */}
        {/* ═══════════════════════════════════════════════════ */}
        {filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-950/20 rounded-2xl border border-zinc-200 dark:border-zinc-850 shadow-inner">
            <Ghost className="w-10 h-10 text-zinc-400 dark:text-zinc-650 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-zinc-600 dark:text-zinc-400">No se encontraron logs</h3>
            <p className="text-zinc-500 dark:text-zinc-550 text-xs font-sans mt-1.5 max-w-xs mx-auto">
              Intenta cambiar los parámetros de búsqueda o de filtrado.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const isClustering = log.step?.toLowerCase().includes("cluster");

              return (
                <div
                  key={log.id}
                  className={cn(
                    "border rounded-2xl overflow-hidden transition-all duration-200 bg-white dark:bg-zinc-950 shadow-sm",
                    isExpanded 
                      ? "border-blue-500/60 dark:border-blue-500/50 shadow-md scale-[1.005]" 
                      : "border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700/80"
                  )}
                >
                  {/* Collapsed view header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4 select-none"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Meta badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border",
                          isClustering 
                            ? "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/10" 
                            : "bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/10"
                        )}>
                          {log.step}
                        </span>
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline truncate max-w-[150px]">
                          Trace: {log.trace_id.slice(0, 12)}...
                        </span>
                        {log.tokens_used > 0 && (
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 px-1.5 py-0.5 rounded-md font-sans">
                            {log.tokens_used} tokens
                          </span>
                        )}
                      </div>

                      {/* Main Title/Model */}
                      <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                        {log.model}
                      </h3>
                    </div>

                    {/* Right timestamp & toggle indicator */}
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-550 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(log.created_at)}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/60 dark:hover:bg-zinc-900 flex items-center justify-center border border-zinc-200/50 dark:border-zinc-800 transition-colors">
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Prompt & Response content block */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-zinc-150 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-[#0c0c0f]"
                      >
                        <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                          
                          {/* Left Panel: Prompt */}
                          <div className="space-y-2 flex flex-col min-w-0">
                            <div className="flex items-center justify-between shrink-0 select-none">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Cpu className="w-3.5 h-3.5" /> Prompt de entrada
                              </span>
                              <button
                                onClick={() => handleCopy(log.id, log.prompt, "prompt")}
                                className="h-7 px-2 border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                {copiedId?.id === log.id && copiedId?.type === "prompt" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="flex-1 bg-zinc-900/90 dark:bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap max-h-[350px] overflow-y-auto scrollbar-thin">
                              <code>{log.prompt}</code>
                            </pre>
                          </div>

                          {/* Right Panel: Response */}
                          <div className="space-y-2 flex flex-col min-w-0">
                            <div className="flex items-center justify-between shrink-0 select-none">
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Database className="w-3.5 h-3.5" /> Respuesta generada
                              </span>
                              <button
                                onClick={() => handleCopy(log.id, log.response, "response")}
                                className="h-7 px-2 border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                {copiedId?.id === log.id && copiedId?.type === "response" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-500" />
                                    <span>Copiado</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="flex-1 bg-zinc-900/90 dark:bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-[11px] leading-relaxed text-blue-300 dark:text-blue-200/90 whitespace-pre-wrap max-h-[350px] overflow-y-auto scrollbar-thin">
                              <code>{log.response}</code>
                            </pre>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
