import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing } from '../../theme/tokens';
import { RoundResult } from '../../engine/types';

interface PlayerScore {
  playerId: string;
  name: string;
}

interface ScoreboardRowProps {
  players: PlayerScore[];
  roundResults: readonly RoundResult[];
  activePlayerId: string;
}

export function ScoreboardRow({ players, roundResults, activePlayerId }: ScoreboardRowProps) {
  const { t } = useTranslation();

  function getCumulativeScore(playerId: string): number {
    return roundResults.reduce((total, round) => {
      const entry = round.scores.find(s => s.playerId === playerId);
      return total + (entry ? entry.penalty : 0);
    }, 0);
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={styles.row}>
        {players.map(player => {
          const score = getCumulativeScore(player.playerId);
          const isActive = player.playerId === activePlayerId;
          return (
            <Text
              key={player.playerId}
              style={[styles.entry, isActive && styles.activeEntry]}
            >
              {t('game.score.label', { name: player.name, score })}
            </Text>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.md,
  },
  entry: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  activeEntry: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
});
