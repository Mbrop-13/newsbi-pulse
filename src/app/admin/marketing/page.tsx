"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Mail,
  BellRing,
  Send,
  Loader2,
  Copy,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Clock
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Article {
  id: string;
  title: string;
  category: string;
  published_at: string;
  relevance_score: number;
  enriched_content?: string;
}

export default function MarketingAdminPage() {
  const [activeTab, setActiveTab] = useState<"news" | "config">("news");
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Configuration States
  const [newsletterEnabled, setNewsletterEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [senderName, setSenderName] = useState("Reclu Inteligencia");
  const [senderEmail, setSenderEmail] = useState("no-reply@reclu.cl");

  useEffect(() => {
    fetchEnrichedNews();
  }, []);

  const fetchEnrichedNews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/articles?enrichedOnly=true&limit=10");
      const data = await res.json();
      if (data.articles) {
        setNews(data.articles);
      }
    } catch (err) {
      console.error("Error fetching enriched news:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNewsletter = (article: Article) => {
    const text = `📰 *${article.title}*\n\n${article.enriched_content || "Sin contenido enriquecido"}\n\n👉 Lee más en reclu.cl`;
    navigator.clipboard.writeText(text);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Marketing y Difusión</h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
              Gestiona newsletters, notificaciones push y contenido optimizado por IA.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-px">
        <button
          onClick={() => setActiveTab("news")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "news"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Noticias Enriquecidas (Listas para enviar)
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          <Mail className="w-4 h-4" />
          Configuración de Campañas
        </button>
      </div>

      {/* Tab Content: News */}
      {activeTab === "news" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : news.length === 0 ? (
            <div className="bg-white dark:bg-[#0F172A] p-8 rounded-2xl border border-slate-200 dark:border-white/5 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">No hay noticias enriquecidas</h3>
              <p className="text-slate-500 dark:text-gray-400 mt-2">
                La IA aún no ha procesado noticias o no tienen la marca de enriquecidas.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {news.map((article) => (
                <div key={article.id} className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                          {article.category}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(article.published_at).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          🔥 Score: {article.relevance_score}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{article.title}</h3>
                      <p className="text-sm text-slate-600 dark:text-gray-400 line-clamp-2">
                        {article.enriched_content}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyNewsletter(article)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-indigo-50 dark:bg-white/5 dark:hover:bg-indigo-500/10 text-slate-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-colors"
                      >
                        {copiedId === article.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        {copiedId === article.id ? "Copiado" : "Copiar (Newsletter)"}
                      </button>
                      <button className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-500/20 transition-all">
                        <Send className="w-4 h-4" />
                        Enviar Push
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Config */}
      {activeTab === "config" && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <Mail className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Newsletter Automático</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Activar Newsletter Diario</p>
                  <p className="text-xs text-slate-500">Envía un resumen de las mejores noticias todos los días.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={newsletterEnabled} onChange={(e) => setNewsletterEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Nombre del Remitente</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1">Email del Remitente</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            
            <button className="w-full py-2.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded-xl text-sm transition-colors">
              Guardar Configuración
            </button>
          </div>

          <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
              <BellRing className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Notificaciones Push</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">Alertas de Breaking News</p>
                  <p className="text-xs text-slate-500">Enviar notificación push cuando haya una noticia mayor a 90 de relevancia.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20">
              <p className="text-xs text-purple-800 dark:text-purple-300">
                <strong>Nota:</strong> Las notificaciones push requieren la configuración de credenciales de Firebase Cloud Messaging (FCM) o VAPID keys.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
