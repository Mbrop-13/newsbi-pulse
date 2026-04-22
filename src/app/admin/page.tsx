"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Newspaper,
  CalendarDays,
  EyeOff,
  Pin,
  Loader2,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  Zap,
  Users,
  Clock,
  DollarSign,
  Activity,
  Play,
  Terminal,
  PenSquare,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Timer,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface PipelineData {
  lastRun: {
    created_at: string;
    articles_fetched: number;
    articles_published: number;
    grok_calls: number;
    step_calls: number;
    duration_ms: number;
    status: string;
  } | null;
  minutesSinceLastRun: number | null;
  nextRunEstimate: string | null;
  intervalMinutes: number;
  chileHour: number;
  scheduleLabel: string;
  runsToday: number;
  articlesSavedToday: number;
}

interface AIData {
  tokensToday: number;
  aiCallsToday: number;
  grokCallsToday: number;
  estimatedCostToday: number;
}

interface Stats {
  totalArticles: number;
  todayArticles: number;
  hiddenArticles: number;
  pinnedArticles: number;
  totalUsers: number;
  pipeline: PipelineData;
  ai: AIData;
  dailyCounts: Record<string, number>;
  categories: { name: string; count: number }[];
  topSources: { name: string; count: number }[];
}

// ── Countdown Hook ──
function useCountdown(targetDate: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetDate) { setTimeLeft("—"); return; }

    const tick = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Ahora"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, "0")}`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

// ── Format helpers ──
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

function formatTimeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Hace segundos";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  return `Hace ${Math.floor(hours / 24)}d`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningPipeline, setRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<string | null>(null);

  const fetchStats = useCallback(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const countdown = useCountdown(stats?.pipeline.nextRunEstimate || null);

  const handleRunPipeline = async () => {
    if (runningPipeline) return;
    setRunningPipeline(true);
    setPipelineResult(null);
    try {
      const res = await fetch("/api/cron?manual=true");
      const data = await res.json();
      if (data.success) {
        setPipelineResult(`✅ ${data.stats?.saved || 0} artículos guardados en ${formatDuration(data.stats?.durationMs || 0)}`);
        // Refresh stats after pipeline run
        setTimeout(fetchStats, 2000);
      } else {
        setPipelineResult(`❌ Error: ${data.error || "desconocido"}`);
      }
    } catch (err: any) {
      setPipelineResult(`❌ ${err.message}`);
    } finally {
      setRunningPipeline(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-32 text-gray-500">
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
        <p>Error al cargar estadísticas. Verifica la configuración.</p>
      </div>
    );
  }

  const dailyEntries = Object.entries(stats.dailyCounts);
  const maxDay = Math.max(...dailyEntries.map(([, v]) => v), 1);
  const pipelineHealthy = stats.pipeline.minutesSinceLastRun !== null && stats.pipeline.minutesSinceLastRun < stats.pipeline.intervalMinutes * 3;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            Centro de Control
          </h1>
          <p className="text-slate-500 dark:text-gray-500 mt-1 text-sm">
            Pipeline v3 · Currents API · {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 rounded-xl bg-slate-200/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition-all"
          title="Refrescar datos"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Pipeline Health Monitor (Hero) ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none"
      >
        {/* Background glow - subtle in light mode, pronounced in dark mode */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[120px] opacity-10 dark:opacity-20 ${pipelineHealthy ? 'bg-green-500' : 'bg-orange-500'}`} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2.5 rounded-xl ${pipelineHealthy ? 'bg-green-100 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20' : 'bg-orange-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20'}`}>
              <Activity className={`w-5 h-5 ${pipelineHealthy ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pipeline Monitor</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${pipelineHealthy ? 'bg-green-500 dark:bg-green-400 animate-pulse' : 'bg-orange-500 dark:bg-orange-400'}`} />
                <span className={`text-xs font-semibold ${pipelineHealthy ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                  {pipelineHealthy ? "Operativo" : "Verificar"}
                </span>
                <span className="text-slate-400 dark:text-gray-600 text-xs">·</span>
                <span className="text-xs text-slate-500 dark:text-gray-500">
                  {stats.pipeline.scheduleLabel} · cada {stats.pipeline.intervalMinutes} min
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Next Run */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Próxima ejecución</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{countdown}</p>
              <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">Chile {stats.pipeline.chileHour}:00h</p>
            </div>

            {/* Last Run */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Última ejecución</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {stats.pipeline.lastRun ? formatTimeAgo(stats.pipeline.lastRun.created_at) : "—"}
              </p>
              {stats.pipeline.lastRun && (
                <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">
                  {stats.pipeline.lastRun.articles_published} arts · {formatDuration(stats.pipeline.lastRun.duration_ms)}
                </p>
              )}
            </div>

            {/* Runs Today */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Ejecuciones hoy</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{stats.pipeline.runsToday}</p>
              <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">{stats.pipeline.articlesSavedToday} artículos guardados</p>
            </div>

            {/* Grok Cost */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider">Costo IA hoy</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                ${stats.ai.estimatedCostToday.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-gray-600 mt-1">
                {stats.ai.grokCallsToday} Grok · {stats.ai.aiCallsToday} total
              </p>
            </div>
          </div>

          {/* Run Pipeline Button */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleRunPipeline}
              disabled={runningPipeline}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                runningPipeline
                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-400 dark:text-blue-300 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
              }`}
            >
              {runningPipeline ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ejecutando pipeline...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Ejecutar Pipeline Ahora
                </>
              )}
            </button>

            <AnimatePresence>
              {pipelineResult && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-500 dark:text-gray-400 font-medium"
                >
                  {pipelineResult}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: "Total Noticias", value: stats.totalArticles, icon: Newspaper, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-gradient-to-br dark:from-blue-500/10 dark:to-blue-600/5", iconBg: "bg-blue-100 dark:bg-white/5" },
          { label: "Publicadas Hoy", value: stats.todayArticles, icon: CalendarDays, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-gradient-to-br dark:from-green-500/10 dark:to-green-600/5", iconBg: "bg-green-100 dark:bg-white/5" },
          { label: "Usuarios", value: stats.totalUsers, icon: Users, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-gradient-to-br dark:from-violet-500/10 dark:to-violet-600/5", iconBg: "bg-violet-100 dark:bg-white/5" },
          { label: "Tokens IA Hoy", value: stats.ai.tokensToday.toLocaleString(), icon: Cpu, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-gradient-to-br dark:from-cyan-500/10 dark:to-cyan-600/5", iconBg: "bg-cyan-100 dark:bg-white/5" },
          { label: "Ocultas", value: stats.hiddenArticles, icon: EyeOff, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-gradient-to-br dark:from-orange-500/10 dark:to-orange-600/5", iconBg: "bg-orange-100 dark:bg-white/5" },
          { label: "Fijadas", value: stats.pinnedArticles, icon: Pin, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-gradient-to-br dark:from-pink-500/10 dark:to-pink-600/5", iconBg: "bg-pink-100 dark:bg-white/5" },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.04 }}
            className={`${card.bg} border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm dark:shadow-none`}
          >
            <div className={`p-1.5 rounded-lg ${card.iconBg} w-fit mb-3`}>
              <card.icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">{card.value}</p>
            <p className="text-[10px] text-slate-500 dark:text-gray-500 font-semibold mt-1 uppercase tracking-wider">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Actividad Semanal</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-gray-600 uppercase tracking-wider">Últimos 7 días</span>
          </div>

          <div className="flex items-end gap-2 h-36">
            {dailyEntries.map(([date, count], idx) => {
              const height = Math.max((count / maxDay) * 100, 6);
              const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "short" });
              const isToday = idx === dailyEntries.length - 1;
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                    {count}
                  </span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.4 + idx * 0.06, duration: 0.5, ease: "easeOut" }}
                    className={`w-full rounded-lg min-h-[6px] transition-all ${
                      isToday
                        ? "bg-gradient-to-t from-blue-500 to-blue-400 dark:from-blue-600 dark:to-blue-400 shadow-sm dark:shadow-lg dark:shadow-blue-500/20"
                        : "bg-gradient-to-t from-slate-200 to-slate-100 dark:from-gray-700 dark:to-gray-600 group-hover:from-blue-400/60 group-hover:to-blue-300/60 dark:group-hover:from-blue-600/60 dark:group-hover:to-blue-400/60"
                    }`}
                  />
                  <span className={`text-[10px] capitalize ${isToday ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-500 dark:text-gray-600"}`}>
                    {dayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Categorías</h3>
          </div>

          <div className="space-y-3">
            {stats.categories.map((cat, i) => {
              const pct = stats.totalArticles > 0 ? (cat.count / stats.totalArticles) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-500 dark:text-gray-500 font-bold uppercase tracking-wider w-20 truncate shrink-0">
                    {cat.name}
                  </span>
                  <div className="flex-1 bg-slate-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                    />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-gray-400 font-bold tabular-nums w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* ── Sources + Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Sources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm dark:shadow-none"
        >
          <div className="flex items-center gap-2 mb-5">
            <Newspaper className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Fuentes Principales</h3>
          </div>

          <div className="space-y-3">
            {stats.topSources.length > 0 ? (
              stats.topSources.map((source, i) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-gray-600 w-4 text-right">{i + 1}</span>
                    <span className="text-sm text-slate-700 dark:text-gray-300 truncate max-w-[160px]">{source.name}</span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-gray-500 font-bold tabular-nums">{source.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 dark:text-gray-600 text-center py-4">Sin datos aún</p>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {[
            { href: "/admin/noticias", label: "Gestionar Noticias", desc: "Editar, ocultar o eliminar", icon: Newspaper, hoverColor: "hover:border-blue-500/30", iconColor: "group-hover:text-blue-600 dark:group-hover:text-blue-400" },
            { href: "/admin/noticias/crear", label: "Publicar Artículo", desc: "Crear una noticia editorial", icon: PenSquare, hoverColor: "hover:border-green-500/30", iconColor: "group-hover:text-green-600 dark:group-hover:text-green-400" },
            { href: "/admin/logs", label: "AI Pipeline Logs", desc: "Prompts y tokens en tiempo real", icon: Terminal, hoverColor: "hover:border-purple-500/30", iconColor: "group-hover:text-purple-600 dark:group-hover:text-purple-400" },
            { href: "/admin/predicciones", label: "Predicciones", desc: "Gestionar predicciones de mercado", icon: TrendingUp, hoverColor: "hover:border-yellow-500/30", iconColor: "group-hover:text-yellow-600 dark:group-hover:text-yellow-400" },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex items-center justify-between bg-white dark:bg-[#1E293B]/60 border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm dark:shadow-none ${action.hoverColor} transition-all`}
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                  <action.icon className={`w-4 h-4 text-slate-400 dark:text-gray-500 ${action.iconColor} transition-colors`} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{action.label}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-gray-500 mt-0.5">{action.desc}</p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-gray-700 group-hover:text-slate-500 dark:group-hover:text-gray-400 transition-colors" />
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
