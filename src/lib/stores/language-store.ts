import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Language = "es" | "en";

interface LanguageState {
  language: Language;
  preference: "default" | "es" | "en";
  setPreference: (pref: "default" | "es" | "en") => void;
  setLanguage: (lang: Language) => void;
  initializeLanguage: () => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: "es",
      preference: "default",
      setPreference: (pref) => {
        set({ preference: pref });
        if (pref === "default") {
          // Detect from browser
          const browserLang = typeof navigator !== "undefined" ? navigator.language : "es";
          const detected: Language = browserLang.toLowerCase().startsWith("es") ? "es" : "en";
          set({ language: detected });
        } else {
          set({ language: pref });
        }
      },
      setLanguage: (lang) => set({ language: lang }),
      initializeLanguage: () => {
        const { preference } = get();
        if (preference === "default") {
          const browserLang = typeof navigator !== "undefined" ? navigator.language : "es";
          const detected: Language = browserLang.toLowerCase().startsWith("es") ? "es" : "en";
          set({ language: detected });
        } else {
          set({ language: preference });
        }
      },
    }),
    {
      name: "maverlang-language-preference",
    }
  )
);
