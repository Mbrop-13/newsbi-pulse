import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface InterestProfile {
  tags: Record<string, number>;
  categories: Record<string, number>;
  lastDecay: number;
}

interface InterestState {
  profile: InterestProfile;
  trackInteraction: (category: string, tags: string[]) => void;
  getInterestScore: (category: string, tags: string[]) => number;
}

const DECAY_FACTOR = 0.95; // Retain 95% of score per day
const DECAY_INTERVAL = 24 * 60 * 60 * 1000; // 1 day

export const useInterestStore = create<InterestState>()(
  persist(
    (set, get) => ({
      profile: {
        tags: {},
        categories: {},
        lastDecay: Date.now(),
      },

      trackInteraction: (category, tags) => {
        set((state) => {
          const now = Date.now();
          let newProfile = { ...state.profile };

          // 1. Apply Time Decay to prevent interests from growing infinitely
          if (now - newProfile.lastDecay > DECAY_INTERVAL) {
            const daysPassed = Math.floor((now - newProfile.lastDecay) / DECAY_INTERVAL);
            const decayMultiplier = Math.pow(DECAY_FACTOR, daysPassed);

            const decayedTags: Record<string, number> = {};
            const decayedCategories: Record<string, number> = {};

            for (const [tag, score] of Object.entries(newProfile.tags)) {
              if (score * decayMultiplier > 0.1) decayedTags[tag] = score * decayMultiplier;
            }
            for (const [cat, score] of Object.entries(newProfile.categories)) {
              if (score * decayMultiplier > 0.1) decayedCategories[cat] = score * decayMultiplier;
            }

            newProfile = {
              tags: decayedTags,
              categories: decayedCategories,
              lastDecay: now,
            };
          }

          // 2. Add Weight for Current Interaction
          if (category) {
            newProfile.categories[category] = (newProfile.categories[category] || 0) + 1.5; // High weight for category
          }

          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              const lowerTag = tag.toLowerCase().trim();
              newProfile.tags[lowerTag] = (newProfile.tags[lowerTag] || 0) + 1; // Standard weight for tags
            });
          }

          return { profile: newProfile };
        });
      },

      getInterestScore: (category, tags) => {
        const { profile } = get();
        let score = 0;

        if (category && profile.categories[category]) {
          // Cap the category boost to a maximum of 15 points
          score += Math.min(profile.categories[category], 15);
        }

        if (Array.isArray(tags)) {
          let tagScore = 0;
          tags.forEach(tag => {
            const lowerTag = tag.toLowerCase().trim();
            if (profile.tags[lowerTag]) {
              tagScore += profile.tags[lowerTag];
            }
          });
          // Cap the total tag boost to a maximum of 25 points
          score += Math.min(tagScore, 25);
        }

        return score;
      },
    }),
    {
      name: 'maverlang-user-interests',
      version: 1,
    }
  )
);
