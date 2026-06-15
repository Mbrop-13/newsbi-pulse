import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlanTier, getPlanConfig, PlanConfig } from "@/lib/plan-limits";

export interface SubscriptionState {
  tier: PlanTier;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  periodEnd: string | null;
  
  // Usage tracking (loaded from Supabase)
  monthlyAiMessages: number;
  monthlyTtsAudios: number;
  dailyTtsAudios: number;
  lifetimeAiMessages: number;
  
  // Actions
  setTier: (tier: PlanTier) => void;
  setStatus: (status: SubscriptionState["status"]) => void;
  setPeriodEnd: (date: string | null) => void;
  setUsage: (usage: Partial<Pick<SubscriptionState, "monthlyAiMessages" | "monthlyTtsAudios" | "dailyTtsAudios" | "lifetimeAiMessages">>) => void;
  incrementAiMessages: () => void;
  incrementTtsAudios: () => void;
  
  // Helpers
  getPlanConfig: () => PlanConfig;
  canSendAiMessage: () => boolean;
  canGenerateAudio: () => boolean;
  getAiRemaining: () => number;
  getTtsRemaining: () => number;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: "free",
      status: "active",
      periodEnd: null,
      
      monthlyAiMessages: 0,
      monthlyTtsAudios: 0,
      dailyTtsAudios: 0,
      lifetimeAiMessages: 0,
      
      setTier: (tier) => set({ tier }),
      setStatus: (status) => set({ status }),
      setPeriodEnd: (date) => set({ periodEnd: date }),
      
      setUsage: (usage) => set(usage),
      
      incrementAiMessages: () => set((s) => ({
        monthlyAiMessages: s.monthlyAiMessages + 1,
        lifetimeAiMessages: s.lifetimeAiMessages + 1,
      })),
      
      incrementTtsAudios: () => set((s) => ({
        monthlyTtsAudios: s.monthlyTtsAudios + 1,
        dailyTtsAudios: s.dailyTtsAudios + 1,
      })),
      
      getPlanConfig: () => getPlanConfig(get().tier),
      
      canSendAiMessage: () => {
        const { tier, monthlyAiMessages, lifetimeAiMessages } = get();
        const config = getPlanConfig(tier);
        
        if (tier === "free") {
          // Free uses lifetime limit
          return lifetimeAiMessages < config.aiLifetimeMessages;
        }
        
        // Paid plans use monthly limit
        if (config.aiMessagesPerMonth === -1) return true;
        return monthlyAiMessages < config.aiMessagesPerMonth;
      },
      
      canGenerateAudio: () => {
        const { tier, monthlyTtsAudios, dailyTtsAudios } = get();
        const config = getPlanConfig(tier);
        
        if (tier === "free") {
          // Free uses daily limit
          return dailyTtsAudios < config.ttsDailyLimit;
        }
        
        // Paid plans use monthly limit
        if (config.ttsAudiosPerMonth === -1) return true;
        return monthlyTtsAudios < config.ttsAudiosPerMonth;
      },
      
      getAiRemaining: () => {
        const { tier, monthlyAiMessages, lifetimeAiMessages } = get();
        const config = getPlanConfig(tier);
        
        if (tier === "free") {
          return Math.max(0, config.aiLifetimeMessages - lifetimeAiMessages);
        }
        
        if (config.aiMessagesPerMonth === -1) return 999;
        return Math.max(0, config.aiMessagesPerMonth - monthlyAiMessages);
      },
      
      getTtsRemaining: () => {
        const { tier, monthlyTtsAudios, dailyTtsAudios } = get();
        const config = getPlanConfig(tier);
        
        if (tier === "free") {
          return Math.max(0, config.ttsDailyLimit - dailyTtsAudios);
        }
        
        if (config.ttsAudiosPerMonth === -1) return 999;
        return Math.max(0, config.ttsAudiosPerMonth - monthlyTtsAudios);
      },
    }),
    {
      name: "maverlang-subscription",
      partialize: (state) => ({
        tier: state.tier,
        status: state.status,
        periodEnd: state.periodEnd,
      }),
    }
  )
);
