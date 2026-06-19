import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./auth-store";
import { createClient } from "@/lib/supabase/client";
import { useWebBuilderStore } from "./webbuilder-store";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  citations?: string[];
  toolResults?: ToolResultUI[];
  thinkingSteps?: string[];
  reasoning?: string;
  model?: "deepseek" | "grok";
  toolInvocations?: any[];
  isCollapsed?: boolean;
  secondsElapsed?: number;
  reasoningSteps?: any[];
  isWebBuilder?: boolean;
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
  type?: string;        // "image" | "code" | "file"
  size?: number;        // size in bytes
  isPastedCode?: boolean;
}

export interface SavedChat {
  id: string;
  title: string;
  messages: ChatMessage[];
  attachedArticles: AttachedArticle[];
  attachedFiles: AttachedFile[];
  timestamp: Date;
  isWebBuilder?: boolean;
}

interface AIChatStore {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  selectedModel: "fast" | "pro";
  attachedArticles: AttachedArticle[];
  attachedFiles: AttachedFile[];
  savedChats: SavedChat[];
  cloudSyncEnabled: boolean;
  
  activeTools: string[];
  favoriteTools: string[];
  
  messageFeedback: Record<string, 'like' | 'dislike'>;

  toggle: () => void;
  open: () => void;
  close: () => void;
  addMessage: (msg: ChatMessage) => void;
  setLoading: (val: boolean) => void;
  setModel: (val: "fast" | "pro") => void;
  setCloudSync: (val: boolean) => void;
  clearMessages: () => void;
  toggleTool: (toolId: string, category: string) => void;
  clearTools: () => void;
  toggleFavoriteTool: (toolId: string) => void;
  setFeedback: (messageId: string, feedback: 'like' | 'dislike' | null) => void;
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
  updateCurrentChat: (localOnly?: boolean) => Promise<void>;
  currentChatId: string | null;
}

