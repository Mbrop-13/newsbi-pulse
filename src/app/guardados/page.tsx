"use client";

import { useState, useEffect } from "react";
import { useBookmarkStore } from "@/lib/stores/bookmark-store";
import { MOCK_ARTICLES } from "@/lib/mock-data";
import { NewsCard } from "@/components/news-card";
import { Bookmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GuardadosPage() {
  const { bookmarkedArticleIds } = useBookmarkStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevents hydration mismatch
  }

  // En un entorno de producción real, haríamos un fetch a la BD usando estos IDs
  // Por ahora, lo sacamos del MOCK_ARTICLES
  const savedArticles = MOCK_ARTICLES.filter((article) =>
    bookmarkedArticleIds.includes(article.id)
  );

  return (
    <div className="min-h-screen bg-background text-foreground pt-[7.5rem] md:pt-[9rem]">
      <div className="max-w-[1200px] mx-auto px-4 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 editorial-rule-double">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver a noticias
            </Link>
            <h1 className="font-editorial text-3xl md:text-5xl font-bold flex items-center gap-3">
              <Bookmark className="w-8 h-8 md:w-10 md:h-10 text-accent fill-accent" />
              Artículos Guardados
            </h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-4 md:mt-0 uppercase tracking-widest">
            {savedArticles.length} {savedArticles.length === 1 ? "Artículo" : "Artículos"}
          </p>
        </div>

        {/* Content */}
        {savedArticles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {savedArticles.map((article, i) => (
              <div key={article.id} className="editorial-rule pb-6">
                <NewsCard article={article} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border p-8 rounded-xl bg-secondary/20">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-editorial text-2xl font-bold mb-3">No tienes artículos guardados</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              Explora las noticias y presiona el ícono del marcador en cualquier artículo para guardarlo y leerlo más tarde.
            </p>
            <Link href="/">
              <Button className="bg-foreground text-background font-bold tracking-widest uppercase text-xs h-11 px-8 rounded-full">
                Explorar Noticias
              </Button>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
