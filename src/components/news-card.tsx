"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Clock, Radio, ShieldCheck, MoreVertical, Bookmark, Headphones, Copy, Share2, Check } from "lucide-react";
import { NewsArticle } from "@/lib/types";
import { formatDate, getFallbackImage } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ExpandableSources } from "./expandable-sources";
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
  layout?: "default" | "featured" | "compact" | "list" | "grid" | "traditional";
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

  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useAuthToastStore();
  const bookmarked = isBookmarked(article.id);

  const { addToQueue, removeFromQueue, queue } = useReadingListStore();
  const isInQueue = queue.some(q => q.id === article.id);

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

  const handleToggleReadingList = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast("Inicia sesión para escuchar noticias.");
      return;
    }
    if (isInQueue) {
      removeFromQueue(article.id);
      toast.success("Quitado de tu lista de reproducción.");
    } else {
      addToQueue({
        id: article.id,
        title: article.title,
        category: article.category,
        image_url: article.image_url || undefined,
        slug: article.slug,
        published_at: article.published_at,
        source: article.sources?.[0]?.name
      });
      toast.success("Añadido a tu lista de reproducción.");
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      handleCopyLink(e);
    }
  };

  const titleSizeClass = 
    layout === 'featured' ? 'text-2xl sm:text-3xl md:text-4xl' :
    layout === 'compact' ? 'text-lg' :
    layout === 'traditional' ? 'text-3xl sm:text-4xl lg:text-[2.5rem]' :
    fontSize === 'sm' ? 'text-lg sm:text-xl' :
    fontSize === 'lg' ? 'text-2xl sm:text-3xl' :
    'text-xl sm:text-2xl'; // base default

  if (layout === 'traditional') {
    return (
      <article className="group flex flex-col gap-3 py-6 border-b border-gray-200 dark:border-gray-800 relative">
        {/* Floating Action Menu */}
        <div className="absolute top-6 right-0 z-30">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center transition-colors shadow-sm"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          
          {/* Context Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-35" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-1 w-44 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-150 dark:border-gray-800 shadow-xl z-40 py-1 overflow-hidden"
                >
                  <button
                    onClick={handleToggleBookmark}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                      bookmarked ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'
                    } hover:bg-gray-100 dark:hover:bg-slate-800`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                    {bookmarked ? "Guardado" : "Guardar favorito"}
                  </button>
                  <button
                    onClick={handleToggleReadingList}
                    className={`w-full text-left px-3 py-2.5 text-xs font-bold transition-colors flex items-center gap-2 ${
                      isInQueue ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'
                    } hover:bg-gray-100 dark:hover:bg-slate-800`}
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    {isInQueue ? "Escuchando" : "Escuchar audio"}
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copiado!" : "Copiar enlace"}
                  </button>
                  <button
                    onClick={handleShare}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <Link 
          href={`/article/${article.slug || article.id}`} 
          onClick={handleCardClick}
          className="group-hover:opacity-80 transition-opacity flex flex-col gap-3 focus:outline-none"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1890FF]">{article.category}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-widest">{article.sources?.[0]?.name || "Noticias"}</span>
          </div>
          
          <h3 className={`font-serif font-medium tracking-tight leading-[1.1] text-gray-900 dark:text-gray-100 ${titleSizeClass}`}>
            {article.title}
          </h3>

          {showImages && article.image_url && (
            <div className="w-full mt-3 mb-2 bg-gray-100 dark:bg-gray-900">
              <img 
                src={imgError ? getFallbackImage(article.category) : article.image_url} 
                onError={() => setImgError(true)}
                alt={article.title} 
                className="w-full h-auto object-cover grayscale-[30%]" 
              />
            </div>
          )}

          <div className="text-gray-700 dark:text-gray-300 leading-relaxed prose prose-base dark:prose-invert max-w-none prose-p:m-0 prose-headings:m-0 [*_>_p]:inline line-clamp-4">
            <ReactMarkdown>{article.summary || ""}</ReactMarkdown>
          </div>

          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{formatDate(article.published_at)}</span>
            {hasEnriched && (
              <span className="flex items-center gap-1 font-bold text-gray-400 dark:text-gray-500">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1890FF]" /> IA
              </span>
            )}
          </div>
        </Link>
      </article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className={`group relative w-full bg-card rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-[#1890FF]/15 transition-all duration-300 overflow-hidden flex flex-col ${
        layout !== 'default' ? 'h-full' : ''
      }`}
    >
      {/* Floating Action Menu */}
      <div className="absolute top-3 right-3 z-30 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-[#1890FF] hover:text-white border-none flex items-center justify-center transition-colors shadow-md"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {/* Context Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-35" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); }} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-1 w-44 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-150 dark:border-gray-800 shadow-xl z-40 py-1 overflow-hidden"
              >
                <button
                  onClick={handleToggleBookmark}
                  className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center gap-2 ${
                    bookmarked ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-100 dark:hover:bg-slate-800`}
                >
                  <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? 'fill-current' : ''}`} />
                  {bookmarked ? "Guardado" : "Guardar favorito"}
                </button>
                <button
                  onClick={handleToggleReadingList}
                  className={`w-full text-left px-3 py-2 text-xs font-bold transition-colors flex items-center gap-2 ${
                    isInQueue ? 'text-[#1890FF]' : 'text-gray-700 dark:text-gray-300'
                  } hover:bg-gray-100 dark:hover:bg-slate-800`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  {isInQueue ? "Escuchando" : "Escuchar audio"}
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copiado!" : "Copiar enlace"}
                </button>
                <button
                  onClick={handleShare}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Compartir
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <Link 
        href={`/article/${article.slug || article.id}`} 
        onClick={handleCardClick}
        className="flex flex-col flex-1 relative focus:outline-none"
      >
        
        {/* Floating Ripple Effect Layer (Subtle click action) */}
        <div className="absolute inset-0 bg-[#1890FF]/0 group-active:bg-[#1890FF]/5 transition-colors z-10 pointer-events-none" />

        {/* Hero Image */}
        {showImages && article.image_url && (
          <div className={`relative w-full overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800 shrink-0 ${
             layout === 'featured' ? 'h-64 sm:h-80 md:h-[350px] lg:flex-1 lg:min-h-[300px]' :
             layout === 'compact' ? 'aspect-[2/1] sm:aspect-video lg:h-36 xl:h-44' :
             'aspect-video'
          }`}>
            <img
              src={imgError ? getFallbackImage(article.category) : article.image_url}
              onError={() => setImgError(true)}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Live / Breaking Badge */}
            {article.is_live && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-md">
                <Radio className="w-3 h-3 animate-pulse" />
                En Vivo
              </div>
            )}
          </div>
        )}

        {/* Card Body */}
        <div className={`flex flex-col mt-auto flex-1 ${layout === 'compact' ? 'p-4 gap-2' : 'p-5 sm:p-6 gap-3'}`}>
          
          {/* Top Meta */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1890FF]">
              {article.category}
            </span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {article.sources?.[0]?.name || "Noticias"}
            </span>
            
            {hasEnriched && (
              <>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 ml-auto" />
                <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500">
                  <ShieldCheck className="w-3 h-3 text-[#1890FF]" />
                  IA
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className={`font-sans font-bold leading-tight transition-colors shrink-0 line-clamp-3 ${titleSizeClass} ${
            article.is_live ? 'text-[#1890FF]' : 'text-gray-900 dark:text-gray-100 group-hover:text-[#1890FF]'
          }`}>
            {article.title}
          </h3>

          {/* Summary */}
          <div className={`text-gray-500 dark:text-gray-400 leading-relaxed shrink-0 prose prose-sm dark:prose-invert max-w-none prose-p:m-0 prose-headings:m-0 [*_>_p]:inline ${
             layout === 'compact' ? 'text-xs sm:text-sm line-clamp-2' : 'text-sm sm:text-base line-clamp-3'
          }`}>
            <ReactMarkdown>{article.summary || ""}</ReactMarkdown>
          </div>


          {/* Footer Action Bar */}
          <div className={`flex items-center mt-auto border-t border-gray-100 dark:border-gray-800/50 ${layout === 'compact' ? 'pt-3' : 'pt-4'}`}>
            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium z-30">
              <span className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(article.published_at)}
              </span>
              
              {article.sources && article.sources.length > 0 && (
                <div className="border-l border-border/50 pl-3">
                  <ExpandableSources sources={article.sources} />
                </div>
              )}
            </div>
          </div>

        </div>
      </Link>
    </motion.article>
  );
}
