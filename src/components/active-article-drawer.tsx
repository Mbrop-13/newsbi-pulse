"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Clock,
  Volume2,
  Share2,
  BookOpen,
  Radio,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDate, getFallbackImage } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { NewsArticle } from "@/lib/types";
import { BookmarkButton } from "@/components/bookmark-button";
import { ReadingListButton } from "@/components/reading-list-button";
import ReactMarkdown from "react-markdown";
import { ExpandableSources } from "@/components/expandable-sources";
import { ShareDialog } from "@/components/share-dialog";
import { useAudioPlayerStore } from "@/lib/stores/audio-player-store";
import { ArticleComments } from "@/components/article-comments";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";
import { OnboardingModal } from "@/components/onboarding-modal";
import { useInterestStore } from "@/lib/stores/interest-store";
import { useActiveArticleStore } from "@/lib/stores/active-article-store";
import { NewsCard } from "@/components/news-card";

export function ActiveArticleDrawer() {
  const { activeArticleId, activeArticle, isOpen, closeArticle } = useActiveArticleStore();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  const supabase = createClient();
  const playArticle = useAudioPlayerStore((s) => s.playArticle);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const trackInteraction = useInterestStore((s) => s.trackInteraction);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeArticle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeArticle]);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Load article content
  useEffect(() => {
    async function fetchFullArticle() {
      if (!activeArticleId) return;
      
      // If we have an initial partial article, show it immediately
      if (activeArticle && activeArticle.id === activeArticleId) {
        setArticle(activeArticle);
        setImgError(false);
        // If it already has enriched content, we don't strictly show loading skeleton for content
        if (!activeArticle.enriched_content) {
          setLoading(true);
        }
      } else {
        setArticle(null);
        setLoading(true);
        setImgError(false);
      }

      try {
        const { data: fullData, error } = await supabase
          .from("news_articles")
          .select("*")
          .eq("id", activeArticleId)
          .single();

        if (fullData && !error) {
          setArticle(fullData);
          
          // Track interest
          if (fullData.category || fullData.tags?.length > 0) {
            trackInteraction(fullData.category, fullData.tags || []);
          }

          // Fetch related articles
          const { data: related } = await supabase
            .from("news_articles")
            .select("*")
            .eq("category", fullData.category)
            .neq("id", fullData.id)
            .limit(3);
          
          if (related) setRelatedArticles(related);
        }
      } catch (err) {
        console.error("Error fetching full article detail:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFullArticle();
  }, [activeArticleId, activeArticle, supabase, trackInteraction]);

  // Trigger onboarding modal for guest users
  useEffect(() => {
    if (isOpen && !loading && article && !isAuthenticated) {
      const timer = setTimeout(() => setOnboardingOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, loading, article, isAuthenticated]);

  const displayedArticle = article || activeArticle;

  const readingTime = displayedArticle
    ? Math.ceil(((displayedArticle.enriched_content || displayedArticle.content || "").split(" ").length) / 200)
    : 3;

  return (
    <AnimatePresence>
      {isOpen && displayedArticle && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={closeArticle}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-[2px]"
          />

          {/* Sliding Drawer */}
          <motion.div
            ref={drawerRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-full md:max-w-3xl lg:max-w-4xl z-50 bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header / Actions Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeArticle}
                  className="rounded-full w-9 h-9"
                >
                  <X className="w-5 h-5" />
                </Button>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest hidden sm:inline-block">
                  Detalle de Noticia
                </span>
              </div>

              {/* Utility actions */}
              <div className="flex items-center gap-2">
                <ReadingListButton
                  article={{
                    id: displayedArticle.id,
                    title: displayedArticle.title,
                    category: displayedArticle.category,
                    image_url: displayedArticle.image_url || undefined,
                    slug: displayedArticle.slug,
                    published_at: displayedArticle.published_at,
                    source: displayedArticle.sources?.[0]?.name,
                  }}
                />
                <BookmarkButton articleId={displayedArticle.id} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-full"
                  onClick={() => setShareOpen(true)}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-9 h-9 rounded-full"
                  onClick={() => {
                    playArticle({
                      id: displayedArticle.id,
                      title: displayedArticle.title,
                      summary: displayedArticle.summary,
                      category: displayedArticle.category,
                      image_url: displayedArticle.image_url || undefined,
                      slug: displayedArticle.slug,
                    });
                  }}
                >
                  <Volume2 className="w-4 h-4" />
                </Button>
                
                <div className="w-px h-5 bg-border mx-1" />

                {/* Open in full page button */}
                <Link
                  href={`/article/${displayedArticle.slug || displayedArticle.id}`}
                  onClick={closeArticle}
                >
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold h-9">
                    <span>Expandir</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8">
              <article className="max-w-3xl mx-auto space-y-6">
                
                {/* Category & Live Badges */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1890FF]">
                    <span>{displayedArticle.category}</span>
                    {displayedArticle.sources?.[0] && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-border" />
                        <span className="text-muted-foreground">
                          {displayedArticle.sources[0].name}
                        </span>
                      </>
                    )}
                  </div>
                  {displayedArticle.is_live && (
                    <span className="px-2.5 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-sm">
                      <Radio className="w-3 h-3 animate-pulse" />
                      EN VIVO
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-sans font-bold leading-tight text-foreground">
                  <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
                    {displayedArticle.title}
                  </ReactMarkdown>
                </h1>

                {/* Summary */}
                <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                  <ReactMarkdown components={{ p: ({ children }) => <>{children}</> }}>
                    {displayedArticle.summary}
                  </ReactMarkdown>
                </p>

                {/* Author / Date Meta Bar */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground border-y border-border py-3">
                  {displayedArticle.author && (
                    <span className="font-semibold text-foreground">
                      Por {displayedArticle.author}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(displayedArticle.published_at)}
                  </span>
                  <span>{readingTime} min de lectura</span>
                  {displayedArticle.sources && displayedArticle.sources.length > 0 && (
                    <div className="border-l border-border pl-4">
                      <ExpandableSources sources={displayedArticle.sources} />
                    </div>
                  )}
                </div>

                {/* Image */}
                {displayedArticle.image_url && (
                  <div className="rounded-xl overflow-hidden bg-muted aspect-video relative">
                    <img
                      src={imgError ? getFallbackImage(displayedArticle.category) : displayedArticle.image_url}
                      onError={() => setImgError(true)}
                      alt={displayedArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Main Content Area */}
                {loading ? (
                  /* Loading Skeletons */
                  <div className="space-y-4 pt-4">
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-[95%]" />
                    <div className="h-4 bg-muted animate-pulse rounded w-[90%]" />
                    <div className="h-4 bg-muted animate-pulse rounded w-[40%] mb-8" />
                    
                    <div className="h-4 bg-muted animate-pulse rounded w-full" />
                    <div className="h-4 bg-muted animate-pulse rounded w-[92%]" />
                    <div className="h-4 bg-muted animate-pulse rounded w-[85%]" />
                  </div>
                ) : !isAuthenticated ? (
                  /* Blurred registration paywall overlay */
                  <div className="relative border border-border/50 rounded-2xl p-8 bg-card text-center max-w-xl mx-auto shadow-sm mt-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#1890FF]/10 flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="w-6 h-6 text-[#1890FF]" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Regístrate para leer el artículo completo
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                      Crea tu cuenta gratis para acceder a los análisis de inteligencia artificial, comentarios y el contenido completo.
                    </p>
                    <button
                      onClick={() => {
                        closeArticle();
                        useAuthModalStore.getState().openModal("register");
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1890FF] text-white text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Crear Cuenta Gratis
                    </button>
                    <p className="text-[11px] text-muted-foreground mt-3">
                      ¿Ya tienes cuenta?{" "}
                      <button
                        onClick={() => {
                          closeArticle();
                          useAuthModalStore.getState().openModal("login");
                        }}
                        className="text-[#1890FF] font-bold hover:underline"
                      >
                        Inicia sesión
                      </button>
                    </p>
                  </div>
                ) : (
                  /* Logged-in complete content */
                  <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-[1.8] pt-4 prose-a:text-[#1890FF] prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown>
                      {displayedArticle.enriched_content || displayedArticle.content || ""}
                    </ReactMarkdown>
                  </div>
                )}

                {/* YouTube Embed */}
                {displayedArticle.is_live && displayedArticle.live_youtube_url && (
                  <div className="border-t border-border pt-6 mt-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Radio className="w-5 h-5 text-red-500" />
                      Transmisión en Vivo
                    </h3>
                    <div className="aspect-video rounded-xl overflow-hidden border border-border">
                      <iframe
                        src={displayedArticle.live_youtube_url.replace("watch?v=", "embed/")}
                        className="w-full h-full"
                        allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      />
                    </div>
                  </div>
                )}

                {/* Comments box */}
                {isAuthenticated && !loading && (
                  <div className="border-t border-border pt-6 mt-8">
                    <ArticleComments articleId={displayedArticle.id} />
                  </div>
                )}

                {/* Related Articles */}
                {relatedArticles.length > 0 && !loading && (
                  <div className="border-t border-border pt-8 mt-12">
                    <h3 className="text-lg font-bold mb-6">
                      Noticias Relacionadas
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {relatedArticles.map((ra, i) => (
                        <div key={ra.id} onClick={closeArticle}>
                          <NewsCard
                            article={ra}
                            index={i}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </article>
            </div>
          </motion.div>

          {/* Share Dialog */}
          <ShareDialog
            isOpen={shareOpen}
            onClose={() => setShareOpen(false)}
            title={displayedArticle.title}
            summary={displayedArticle.summary}
            url={`/article/${displayedArticle.slug || displayedArticle.id}`}
            imageUrl={displayedArticle.image_url || undefined}
          />

          {/* Onboarding Modal for Guests */}
          <OnboardingModal
            isOpen={onboardingOpen}
            onClose={() => setOnboardingOpen(false)}
            articleTitle={displayedArticle.title}
          />
        </>
      )}
    </AnimatePresence>
  );
}
