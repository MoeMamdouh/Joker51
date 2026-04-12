import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import ar from './ar.json';

const LANGUAGE_KEY = '@joker51/language';

export async function initI18n(): Promise<void> {
  let savedLocale: 'en' | 'ar' = 'en';

  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'ar') {
      savedLocale = stored;
    }
  } catch {
    // Use default 'en'
  }

  // Apply native RTL direction for the next cold start
  I18nManager.forceRTL(savedLocale === 'ar');

  await i18next.use(initReactI18next).init({
    lng: savedLocale,
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });
}

export default i18next;
