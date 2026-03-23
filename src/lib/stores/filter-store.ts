import { create } from 'zustand';

export interface Source {
  name: string;
  url: string;
}

interface FilterState {
  selectedSources: string[];
  availableSources: Source[];
  setAvailableSources: (sources: Source[]) => void;
  toggleSource: (sourceName: string) => void;
  clearSources: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedSources: [],
  availableSources: [],
  setAvailableSources: (sources) => set({ availableSources: sources }),
  toggleSource: (sourceName) => set((state) => ({
    selectedSources: state.selectedSources.includes(sourceName)
      ? state.selectedSources.filter(s => s !== sourceName)
      : [...state.selectedSources, sourceName]
  })),
  clearSources: () => set({ selectedSources: [] }),
}));
