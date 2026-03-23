import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';

interface DiamondState {
  balance: number;
  consecutiveDays: number;
  lastClaimDate: string | null;
  canClaimToday: boolean;
  isLoading: boolean;
  loadDiamonds: (userId: string) => Promise<void>;
  claimDiamonds: () => Promise<{ success: boolean; reward?: number; error?: string }>;
}

export const useDiamondStore = create<DiamondState>((set, get) => ({
  balance: 0,
  consecutiveDays: 0,
  lastClaimDate: null,
  canClaimToday: false,
  isLoading: false,

  loadDiamonds: async (userId: string) => {
    set({ isLoading: true });
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('user_diamonds')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        set({
          balance: data.balance || 0,
          consecutiveDays: data.consecutive_days || 0,
          lastClaimDate: data.last_claim_date || null,
        });

        // Check if can claim today
        if (data.last_claim_date) {
          const lastClaim = new Date(data.last_claim_date);
          const now = new Date();
          // We consider "today" as the same calendar day in local time or UTC
          // For simplicity, if the day, month, and year are the same in UTC, they can't claim
          const isSameDay = lastClaim.getUTCFullYear() === now.getUTCFullYear() &&
                            lastClaim.getUTCMonth() === now.getUTCMonth() &&
                            lastClaim.getUTCDate() === now.getUTCDate();
          set({ canClaimToday: !isSameDay });
        } else {
          set({ canClaimToday: true });
        }
      } else {
        // User has no record yet
        set({
          balance: 0,
          consecutiveDays: 0,
          lastClaimDate: null,
          canClaimToday: true,
        });
      }
    } catch (err) {
      console.error("Failed to load diamonds:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  claimDiamonds: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/diamonds/claim', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to claim");
      }

      set({
        balance: data.balance,
        consecutiveDays: data.consecutive_days,
        lastClaimDate: data.last_claim_date,
        canClaimToday: false,
      });

      return { success: true, reward: data.reward };
    } catch (err: any) {
      console.error("Claim error:", err);
      return { success: false, error: err.message };
    } finally {
      set({ isLoading: false });
    }
  }
}));
