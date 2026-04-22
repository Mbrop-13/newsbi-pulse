import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewLayout = 'grid' | 'list' | 'traditional';
export type ViewDensity = 'compact' | 'comfortable' | 'spacious';
export type ViewFontSize = 'sm' | 'base' | 'lg';
export type ArticleWidth = 'normal' | 'wide' | 'full';
export type TimePeriod = 'recent' | '24h' | '7d' | '30d' | 'all';

interface ViewSettingsState {
  // Configs
  layout: ViewLayout;
  density: ViewDensity;
  fontSize: ViewFontSize;
  showImages: boolean;
  showPredictions: boolean;
  articleWidth: ArticleWidth;
  timePeriod: TimePeriod;

  // Actions
  setLayout: (layout: ViewLayout) => void;
  setDensity: (density: ViewDensity) => void;
  setFontSize: (fontSize: ViewFontSize) => void;
  setShowImages: (show: boolean) => void;
  setShowPredictions: (show: boolean) => void;
  setArticleWidth: (width: ArticleWidth) => void;
  setTimePeriod: (period: TimePeriod) => void;
  resetToDefaults: () => void;
}

const defaultState = {
  layout: 'traditional' as ViewLayout,
  density: 'comfortable' as ViewDensity,
  fontSize: 'base' as ViewFontSize,
  showImages: true,
  showPredictions: true,
  articleWidth: 'normal' as ArticleWidth,
  timePeriod: '24h' as TimePeriod,
};

export const useViewStore = create<ViewSettingsState>()(
  persist(
    (set) => ({
      ...defaultState,
      setLayout: (layout) => set({ layout }),
      setDensity: (density) => set({ density }),
      setFontSize: (fontSize) => set({ fontSize }),
      setShowImages: (showImages) => set({ showImages }),
      setShowPredictions: (showPredictions) => set({ showPredictions }),
      setArticleWidth: (articleWidth) => set({ articleWidth }),
      setTimePeriod: (timePeriod) => set({ timePeriod }),
      resetToDefaults: () => set(defaultState),
    }),
    {
      name: 'reclu-view-settings', 
    }
  )
);
