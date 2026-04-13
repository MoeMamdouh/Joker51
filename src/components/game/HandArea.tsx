import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CardTile } from './CardTile';
import { spacing } from '../../theme/tokens';
import { Card } from '../../engine/types';
import { useDirection } from '../../contexts/DirectionContext';

interface HandAreaProps {
  cards: Card[];
  selectedCards: Card[];
  onCardPress(card: Card): void;
}

export function HandArea({ cards, selectedCards, onCardPress }: HandAreaProps) {
  const { isRTL } = useDirection();

  if (cards.length === 0) {
    return <View style={styles.empty} />;
  }

  const displayCards = isRTL ? [...cards].reverse() : cards;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {displayCards.map((card, index) => (
        <CardTile
          key={index}
          card={card}
          selected={selectedCards.includes(card)}
          size="md"
          onPress={() => onCardPress(card)}
          testID={`hand-card-${index}`}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  empty: {
    height: 72,
  },
});
