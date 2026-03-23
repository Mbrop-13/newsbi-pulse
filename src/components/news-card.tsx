"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Radio, ShieldCheck } from "lucide-react";
import { NewsArticle } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { BookmarkButton } from "./bookmark-button";
import ReactMarkdown from "react-markdown";
import { ExpandableSources } from "./expandable-sources";

interface NewsCardProps {
  article: NewsArticle;
  index: number;
  layout?: "default" | "featured" | "compact";
}

export function NewsCard({ article, index, layout = "default" }: NewsCardProps) {
  const hasEnriched = !!(article.enriched_content && article.enriched_content.length > 50);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className={`group relative w-full bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-[#1890FF]/15 transition-all duration-300 overflow-hidden flex flex-col ${
        layout !== 'default' ? 'h-full' : ''
      }`}
    >
      <Link href={`/article/${article.slug || article.id}`} className="flex flex-col flex-1 relative focus:outline-none">
        
        {/* Floating Ripple Effect Layer (Subtle click action) */}
        <div className="absolute inset-0 bg-[#1890FF]/0 group-active:bg-[#1890FF]/5 transition-colors z-10 pointer-events-none" />

        {/* Hero Image */}
        {article.image_url && (
          <div className={`relative w-full overflow-hidden rounded-t-xl bg-gray-100 dark:bg-gray-800 shrink-0 ${
             layout === 'featured' ? 'h-64 sm:h-80 md:h-[350px] lg:flex-1 lg:min-h-[300px]' :
             layout === 'compact' ? 'aspect-[2/1] sm:aspect-video lg:h-36 xl:h-44' :
             'aspect-video'
          }`}>
            <img
              src={article.image_url}
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
            
            <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
              <BookmarkButton articleId={article.id} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 border-none" />
            </div>
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
          <h3 className={`font-sans font-bold leading-tight transition-colors shrink-0 ${
            layout === 'featured' ? 'text-2xl sm:text-3xl md:text-4xl line-clamp-3' : 
            layout === 'compact' ? 'text-lg line-clamp-2' : 
            'text-xl sm:text-2xl line-clamp-3'
          } ${article.is_live ? 'text-[#1890FF]' : 'text-gray-900 dark:text-gray-100 group-hover:text-[#1890FF]'}`}>
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
