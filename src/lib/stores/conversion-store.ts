import { create } from "zustand";

type FeatureType = "audio" | "ai_chat" | "portfolio" | "general";

interface ConversionStore {
  isOpen: boolean;
  feature: FeatureType;
  openModal: (feature: FeatureType) => void;
  closeModal: () => void;
}

export const useConversionStore = create<ConversionStore>((set) => ({
  isOpen: false,
  feature: "general",
  openModal: (feature) => set({ isOpen: true, feature }),
  closeModal: () => set({ isOpen: false }),
}));
