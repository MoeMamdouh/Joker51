import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { colors, spacing, typography } from '../../theme/tokens';

interface PlayerCountStepperProps {
  value: number;
  onChange(count: number): void;
  testID?: string;
}

export function PlayerCountStepper({ value, onChange, testID }: PlayerCountStepperProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{t('setup.playerCount')}</Text>
      <View style={styles.row}>
        <Button
          label="−"
          onPress={() => onChange(value - 1)}
          disabled={value <= 2}
          variant="secondary"
          testID={testID ? `${testID}-decrement` : 'stepper-decrement'}
          style={styles.stepButton}
        />
        <Text
          style={styles.count}
          accessibilityLabel={`${value} players`}
          testID={testID ? `${testID}-value` : 'stepper-value'}
        >
          {value}
        </Text>
        <Button
          label="+"
          onPress={() => onChange(value + 1)}
          disabled={value >= 8}
          variant="secondary"
          testID={testID ? `${testID}-increment` : 'stepper-increment'}
          style={styles.stepButton}
        />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepButton: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  count: {
    ...typography.heading,
    color: colors.text.primary,
    minWidth: 40,
    textAlign: 'center',
  },
});
