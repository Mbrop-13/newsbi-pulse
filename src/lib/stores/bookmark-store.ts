import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface BookmarkState {
  bookmarkedArticleIds: string[];
  isLoaded: boolean;
  addBookmark: (articleId: string) => void;
  removeBookmark: (articleId: string) => void;
  toggleBookmark: (articleId: string) => void;
  isBookmarked: (articleId: string) => boolean;
  // Supabase sync
  loadBookmarks: (userId: string) => Promise<void>;
  toggleBookmarkSupabase: (userId: string, articleId: string) => Promise<void>;
}

export const useBookmarkStore = create<BookmarkState>()(
  (set, get) => ({
    bookmarkedArticleIds: [],
    isLoaded: false,

    addBookmark: (articleId) =>
      set((state) => ({
        bookmarkedArticleIds: state.bookmarkedArticleIds.includes(articleId)
          ? state.bookmarkedArticleIds
          : [...state.bookmarkedArticleIds, articleId],
      })),

    removeBookmark: (articleId) =>
      set((state) => ({
        bookmarkedArticleIds: state.bookmarkedArticleIds.filter((id) => id !== articleId),
      })),

    toggleBookmark: (articleId) => {
      const state = get();
      if (state.bookmarkedArticleIds.includes(articleId)) {
        state.removeBookmark(articleId);
      } else {
        state.addBookmark(articleId);
      }
    },

    isBookmarked: (articleId) => get().bookmarkedArticleIds.includes(articleId),

    // ═══ Supabase Sync ═══
    loadBookmarks: async (userId: string) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('user_bookmarks')
          .select('article_id')
          .eq('user_id', userId);

        if (error) {
          console.error('Error loading bookmarks:', error);
          return;
        }

        if (data) {
          set({
            bookmarkedArticleIds: data.map(d => d.article_id),
            isLoaded: true,
          });
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      }
    },

    toggleBookmarkSupabase: async (userId: string, articleId: string) => {
      const state = get();
      const supabase = createClient();
      const isCurrentlyBookmarked = state.bookmarkedArticleIds.includes(articleId);

      // Optimistic UI update
      state.toggleBookmark(articleId);

      try {
        if (isCurrentlyBookmarked) {
          await supabase
            .from('user_bookmarks')
            .delete()
            .eq('user_id', userId)
            .eq('article_id', articleId);
        } else {
          await supabase
            .from('user_bookmarks')
            .insert({ user_id: userId, article_id: articleId });
        }
      } catch (err) {
        // Revert on failure
        state.toggleBookmark(articleId);
        console.error('Failed to toggle bookmark in Supabase:', err);
      }
    },
  })
);
