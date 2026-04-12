import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { CardTile } from './CardTile';
import { colors, cardSizes, radii } from '../../theme/tokens';
import { Card } from '../../engine/types';

interface DiscardPileProps {
  topCard: Card | null;
  onPress?(): void;
}

export function DiscardPile({ topCard, onPress }: DiscardPileProps) {
  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      {topCard ? (
        <CardTile card={topCard} size="lg" />
      ) : (
        <View style={styles.empty} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  empty: {
    width: cardSizes.lg.width,
    height: cardSizes.lg.height,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
