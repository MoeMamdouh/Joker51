import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { CardTile } from './CardTile';
import { colors, typography, radii, spacing } from '../../theme/tokens';
import { Card, Rank, Suit } from '../../engine/types';

// Placeholder card used to render the face-down back of the draw pile
const BACK_CARD: Card = { rank: Rank.ACE, suit: Suit.SPADES, isJoker: false };

interface DrawPileProps {
  cardCount: number;
  onPress?(): void;
}

export function DrawPile({ cardCount, onPress }: DrawPileProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.container}>
      <CardTile card={BACK_CARD} faceDown size="lg" />
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{cardCount}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    ...typography.caption,
    color: colors.surface,
    fontWeight: '700',
  },
});
