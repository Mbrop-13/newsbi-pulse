import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface QueuedArticle {
  id: string;
  title: string;
  category?: string;
  image_url?: string;
  slug?: string;
  published_at?: string;
  source?: string;
}

interface ReadingListState {
  queue: QueuedArticle[];
  addToQueue: (article: QueuedArticle) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  isInQueue: (id: string) => boolean;
  reorderQueue: (newQueue: QueuedArticle[]) => void;
}

export const useReadingListStore = create<ReadingListState>()(
  persist(
    (set, get) => ({
      queue: [],
      addToQueue: (article) => {
        const { queue } = get();
        if (!queue.find((a) => a.id === article.id)) {
          set({ queue: [article, ...queue] });
        }
      },
      removeFromQueue: (id) => {
        set({ queue: get().queue.filter((a) => a.id !== id) });
      },
      clearQueue: () => set({ queue: [] }),
      isInQueue: (id) => get().queue.some((a) => a.id === id),
      reorderQueue: (newQueue) => set({ queue: newQueue }),
    }),
    {
      name: 'reclu-reading-queue',
    }
  )
);
