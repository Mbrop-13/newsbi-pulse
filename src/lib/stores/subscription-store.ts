import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PlanTier, getPlanConfig, PlanConfig } from "@/lib/plan-limits";

export interface SubscriptionState {
  tier: PlanTier;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired";
  periodEnd: string | null;
  
  // Usage tracking (loaded from Supabase)
  /** @deprecated AI gating uses tokens now */
  monthlyAiMessages: number;
  monthlyTtsAudios: number;
  dailyTtsAudios: number;
  /** @deprecated AI gating uses tokens now */
  lifetimeAiMessages: number;
  /** Tokens used this month (or lifetime for free — see lifetimeAiTokens) */
  monthlyAiTokens: number;
  lifetimeAiTokens: number;
  monthlyImageCreditsUsed?: number;
  
  // Actions
  setTier: (tier: PlanTier) => void;
  setStatus: (status: SubscriptionState["status"]) => void;
  setPeriodEnd: (date: string | null) => void;
  setUsage: (usage: Partial<Pick<SubscriptionState, "monthlyAiMessages" | "monthlyTtsAudios" | "dailyTtsAudios" | "lifetimeAiMessages" | "monthlyAiTokens" | "lifetimeAiTokens" | "monthlyImageCreditsUsed">>) => void;
  incrementAiMessages: () => void;
  incrementAiTokens: (tokens: number) => void;
  incrementTtsAudios: () => void;
  incrementImageCreditsUsed: (credits: number) => void;
  
  // Helpers
  getPlanConfig: () => PlanConfig;
  /** Based on token quota (not message count) */
  canSendAiMessage: () => boolean;
  canGenerateAudio: () => boolean;
  /** Remaining tokens (primary AI limit) */
  getAiRemaining: () => number;
  getAiTokenLimit: () => number;
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
      monthlyAiTokens: 0,
      lifetimeAiTokens: 0,
      monthlyImageCreditsUsed: 0,
      
      setTier: (tier) => set({ tier }),
      setStatus: (status) => set({ status }),
      setPeriodEnd: (date) => set({ periodEnd: date }),
      
      setUsage: (usage) => set(usage),
      
      incrementAiMessages: () => set((s) => ({
        monthlyAiMessages: s.monthlyAiMessages + 1,
        lifetimeAiMessages: s.lifetimeAiMessages + 1,
      })),

      incrementAiTokens: (tokens) => set((s) => ({
        monthlyAiTokens: s.monthlyAiTokens + tokens,
        lifetimeAiTokens: s.lifetimeAiTokens + tokens,
      })),
      
      incrementTtsAudios: () => set((s) => ({
        monthlyTtsAudios: s.monthlyTtsAudios + 1,
        dailyTtsAudios: s.dailyTtsAudios + 1,
      })),
      
      incrementImageCreditsUsed: (credits) => set((s) => ({
        monthlyImageCreditsUsed: (s.monthlyImageCreditsUsed || 0) + credits,
      })),
      
      getPlanConfig: () => getPlanConfig(get().tier),

      getAiTokenLimit: () => {
        const { tier } = get();
        const config = getPlanConfig(tier);
        if (tier === "free") return config.aiLifetimeTokens;
        return config.aiTokensPerMonth;
      },
      
      canSendAiMessage: () => {
        // Primary gate: token quota (message counts are no longer enforced for AI)
        return get().getAiRemaining() > 0;
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
        const { tier, monthlyAiTokens, lifetimeAiTokens } = get();
        const config = getPlanConfig(tier);
        
        if (tier === "free") {
          const limit = config.aiLifetimeTokens;
          if (limit === -1) return 999999;
          return Math.max(0, limit - lifetimeAiTokens);
        }
        
        const limit = config.aiTokensPerMonth;
        if (limit === -1) return 999999;
        return Math.max(0, limit - monthlyAiTokens);
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
        monthlyImageCreditsUsed: state.monthlyImageCreditsUsed,
      }),
    }
  )
);
