"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  CalendarDays,
  EyeOff,
  Pin,
  Loader2,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

interface Stats {
  totalArticles: number;
  todayArticles: number;
  hiddenArticles: number;
  pinnedArticles: number;
  dailyCounts: Record<string, number>;
  categories: { name: string; count: number }[];
}

const STAT_CARDS = [
  { key: "totalArticles", label: "Total Noticias", icon: Newspaper, color: "from-blue-500 to-blue-700", textColor: "text-blue-400" },
  { key: "todayArticles", label: "Publicadas Hoy", icon: CalendarDays, color: "from-green-500 to-emerald-700", textColor: "text-green-400" },
  { key: "hiddenArticles", label: "Ocultas", icon: EyeOff, color: "from-orange-500 to-amber-700", textColor: "text-orange-400" },
  { key: "pinnedArticles", label: "Fijadas", icon: Pin, color: "from-purple-500 to-violet-700", textColor: "text-purple-400" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
        <p>Error al cargar estadísticas. Verifica la configuración de la base de datos.</p>
      </div>
    );
  }

  const dailyEntries = Object.entries(stats.dailyCounts);
  const maxDay = Math.max(...dailyEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Visión general de la plataforma Reclu
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="relative overflow-hidden bg-[#1E293B] border border-white/5 rounded-2xl p-5"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-10 rounded-bl-[60px]`} />
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br ${card.color} bg-opacity-20`}>
                <card.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-white tabular-nums">
              {(stats as any)[card.key]?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-[#1E293B] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-sm text-white">Actividad Semanal</h3>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Últimos 7 días</span>
          </div>

          <div className="flex items-end gap-2 h-40">
            {dailyEntries.map(([date, count]) => {
              const height = Math.max((count / maxDay) * 100, 4);
              const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("es-CL", { weekday: "short" });
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 tabular-nums">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 min-h-[4px]"
                  />
                  <span className="text-[10px] text-gray-600 capitalize">{dayLabel}</span>
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
          className="bg-[#1E293B] border border-white/5 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-bold text-sm text-white">Por Categoría</h3>
          </div>

          <div className="space-y-3">
            {stats.categories.map((cat, i) => {
              const pct = stats.totalArticles > 0 ? (cat.count / stats.totalArticles) * 100 : 0;
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider w-20 truncate shrink-0">
                    {cat.name}
                  </span>
                  <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.6 + i * 0.05, duration: 0.4 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-bold tabular-nums w-8 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <Link
          href="/admin/noticias"
          className="group flex items-center justify-between bg-[#1E293B] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all"
        >
          <div>
            <h4 className="font-bold text-sm text-white">Gestionar Noticias</h4>
            <p className="text-xs text-gray-500 mt-1">Editar, ocultar o eliminar artículos</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-blue-400 transition-colors" />
        </Link>

        <Link
          href="/admin/noticias/crear"
          className="group flex items-center justify-between bg-[#1E293B] border border-white/5 rounded-2xl p-5 hover:border-green-500/30 transition-all"
        >
          <div>
            <h4 className="font-bold text-sm text-white">Publicar Artículo</h4>
            <p className="text-xs text-gray-500 mt-1">Crear una noticia editorial propia</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-green-400 transition-colors" />
        </Link>

        <Link
          href="/admin/logs"
          className="group flex items-center justify-between bg-[#1E293B] border border-white/5 rounded-2xl p-5 hover:border-purple-500/30 transition-all"
        >
          <div>
            <h4 className="font-bold text-sm text-white">AI Pipeline Logs</h4>
            <p className="text-xs text-gray-500 mt-1">Monitor de prompts y tokens en tiempo real</p>
          </div>
          <ArrowUpRight className="w-5 h-5 text-gray-600 group-hover:text-purple-400 transition-colors" />
        </Link>
      </motion.div>
    </div>
  );
}
