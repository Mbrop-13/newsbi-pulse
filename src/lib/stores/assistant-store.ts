import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

export interface Ticker {
  symbol: string;
  name: string;
  exchange?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

interface AssistantState {
  name: string;
  topics: string[];
  tickers: Ticker[];
  hasCompletedSetup: boolean;
  showPreferences: boolean;
  showSettings: boolean;
  assistantTone: string;
  assistantRole: string;
  interests: Record<string, string[]>;
  messages: ChatMessage[];
  isLoadingConfig: boolean;
  setName: (name: string) => void;
  setTopics: (topics: string[]) => void;
  addTopic: (topic: string) => void;
  removeTopic: (topic: string) => void;
  addTicker: (ticker: Ticker) => void;
  removeTicker: (symbol: string) => void;
  completeSetup: () => void;
  resetSetup: () => void;
  cancelSetup: () => void;
  setShowPreferences: (v: boolean) => void;
  setShowSettings: (v: boolean) => void;
  setAssistantTone: (tone: string) => void;
  setAssistantRole: (role: string) => void;
  toggleInterest: (topic: string, interest: string) => void;
  // Supabase sync
  loadFromSupabase: (userId: string) => Promise<void>;
  saveToSupabase: (userId: string) => Promise<void>;
  // Chat
  addMessage: (msg: ChatMessage) => void;
  setMessages: (msgs: ChatMessage[]) => void;
  clearMessages: () => void;
  loadMessages: (userId: string) => Promise<void>;
  saveMessage: (userId: string, msg: ChatMessage) => Promise<void>;
  clearMessagesSupabase: (userId: string) => Promise<void>;
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

function debouncedSave(userId: string) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    useAssistantStore.getState().saveToSupabase(userId);
  }, 1000);
}

export const useAssistantStore = create<AssistantState>()(
  (set, get) => ({
    name: '',
    topics: [],
    tickers: [],
    interests: {},
    hasCompletedSetup: false,
    showPreferences: false,
    showSettings: false,
    assistantTone: 'Analítico',
    assistantRole: 'Mentor Financiero',
    messages: [],
    isLoadingConfig: true,

    setName: (name) => set({ name }),
    setTopics: (topics) => set({ topics }),
    addTopic: (topic) => set((state) => ({ topics: [...new Set([...state.topics, topic])] })),
    removeTopic: (topic) => set((state) => {
      const newInterests = { ...state.interests };
      delete newInterests[topic];
      return { 
        topics: state.topics.filter(t => t !== topic),
        interests: newInterests
      };
    }),
    addTicker: (ticker) => set((state) => {
      if (state.tickers.some(t => t.symbol === ticker.symbol)) return state;
      return { tickers: [...state.tickers, ticker] };
    }),
    removeTicker: (symbol) => set((state) => ({ tickers: state.tickers.filter(t => t.symbol !== symbol) })),
    completeSetup: () => set({ hasCompletedSetup: true }),
    resetSetup: () => set({ name: '', topics: [], tickers: [], interests: {}, hasCompletedSetup: false }),
    cancelSetup: () => set({ hasCompletedSetup: true }),
    setShowPreferences: (v) => set({ showPreferences: v }),
    setShowSettings: (v) => set({ showSettings: v }),
    setAssistantTone: (tone) => set({ assistantTone: tone }),
    setAssistantRole: (role) => set({ assistantRole: role }),
    toggleInterest: (topic, interest) => set((state) => {
      const currentInterests = state.interests[topic] || [];
      const isSelected = currentInterests.includes(interest);
      const nextInterests = isSelected
        ? currentInterests.filter(i => i !== interest)
        : [...currentInterests, interest];
      
      return {
        interests: {
          ...state.interests,
          [topic]: nextInterests
        }
      };
    }),

    // ═══ Supabase Config Sync ═══
    loadFromSupabase: async (userId: string) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('assistant_configs')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading config:', error);
          return;
        }

        if (data) {
          set({
            name: data.name || '',
            topics: data.topics || [],
            tickers: data.tickers || [],
            interests: data.interests || {},
            assistantTone: data.tone || 'Analítico',
            assistantRole: data.role || 'Mentor Financiero',
            hasCompletedSetup: data.has_completed_setup || false,
            isLoadingConfig: false,
          });
        } else {
          set({ isLoadingConfig: false });
        }
      } catch (err) {
        console.error('Failed to load from Supabase:', err);
        set({ isLoadingConfig: false });
      }
    },

    saveToSupabase: async (userId: string) => {
      try {
        const state = get();
        const supabase = createClient();

        await supabase
          .from('assistant_configs')
          .upsert({
            user_id: userId,
            name: state.name,
            topics: state.topics,
            tickers: state.tickers,
            interests: state.interests,
            tone: state.assistantTone,
            role: state.assistantRole,
            has_completed_setup: state.hasCompletedSetup,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('Failed to save to Supabase:', err);
      }
    },

    // ═══ Chat Messages ═══
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setMessages: (msgs) => set({ messages: msgs }),
    clearMessages: () => set({ messages: [] }),

    loadMessages: async (userId: string) => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error loading messages:', error);
          return;
        }

        if (data && data.length > 0) {
          set({ messages: data.map(m => ({ id: m.id, role: m.role, content: m.content, created_at: m.created_at })) });
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    },

    saveMessage: async (userId: string, msg: ChatMessage) => {
      try {
        const supabase = createClient();
        await supabase
          .from('chat_messages')
          .insert({
            user_id: userId,
            role: msg.role,
            content: msg.content,
          });
      } catch (err) {
        console.error('Failed to save message:', err);
      }
    },

    clearMessagesSupabase: async (userId: string) => {
      try {
        const supabase = createClient();
        await supabase
          .from('chat_messages')
          .delete()
          .eq('user_id', userId);
        set({ messages: [] });
      } catch (err) {
        console.error('Failed to clear messages:', err);
      }
    },
  })
);

export { debouncedSave };
