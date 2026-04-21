"use client";

import { useState, useRef, useEffect } from "react";
import { useReadingListStore, QueuedArticle } from "@/lib/stores/use-reading-list-store";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { ListPlus, X, GripVertical, Trash2, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function ReadingListWidget() {
  const { queue, removeFromQueue, clearQueue, reorderQueue } = useReadingListStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewItem, setHasNewItem] = useState(false);
  const prevQueueLength = useRef(queue.length);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (queue.length > prevQueueLength.current) {
      setHasNewItem(true);
      const timer = setTimeout(() => setHasNewItem(false), 2000);
      return () => clearTimeout(timer);
    }
    
    // Auto close if empty
    if (queue.length === 0 && isOpen) {
      setIsOpen(false);
    }

    prevQueueLength.current = queue.length;
  }, [queue.length, isOpen]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.addEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (queue.length === 0 && !isOpen) return null;

  return (
    <div ref={widgetRef} className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3 font-sans">
      
      {/* Expanded Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[360px] max-w-[calc(100vw-3rem)] bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col mb-2"
          >
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
              <div className="flex items-center gap-2">
                <div className="bg-[#1890FF] p-1.5 rounded-lg text-white">
                  <ListPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Lista de Lectura</h3>
                <span className="bg-gray-200 dark:bg-white/10 text-[10px] font-bold px-2 py-0.5 rounded-full text-gray-500 dark:text-gray-400">
                  {queue.length}
                </span>
              </div>
              <button 
                onClick={clearQueue}
                className="text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-wider"
              >
                Limpiar todo
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto hidden-scrollbar p-2">
              <Reorder.Group axis="y" values={queue} onReorder={reorderQueue} className="flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {queue.map((article) => (
                    <SortableItem 
                      key={article.id} 
                      article={article} 
                      removeFromQueue={removeFromQueue} 
                      setIsOpen={setIsOpen} 
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            </div>

            {queue.length > 0 && (
              <div className="p-4 bg-gray-50/50 dark:bg-white/5 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href={`/lista-lectura`}
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-[#1890FF] hover:bg-[#1890FF]/90 text-white font-bold text-sm py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#1890FF]/20 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <BookOpen className="w-4 h-4" />
                  Comenzar lectura
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      {queue.length > 0 && (
        <motion.button
          layout
          onClick={() => setIsOpen(!isOpen)}
          initial={{ scale: 0 }}
          animate={{ 
            scale: 1,
            y: hasNewItem ? -10 : 0
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative group h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            isOpen ? 'bg-gray-200 dark:bg-slate-800 text-gray-900 dark:text-white' : 'bg-[#1890FF] text-white'
          }`}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90 }} animate={{ rotate: 0 }} exit={{ rotate: 90 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ rotate: 90 }} animate={{ rotate: 0 }} exit={{ rotate: -90 }}>
                <ListPlus className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* New Item Badge / Animation */}
          {!isOpen && (
            <motion.div 
              className="absolute -top-1 -right-1 h-6 min-w-[24px] px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#0F172A]"
              animate={{
                scale: hasNewItem ? [1, 1.4, 1] : 1
              }}
            >
              {queue.length}
            </motion.div>
          )}

          {/* New Item Particle Effect */}
          {hasNewItem && !isOpen && (
            <motion.div 
               className="absolute inset-0 rounded-full border-2 border-[#1890FF]"
               initial={{ scale: 1, opacity: 1 }}
               animate={{ scale: 2, opacity: 0 }}
               transition={{ duration: 1 }}
            />
          )}

          {/* Tooltip */}
          <div className="absolute right-full mr-4 bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
             {isOpen ? 'Cerrar lista' : `${queue.length} noticias en cola`}
          </div>
        </motion.button>
      )}
    </div>
  );
}

function SortableItem({ article, removeFromQueue, setIsOpen }: { 
  article: QueuedArticle, 
  removeFromQueue: (id: string) => void, 
  setIsOpen: (open: boolean) => void 
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={article}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group relative bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl p-2 transition-colors duration-200 flex gap-3"
    >
      <div 
        className="flex items-center justify-center -ml-1 w-6 cursor-grab active:cursor-grabbing text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
        onPointerDown={(e) => controls.start(e)}
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {article.image_url && (
        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800 pointer-events-none">
          <img src={article.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="flex-1 min-w-0 py-1 flex flex-col justify-center">
        <Link 
          href={`/article/${article.slug || article.id}`}
          onClick={() => setIsOpen(false)}
          className="block group-hover:text-[#1890FF] transition-colors"
        >
          <p className="text-xs font-bold leading-snug line-clamp-2">{article.title}</p>
          <div className="flex items-center gap-2 mt-1.5 opacity-60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1890FF]">
              {article.category || 'Noticia'}
            </span>
          </div>
        </Link>
      </div>

      <button
        onClick={() => removeFromQueue(article.id)}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 self-center"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </Reorder.Item>
  );
}
