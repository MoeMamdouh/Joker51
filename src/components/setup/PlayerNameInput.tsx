import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextInput } from '../ui/TextInput';
import { useDirection } from '../../contexts/DirectionContext';
import { colors, spacing, typography } from '../../theme/tokens';

interface PlayerNameInputProps {
  index: number;
  value: string;
  error: string | null;
  onChange(name: string): void;
  testID?: string;
}

export function PlayerNameInput({ index, value, error, onChange, testID }: PlayerNameInputProps) {
  const { t } = useTranslation();
  const { isRTL } = useDirection();

  const translatedError = error ? t(error) : null;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isRTL && styles.labelRTL]}>
        {t('setup.playerLabel', { number: index + 1 })}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('setup.playerNamePlaceholder')}
        maxLength={20}
        error={translatedError}
        testID={testID ?? `player-name-${index}`}
        textAlign={isRTL ? 'right' : 'left'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  labelRTL: {
    textAlign: 'right',
  },
});
