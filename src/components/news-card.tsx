"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Bookmark, Headphones, Copy, Share2, Check, Clock } from "lucide-react";
import { NewsArticle } from "@/lib/types";
import { getFallbackImage } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { useViewStore } from "@/lib/stores/use-view-store";
import { useBookmarkStore } from "@/lib/stores/bookmark-store";
import { useReadingListStore } from "@/lib/stores/use-reading-list-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthToastStore } from "@/lib/stores/auth-toast-store";
import { toast } from "sonner";
import { useActiveArticleStore } from "@/lib/stores/active-article-store";

interface NewsCardProps {
  article: NewsArticle;
  index: number;
  layout?: "default" | "featured" | "compact" | "horizontal" | "list" | "traditional" | "grid";
}

export function NewsCard({ article, index, layout = "default" }: NewsCardProps) {
  const { openArticle } = useActiveArticleStore();
  const hasEnriched = !!(article.enriched_content && article.enriched_content.length > 50);
  const { showImages, fontSize } = useViewStore();

  const handleCardClick = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      openArticle(article.id, article);
    }
  };
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useAuthToastStore();
  const bookmarked = isBookmarked(article.id);

  const { addToQueue, removeFromQueue, queue } = useReadingListStore();
  const isInQueue = queue.some(q => q.id === article.id);

  const formatTimeAgo = (d: string) => {
    try {
      const date = new Date(d);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `hace ${mins}m`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `hace ${hrs}h`;
      return `hace ${Math.floor(hrs / 24)}d`;
    } catch { return ""; }
  };

  const getFavicon = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleToggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Inicia sesión para poder guardar noticias.");
      return;
    }
    toggleBookmark(article.id);
    toast.success(bookmarked ? "Quitado de favoritos." : "Guardado en favoritos.");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/article/${article.slug || article.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Enlace copiado al portapapeles.");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.error("Error al copiar enlace.");
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/article/${article.slug || article.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || undefined,
          url: url,
        });
      } catch (err) {
        // share cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const titleSizeClass = 
    layout === 'featured' ? 'text-2xl sm:text-3xl' :
    layout === 'compact' ? 'text-sm font-bold' :
    fontSize === 'sm' ? 'text-sm font-semibold' :
    fontSize === 'lg' ? 'text-base font-bold' :
    'text-sm.5 font-bold'; // base default for Google News card style

  // Show summary only on featured, list or horizontal layouts
  const showSummary = layout === 'featured' || layout === 'list' || layout === 'traditional' || layout === 'horizontal';

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: "easeOut" }}
      className={`group relative w-full bg-card rounded-2xl border border-border/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden flex flex-col ${
        layout !== 'default' ? 'h-full' : ''
      }`}
    >
      <Link 
        href={`/article/${article.slug || article.id}`} 
        onClick={handleCardClick}
        className="flex flex-col flex-1 relative focus:outline-none"
      >
        <div className="absolute inset-0 bg-[#1890FF]/0 group-active:bg-[#1890FF]/5 transition-colors z-10 pointer-events-none" />

        {/* Hero Image */}
        {showImages && article.image_url && (
          <div className={`relative w-full overflow-hidden rounded-t-xl bg-gray-50 dark:bg-slate-800/40 shrink-0 ${
             layout === 'featured' ? 'h-64 sm:h-80 md:h-[350px]' :
             layout === 'compact' ? 'aspect-[2/1] sm:aspect-video' :
             'aspect-[16/10]'
          }`}>
            <img
              src={imgError ? getFallbackImage(article.category) : article.image_url}
              onError={() => setImgError(true)}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-750 group-hover:scale-[1.03]"
            />
          </div>
        )}

        {/* Card Body */}
        <div className="flex flex-col p-4 sm:p-5 gap-2.5 flex-1 mt-auto">
          
          {/* Top Meta info */}
          <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400">
            <span className="uppercase text-[#1890FF] tracking-wider">{article.category}</span>
            <span className="w-0.5 h-0.5 rounded-full bg-gray-400 shrink-0" />
            <span>Publicado {formatTimeAgo(article.published_at)}</span>
            
            {hasEnriched && (
              <>
                <span className="w-0.5 h-0.5 rounded-full bg-gray-400 shrink-0 ml-auto" />
                <span className="flex items-center gap-0.5 text-[9px] font-bold text-gray-400 dark:text-gray-500">
                  <ShieldCheck className="w-3 h-3 text-[#1890FF]" />
                  IA
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-sans leading-tight transition-colors line-clamp-3 text-gray-950 dark:text-gray-50 group-hover:text-[#1890FF] ${titleSizeClass}`}>
            {article.title}
          </h3>

          {/* Summary */}
          {showSummary && article.summary && (
            <div className="text-gray-500 dark:text-gray-400 text-xs.5 sm:text-sm leading-relaxed line-clamp-3 mt-1.5">
              <ReactMarkdown>{article.summary}</ReactMarkdown>
            </div>
          )}

          {/* Footer actions and sources */}
          <div className="flex items-center mt-auto pt-3 border-t border-border/40 justify-between">
            {article.sources && article.sources.length > 0 ? (
              <div className="flex items-center gap-1.5 min-w-0 z-30">
                <div className="flex items-center -space-x-1 shrink-0">
                  {article.sources.slice(0, 3).map((src: any, idx: number) => {
                    const favicon = getFavicon(src.url);
                    return favicon ? (
                      <img 
                        key={idx}
                        src={favicon} 
                        alt="" 
                        className="w-4 h-4 rounded-full border border-card bg-white object-contain shrink-0" 
                      />
                    ) : (
                      <div key={idx} className="w-4 h-4 rounded-full border border-card bg-muted text-[7px] font-black flex items-center justify-center shrink-0">
                        {src.name.charAt(0)}
                      </div>
                    );
                  })}
                </div>
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                  {article.sources.length} {article.sources.length === 1 ? "fuente" : "fuentes"}
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-gray-400 font-medium">Maverlang</div>
            )}

            {/* Premium action buttons */}
            <div className="flex items-center gap-2 z-30 shrink-0">
              <button
                onClick={handleToggleBookmark}
                className={`p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors ${
                  bookmarked ? 'text-[#1890FF]' : 'text-gray-400 hover:text-foreground'
                }`}
                title="Guardar favorito"
              >
                <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={handleShare}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-foreground transition-colors"
                title="Compartir"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </Link>
    </motion.article>
  );
}
