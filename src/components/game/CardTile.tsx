import React, { useEffect } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Card, Rank, Suit } from '../../engine/types';
import {
  colors,
  cardSizes,
  radii,
  spacing,
  typography,
} from '../../theme/tokens';
import { useCardStyleStore, CardStyleId } from '../../store/cardStyleStore';

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

const FACE_RANKS: Rank[] = [Rank.JACK, Rank.QUEEN, Rank.KING];
const RED_SUITS: Suit[] = [Suit.HEARTS, Suit.DIAMONDS];

interface CardTileProps {
  card: Card;
  /** Card is selected (staged pre-meld): lifts card up */
  selected?: boolean;
  /** Card is dimmed: reduced opacity + non-interactive. Mutually exclusive with selected. */
  dimmed?: boolean;
  faceDown?: boolean;
  onPress?(): void;
  size?: 'sm' | 'md' | 'lg';
  /** Override the active card style — used by CardStylePicker previews. */
  styleOverride?: CardStyleId;
  /** Newly drawn card — shows pulsing accent border indicator */
  isNew?: boolean;
  testID?: string;
}

export function CardTile({
  card,
  selected = false,
  dimmed = false,
  faceDown = false,
  onPress,
  size = 'md',
  styleOverride,
  isNew = false,
  testID,
}: CardTileProps) {
  const dimensions = cardSizes[size];
  const storeStyleId = useCardStyleStore((s) => s.activeStyleId);
  const activeStyleId = styleOverride ?? storeStyleId;
  const isMinimal = activeStyleId === 'minimal';
  const faceCardCenterBg = isMinimal ? null : colors.card.faceCard.classicBg;
  const faceCardCenterTextColor = isMinimal
    ? colors.suit.black
    : colors.card.faceCard.classicText;
  const showNumberCardCenterSuit = isMinimal;
  const styleDef = { faceCardCenterBg, faceCardCenterTextColor, showNumberCardCenterSuit };

  const glowPulse = useSharedValue(0);

  useEffect(() => {
    if (isNew && !dimmed) {
      glowPulse.value = withRepeat(withTiming(1, { duration: 600 }), -1, true);
    } else {
      glowPulse.value = withTiming(0, { duration: 200 });
    }
  }, [isNew, dimmed, glowPulse]);

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(selected ? -8 : 0, { duration: 150 }) }],
  }));

  const dimStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dimmed ? 0.35 : 1.0, { duration: 150 }),
  }));

  const newGlowStyle = useAnimatedStyle(() => ({
    shadowColor: colors.card.newIndicator,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowPulse.value * 0.9,
    shadowRadius: glowPulse.value * 8,
    elevation: glowPulse.value * 10,
  }));

  const isRed = card.suit !== null && RED_SUITS.includes(card.suit);
  const suitColor = isRed ? colors.suit.red : colors.suit.black;
  const rankLabel = card.rank !== null ? RANK_LABELS[card.rank] : '';
  const suitSymbol = card.suit !== null ? SUIT_SYMBOLS[card.suit] : '';
  const isFaceRank = card.rank !== null && FACE_RANKS.includes(card.rank);

  // --- Card face content ---
  let centerContent: React.ReactNode = null;

  if (!faceDown && !card.isJoker) {
    if (card.rank === Rank.ACE) {
      // Large centered suit symbol
      centerContent = (
        <Text
          style={[
            size === 'sm' ? styles.centerSm : styles.center,
            { color: suitColor },
          ]}
        >
          {suitSymbol}
        </Text>
      );
    } else if (isFaceRank) {
      // Classic: colored bg fill + white rank letter; Minimal: rank letter only
      centerContent = (
        <View
          style={[
            styles.faceCenter,
            styleDef.faceCardCenterBg
              ? { backgroundColor: styleDef.faceCardCenterBg }
              : null,
          ]}
        >
          <Text
            style={[
              size === 'sm' ? styles.centerSm : styles.center,
              // Classic: white on amber bg. Minimal: no bg, so follow suit color.
              { color: styleDef.faceCardCenterBg ? styleDef.faceCardCenterTextColor : suitColor },
            ]}
          >
            {rankLabel}
          </Text>
        </View>
      );
    } else if (styleDef.showNumberCardCenterSuit) {
      // Minimal style: number cards show large suit in center
      centerContent = (
        <Text
          style={[
            size === 'sm' ? styles.centerSm : styles.center,
            { color: suitColor },
          ]}
        >
          {suitSymbol}
        </Text>
      );
    }
  }

  // --- Corner block (rank + suit stacked) ---
  const cornerBlock = (
    <View style={styles.corner}>
      <Text style={[styles.cornerRank, { color: suitColor }]}>{rankLabel}</Text>
      <Text style={[styles.cornerSuit, { color: suitColor }]}>{suitSymbol}</Text>
    </View>
  );

  const jokerCorner = (
    <View style={styles.corner}>
      <Text style={styles.jokerCornerGlyph}>🃏</Text>
    </View>
  );

  const cardInner = faceDown ? (
    <View style={[styles.faceDown, dimensions]} />
  ) : card.isJoker ? (
    <View style={[styles.jokerCard, dimensions, selected && styles.selectedBorder]}>
      {jokerCorner}
      <View style={styles.centerArea}>
        <Text style={size === 'sm' ? styles.jokerGlyphSm : styles.jokerGlyph}>🃏</Text>
      </View>
      <View style={[styles.corner, styles.cornerBottomRight]}>
        <Text style={styles.jokerCornerGlyph}>🃏</Text>
      </View>
    </View>
  ) : (
    <View
      style={[
        styles.faceCard,
        dimensions,
        selected && styles.selectedBorder,
      ]}
    >
      {/* Top-left corner */}
      {cornerBlock}

      {/* Center content */}
      <View style={styles.centerArea}>{centerContent}</View>

      {/* Bottom-right corner (rotated 180°) */}
      <View style={[styles.corner, styles.cornerBottomRight]}>
        <Text style={[styles.cornerRank, { color: suitColor }]}>{rankLabel}</Text>
        <Text style={[styles.cornerSuit, { color: suitColor }]}>{suitSymbol}</Text>
      </View>
    </View>
  );

  return (
    <Animated.View style={[liftStyle, dimStyle, newGlowStyle]} testID={testID}>
      <Pressable onPress={onPress} disabled={!onPress || dimmed}>
        {cardInner}
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
    overflow: 'hidden',
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
    backgroundColor: colors.card.face,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.card.joker,
    overflow: 'hidden',
  },
  jokerCornerGlyph: {
    fontSize: 10,
    lineHeight: 12,
  },
  jokerGlyph: {
    fontSize: 32,
    lineHeight: 38,
  },
  jokerGlyphSm: {
    fontSize: 20,
    lineHeight: 24,
  },
  corner: {
    position: 'absolute',
    top: spacing.xxs,
    left: spacing.xs,
    alignItems: 'center',
  },
  cornerBottomRight: {
    top: undefined,
    left: undefined,
    bottom: spacing.xxs,
    right: spacing.xs,
    transform: [{ rotate: '180deg' }],
  },
  cornerRank: {
    ...typography.cardCorner,
  },
  cornerSuit: {
    ...typography.cardCorner,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCenter: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...typography.cardCenter,
  },
  centerSm: {
    ...typography.cardCenterSm,
  },
});
