import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { SafeScrollView } from '../components/layout/SafeScrollView';
import { CardStylePicker } from '../components/settings/CardStylePicker';
import { LanguageSelector } from '../components/setup/LanguageSelector';
import { useCardStyleStore } from '../store/cardStyleStore';
import { useLanguageStore } from '../store/languageStore';
import { colors, spacing, typography } from '../theme/tokens';

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { activeStyleId, setStyle } = useCardStyleStore();
  const locale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);

  return (
    <SafeScrollView>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={12}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('settings.cardStyle.label')}</Text>
        <CardStylePicker activeStyleId={activeStyleId} onSelect={setStyle} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('settings.language.label')}</Text>
        <LanguageSelector value={locale} onChange={setLocale} showLabel={false} />
      </View>
    </SafeScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    width: 40,
    alignItems: 'center',
  },
  backArrow: {
    ...typography.heading,
    color: colors.text.primary,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
});
