import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CardTile } from './CardTile';
import { getJokerRankLabel } from './jokerPlacement';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { Card, Combination } from '../../engine/types';

interface CombinationRowProps {
  combination: Combination;
  ownerName: string;
  onPress?(): void;
  /** Card-array index of the specific Joker the player can claim. */
  claimJokerCardIndex?: number;
  onClaimJoker?(): void;
  testID?: string;
}

export function CombinationRow({
  combination,
  ownerName,
  onPress,
  claimJokerCardIndex,
  onClaimJoker,
  testID,
}: CombinationRowProps) {
  return (
    <View style={styles.container} testID={testID ?? `combination-row-${combination.id}`}>
      <Text style={styles.ownerLabel}>{ownerName}</Text>
      <Pressable onPress={onPress} disabled={!onPress} style={styles.cardsRow}>
        {combination.cards.map((card, index) => {
          const jokerLabel = combination.type === 'sequence' && card.isJoker
            ? getJokerRankLabel(combination.cards, index)
            : null;
          return (
            <View key={index} style={[styles.cardWrapper, jokerLabel !== null && styles.jokerCardWrapper]}>
              <CardTile card={card} size="sm" />
              {jokerLabel !== null && (
                <Text style={styles.jokerLabel}>{jokerLabel}</Text>
              )}
              {index === claimJokerCardIndex && onClaimJoker && (
                <Pressable style={styles.claimBadge} onPress={onClaimJoker} testID="claim-joker-badge">
                  <Text style={styles.claimText}>↩</Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  ownerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  cardWrapper: {
    position: 'relative',
  },
  jokerCardWrapper: {
    alignItems: 'center',
  },
  jokerLabel: {
    ...typography.caption,
    color: colors.card.joker,
    marginTop: 2,
    fontSize: 9,
    lineHeight: 11,
  },
  claimBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    ...typography.tiny,
    fontWeight: '700',
    lineHeight: 12,
    color: colors.surface,
  },
});
