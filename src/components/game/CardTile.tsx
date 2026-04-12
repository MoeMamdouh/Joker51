import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Card, Rank, Suit } from '../../engine/types';
import { colors, cardSizes, radii, typography } from '../../theme/tokens';

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.HEARTS]: '♥',
  [Suit.DIAMONDS]: '♦',
  [Suit.SPADES]: '♠',
  [Suit.CLUBS]: '♣',
};

const RANK_LABELS: Record<Rank, string> = {
  [Rank.ACE]: 'A',
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
};

const RED_SUITS: Suit[] = [Suit.HEARTS, Suit.DIAMONDS];

interface CardTileProps {
  card: Card;
  selected?: boolean;
  faceDown?: boolean;
  onPress?(): void;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

export function CardTile({
  card,
  selected = false,
  faceDown = false,
  onPress,
  size = 'md',
  testID,
}: CardTileProps) {
  const dimensions = cardSizes[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(selected ? -8 : 0, { duration: 150 }) }],
  }));

  const isRed = card.suit !== null && RED_SUITS.includes(card.suit);
  const textColor = card.isJoker
    ? colors.card.face
    : isRed
    ? colors.suit.red
    : colors.suit.black;

  const cardContent = faceDown ? (
    <View style={[styles.faceDown, dimensions]} />
  ) : card.isJoker ? (
    <View style={[styles.jokerCard, dimensions]}>
      <Text style={styles.jokerSymbol}>🃏</Text>
    </View>
  ) : (
    <View
      style={[
        styles.faceCard,
        dimensions,
        selected && styles.selectedBorder,
      ]}
    >
      <Text style={[styles.rankText, { color: textColor }]}>
        {card.rank !== null ? RANK_LABELS[card.rank] : ''}
      </Text>
      <Text style={[styles.suitText, { color: textColor }]}>
        {card.suit !== null ? SUIT_SYMBOLS[card.suit] : ''}
      </Text>
    </View>
  );

  return (
    <Animated.View style={animatedStyle} testID={testID}>
      <Pressable onPress={onPress} disabled={!onPress}>
        {cardContent}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  faceCard: {
    backgroundColor: colors.card.face,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  selectedBorder: {
    borderColor: colors.card.selected,
    borderWidth: 2,
  },
  faceDown: {
    backgroundColor: colors.card.back,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jokerCard: {
    backgroundColor: colors.card.joker,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.label,
    fontWeight: '700',
  },
  suitText: {
    ...typography.caption,
  },
  jokerSymbol: {
    fontSize: 20,
  },
});
