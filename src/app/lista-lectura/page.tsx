"use client";

import { useEffect, useState } from "react";
import { useReadingListStore } from "@/lib/stores/use-reading-list-store";
import { createClient } from "@/lib/supabase/client";
import { NewsArticle } from "@/lib/types";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { formatDate } from "@/lib/utils";
import { BookmarkButton } from "@/components/bookmark-button";

export default function ListaLecturaPage() {
  const { queue } = useReadingListStore();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchQueueArticles() {
      if (queue.length === 0) {
        setArticles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      // Fetch all articles in queue
      const ids = queue.map(q => q.id);
      const { data, error } = await supabase
        .from("news_articles")
        .select("*")
        .in("id", ids);

      if (data && !error) {
        // Sort data to match the queue order
        const sortedData = queue.map(q => data.find(d => d.id === q.id)).filter(Boolean) as NewsArticle[];
        setArticles(sortedData);
      }
      setLoading(false);
    }

    fetchQueueArticles();
  }, [queue, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#1890FF]" />
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <BookOpen className="w-16 h-16 text-gray-200 dark:text-gray-800 mb-6" />
        <h1 className="font-editorial text-3xl font-bold mb-4">Tu lista está vacía</h1>
        <p className="text-muted-foreground mb-8">Añade noticias desde el feed para leerlas en modo continuo aquí.</p>
        <Link 
          href="/"
          className="bg-[#1890FF] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#1890FF]/90 transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Spacer for sticky nav */}
      <div className="pt-[6rem]" />

      <div className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12 border-b border-border pb-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
            <h1 className="font-editorial text-4xl font-bold">Lista de Lectura</h1>
            <p className="text-muted-foreground mt-2">
              Modo de lectura continua. {articles.length} artículo{articles.length !== 1 ? 's' : ''} en cola.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {articles.map((article, index) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-500 font-bold text-sm">
                  {index + 1}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1890FF] bg-blue-50 dark:bg-[#1890FF]/10 px-2.5 py-1 rounded-full">
                  {article.category}
                </span>
              </div>

              <h2 className="font-editorial text-3xl md:text-4xl font-bold leading-tight mb-4">
                {article.title}
              </h2>
              
              <div className="flex items-center gap-4 text-[12px] text-muted-foreground mb-8">
                <span className="font-semibold text-foreground">
                  {article.author}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(article.published_at)}
                </span>
                <BookmarkButton articleId={article.id} />
              </div>

              {article.image_url && (
                <div className="mb-8 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </div>
              )}

              <div className="prose prose-lg dark:prose-invert max-w-none text-foreground/90 leading-[1.8] mb-12 prose-a:text-[#1890FF]">
                <ReactMarkdown>
                  {article.enriched_content || article.content || ""}
                </ReactMarkdown>
              </div>

              {/* End of article separator */}
              {index < articles.length - 1 && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-16 h-1 rounded-full bg-gray-200 dark:bg-white/10" />
                </div>
              )}
            </motion.article>
          ))}
        </div>
        
        <div className="mt-20 text-center border-t border-border pt-12">
          <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
          <h3 className="font-editorial text-2xl font-bold mb-2">¡Has llegado al final!</h3>
          <p className="text-muted-foreground mb-8">Has terminado tu lista de lectura actual.</p>
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 font-bold transition-all"
          >
            Descubrir más noticias
          </Link>
        </div>
      </div>
    </div>
  );
}
