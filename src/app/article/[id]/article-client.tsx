"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  Volume2,
  Share2,
  BookOpen,
  Radio,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NewsArticle } from "@/lib/types";
import { NewsCard } from "@/components/news-card";
import { BookmarkButton } from "@/components/bookmark-button";
import ReactMarkdown from "react-markdown";
import { ExpandableSources } from "@/components/expandable-sources";
import { ShareDialog } from "@/components/share-dialog";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { detectTicker } from "@/lib/detect-ticker";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const supabase = createClient();
  const playArticle = useAudioPlayerStore((s) => s.playArticle);

  useEffect(() => {
    async function fetchArticle() {
      if (!params.id) return;
      setLoading(true);
      
      const id = params.id as string;
      const isUuid = id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      let articleData: NewsArticle | null = null;
      if (isUuid) {
        const { data: byId } = await supabase.from("news_articles").select("*").eq("id", id).single();
        articleData = byId;
      }
      
      if (!articleData) {
        const { data: bySlug } = await supabase.from("news_articles").select("*").eq("slug", id).single();
        articleData = bySlug;
      }

      setArticle(articleData);
      
      if (articleData) {
        // Fetch related articles
        const { data: related } = await supabase
          .from("news_articles")
          .select("*")
          .eq("category", articleData.category)
          .neq("id", articleData.id)
          .limit(3);
        
        if (related) setRelatedArticles(related);
      }
      
      setLoading(false);
    }
    
    fetchArticle();
    window.scrollTo(0, 0);
  }, [params.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-editorial text-2xl font-bold mb-2">Artículo no encontrado</h2>
          <p className="text-muted-foreground text-sm mb-6">
            El artículo que buscas no existe o ha sido removido.
          </p>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const readingTime = Math.ceil(
    ((article.enriched_content || article.content || "").split(" ").length) / 200
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top spacer for navbar */}
      <div className="pt-[7rem] md:pt-[9rem]" />

      {/* Article Header */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-[760px] mx-auto px-4 pb-16"
      >
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-6">
          <Link
            href="/"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Inicio
          </Link>
          <span>/</span>
          <span className="capitalize">{article.category}</span>
        </div>

        {/* Category + Live badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-0.5 bg-accent text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
            {article.category}
          </span>
          {article.is_live && (
            <span className="px-2.5 py-0.5 bg-live-red text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <Radio className="w-3 h-3" />
              EN VIVO
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="font-editorial text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          {article.title}
        </h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
          {article.summary}
        </p>

        {/* Meta bar */}
        <div className="flex items-center justify-between py-4 border-y border-border mb-8">
          <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
            <span className="font-semibold text-foreground">
              {article.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(article.published_at)}
            </span>
            <span>{readingTime} min lectura</span>
            {article.sources && article.sources.length > 0 && (
              <div className="border-l border-border/50 pl-4 flex items-center">
                <ExpandableSources sources={article.sources} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <BookmarkButton articleId={article.id} />
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => setShareOpen(true)}>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => {
              if (article) {
                playArticle({
                  id: article.id,
                  title: article.title,
                  summary: article.summary,
                  category: article.category,
                  image_url: article.image_url || undefined,
                  slug: article.slug,
                });
              }
            }}>
              <Volume2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hero Image */}
        {article.image_url && (
          <div className="mb-8 rounded-xl overflow-hidden">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-auto object-cover aspect-video"
            />
            <p className="text-[11px] text-muted-foreground mt-2 italic">
              Fuentes: {article.sources?.map(s => s.name).join(", ") || "No especificadas"}
            </p>
          </div>
        )}

        {/* TradingView Widget (auto-detected) */}
        {(() => {
          const ticker = detectTicker(`${article.title} ${article.summary} ${article.enriched_content || article.content || ""}`);
          return ticker ? <TradingViewWidget symbol={ticker.symbol} displayName={ticker.name} /> : null;
        })()}

        {/* Article Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-[1.8] mb-12 prose-a:text-[#1890FF] prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>
            {article.enriched_content || article.content || ""}
          </ReactMarkdown>
        </div>



        {/* Tags */}
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags?.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-secondary/50 border border-border/50 rounded-full text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* YouTube Embed */}
        {article.is_live && article.live_youtube_url && (
          <div className="mt-10 editorial-rule-top pt-8">
            <h3 className="font-editorial text-xl font-bold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-live-red" />
              Cobertura en Vivo
            </h3>
            <div className="aspect-video rounded-xl overflow-hidden border border-border">
              <iframe
                src={article.live_youtube_url.replace(
                  "watch?v=",
                  "embed/"
                )}
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <div className="mt-12 editorial-rule-top pt-8">
            <h3 className="font-editorial text-xl font-bold mb-6">
              Noticias Relacionadas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {relatedArticles.map((ra, i) => (
                <NewsCard
                  key={ra.id}
                  article={ra}
                  index={i}
                />
              ))}
            </div>
          </div>
        )}
      </motion.article>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        title={article.title}
        summary={article.summary}
        url={`/article/${article.slug || article.id}`}
        imageUrl={article.image_url || undefined}
      />
    </div>
  );
}
