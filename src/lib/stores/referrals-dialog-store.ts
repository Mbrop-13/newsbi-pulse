import { create } from "zustand";

interface ReferralsDialogState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
}

export const useReferralsDialogStore = create<ReferralsDialogState>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
}));
