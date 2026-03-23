"use client";

import { useBookmarkStore } from "@/lib/stores/bookmark-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useAuthToastStore } from "@/lib/stores/auth-toast-store";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BookmarkButtonProps {
  articleId: string;
  className?: string;
}

export function BookmarkButton({ articleId, className }: BookmarkButtonProps) {
  const { isBookmarked, toggleBookmark } = useBookmarkStore();
  const { isAuthenticated } = useAuthStore();
  const { showToast } = useAuthToastStore();
  const saved = isBookmarked(articleId);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if this is inside a Next/Link
    e.stopPropagation();
    
    if (!isAuthenticated) {
      showToast("Inicia sesión para poder guardar noticias.");
      return;
    }
    
    toggleBookmark(articleId);
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={handleToggle}
      className={cn(
        "p-2 rounded-full transition-colors flex items-center justify-center",
        saved
          ? "bg-accent/10 text-accent hover:bg-accent/20"
          : "bg-background/80 text-muted-foreground hover:bg-secondary hover:text-foreground",
        className
      )}
      aria-label={saved ? "Quitar de guardados" : "Guardar artículo"}
      title={saved ? "Quitar de guardados" : "Guardar artículo"}
    >
      <Bookmark
        className={cn("w-4 h-4 transition-all duration-300", saved && "fill-current")}
      />
    </motion.button>
  );
}
