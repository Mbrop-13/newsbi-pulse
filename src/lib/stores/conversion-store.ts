import { create } from "zustand";

type FeatureType = "audio" | "ai_chat" | "portfolio" | "general";

// Detalles del límite de tokens alcanzado, enviados por el servidor en el
// 403 TOKEN_LIMIT_REACHED. Se usan solo para mostrar info en el banner.
interface TokenLimitDetails {
  allowed: boolean;
  remaining: number;
  limit: number;
  tier: string;
}

interface ConversionStore {
  isOpen: boolean;
  feature: FeatureType;
  openModal: (feature: FeatureType) => void;
  closeModal: () => void;
  // Banner de límite de tokens sobre la barra de input.
  tokenLimitReached: boolean;
  tokenLimitDetails: TokenLimitDetails | null;
  setTokenLimitReached: (details?: TokenLimitDetails | null) => void;
  clearTokenLimitReached: () => void;
}

export const useConversionStore = create<ConversionStore>((set) => ({
  isOpen: false,
  feature: "general",
  openModal: (feature) => set({ isOpen: true, feature }),
  closeModal: () => set({ isOpen: false }),
  tokenLimitReached: false,
  tokenLimitDetails: null,
  setTokenLimitReached: (details = null) =>
    set({ tokenLimitReached: true, tokenLimitDetails: details }),
  clearTokenLimitReached: () =>
    set({ tokenLimitReached: false, tokenLimitDetails: null }),
}));
