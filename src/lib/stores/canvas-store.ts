import { create } from "zustand";

export interface CanvasFile {
  title: string;
  code: string;
  language: string;
  stdout?: string;
  output?: string;
  error?: string;
  durationMs?: number;
  success?: boolean;
}

interface CanvasStore {
  isOpen: boolean;
  activeFile: CanvasFile | null;
  history: CanvasFile[];
  undoStack: string[];
  redoStack: string[];
  openCanvas: (file: CanvasFile) => void;
  closeCanvas: () => void;
  setOpen: (open: boolean) => void;
  clearCanvas: () => void;
  updateActiveFileCode: (code: string) => void;
  updateActiveFileResult: (result: Partial<CanvasFile>) => void;
  undo: () => void;
  redo: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  isOpen: false,
  activeFile: null,
  history: [],
  undoStack: [],
  redoStack: [],
  
  openCanvas: (file) => set((state) => {
    const filteredHistory = state.history.filter(f => f.title !== file.title);
    return {
      isOpen: true,
      activeFile: file,
      history: [file, ...filteredHistory].slice(0, 15),
      undoStack: [],
      redoStack: [],
    };
  }),
  
  closeCanvas: () => set({ isOpen: false }),
  setOpen: (open) => set({ isOpen: open }),
  clearCanvas: () => set({ isOpen: false, activeFile: null, history: [], undoStack: [], redoStack: [] }),
  
  updateActiveFileCode: (code) => set((state) => {
    if (!state.activeFile) return {};
    
    // Save previous code to undo stack
    const prevCode = state.activeFile.code;
    if (prevCode === code) return {};
    
    return {
      activeFile: {
        ...state.activeFile,
        code,
      },
      undoStack: [...state.undoStack, prevCode],
      redoStack: [], // Clear redo on new edit
    };
  }),
  
  updateActiveFileResult: (result) => set((state) => {
    if (!state.activeFile) return {};
    return {
      activeFile: {
        ...state.activeFile,
        ...result,
      }
    };
  }),
  
  undo: () => set((state) => {
    if (!state.activeFile || state.undoStack.length === 0) return {};
    const previousCode = state.undoStack[state.undoStack.length - 1];
    const newUndoStack = state.undoStack.slice(0, -1);
    
    return {
      activeFile: {
        ...state.activeFile,
        code: previousCode,
      },
      undoStack: newUndoStack,
      redoStack: [...state.redoStack, state.activeFile.code],
    };
  }),
  
  redo: () => set((state) => {
    if (!state.activeFile || state.redoStack.length === 0) return {};
    const nextCode = state.redoStack[state.redoStack.length - 1];
    const newRedoStack = state.redoStack.slice(0, -1);
    
    return {
      activeFile: {
        ...state.activeFile,
        code: nextCode,
      },
      undoStack: [...state.undoStack, state.activeFile.code],
      redoStack: newRedoStack,
    };
  }),
}));
