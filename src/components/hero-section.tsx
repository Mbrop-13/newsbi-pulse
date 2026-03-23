"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Radio, ArrowRight } from "lucide-react";
import { MOCK_ARTICLES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";

export function HeroSection() {
  const featured = MOCK_ARTICLES[0];
  const secondary = MOCK_ARTICLES.slice(1, 3);
  const tertiary = MOCK_ARTICLES.slice(3, 6);

  return (
    <section className="pt-[7.5rem] md:pt-[8.5rem] pb-0">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Edition line */}
        <div className="flex items-center justify-between py-3 editorial-rule-double mb-6">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Edición del día
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Actualizado cada 5 minutos
          </span>
        </div>

        {/* === ABOVE THE FOLD: Main story + 2 secondary === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 mb-8">
          {/* MAIN STORY — large image + big headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-7 mb-8 lg:mb-0"
          >
            <Link href={`/article/${featured.id}`} className="group block">
              {/* Image */}
              <div className="relative overflow-hidden mb-5 aspect-[16/10]">
                <img
                  src={featured.image_url!}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {featured.is_live && (
                  <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-live-red text-white text-[10px] font-bold uppercase tracking-wider">
                    <Radio className="w-3 h-3 animate-pulse-live" />
                    En Vivo
                  </div>
                )}
              </div>

              {/* Category + source */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent">
                  {featured.category}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {featured.sources?.[0]?.name || "Noticias"}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  Hace {formatDate(featured.published_at)}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-editorial text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-[1.15] mb-4 group-hover:text-accent transition-colors duration-300">
                {featured.title}
              </h1>

              {/* Description */}
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-3">
                {featured.summary || (featured as any).description}
              </p>

              {/* Read more */}
              <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-accent group-hover:gap-2.5 transition-all">
                Leer artículo completo
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          </motion.div>

          {/* SECONDARY STORIES — stacked in right column */}
          <div className="lg:col-span-5 lg:border-l lg:border-editorial-rule lg:pl-8 flex flex-col">
            {secondary.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
                className={`flex-1 ${i < secondary.length - 1 ? "pb-6 mb-6 editorial-rule" : ""}`}
              >
                <Link href={`/article/${article.id}`} className="group block">
                  {/* Image */}
                  <div className="relative overflow-hidden mb-3 aspect-[16/9]">
                    <img
                      src={article.image_url!}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                    {article.is_live && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-live-red text-white text-[9px] font-bold uppercase tracking-wider">
                        <Radio className="w-2.5 h-2.5 animate-pulse-live" />
                        Live
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Hace {formatDate(article.published_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="font-editorial text-lg md:text-xl font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-3">
                    {article.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {article.summary || (article as any).description}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* === TERTIARY ROW: 3 smaller stories === */}
        <div className="editorial-rule-top pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {tertiary.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * (i + 1) }}
              className={`${i < tertiary.length - 1 ? "sm:border-r sm:border-editorial-rule sm:pr-6" : ""}`}
            >
              <Link href={`/article/${article.id}`} className="group block">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-accent">
                  {article.category}
                </span>
                <h3 className="font-editorial text-base font-semibold leading-snug mt-1 group-hover:text-accent transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {article.summary || (article as any).description}
                </p>
                <span className="mt-2 block text-[10px] text-muted-foreground">
                  {article.sources?.[0]?.name || "Noticias"} · Hace {formatDate(article.published_at)}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
