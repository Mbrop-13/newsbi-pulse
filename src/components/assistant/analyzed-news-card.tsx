import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ChevronDown, ExternalLink, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';

interface AnalyzedNewsCardProps {
  toolName: string;
  result: any;
}

export function AnalyzedNewsCard({ toolName, result }: AnalyzedNewsCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!result || !result.news || result.news.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-xs text-gray-500 border border-gray-100 dark:border-gray-700 w-fit">
        {toolName === 'get_portfolio_news' ? <BarChart3 className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
        Sin noticias encontradas
      </div>
    );
  }

  const news = result.news;

  return (
    <div className="w-full max-w-sm my-2">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-500/20 text-sm font-bold w-full"
      >
        <Newspaper className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">{news.length} Noticias Analizadas</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 p-2 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              {news.map((item: any) => (
                <div key={item.id} className="flex flex-col gap-1 p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Puntuación: {item.relevance_score}/10</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.title}</p>
                  <div className="flex justify-end mt-1">
                    <Link href={`/article/${item.slug || item.id}`} target="_blank" className="flex items-center gap-1 text-xs font-bold text-[#1890FF] hover:text-indigo-500 transition-colors">
                      Leer artículo <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
