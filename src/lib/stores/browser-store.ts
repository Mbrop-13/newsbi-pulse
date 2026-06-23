import { create } from "zustand";

export interface BrowserStep {
  action: string;
  description: string;
  status: "running" | "done" | "error";
  timestamp?: number;
}

interface BrowserStore {
  isOpen: boolean;
  sessionId: string | null;
  currentUrl: string;
  pageTitle: string;
  screenshot: string | null;
  steps: BrowserStep[];
  isLoading: boolean;
  setOpen: (open: boolean) => void;
  setSessionId: (id: string | null) => void;
  updateScreenshot: (screenshot: string) => void;
  addStep: (step: BrowserStep) => void;
  updateUrl: (url: string, title?: string) => void;
  setLoading: (loading: boolean) => void;
  clearSession: () => void;
}

export const useBrowserStore = create<BrowserStore>((set) => ({
  isOpen: false,
  sessionId: null,
  currentUrl: "",
  pageTitle: "",
  screenshot: null,
  steps: [],
  isLoading: false,
  
  setOpen: (open) => set({ isOpen: open }),
  setSessionId: (id) => set((state) => ({
    sessionId: id,
    isOpen: id !== null,
    currentUrl: id ? state.currentUrl : "",
    pageTitle: id ? state.pageTitle : "",
    screenshot: id ? state.screenshot : null,
    steps: id ? state.steps : [],
    isLoading: id ? state.isLoading : false,
  })),
  updateScreenshot: (screenshot) => set({ screenshot, isLoading: false }),
  addStep: (step) => set((state) => ({
    steps: [...state.steps, { ...step, timestamp: Date.now() }],
    isLoading: step.status === "running",
  })),
  updateUrl: (url, title = "") => set({ currentUrl: url, pageTitle: title || url }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearSession: () => set({
    isOpen: false,
    sessionId: null,
    currentUrl: "",
    pageTitle: "",
    screenshot: null,
    steps: [],
    isLoading: false,
  }),
}));
