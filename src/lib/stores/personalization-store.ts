import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PersonalizationState {
  fontSize: 'small' | 'medium' | 'large';
  imageRadius: 'none' | 'small' | 'medium' | 'large';
  contentDensity: 'compact' | 'comfortable' | 'spacious';
  showImages: boolean;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setImageRadius: (radius: 'none' | 'small' | 'medium' | 'large') => void;
  setContentDensity: (density: 'compact' | 'comfortable' | 'spacious') => void;
  setShowImages: (show: boolean) => void;
}

export const usePersonalizationStore = create<PersonalizationState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      imageRadius: 'medium',
      contentDensity: 'comfortable',
      showImages: true,
      setFontSize: (fontSize) => set({ fontSize }),
      setImageRadius: (imageRadius) => set({ imageRadius }),
      setContentDensity: (contentDensity) => set({ contentDensity }),
      setShowImages: (showImages) => set({ showImages }),
    }),
    { name: 'newsbi-personalization' }
  )
);

// CSS variable mappings
export const FONT_SIZE_MAP = {
  small: { base: '14px', article: '15px', heading: '1.1' },
  medium: { base: '16px', article: '16px', heading: '1' },
  large: { base: '18px', article: '18px', heading: '0.95' },
};

export const IMAGE_RADIUS_MAP = {
  none: '0px',
  small: '4px',
  medium: '12px',
  large: '20px',
};

export const DENSITY_MAP = {
  compact: { gap: '0.5rem', padding: '0.5rem' },
  comfortable: { gap: '1rem', padding: '1rem' },
  spacious: { gap: '1.5rem', padding: '1.5rem' },
};
