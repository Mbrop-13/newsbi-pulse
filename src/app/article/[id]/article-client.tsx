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
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, getFallbackImage } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NewsArticle } from "@/lib/types";
import { NewsCard } from "@/components/news-card";
import { BookmarkButton } from "@/components/bookmark-button";
import { ReadingListButton } from "@/components/reading-list-button";
import ReactMarkdown from "react-markdown";
import { ExpandableSources } from "@/components/expandable-sources";
import { ShareDialog } from "@/components/share-dialog";
import { TradingViewWidget } from "@/components/tradingview-widget";
import { detectTicker } from "@/lib/detect-ticker";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { ArticleComments } from "@/components/article-comments";
import { useViewStore } from "@/lib/stores/use-view-store";
import { PredictionCard } from "@/components/prediction-card";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { OnboardingModal } from "@/components/onboarding-modal";

export default function ArticlePage() {
  const params = useParams();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [matchedPredictions, setMatchedPredictions] = useState<any[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const supabase = createClient();
  const playArticle = useAudioPlayerStore((s) => s.playArticle);
  const { articleWidth, showPredictions } = useViewStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const widthClass = 
    articleWidth === 'wide' ? 'max-w-4xl' : 
    articleWidth === 'full' ? 'max-w-[1400px]' : 
    'max-w-[760px]'; // 'normal'

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

        // Fetch predictions matching article tags
        if (articleData.tags && articleData.tags.length > 0) {
          try {
            const res = await fetch(`/api/predictions?status=active`);
            const pData = await res.json();
            if (pData.predictions) {
              const articleTagsLower = articleData.tags.map((t: string) => t.toLowerCase());
              const matched = pData.predictions.filter((p: any) =>
                p.tags?.some((pt: string) => articleTagsLower.includes(pt.toLowerCase()))
              );
              setMatchedPredictions(matched);
            }
          } catch {}
        }
      }
      
      setLoading(false);
    }
    
    fetchArticle();
    window.scrollTo(0, 0);
  }, [params.id, supabase]);

  // Show onboarding if not authenticated after article loads
  useEffect(() => {
    if (!loading && article && !isAuthenticated) {
      const timer = setTimeout(() => setOnboardingOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [loading, article, isAuthenticated]);

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
      <div className="pt-[6rem]" />

      {/* Article Header */}
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`${showPredictions && matchedPredictions.length > 0 ? 'max-w-[1200px]' : widthClass} mx-auto px-4 pb-16 transition-all duration-300`}
      >
        {/* Back and Live badge */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
          {article.is_live && (
            <span className="px-2.5 py-1 bg-live-red text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
              <Radio className="w-3 h-3 animate-pulse" />
              EN VIVO
            </span>
          )}
        </div>

        {/* Title */}
        <div className="font-editorial text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
            {article.title}
          </ReactMarkdown>
        </div>

        {/* Description */}
        <div className="text-lg text-muted-foreground leading-relaxed mb-6">
          <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
            {article.summary}
          </ReactMarkdown>
        </div>

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
              <div className="border-l border-border/50 pl-4 flex items-center gap-2">
                <ExpandableSources sources={article.sources} />
                {(article.relevance_score || 0) > 0 && (
                  <span 
                    className="flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-bold tracking-tight shadow-sm"
                    title="Porcentaje de Importancia asignado por Inteligencia Artificial"
                  >
                    {article.relevance_score > 1 ? Math.round(article.relevance_score) : Math.round(article.relevance_score * 100)}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <ReadingListButton 
               article={{
                 id: article.id,
                 title: article.title,
                 category: article.category,
                 image_url: article.image_url || undefined,
                 slug: article.slug,
                 published_at: article.published_at,
                 source: article.sources?.[0]?.name
               }}
            />
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

        {/* Two-column layout: Image+Article on Left, Predictions on Right */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Full article body */}
          <div className="flex-1 min-w-0">
            {/* Hero Image */}
            {article.image_url && (
              <div className="mb-8 rounded-xl overflow-hidden">
                <img
                  src={imgError ? getFallbackImage(article.category) : article.image_url}
                  onError={() => setImgError(true)}
                  alt={article.title}
                  className="w-full h-auto object-cover aspect-video"
                />
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  Fuentes: {article.sources?.map(s => s.name).join(", ") || "No especificadas"}
                </p>
              </div>
            )}

            {/* TradingView Widget (auto-detected) */}
            {isAuthenticated && (() => {
              const ticker = detectTicker(`${article.title} ${article.summary} ${article.enriched_content || article.content || ""}`);
              return ticker ? <TradingViewWidget symbol={ticker.symbol} displayName={ticker.name} /> : null;
            })()}

            {/* Article Content */}
            {isAuthenticated ? (
              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-[1.8] mb-12 prose-a:text-[#1890FF] prose-a:no-underline hover:prose-a:underline">
                <ReactMarkdown>
                  {article.enriched_content || article.content || ""}
                </ReactMarkdown>
              </div>
            ) : (
              /* Blurred placeholder for non-authenticated users */
              <div className="relative mb-12">
                {/* Fake blurred text lines */}
                <div className="space-y-4 select-none" aria-hidden="true">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className={`h-4 rounded bg-gray-200 dark:bg-gray-800 ${i % 3 === 0 ? 'w-full' : i % 3 === 1 ? 'w-[90%]' : 'w-[75%]'}`} />
                      <div className={`h-4 rounded bg-gray-200 dark:bg-gray-800 ${i % 2 === 0 ? 'w-[85%]' : 'w-full'}`} />
                      <div className="h-4 rounded bg-gray-200 dark:bg-gray-800 w-[60%]" />
                    </div>
                  ))}
                </div>
                {/* CTA overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-white via-white/90 to-white/60 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-950/60">
                  <div className="text-center px-6 py-8 max-w-md">
                    <div className="w-14 h-14 rounded-2xl bg-[#1890FF]/10 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-7 h-7 text-[#1890FF]" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                      Regístrate para leer el artículo completo
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                      Crea tu cuenta gratis y accede a todas las noticias, análisis de IA y herramientas de personalización.
                    </p>
                    <button
                      onClick={() => { useAuthModalStore.getState().openModal("register"); }}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1890FF] to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-[#1890FF]/25"
                    >
                      <Sparkles className="w-4 h-4" />
                      Crear Cuenta Gratis
                    </button>
                    <p className="text-xs text-gray-400 mt-3">
                      ¿Ya tienes cuenta?{" "}
                      <button onClick={() => useAuthModalStore.getState().openModal("login")} className="text-[#1890FF] font-bold hover:underline">
                        Inicia sesión
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Prediction Sidebar (sticky, next to image) */}
          {showPredictions && matchedPredictions.length > 0 && (
            <aside className="w-full lg:w-[340px] shrink-0">
              <div className="lg:sticky lg:top-28 space-y-3">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  Mercados Relacionados
                </h3>
                {matchedPredictions.map((p: any) => (
                  <PredictionCard key={p.id} prediction={p} compact />
                ))}
              </div>
            </aside>
          )}
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


        {/* Cajas de Comentarios */}
        <ArticleComments articleId={article.id} />

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

      {/* Onboarding Modal for unauthenticated users */}
      <OnboardingModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        articleTitle={article.title}
      />

    </div>
  );
}
