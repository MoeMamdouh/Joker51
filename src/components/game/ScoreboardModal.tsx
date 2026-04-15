import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { RoundResult } from '../../engine/types';
import { useLanguageStore } from '../../store/languageStore';
import { formatNumber } from '../../i18n/formatNumber';

interface PlayerInfo {
  playerId: string;
  name: string;
}

interface ScoreboardModalProps {
  visible: boolean;
  totalRounds: 4 | 8 | 12;
  players: PlayerInfo[];
  roundResults: readonly RoundResult[];
  onClose(): void;
}

interface ScoreboardEntry {
  playerId: string;
  name: string;
  roundPenalties: (number | null)[];
  total: number;
  isLeader: boolean;
}

function buildEntries(
  players: PlayerInfo[],
  roundResults: readonly RoundResult[],
  totalRounds: number
): ScoreboardEntry[] {
  const entries = players.map(player => {
    const roundPenalties: (number | null)[] = Array.from({ length: totalRounds }, (_, i) => {
      const result = roundResults.find(r => r.roundNumber === i + 1);
      if (!result) return null;
      const score = result.scores.find(s => s.playerId === player.playerId);
      return score ? score.penalty : null;
    });
    const total = roundPenalties.reduce<number>((sum, p) => sum + (p ?? 0), 0);
    return { playerId: player.playerId, name: player.name, roundPenalties, total, isLeader: false };
  });

  if (entries.length === 0) return entries;

  const minTotal = Math.min(...entries.map(e => e.total));
  return entries.map(e => ({ ...e, isLeader: e.total === minTotal }));
}

export function ScoreboardModal({
  visible,
  totalRounds,
  players,
  roundResults,
  onClose,
}: ScoreboardModalProps) {
  const { t } = useTranslation();
  const locale = useLanguageStore(s => s.locale);

  if (!visible) return null;

  const entries = buildEntries(players, roundResults, totalRounds);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title} testID="scoreboard-title">
          {t('game.scoreboard.title')}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={styles.headerRow}>
              <Text style={[styles.nameCell, styles.headerText]}>{' '}</Text>
              {Array.from({ length: totalRounds }, (_, i) => (
                <Text key={i} style={[styles.roundCell, styles.headerText]}>
                  {t('game.scoreboard.round', { number: i + 1 })}
                </Text>
              ))}
              <Text style={[styles.totalCell, styles.headerText]}>
                {t('game.scoreboard.total')}
              </Text>
            </View>

            {/* Player rows */}
            {entries.map(entry => (
              <View
                key={entry.playerId}
                testID={`scoreboard-row-${entry.playerId}`}
                style={[styles.dataRow, entry.isLeader && styles.leaderRow]}
              >
                <View style={styles.nameCell}>
                  <Text
                    style={[styles.nameText, entry.isLeader && styles.leaderText]}
                    numberOfLines={1}
                  >
                    {entry.name}
                  </Text>
                  {entry.isLeader && (
                    <Text
                      testID={`scoreboard-leader-${entry.playerId}`}
                      style={styles.leaderBadge}
                    >
                      {t('game.scoreboard.leader')}
                    </Text>
                  )}
                </View>
                {entry.roundPenalties.map((penalty, i) => (
                  <Text
                    key={i}
                    style={[styles.roundCell, styles.dataText, entry.isLeader && styles.leaderText]}
                  >
                    {penalty === null ? t('game.scoreboard.pending') : formatNumber(penalty, locale)}
                  </Text>
                ))}
                <Text style={[styles.totalCell, styles.dataText, entry.isLeader && styles.leaderText]}>
                  {formatNumber(entry.total, locale)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Pressable
          style={styles.closeButton}
          onPress={onClose}
          testID="btn-scoreboard-close"
        >
          <Text style={styles.closeText}>{t('game.scoreboard.close')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    maxHeight: '80%',
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  leaderRow: {
    backgroundColor: colors.accent + '22',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  nameCell: {
    width: 90,
    paddingHorizontal: spacing.xs,
  },
  roundCell: {
    width: 36,
    textAlign: 'center',
  },
  totalCell: {
    width: 48,
    textAlign: 'center',
    paddingLeft: spacing.xs,
  },
  headerText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  dataText: {
    ...typography.caption,
    color: colors.text.primary,
    lineHeight: 20,
  },
  nameText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  leaderText: {
    color: colors.accent,
  },
  leaderBadge: {
    ...typography.tiny,
    color: colors.accent,
  },
  closeButton: {
    backgroundColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  closeText: {
    ...typography.label,
    color: colors.text.primary,
  },
});
