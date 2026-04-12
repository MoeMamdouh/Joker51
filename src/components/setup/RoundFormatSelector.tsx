import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface RoundFormatSelectorProps {
  value: 4 | 8 | 12;
  onChange(format: 4 | 8 | 12): void;
  testID?: string;
}

const OPTIONS: { label: string; value: 4 | 8 | 12 }[] = [
  { label: 'setup.roundFormat.short', value: 4 },
  { label: 'setup.roundFormat.medium', value: 8 },
  { label: 'setup.roundFormat.long', value: 12 },
];

export function RoundFormatSelector({ value, onChange, testID }: RoundFormatSelectorProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{t('setup.roundFormat')}</Text>
      <View style={styles.options}>
        {OPTIONS.map(option => {
          const isSelected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[styles.option, isSelected && styles.optionSelected]}
              testID={testID ? `${testID}-${option.value}` : `round-format-${option.value}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                {t(option.label)}
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
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
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
