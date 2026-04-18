import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { RoundResult } from '../../engine/types';
import { useLanguageStore } from '../../store/languageStore';
import { formatNumber } from '../../i18n/formatNumber';
import { getPlayerColor } from './RoundSummaryOverlay';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  colorIndex: number;
  roundPenalties: (number | null)[];
  total: number;
  isLeader: boolean;
  roundsWon: Set<number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildEntries(
  players: PlayerInfo[],
  roundResults: readonly RoundResult[],
  totalRounds: number
): ScoreboardEntry[] {
  const entries: ScoreboardEntry[] = players.map((player, idx) => {
    const roundPenalties: (number | null)[] = Array.from({ length: totalRounds }, (_, i) => {
      const result = roundResults.find(r => r.roundNumber === i + 1);
      if (!result) return null;
      const score = result.scores.find(s => s.playerId === player.playerId);
      return score ? score.penalty : null;
    });

    const roundsWon = new Set<number>();
    roundResults.forEach(r => {
      if (r.winnerId === player.playerId) roundsWon.add(r.roundNumber);
    });

    const total = roundPenalties.reduce<number>((sum, p) => sum + (p ?? 0), 0);
    return {
      playerId: player.playerId,
      name: player.name,
      colorIndex: idx,
      roundPenalties,
      total,
      isLeader: false,
      roundsWon,
    };
  });

  if (entries.length === 0) return entries;
  const minTotal = Math.min(...entries.map(e => e.total));
  return entries.map(e => ({ ...e, isLeader: e.total === minTotal }));
}

// ─── Main component ───────────────────────────────────────────────────────────

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
  const sortedEntries = [...entries].sort((a, b) => a.total - b.total);
  const maxTotal = Math.max(...entries.map(e => e.total), 1);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>

        {/* Title + close */}
        <View style={styles.titleRow}>
          <Text style={styles.title} testID="scoreboard-title">
            {t('game.scoreboard.title')}
          </Text>
          <Pressable style={styles.closeButton} onPress={onClose} testID="btn-scoreboard-close">
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* ── Standings bar chart ── */}
        {entries.some(e => e.total > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('game.roundSummary.standings')}</Text>
            <View style={styles.barChart}>
              {sortedEntries.map((entry, i) => {
                const color = getPlayerColor(entry.colorIndex);
                const ratio = Math.max(entry.total / maxTotal, 0.02);
                return (
                  <View key={entry.playerId} style={styles.barRow}>
                    <View style={[styles.colorDot, { backgroundColor: color }]} />
                    <Text
                      style={[styles.barName, entry.isLeader && { color }]}
                      numberOfLines={1}
                    >
                      {entry.name}
                    </Text>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          { flex: ratio, backgroundColor: entry.isLeader ? color : color + '70' },
                        ]}
                      />
                      <View style={{ flex: 1 - ratio }} />
                    </View>
                    <Text style={[styles.barScore, entry.isLeader && { color }]}>
                      {formatNumber(entry.total, locale)}
                    </Text>
                    {entry.isLeader && (
                      <Text style={[styles.leaderStar, { color }]}>★</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Round-by-round table ── */}
        {roundResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t('game.scoreboard.title')}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.tableNameCell}>
                    <Text style={styles.tableHeaderText}> </Text>
                  </View>
                  {Array.from({ length: totalRounds }, (_, i) => (
                    <View key={i} style={styles.tableRoundCell}>
                      <Text style={styles.tableHeaderText}>
                        {t('game.scoreboard.round', { number: i + 1 })}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.tableTotalCell}>
                    <Text style={styles.tableHeaderText}>{t('game.scoreboard.total')}</Text>
                  </View>
                </View>

                {/* Player rows */}
                {entries.map(entry => {
                  const color = getPlayerColor(entry.colorIndex);
                  return (
                    <View
                      key={entry.playerId}
                      testID={`scoreboard-row-${entry.playerId}`}
                      style={[styles.tableRow, entry.isLeader && { backgroundColor: color + '18' }]}
                    >
                      {/* Name cell */}
                      <View style={styles.tableNameCell}>
                        <View style={styles.tableNameInner}>
                          <View style={[styles.colorDot, { backgroundColor: color }]} />
                          <Text
                            style={[styles.tableNameText, entry.isLeader && { color }]}
                            numberOfLines={1}
                            testID={`scoreboard-name-${entry.playerId}`}
                          >
                            {entry.name}
                          </Text>
                        </View>
                        {entry.isLeader && (
                          <Text
                            testID={`scoreboard-leader-${entry.playerId}`}
                            style={[styles.leaderBadge, { color }]}
                          >
                            {t('game.scoreboard.leader')}
                          </Text>
                        )}
                      </View>

                      {/* Round penalty cells */}
                      {entry.roundPenalties.map((penalty, i) => {
                        const wonThisRound = entry.roundsWon.has(i + 1);
                        return (
                          <View key={i} style={styles.tableRoundCell}>
                            <Text
                              style={[
                                styles.tableCellText,
                                wonThisRound && { color, fontWeight: '700' },
                                !wonThisRound && penalty !== null && { color: colors.text.secondary },
                              ]}
                            >
                              {penalty === null
                                ? t('game.scoreboard.pending')
                                : formatNumber(penalty, locale)}
                            </Text>
                            {wonThisRound && (
                              <Text style={[styles.roundWonStar, { color }]}>★</Text>
                            )}
                          </View>
                        );
                      })}

                      {/* Total cell */}
                      <View style={styles.tableTotalCell}>
                        <Text style={[styles.tableTotalText, entry.isLeader && { color }]}>
                          {formatNumber(entry.total, locale)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}

        {roundResults.length === 0 && (
          <Text style={styles.emptyText}>{t('game.scoreboard.pending')}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE = 10;
const BAR_HEIGHT = 10;
const NAME_CELL_W = 96;
const ROUND_CELL_W = 44;
const TOTAL_CELL_W = 52;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    width: '100%',
    maxHeight: '88%',
    gap: spacing.md,
  },

  // Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.heading,
    fontSize: 20,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    ...typography.label,
    color: colors.text.secondary,
    lineHeight: 20,
  },

  // Section
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },

  // Bar chart
  barChart: {
    gap: spacing.xs,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  colorDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    flexShrink: 0,
  },
  barName: {
    ...typography.caption,
    color: colors.text.primary,
    width: 72,
    flexShrink: 0,
    fontWeight: '600',
  },
  barTrack: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.border + '60',
    flexDirection: 'row',
    overflow: 'hidden',
    marginHorizontal: spacing.xs,
  },
  barFill: {
    borderRadius: BAR_HEIGHT / 2,
  },
  barScore: {
    ...typography.caption,
    color: colors.text.secondary,
    width: 36,
    textAlign: 'right',
    fontWeight: '600',
    flexShrink: 0,
  },
  leaderStar: {
    fontSize: 12,
    marginLeft: spacing.xs,
    flexShrink: 0,
  },

  // Table
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    marginBottom: 2,
  },
  tableNameCell: {
    width: NAME_CELL_W,
    paddingHorizontal: spacing.xs,
  },
  tableNameInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  tableNameText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  tableRoundCell: {
    width: ROUND_CELL_W,
    alignItems: 'center',
  },
  tableTotalCell: {
    width: TOTAL_CELL_W,
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  tableHeaderText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    textAlign: 'center',
  },
  tableCellText: {
    ...typography.caption,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 18,
  },
  tableTotalText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  roundWonStar: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 11,
  },
  leaderBadge: {
    ...typography.tiny,
    fontWeight: '600',
  },

  emptyText: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
});
