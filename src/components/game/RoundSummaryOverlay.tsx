import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { useLanguageStore } from '../../store/languageStore';
import { formatNumber } from '../../i18n/formatNumber';
import { RoundResult } from '../../engine/types';

// ─── Player colour palette (assigned by player order) ─────────────────────────

export const PLAYER_COLORS = ['#E8B84B', '#4ECDC4', '#FF6B6B', '#A78BFA'];

export function getPlayerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlayerScore {
  playerId: string;
  name: string;
  score: number; // cumulative penalty (lower = better)
}

interface RoundScore {
  playerId: string;
  penalty: number;
}

interface PlayerInfo {
  playerId: string;
  name: string;
}

interface RoundSummaryOverlayProps {
  currentRound: number;
  totalRounds: number;
  players: PlayerInfo[];
  cumulativeScores: PlayerScore[];
  roundWinnerIds: string[];
  latestRoundScores: readonly RoundScore[];
  roundResults: readonly RoundResult[];
  isGameOver: boolean;
  onNextRound(): void;
  onNewGame(): void;
  onPlayAgain(): void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RoundSummaryOverlay({
  currentRound,
  totalRounds,
  players,
  cumulativeScores,
  roundWinnerIds,
  latestRoundScores,
  roundResults,
  isGameOver,
  onNextRound,
  onNewGame,
  onPlayAgain,
}: RoundSummaryOverlayProps) {
  const { t } = useTranslation();
  const locale = useLanguageStore(s => s.locale);

  // Sort standings ascending (lowest penalty = winner on top)
  const sortedStandings = [...cumulativeScores].sort((a, b) => a.score - b.score);
  const maxTotal = Math.max(...cumulativeScores.map(p => p.score), 1);
  const leaderScore = sortedStandings[0]?.score ?? 0;

  // Sort this round's scores ascending
  const sortedRound = [...latestRoundScores].sort((a, b) => a.penalty - b.penalty);

  // Winner display names
  const roundWinnerNames = roundWinnerIds
    .map(id => players.find(p => p.playerId === id)?.name ?? id)
    .join(' & ');

  const gameWinnerName = isGameOver
    ? (players.find(p => p.playerId === sortedStandings[0]?.playerId)?.name ?? '')
    : '';

  return (
    <View style={styles.overlay}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {isGameOver ? t('game.roundSummary.gameOverTitle') : t('game.roundSummary.title', { round: currentRound })}
        </Text>

        <View style={styles.winnerBanner}>
          <Text style={styles.winnerBannerLabel}>
            {isGameOver
              ? t('game.roundSummary.champion')
              : roundWinnerIds.length > 1
                ? t('game.roundSummary.coWinners')
                : t('game.roundSummary.winner')}
          </Text>
          <Text style={styles.winnerBannerName}>
            {isGameOver ? gameWinnerName : roundWinnerNames}
          </Text>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* This Round */}
        <Text style={styles.sectionLabel}>{t('game.roundSummary.thisRound')}</Text>
        <View style={styles.card}>
          {sortedRound.map((rs, i) => {
            const pIdx = players.findIndex(p => p.playerId === rs.playerId);
            const pName = players[pIdx]?.name ?? rs.playerId;
            const color = getPlayerColor(pIdx);
            const isWinner = roundWinnerIds.includes(rs.playerId);
            return (
              <View key={rs.playerId} style={[styles.roundRow, i > 0 && styles.rowDivider]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text
                  style={[styles.rowName, isWinner && { color }]}
                  numberOfLines={1}
                >
                  {pName}
                </Text>
                {isWinner && (
                  <View style={[styles.winnerPill, { backgroundColor: color + '28', borderColor: color }]}>
                    <Text style={[styles.winnerPillText, { color }]}>✓</Text>
                  </View>
                )}
                <View style={styles.spacer} />
                <Text style={[styles.penaltyValue, isWinner && { color }]}>
                  {rs.penalty === 0
                    ? `0 ${t('game.roundSummary.pts')}`
                    : `+${formatNumber(rs.penalty, locale)} ${t('game.roundSummary.pts')}`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Standings bar chart */}
        <Text style={[styles.sectionLabel, styles.sectionGap]}>{t('game.roundSummary.standings')}</Text>
        <View style={styles.card}>
          {sortedStandings.map((player, i) => {
            const pIdx = players.findIndex(p => p.playerId === player.playerId);
            const color = getPlayerColor(pIdx);
            const isLeader = player.score === leaderScore;
            const ratio = Math.max(player.score / maxTotal, 0.02);
            return (
              <View key={player.playerId} style={[styles.barRow, i > 0 && styles.rowDivider]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text
                  style={[styles.barName, isLeader && { color }]}
                  numberOfLines={1}
                >
                  {player.name}
                </Text>
                {/* Bar */}
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        flex: ratio,
                        backgroundColor: isLeader ? color : color + '70',
                      },
                    ]}
                  />
                  <View style={{ flex: 1 - ratio }} />
                </View>
                <Text style={[styles.barScore, isLeader && { color }]}>
                  {formatNumber(player.score, locale)}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Round history */}
        {roundResults.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionGap]}>
              {t('game.roundSummary.history')}
            </Text>
            <View style={styles.card}>
              <View style={styles.historyRow}>
                {Array.from({ length: totalRounds }, (_, i) => {
                  const result = roundResults.find(r => r.roundNumber === i + 1);
                  if (!result) {
                    return (
                      <View key={i} style={styles.historyDot}>
                        <View style={[styles.historyCircle, { backgroundColor: colors.border }]} />
                        <Text style={styles.historyNum}>{i + 1}</Text>
                      </View>
                    );
                  }
                  const winnerIdx = players.findIndex(p => p.playerId === result.winnerId);
                  const color = getPlayerColor(winnerIdx);
                  return (
                    <View key={i} style={styles.historyDot}>
                      <View style={[styles.historyCircle, { backgroundColor: color }]} />
                      <Text style={[styles.historyNum, { color }]}>{i + 1}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Colour legend */}
              <View style={styles.legend}>
                {players.map((p, idx) => (
                  <View key={p.playerId} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: getPlayerColor(idx) }]} />
                    <Text style={styles.legendText} numberOfLines={1}>{p.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        {!isGameOver && (
          <ActionButton
            label={t('game.roundSummary.nextRound')}
            onPress={onNextRound}
            primary
            testID="btn-next-round"
          />
        )}
        {isGameOver && (
          <>
            <ActionButton
              label={t('game.roundSummary.playAgain')}
              onPress={onPlayAgain}
              primary
              testID="btn-play-again"
            />
            <ActionButton
              label={t('game.roundSummary.gameOver')}
              onPress={onNewGame}
              testID="btn-game-over"
            />
          </>
        )}
      </View>
    </View>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

function ActionButton({
  label,
  onPress,
  primary = false,
  testID,
}: {
  label: string;
  onPress(): void;
  primary?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      style={[styles.button, primary ? styles.primaryButton : styles.secondaryButton]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={[styles.buttonText, !primary && styles.secondaryButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const DOT_SIZE = 10;
const HISTORY_CIRCLE = 26;
const BAR_HEIGHT = 10;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 200,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  winnerBanner: {
    alignItems: 'center',
    backgroundColor: colors.accent + '1A',
    borderWidth: 1,
    borderColor: colors.accent + '55',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  winnerBannerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  winnerBannerName: {
    ...typography.label,
    color: colors.accent,
    fontWeight: '700',
    fontSize: 18,
    marginTop: 2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },

  // Section labels
  sectionLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  sectionGap: {
    marginTop: spacing.md,
  },

  // Cards (section containers)
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },

  // Shared row elements
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginRight: spacing.sm,
    flexShrink: 0,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border + '66',
  },
  spacer: {
    flex: 1,
  },

  // This-round rows
  roundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  rowName: {
    ...typography.label,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.xs,
  },
  winnerPill: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    flexShrink: 0,
  },
  winnerPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  penaltyValue: {
    ...typography.label,
    color: colors.text.secondary,
    textAlign: 'right',
    flexShrink: 0,
  },

  // Bar chart rows
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  barName: {
    ...typography.caption,
    color: colors.text.primary,
    width: 72,
    flexShrink: 0,
  },
  barTrack: {
    flex: 1,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    backgroundColor: colors.border + '50',
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
    flexShrink: 0,
    fontWeight: '600',
  },

  // Round history
  historyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  historyDot: {
    alignItems: 'center',
    gap: 3,
  },
  historyCircle: {
    width: HISTORY_CIRCLE,
    height: HISTORY_CIRCLE,
    borderRadius: HISTORY_CIRCLE / 2,
  },
  historyNum: {
    ...typography.tiny,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border + '66',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    ...typography.tiny,
    color: colors.text.secondary,
    maxWidth: 80,
  },

  // Action buttons
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  button: {
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    ...typography.label,
    color: colors.background,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
});
