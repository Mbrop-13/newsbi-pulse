"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { TrendingUp, ChevronRight, Activity } from "lucide-react";
import { MOCK_ARTICLES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { NewsletterForm } from "./newsletter-form";

export function Sidebar() {
  const trendingArticles = MOCK_ARTICLES.slice(0, 5);

  return (
    <aside className="space-y-8">
      {/* Lo Más Leído */}
      <div>
        <div className="flex items-center gap-2 mb-4 editorial-rule-double pb-3">
          <TrendingUp className="w-4 h-4 text-accent" />
          <h3 className="font-editorial text-lg font-bold">Lo Más Leído</h3>
        </div>
        <div className="space-y-0">
          {trendingArticles.map((article, i) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link
                href={`/article/${article.id}`}
                className="flex gap-4 py-4 editorial-rule group"
              >
                <span className="text-2xl font-editorial font-bold text-muted-foreground/20 group-hover:text-accent/30 transition-colors leading-none pt-0.5 w-8 flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2">
                    {article.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-accent">
                      {article.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(article.published_at)}
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Actividad en Vivo */}
      <div>
        <div className="flex items-center gap-2 mb-4 editorial-rule-double pb-3">
          <Activity className="w-4 h-4 text-accent" />
          <h3 className="font-editorial text-lg font-bold">Actividad</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 py-2">
            <div className="w-1.5 h-1.5 mt-2 rounded-full bg-accent flex-shrink-0" />
            <div>
              <p className="text-xs text-foreground leading-relaxed">
                <span className="font-semibold text-accent">Grok AI</span> verificó una noticia sobre OpenAI GPT-5.
              </p>
              <span className="text-[10px] text-muted-foreground">Hace 2 min</span>
            </div>
          </div>
          <div className="flex items-start gap-3 py-2">
            <div className="w-1.5 h-1.5 mt-2 rounded-full bg-live-red flex-shrink-0" />
            <div>
              <p className="text-xs text-foreground leading-relaxed">
                Nueva transmisión <span className="font-semibold text-live-red">EN VIVO</span> detectada.
              </p>
              <span className="text-[10px] text-muted-foreground">Hace 15 min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <NewsletterForm variant="sidebar" />
    </aside>
  );
}