export const useAIChatStore = create<AIChatStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      messages: [],
      currentChatId: null,
      isLoading: false,
      selectedModel: "fast",
      attachedArticles: [],
      attachedFiles: [],
      savedChats: [],
      cloudSyncEnabled: true,
      activeTools: [],
      favoriteTools: [],
      messageFeedback: {},
      
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
      setModel: (val) => set({ selectedModel: val }),
      setCloudSync: (val) => {
        set({ cloudSyncEnabled: val });
        if (val) {
          get().fetchCloudChats();
        }
      },
      toggleTool: (toolId, category) => {
        const currentTools = get().activeTools;
        
        // Find existing tool of the same category
        // ADVANCED_TOOLS categories are 'Gráficos' and 'Análisis'
        // Since we don't have access to ADVANCED_TOOLS array here directly, we rely on the component to pass the category
        const isGraph = category === 'Gráficos';
        const isAnalysis = category === 'Análisis';
        
        // Define prefixes based on known tool IDs to infer category safely if needed
        const currentGraphs = currentTools.filter(id => id.startsWith('chart_'));
        const currentAnalysis = currentTools.filter(id => !id.startsWith('chart_')); // everything else is analysis for now
        
        if (currentTools.includes(toolId)) {
          // Deselect
          set({ activeTools: currentTools.filter(id => id !== toolId) });
        } else {
          // Select, replacing existing of same category
          let newTools = [...currentTools];
          if (isGraph) {
            newTools = newTools.filter(id => !id.startsWith('chart_'));
          } else if (isAnalysis) {
            newTools = newTools.filter(id => id.startsWith('chart_'));
          }
          newTools.push(toolId);
          set({ activeTools: newTools });
        }
      },
      clearTools: () => set({ activeTools: [] }),
      toggleFavoriteTool: (toolId) => {
        const { favoriteTools } = get();
        if (favoriteTools.includes(toolId)) {
          set({ favoriteTools: favoriteTools.filter(id => id !== toolId) });
        } else {
          set({ favoriteTools: [...favoriteTools, toolId] });
        }
      },
      setFeedback: (messageId, feedback) => set((state) => {
        const newFeedback = { ...state.messageFeedback };
        if (feedback === null) {
          delete newFeedback[messageId];
        } else {
          newFeedback[messageId] = feedback;
        }
        return { messageFeedback: newFeedback };
      }),
      
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
          const cloudChats: SavedChat[] = data.map(row => {
            const msgs = (row.messages || []) as ChatMessage[];
            const hasArtifact = msgs.some((m: any) => m.content && (m.content.includes("<maverlangArtifact") || m.content.includes("</maverlangArtifact>")));
            const firstMsgHasWB = msgs[0]?.isWebBuilder;
            const isWB = !!(firstMsgHasWB || hasArtifact);

            return {
              id: row.chat_id,
              title: row.title,
              messages: msgs,
              attachedArticles: row.attached_articles || [],
              attachedFiles: row.attached_files || [],
              timestamp: new Date(row.created_at),
              isWebBuilder: isWB
            };
          });
          set({ savedChats: cloudChats });
        }
      },
      
      updateCurrentChat: async (localOnly = false) => {
        const { messages, attachedArticles, attachedFiles, savedChats, cloudSyncEnabled, currentChatId } = get();
        if (messages.length === 0) return;

        const user = useAuthStore.getState().user;

        const chatId = currentChatId || Date.now().toString();
        const existingIndex = savedChats.findIndex(c => c.id === chatId);
        const isNewChat = existingIndex === -1;
        
        if (!currentChatId) {
          set({ currentChatId: chatId });
        }

        const title = messages.find(m => m.role === "user")?.content.slice(0, 40) + "..." || "Nuevo chat";
        const isWB = useWebBuilderStore.getState().isWebBuilderMode;
        
        // Inject metadata into the first message to survive cloud sync
        const messagesWithMeta = messages.map((m, idx) => {
          if (idx === 0) {
            return { ...m, isWebBuilder: isWB };
          }
          return m;
        });

        const chatData: SavedChat = {
          id: chatId,
          title,
          messages: messagesWithMeta,
          attachedArticles,
          attachedFiles,
          timestamp: new Date(),
          isWebBuilder: isWB,
        };

        let updatedChats;
        if (existingIndex >= 0) {
          updatedChats = [...savedChats];
          updatedChats[existingIndex] = chatData;
        } else {
          updatedChats = [chatData, ...savedChats].slice(0, 10);
        }
        set({ savedChats: updatedChats });
        
        if (localOnly) return;
        
        if (cloudSyncEnabled && user) {
          const supabase = createClient();
          if (isNewChat) {
            const { error } = await supabase.from("ai_saved_chats").insert({
              user_id: user.id,
              chat_id: chatId,
              title,
              messages: messagesWithMeta,
              attached_articles: attachedArticles,
              attached_files: attachedFiles
            });
            if (error) console.error(error);
          } else {
            const { error } = await supabase.from("ai_saved_chats").update({
              title,
              messages: messagesWithMeta,
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
        set({ messages: [], attachedArticles: [], attachedFiles: [], activeTools: [], currentChatId: null });
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

          // Auto-restore WebBuilder mode based on saved flag or message content fallback
          const hasArtifact = chat.messages.some(m => m.content && (m.content.includes("<maverlangArtifact") || m.content.includes("</maverlangArtifact>")));
          const firstMsgHasWB = chat.messages[0]?.isWebBuilder;
          const isWB = !!(chat.isWebBuilder || firstMsgHasWB || hasArtifact);
          useWebBuilderStore.getState().setWebBuilderMode(isWB);
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
      name: "maverlang-ai-chat-history",
      partialize: (state) => ({ 
        savedChats: state.savedChats, 
        cloudSyncEnabled: state.cloudSyncEnabled,
        favoriteTools: state.favoriteTools,
        messageFeedback: state.messageFeedback
      }),
    }
  )
);
