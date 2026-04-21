import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: string[];
}

export interface AttachedArticle {
  id: string;
  title: string;
  summary?: string;
  category?: string;
  image_url?: string;
  slug?: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  content: string;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  attachedArticles: AttachedArticle[];
  attachedFiles: AttachedFile[];
  timestamp: Date;
}

interface AIChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  attachedArticles: AttachedArticle[];
  attachedFiles: AttachedFile[];
  savedChats: SavedChat[];
  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (val: boolean) => void;
  clearMessages: () => void; // Clears active, saves to history if Premium
  attachArticle: (article: AttachedArticle) => void;
  removeArticle: (id: string) => void;
  clearArticles: () => void;
  attachFile: (file: AttachedFile) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  loadChat: (id: string) => void;
  deleteSavedChat: (id: string) => void;
  _saveCurrentIfPremium: () => void;
}

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      isLoading: false,
      attachedArticles: [],
      attachedFiles: [],
      savedChats: [],
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      setLoading: (val) => set({ isLoading: val }),
      _saveCurrentIfPremium: () => {
        const { messages, attachedArticles, attachedFiles, savedChats } = get();
        if (messages.length === 0) return;

        // Check if user is premium
        const userTier = useAuthStore.getState().user?.tier || "free";
        if (userTier === "free") return; // Free users don't get saved history

        // Save current as a chat
        const title = messages.find(m => m.role === "user")?.content.slice(0, 40) + "..." || "Nuevo chat";
        const newChat: SavedChat = {
          id: Date.now().toString(),
          title,
          messages,
          attachedArticles,
          attachedFiles,
          timestamp: new Date(),
        };

        // Keep at most 10 chats
        const updatedChats = [newChat, ...savedChats].slice(0, 10);
        set({ savedChats: updatedChats });
      },
      clearMessages: () => {
        get()._saveCurrentIfPremium();
        set({ messages: [], attachedArticles: [], attachedFiles: [] });
      },
      attachArticle: (article) => {
        const { attachedArticles } = get();
        if (!attachedArticles.find((a) => a.id === article.id)) {
          set({ attachedArticles: [...attachedArticles, article] });
        }
      },
      removeArticle: (id) =>
        set((s) => ({ attachedArticles: s.attachedArticles.filter((a) => a.id !== id) })),
      clearArticles: () => set({ attachedArticles: [] }),
      attachFile: (file) => set((s) => ({ attachedFiles: [...s.attachedFiles, file] })),
      removeFile: (id) => set((s) => ({ attachedFiles: s.attachedFiles.filter((f) => f.id !== id) })),
      clearFiles: () => set({ attachedFiles: [] }),
      loadChat: (id) => {
        const { savedChats } = get();
        const chat = savedChats.find(c => c.id === id);
        if (chat) {
          get()._saveCurrentIfPremium();
          set({ messages: chat.messages, attachedArticles: chat.attachedArticles, attachedFiles: chat.attachedFiles || [] });
        }
      },
      deleteSavedChat: (id) => set((s) => ({ savedChats: s.savedChats.filter(c => c.id !== id) })),
    }),
    {
      name: "r-ai-chat-history",
      partialize: (state) => ({ savedChats: state.savedChats }), // Only persist savedChats
    }
  )
);
