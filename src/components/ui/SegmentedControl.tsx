import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface SegmentOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  testID?: string;
}

export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  testID,
}: SegmentedControlProps) {
  return (
    <View
      style={[styles.container, disabled && styles.disabled]}
      pointerEvents={disabled ? 'none' : 'auto'}
      testID={testID}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(option.value)}
            testID={testID ? `${testID}-${option.value}` : undefined}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.4,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.accent,
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.card.face,
    fontWeight: '700',
  },
});
