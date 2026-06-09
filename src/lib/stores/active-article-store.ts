import { create } from 'zustand';
import { NewsArticle } from '@/lib/types';

interface ActiveArticleState {
  activeArticleId: string | null;
  activeArticle: NewsArticle | null;
  isOpen: boolean;
  openArticle: (articleId: string, article?: NewsArticle) => void;
  closeArticle: () => void;
}

export const useActiveArticleStore = create<ActiveArticleState>((set) => ({
  activeArticleId: null,
  activeArticle: null,
  isOpen: false,
  openArticle: (articleId, article) => set({
    activeArticleId: articleId,
    activeArticle: article || null,
    isOpen: true,
  }),
  closeArticle: () => set({
    activeArticleId: null,
    activeArticle: null,
    isOpen: false,
  }),
}));
