"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Eye,
  Activity,
  Gem,
} from "lucide-react";
import Link from "next/link";

// Lucide doesn't export 'trophy' as named, use Award instead
import { Award } from "lucide-react";

interface Prediction {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  option_a_label: string;
  option_b_label: string;
  pool_a: number;
  pool_b: number;
  prob_a: number;
  prob_b: number;
  total_volume: number;
  status: string;
  winner: string | null;
  resolution_date: string | null;
  created_at: string;
}

export default function AdminPrediccionesPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveTarget, setResolveTarget] = useState<Prediction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Prediction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/predictions")
      .then(r => r.json())
      .then(d => { if (!d.error) setPredictions(d.predictions); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleResolve = async (winner: "a" | "b") => {
    if (!resolveTarget) return;
    setActionLoading(true);
    const res = await fetch(`/api/predictions/${resolveTarget.id}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winner }),
    });
    const data = await res.json();
    if (data.success) {
      setPredictions(prev => prev.map(p =>
        p.id === resolveTarget.id ? { ...p, status: "resolved", winner } : p
      ));
    }
    setResolveTarget(null);
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    await fetch(`/api/admin/predictions/${deleteTarget.id}`, { method: "DELETE" });
    setPredictions(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    setActionLoading(false);
  };

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  };

  const statusBadge = (p: Prediction) => {
    if (p.status === "resolved") {
      const winnerLabel = p.winner === "a" ? p.option_a_label : p.option_b_label;
      return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">✓ {winnerLabel}</span>;
    }
    if (p.status === "closed") {
      return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-gray-500/15 text-gray-400 border border-gray-500/20">CERRADO</span>;
    }
    return <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/20">ACTIVO</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Predicciones</h1>
          <p className="text-gray-500 text-sm mt-1">{predictions.length} mercados</p>
        </div>
        <Link
          href="/admin/predicciones/crear"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold transition-all shadow-lg shadow-purple-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nuevo Mercado
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-2xl border border-white/5">
          <TrendingUp className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay mercados de predicción aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => (
            <motion.div
              key={p.id}
              layout
              className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {statusBadge(p)}
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-gray-500 uppercase tracking-wider">
                      {p.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg leading-snug">{p.title}</h3>
                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-400 font-medium">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {p.status === "active" && (
                    <button
                      onClick={() => setResolveTarget(p)}
                      className="px-3 py-2 rounded-xl bg-green-500/10 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 inline mr-1" />
                      Resolver
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-green-400">{p.option_a_label} · {Math.round(p.prob_a * 100)}%</span>
                    <span className="font-bold text-red-400">{Math.round(p.prob_b * 100)}% · {p.option_b_label}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-red-500/20 overflow-hidden">
                    <motion.div
                      initial={{ width: "50%" }}
                      animate={{ width: `${p.prob_a * 100}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-500 font-medium">
                <span className="flex items-center gap-1"><Gem className="w-3 h-3" /> {p.total_volume} volumen</span>
                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Pool: {p.pool_a} / {p.pool_b}</span>
                <span>Resolución: {fmtDate(p.resolution_date)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setResolveTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-green-500/10"><Award className="w-5 h-5 text-green-400" /></div>
                <h3 className="font-bold text-white text-lg">Resolver Mercado</h3>
              </div>
              <p className="text-gray-400 text-sm mb-4">&ldquo;{resolveTarget.title}&rdquo;</p>
              <p className="text-gray-500 text-xs mb-6">¿Quién ganó esta predicción?</p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => handleResolve("a")}
                  disabled={actionLoading}
                  className="py-4 rounded-xl bg-green-500/10 border-2 border-green-500/20 hover:border-green-500/60 text-green-400 font-bold text-sm transition-all disabled:opacity-50"
                >
                  {resolveTarget.option_a_label}
                </button>
                <button
                  onClick={() => handleResolve("b")}
                  disabled={actionLoading}
                  className="py-4 rounded-xl bg-red-500/10 border-2 border-red-500/20 hover:border-red-500/60 text-red-400 font-bold text-sm transition-all disabled:opacity-50"
                >
                  {resolveTarget.option_b_label}
                </button>
              </div>

              <button
                onClick={() => setResolveTarget(null)}
                className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
                <h3 className="font-bold text-white text-lg">Eliminar Mercado</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">Esto eliminará el mercado y todas las apuestas asociadas permanentemente.</p>
              <div className="flex items-center gap-3 justify-end">
                <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors">Cancelar</button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
