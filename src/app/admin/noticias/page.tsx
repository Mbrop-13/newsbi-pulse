"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Trash2,
  PenSquare,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  image_url: string | null;
  published_at: string;
  is_hidden: boolean;
  is_pinned: boolean;
  relevance_score: number;
  author: string | null;
}

export default function AdminNoticiasPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (status) params.set("status", status);

    const res = await fetch(`/api/admin/articles?${params}`);
    const data = await res.json();
    console.log('[ADMIN UI] API response:', res.status, data);
    if (data.error) {
      setError(data.error);
      setArticles([]);
    } else {
      setError(null);
      setArticles(data.articles);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    }
    setLoading(false);
  }, [page, search, category, status]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleToggle = async (id: string, field: "is_hidden" | "is_pinned") => {
    setActionLoading(id);
    await fetch(`/api/admin/articles/${id}/toggle`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field }),
    });
    // Optimistic update
    setArticles(prev =>
      prev.map(a =>
        a.id === id ? { ...a, [field]: !a[field] } : a
      )
    );
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(deleteTarget.id);
    await fetch(`/api/admin/articles/${deleteTarget.id}`, { method: "DELETE" });
    setArticles(prev => prev.filter(a => a.id !== deleteTarget.id));
    setTotal(t => t - 1);
    setDeleteTarget(null);
    setActionLoading(null);
  };

  const fmtDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestión de Noticias</h1>
          <p className="text-gray-500 text-sm mt-1">{total} artículos en total</p>
        </div>
        <Link
          href="/admin/noticias/crear"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-500/20 shrink-0"
        >
          <PenSquare className="w-4 h-4" />
          Nuevo Artículo
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por título..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-[#1E293B] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="bg-[#1E293B] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="">Todas las categorías</option>
          <option value="technology">Technology</option>
          <option value="business">Business</option>
          <option value="politics">Politics</option>
          <option value="world">World</option>
          <option value="general">General</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-[#1E293B] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
        >
          <option value="">Todos los estados</option>
          <option value="hidden">Ocultas</option>
          <option value="pinned">Fijadas</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-2xl border border-red-500/20">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 text-sm font-bold">Error: {error}</p>
          <p className="text-gray-600 text-xs mt-2">Verifica que estás autenticado y eres administrador.</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 bg-[#1E293B] rounded-2xl border border-white/5">
          <Filter className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No se encontraron artículos.</p>
        </div>
      ) : (
        <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Artículo</th>
                  <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden lg:table-cell">Categoría</th>
                  <th className="text-left px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden md:table-cell">Fecha</th>
                  <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Estado</th>
                  <th className="text-right px-5 py-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {articles.map((article) => (
                  <motion.tr
                    key={article.id}
                    layout
                    className={`hover:bg-white/[0.02] transition-colors ${article.is_hidden ? "opacity-50" : ""}`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-800"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[300px] leading-snug">
                            {article.title}
                          </p>
                          {article.author && (
                            <p className="text-[10px] text-gray-600 mt-0.5">{article.author}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-gray-400">
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-gray-500 hidden md:table-cell whitespace-nowrap">
                      {fmtDate(article.published_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {article.is_pinned && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/20">
                            FIJADA
                          </span>
                        )}
                        {article.is_hidden && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/15 text-orange-400 border border-orange-500/20">
                            OCULTA
                          </span>
                        )}
                        {!article.is_pinned && !article.is_hidden && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500/15 text-green-400 border border-green-500/20">
                            VISIBLE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggle(article.id, "is_pinned")}
                          title={article.is_pinned ? "Desfijar" : "Fijar"}
                          disabled={actionLoading === article.id}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-purple-400 transition-colors disabled:opacity-30"
                        >
                          {article.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleToggle(article.id, "is_hidden")}
                          title={article.is_hidden ? "Mostrar" : "Ocultar"}
                          disabled={actionLoading === article.id}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-orange-400 transition-colors disabled:opacity-30"
                        >
                          {article.is_hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        <Link
                          href={`/admin/noticias/${article.id}/editar`}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-blue-400 transition-colors"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(article)}
                          title="Eliminar"
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/5">
              <p className="text-xs text-gray-500">
                Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1E293B] border border-white/10 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-bold text-white text-lg">Eliminar artículo</h3>
              </div>
              <p className="text-gray-400 text-sm mb-2">¿Estás seguro de que quieres eliminar permanentemente este artículo?</p>
              <p className="text-white font-semibold text-sm mb-6 line-clamp-2">&ldquo;{deleteTarget.title}&rdquo;</p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={actionLoading === deleteTarget.id}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === deleteTarget.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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
