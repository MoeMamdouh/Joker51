import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { initI18n } from '../src/i18n';
import { DirectionProvider } from '../src/contexts/DirectionContext';
import { useLanguageStore } from '../src/store/languageStore';
import { useCardStyleStore } from '../src/store/cardStyleStore';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(savedLocale => {
      useLanguageStore.setState({ locale: savedLocale, isRTL: savedLocale === 'ar' });
      useCardStyleStore.getState().loadPersistedStyle();
      setI18nReady(true);
    });
  }, []);

  if (!i18nReady) return null;

  return (
    <DirectionProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="game" />
          <Stack.Screen name="settings" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </DirectionProvider>
  );
}
