import { create } from "zustand";

interface SubscriptionDialogState {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  open: () => void;
  close: () => void;
}

export const useSubscriptionDialogStore = create<SubscriptionDialogState>((set) => ({
  isOpen: false,
  setOpen: (isOpen) => set({ isOpen }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
