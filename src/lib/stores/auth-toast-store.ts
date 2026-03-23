import { create } from 'zustand';

interface AuthToastState {
  isOpen: boolean;
  message: string;
  showToast: (message?: string) => void;
  hideToast: () => void;
}

export const useAuthToastStore = create<AuthToastState>((set) => ({
  isOpen: false,
  message: 'Debes iniciar sesión para realizar esta acción.',
  showToast: (message) => {
    set({ isOpen: true, message: message || 'Debes iniciar sesión para realizar esta acción.' });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      set({ isOpen: false });
    }, 5000);
  },
  hideToast: () => set({ isOpen: false }),
}));
