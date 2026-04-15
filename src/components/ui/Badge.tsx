import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface BadgeProps {
  label?: string;
  value?: number;
  variant?: 'default' | 'accent';
}

export function Badge({ label, value, variant = 'default' }: BadgeProps) {
  const text = label ?? String(value ?? '');
  return (
    <View style={[styles.container, variant === 'accent' && styles.accent]}>
      <Text style={[styles.text, variant === 'accent' && styles.accentText]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    alignSelf: 'flex-start',
  },
  accent: {
    backgroundColor: colors.accent,
  },
  text: {
    ...typography.label,
    color: colors.text.primary,
  },
  accentText: {
    color: colors.background,
  },
});
