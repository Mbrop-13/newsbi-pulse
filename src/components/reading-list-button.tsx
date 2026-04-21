"use client";

import { useReadingListStore, QueuedArticle } from "@/lib/stores/use-reading-list-store";
import { Plus, Check, ListPlus, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAIChatStore } from "@/lib/stores/ai-chat-store";
import { useAuthStore, useAuthModalStore } from "@/lib/stores/auth-store";

interface ReadingListButtonProps {
  article: QueuedArticle;
  className?: string;
  variant?: 'ghost' | 'icon';
}

const MAX_AI_ARTICLES = 10;

export function ReadingListButton({ article, className, variant = 'icon' }: ReadingListButtonProps) {
  const { addToQueue, removeFromQueue, queue } = useReadingListStore();
  const isInQueue = queue.some(a => a.id === article.id);
  const aiChatOpen = useAIChatStore((s) => s.isOpen);
  const attachArticle = useAIChatStore((s) => s.attachArticle);
  const removeArticle = useAIChatStore((s) => s.removeArticle);
  const attachedArticles = useAIChatStore((s) => s.attachedArticles);
  const isAttachedToAI = attachedArticles.some(a => a.id === article.id);

  const { isAuthenticated, user } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const userTier = user?.role === "admin" ? "ultra" : (user?.tier || "free");

  const MAX_AI_ARTICLES = userTier === "free" ? 1 : userTier === "pro" ? 5 : 10;
  const MAX_READING_LIST = userTier === "free" ? 4 : userTier === "pro" ? 10 : userTier === "max" ? 50 : 1000;

  const aiLimitReached = attachedArticles.length >= MAX_AI_ARTICLES;
  // If ai chat is open, limit is checked against ai articles. Else against reading list
  const readingListLimitReached = queue.length >= MAX_READING_LIST;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      openModal("login");
      return;
    }

    if (aiChatOpen) {
      // AI mode: toggle article in AI context only (NOT reading list)
      if (isAttachedToAI) {
        removeArticle(article.id);
      } else if (!aiLimitReached) {
        attachArticle({
          id: article.id,
          title: article.title,
          category: article.category,
          image_url: article.image_url,
          slug: article.slug,
        });
      }
    } else {
      // Normal mode: toggle reading list
      if (isInQueue) {
        removeFromQueue(article.id);
      } else if (!readingListLimitReached) {
        addToQueue(article);
      }
    }
  };

  // Determine active state based on mode
  const isActive = aiChatOpen ? isAttachedToAI : isInQueue;
  const isDisabled = aiChatOpen 
    ? (!isAttachedToAI && aiLimitReached)
    : (!isInQueue && readingListLimitReached);

  if (variant === 'ghost') {
    return (
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
          isDisabled
            ? "opacity-40 cursor-not-allowed text-gray-400"
            : isActive
            ? aiChatOpen
              ? "bg-purple-500/10 text-purple-500 border border-purple-500/25"
              : "bg-[#1890FF]/10 text-[#1890FF] border border-[#1890FF]/25"
            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="check"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Check className="w-3.5 h-3.5" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              {aiChatOpen ? <Sparkles className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </motion.div>
          )}
        </AnimatePresence>
        {aiChatOpen
          ? isActive ? "En chat IA" : "Agregar a IA"
          : isInQueue ? "En lista" : "Añadir a lista"
        }
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "flex items-center justify-center transition-all p-1.5 rounded-full border border-transparent",
        isDisabled
          ? "opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400"
          : isActive
          ? aiChatOpen
            ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
            : "bg-[#1890FF] text-white shadow-md shadow-[#1890FF]/20"
          : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#1890FF] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700",
        className
      )}
      title={
        aiChatOpen
          ? isAttachedToAI ? "Quitar del chat IA" : aiLimitReached ? `Máximo ${MAX_AI_ARTICLES} noticias` : "Agregar al chat IA"
          : isInQueue ? "Quitar de lista de lectura" : readingListLimitReached ? `Máximo ${MAX_READING_LIST} noticias` : "Añadir a lista de lectura"
      }
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isActive ? 'checked' : aiChatOpen ? 'ai' : 'plus'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {isActive
            ? <Check className="w-4 h-4" />
            : aiChatOpen
            ? <Sparkles className="w-4 h-4" />
            : <ListPlus className="w-4 h-4" />
          }
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
