import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Card } from '../../engine/types';
import { CardTile } from './CardTile';
import { getJokerRankLabel } from './jokerPlacement';
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
            {combo.map((card, cardIdx) => {
              const jokerLabel = card.isJoker ? getJokerRankLabel(combo, cardIdx) : null;
              return (
                <View key={cardIdx} style={card.isJoker ? styles.jokerWrapper : undefined}>
                  <CardTile
                    card={card}
                    size="sm"
                    testID={`staged-card-${comboIdx}-${cardIdx}`}
                  />
                  {jokerLabel !== null && (
                    <Text style={styles.jokerLabel}>{jokerLabel}</Text>
                  )}
                </View>
              );
            })}
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
  jokerWrapper: {
    alignItems: 'center',
  },
  jokerLabel: {
    ...typography.caption,
    color: colors.card.joker,
    marginTop: 2,
    fontSize: 9,
    lineHeight: 11,
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
