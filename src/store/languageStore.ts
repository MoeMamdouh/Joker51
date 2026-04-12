import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18next from 'i18next';

const LANGUAGE_KEY = '@joker51/language';

interface LanguageState {
  locale: 'en' | 'ar';
  isRTL: boolean;
  setLocale(locale: 'en' | 'ar'): void;
  loadPersistedLocale(): Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'en',
  isRTL: false,

  setLocale(locale) {
    const isRTL = locale === 'ar';
    set({ locale, isRTL });
    i18next.changeLanguage(locale);
    // Persist preference (fire-and-forget)
    AsyncStorage.setItem(LANGUAGE_KEY, locale).catch(() => {});
  },

  async loadPersistedLocale() {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (saved === 'en' || saved === 'ar') {
        const isRTL = saved === 'ar';
        set({ locale: saved, isRTL });
        await i18next.changeLanguage(saved);
      }
    } catch {
      // Fall back to default 'en'
    }
  },
}));
