import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: string[];
  toolResults?: ToolResultUI[];
  thinkingSteps?: string[];
  model?: "deepseek" | "grok";
}

export interface ToolResultUI {
  tool: "portfolio" | "stock_info" | "news" | "alerts";
  data: any;
  summary: string;
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
  webSearchEnabled: boolean;
  attachedArticles: AttachedArticle[];
  attachedFiles: AttachedFile[];
  savedChats: SavedChat[];
  cloudSyncEnabled: boolean;
  
  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (val: boolean) => void;
  setWebSearch: (val: boolean) => void;
  setCloudSync: (val: boolean) => void;
  clearMessages: () => void;
  attachArticle: (article: AttachedArticle) => void;
  removeArticle: (id: string) => void;
  clearArticles: () => void;
  attachFile: (file: AttachedFile) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  loadChat: (id: string) => void;
  deleteSavedChat: (id: string) => void;
  fetchCloudChats: () => Promise<void>;
  _saveCurrentIfPremium: () => void;
  updateCurrentChat: () => void;
  currentChatId: string | null;
}

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      currentChatId: null,
      isLoading: false,
      webSearchEnabled: false,
      attachedArticles: [],
      attachedFiles: [],
      savedChats: [],
      cloudSyncEnabled: false,
      
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      open: () => set({ isOpen: true }),
      close: () => {
        set({ isOpen: false });
        get().clearMessages();
      },
      addMessage: (msg) => {
        set((s) => ({ messages: [...s.messages, msg] }));
        get().updateCurrentChat();
      },
      setLoading: (val) => set({ isLoading: val }),
      setWebSearch: (val) => set({ webSearchEnabled: val }),
      setCloudSync: (val) => {
        set({ cloudSyncEnabled: val });
        if (val) {
          get().fetchCloudChats();
        }
      },
      
      fetchCloudChats: async () => {
        const { cloudSyncEnabled } = get();
        if (!cloudSyncEnabled) return;
        
        const user = useAuthStore.getState().user;
        if (!user) return;
        
        const supabase = createClient();
        const { data } = await supabase
          .from("ai_saved_chats")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);
          
        if (data && data.length > 0) {
          const cloudChats: SavedChat[] = data.map(row => ({
            id: row.chat_id,
            title: row.title,
            messages: row.messages,
            attachedArticles: row.attached_articles || [],
            attachedFiles: row.attached_files || [],
            timestamp: new Date(row.created_at)
          }));
          set({ savedChats: cloudChats });
        }
      },
      
      updateCurrentChat: async () => {
        const { messages, attachedArticles, attachedFiles, savedChats, cloudSyncEnabled, currentChatId } = get();
        if (messages.length === 0) return;

        const user = useAuthStore.getState().user;

        const isNewChat = !currentChatId;
        const chatId = currentChatId || Date.now().toString();
        
        if (isNewChat) {
          set({ currentChatId: chatId });
        }

        const title = messages.find(m => m.role === "user")?.content.slice(0, 40) + "..." || "Nuevo chat";
        
        const chatData: SavedChat = {
          id: chatId,
          title,
          messages,
          attachedArticles,
          attachedFiles,
          timestamp: new Date(),
        };

        const existingIndex = savedChats.findIndex(c => c.id === chatId);
        let updatedChats;
        if (existingIndex >= 0) {
          updatedChats = [...savedChats];
          updatedChats[existingIndex] = chatData;
        } else {
          updatedChats = [chatData, ...savedChats].slice(0, 10);
        }
        set({ savedChats: updatedChats });
        
        if (cloudSyncEnabled && user) {
          const supabase = createClient();
          if (isNewChat) {
            const { error } = await supabase.from("ai_saved_chats").insert({
              user_id: user.id,
              chat_id: chatId,
              title,
              messages,
              attached_articles: attachedArticles,
              attached_files: attachedFiles
            });
            if (error) console.error(error);
          } else {
            const { error } = await supabase.from("ai_saved_chats").update({
              title,
              messages,
              attached_articles: attachedArticles,
              attached_files: attachedFiles
            }).eq("chat_id", chatId).eq("user_id", user.id);
            if (error) console.error(error);
          }
        }
      },
      
      _saveCurrentIfPremium: () => {
        // Deprecated, use updateCurrentChat via auto-sync
      },
      
      clearMessages: () => {
        set({ messages: [], attachedArticles: [], attachedFiles: [], currentChatId: null });
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
          set({ 
            messages: chat.messages, 
            attachedArticles: chat.attachedArticles, 
            attachedFiles: chat.attachedFiles || [],
            currentChatId: id
          });
        }
      },
      deleteSavedChat: async (id) => {
        const { cloudSyncEnabled } = get();
        set((s) => ({ savedChats: s.savedChats.filter(c => c.id !== id) }));
        
        if (cloudSyncEnabled) {
          const user = useAuthStore.getState().user;
          if (user) {
            const supabase = createClient();
            const { error } = await supabase.from("ai_saved_chats").delete().eq("chat_id", id).eq("user_id", user.id);
            if (error) console.error(error);
          }
        }
      },
    }),
    {
      name: "r-ai-chat-history",
      partialize: (state) => ({ 
        savedChats: state.savedChats, 
        messages: state.messages,
        cloudSyncEnabled: state.cloudSyncEnabled 
      }),
    }
  )
);
