import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface LanguageSelectorProps {
  value: 'en' | 'ar';
  onChange(locale: 'en' | 'ar'): void;
  showLabel?: boolean;
  testID?: string;
}

export function LanguageSelector({ value, onChange, showLabel = true, testID }: LanguageSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      {showLabel && <Text style={styles.label}>{t('setup.language')}</Text>}
      <View style={styles.options}>
        {(['en', 'ar'] as const).map(locale => {
          const isSelected = locale === value;
          return (
            <Pressable
              key={locale}
              onPress={() => onChange(locale)}
              style={[styles.option, isSelected && styles.optionSelected]}
              testID={testID ? `${testID}-${locale}` : `language-${locale}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {t(`common.language.${locale}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent,
  },
  optionText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  optionTextSelected: {
    color: colors.background,
  },
});
