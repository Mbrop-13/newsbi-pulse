"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ChevronDown, ExternalLink, BarChart3, Globe, TrendingUp, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface AnalyzedNewsCardProps {
  toolName: string;
  result: any;
}

function timeAgo(dateStr: string) {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  } catch { return ""; }
}

function scoreColor(score: number) {
  if (score >= 8) return "text-emerald-500";
  if (score >= 6) return "text-amber-500";
  return "text-gray-400";
}

function scoreBg(score: number) {
  if (score >= 8) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 6) return "bg-amber-500/10 border-amber-500/20";
  return "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
}

export function AnalyzedNewsCard({ toolName, result }: AnalyzedNewsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Only render for news-related tools. Portfolio summary and news context are handled by the AI text response.
  const newsTools = ['get_portfolio_news', 'get_top_news_today', 'search_general_news'];
  if (!newsTools.includes(toolName)) return null;

  if (!result || !result.news || result.news.length === 0) {
    if (result?.error) {
      return (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-500/10 rounded-2xl text-xs font-medium text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-500/20 w-fit">
          <BarChart3 className="w-4 h-4 shrink-0" />
          {result.error}
        </div>
      );
    }
    // Don't show "sin noticias" for empty results — the AI text response handles it
    return null;
  }

  const news = result.news;
  const isPortfolio = toolName === 'get_portfolio_news';
  const label = isPortfolio ? "Noticias del Portafolio" : toolName === 'get_top_news_today' ? "Top Noticias de Hoy" : "Noticias Encontradas";
  const Icon = isPortfolio ? BarChart3 : toolName === 'get_top_news_today' ? TrendingUp : Globe;

  // Circular thumbnail avatars for the collapsed preview (show first 5)
  const previewImages = news.filter((n: any) => n.image_url).slice(0, 5);

  return (
    <div className="w-full my-3">
      {/* ── Sources Pill Button ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-fit px-2 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] border border-gray-200/60 dark:border-white/10 rounded-full transition-all cursor-pointer group shadow-sm"
      >
        <div className="flex -space-x-1.5 pl-0.5">
          {previewImages.map((item: any, i: number) => (
            <div
              key={item.id}
              className="w-[22px] h-[22px] rounded-full border border-white dark:border-gray-900 bg-white dark:bg-gray-800 overflow-hidden shrink-0 shadow-sm flex items-center justify-center"
              style={{ zIndex: previewImages.length - i }}
            >
              {item.image_url ? (
                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Globe className="w-3 h-3 text-gray-400" />
              )}
            </div>
          ))}
        </div>
        <span className="text-[13px] font-semibold text-gray-600 dark:text-gray-300 pr-1 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
          {news.length} fuentes
        </span>
      </button>

      {/* ── Expanded Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="
              w-full max-w-sm
              bg-white dark:bg-[#141821]
              border border-gray-200/80 dark:border-white/10
              rounded-2xl shadow-sm
              overflow-hidden
            ">
              {/* Scrollable news list with bounded height */}
              <div className="max-h-[340px] overflow-y-auto hidden-scrollbar divide-y divide-gray-100 dark:divide-white/5">
                {news.map((item: any, i: number) => (
                  <Link 
                    key={item.id}
                    href={`/article/${item.slug || item.id}`}
                    target="_blank"
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-[#1890FF]/5 dark:hover:bg-[#1890FF]/5 transition-colors group"
                  >
                    {/* Rank number */}
                    <span className="text-xs font-black text-gray-300 dark:text-gray-700 w-4 text-right tabular-nums shrink-0">
                      {i + 1}
                    </span>

                    {/* Circular Thumbnail */}
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0 ring-2 ring-gray-100 dark:ring-gray-800 group-hover:ring-[#1890FF]/30 transition-all">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Newspaper className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Title + Meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[#1890FF] transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.published_at && (
                          <span className="flex items-center gap-0.5 text-[10px] font-medium text-gray-400">
                            <Clock className="w-3 h-3" />
                            {timeAgo(item.published_at)}
                          </span>
                        )}
                        {item.relevance_score > 0 && (
                          <span className={`flex items-center gap-0.5 text-[10px] font-bold ${scoreColor(item.relevance_score)} ${scoreBg(item.relevance_score)} px-1.5 py-0.5 rounded-md border`}>
                            <Sparkles className="w-2.5 h-2.5" />
                            {typeof item.relevance_score === 'number' && item.relevance_score <= 10
                              ? `${item.relevance_score}/10`
                              : `${Math.round(item.relevance_score * 100)}%`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ExternalLink className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-[#1890FF] shrink-0 transition-colors" />
                  </Link>
                ))}
              </div>

              {/* Bottom gradient fade hint if scrollable */}
              {news.length > 5 && (
                <div className="h-1 bg-gradient-to-r from-transparent via-[#1890FF]/20 to-transparent" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
