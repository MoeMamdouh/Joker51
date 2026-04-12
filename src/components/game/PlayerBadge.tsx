import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '../../theme/tokens';

interface PlayerBadgeProps {
  name: string;
  cardCount: number;
  isActive: boolean;
}

export function PlayerBadge({ name, cardCount, isActive }: PlayerBadgeProps) {
  return (
    <View style={[styles.container, isActive && styles.activeContainer]}>
      <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.cardCount}>🂠 {cardCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeContainer: {
    borderColor: colors.accent,
  },
  name: {
    ...typography.label,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  activeName: {
    color: colors.accent,
  },
  cardCount: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
