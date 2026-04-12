import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../engine/types';
import { CardTile } from './CardTile';
import { colors, spacing, radii, typography } from '../../theme/tokens';

interface StagedMeldPreviewProps {
  stagedCombinations: Card[][];
  pointTotal: number;
  onCancel(): void;
}

export function StagedMeldPreview({
  stagedCombinations,
  pointTotal,
  onCancel,
}: StagedMeldPreviewProps) {
  const { t } = useTranslation();

  if (stagedCombinations.length === 0) return null;

  return (
    <View style={styles.container} testID="staged-meld-preview">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stagedCombinations.map((combo, comboIdx) => (
          <View
            key={comboIdx}
            style={[styles.combo, comboIdx > 0 && styles.comboSeparator]}
            testID={`staged-combo-${comboIdx}`}
          >
            {combo.map((card, cardIdx) => (
              <CardTile
                key={cardIdx}
                card={card}
                size="sm"
                testID={`staged-card-${comboIdx}-${cardIdx}`}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Text style={styles.pointsText}>
          {t('game.stagedPoints', { points: pointTotal })}
        </Text>
        <Pressable onPress={onCancel} style={styles.cancelButton} testID="staged-cancel-button">
          <Text style={styles.cancelText}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  combo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  comboSeparator: {
    marginLeft: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  pointsText: {
    ...typography.label,
    color: colors.accent,
  },
  cancelButton: {
    padding: spacing.xs,
  },
  cancelText: {
    ...typography.label,
    color: colors.text.secondary,
  },
});
