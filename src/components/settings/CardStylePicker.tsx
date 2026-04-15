import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CardTile } from '../game/CardTile';
import { CardStyleId, CARD_STYLES } from '../../store/cardStyleStore';
import { useDirection } from '../../contexts/DirectionContext';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { Card, Rank, Suit } from '../../engine/types';

const PREVIEW_FACE: Card = { rank: Rank.KING, suit: Suit.SPADES, isJoker: false };
const PREVIEW_NUMBER: Card = { rank: Rank.SEVEN, suit: Suit.HEARTS, isJoker: false };

interface CardStylePickerProps {
  activeStyleId: CardStyleId;
  onSelect: (id: CardStyleId) => void;
}

export function CardStylePicker({ activeStyleId, onSelect }: CardStylePickerProps) {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const styleIds = Object.keys(CARD_STYLES) as CardStyleId[];

  return (
    <View style={[styles.row, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
      {styleIds.map((id) => {
        const isActive = id === activeStyleId;
        return (
          <Pressable
            key={id}
            style={[styles.option, isActive && styles.optionActive]}
            onPress={() => onSelect(id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isActive }}
          >
            <View style={styles.previews}>
              <CardTile card={PREVIEW_FACE} size="sm" styleOverride={id} />
              <CardTile card={PREVIEW_NUMBER} size="sm" styleOverride={id} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {t(CARD_STYLES[id].labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionActive: {
    borderColor: colors.card.selected,
  },
  previews: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
  },
  labelActive: {
    color: colors.accent,
  },
});
