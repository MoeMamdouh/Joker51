// Mock i18next and AsyncStorage before imports (jest.mock is hoisted)
jest.mock('i18next', () => ({
  changeLanguage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguageStore } from '../languageStore';

const LANGUAGE_KEY = '@joker51/language';

let forceRTLSpy: jest.SpyInstance;

function getStore() {
  return useLanguageStore.getState();
}

function resetStore() {
  useLanguageStore.setState({ locale: 'en', isRTL: false });
}

beforeEach(() => {
  resetStore();
  jest.clearAllMocks();
  forceRTLSpy = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});
  (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
});

afterEach(() => {
  forceRTLSpy.mockRestore();
});

describe('languageStore — direction signalling', () => {
  it('setLocale("ar") from "en" sets isRTL true and calls forceRTL', () => {
    getStore().setLocale('ar');
    expect(getStore().isRTL).toBe(true);
    expect(forceRTLSpy).toHaveBeenCalledWith(true);
  });

  it('setLocale("en") from "en" does NOT call forceRTL (no direction change)', () => {
    getStore().setLocale('en');
    expect(forceRTLSpy).not.toHaveBeenCalled();
  });

  it('setLocale("en") from "ar" sets isRTL false and calls forceRTL', () => {
    useLanguageStore.setState({ locale: 'ar', isRTL: true });
    getStore().setLocale('en');
    expect(getStore().isRTL).toBe(false);
    expect(forceRTLSpy).toHaveBeenCalledWith(false);
  });
});

describe('languageStore — persistence', () => {
  it('setLocale persists the locale to AsyncStorage', () => {
    getStore().setLocale('ar');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(LANGUAGE_KEY, 'ar');
  });

  it('loadPersistedLocale restores "ar" when stored in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('ar');
    await getStore().loadPersistedLocale();
    expect(getStore().locale).toBe('ar');
    expect(getStore().isRTL).toBe(true);
  });

  it('loadPersistedLocale defaults to "en" when nothing is stored', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await getStore().loadPersistedLocale();
    expect(getStore().locale).toBe('en');
    expect(getStore().isRTL).toBe(false);
  });
});
