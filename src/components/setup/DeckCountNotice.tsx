import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface DeckCountNoticeProps {
  deckCount: number;
  testID?: string;
}

export function DeckCountNotice({ deckCount, testID }: DeckCountNoticeProps) {
  const { t } = useTranslation();

  if (deckCount <= 1) return null;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.text}>
        {t('setup.deckNotice', { count: deckCount })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  text: {
    ...typography.body,
    color: colors.text.secondary,
  },
});
