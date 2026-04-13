import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { useLanguageStore } from '../../store/languageStore';
import { formatNumber } from '../../i18n/formatNumber';

interface PlayerScore {
  playerId: string;
  name: string;
  score: number;
}

interface RoundScore {
  playerId: string;
  penalty: number;
}

interface RoundSummaryOverlayProps {
  currentRound: number;
  cumulativeScores: PlayerScore[];
  roundWinnerIds: string[];
  latestRoundScores: readonly RoundScore[];
  isGameOver: boolean;
  onNextRound(): void;
  onNewGame(): void;
  onPlayAgain(): void;
}

export function RoundSummaryOverlay({
  currentRound,
  cumulativeScores,
  roundWinnerIds,
  latestRoundScores,
  isGameOver,
  onNextRound,
  onNewGame,
  onPlayAgain,
}: RoundSummaryOverlayProps) {
  const { t } = useTranslation();
  const locale = useLanguageStore(s => s.locale);

  const winnerLabel = roundWinnerIds.length > 1
    ? t('game.roundSummary.coWinners')
    : t('game.roundSummary.winner');

  return (
    <View style={styles.overlay}>
      <Text style={styles.title}>
        {t('game.roundSummary.title', { round: currentRound })}
      </Text>

      <Text style={styles.sectionLabel}>{winnerLabel}</Text>

      <ScrollView style={styles.scoreList} contentContainerStyle={styles.scoreContent}>
        {cumulativeScores.map(player => {
          const isWinner = roundWinnerIds.includes(player.playerId);
          const latestPenalty = latestRoundScores.find(s => s.playerId === player.playerId)?.penalty ?? 0;
          return (
            <View
              key={player.playerId}
              style={[styles.scoreRow, isWinner && styles.winnerRow]}
            >
              <Text style={[styles.playerName, isWinner && styles.winnerText]}>
                {player.name}
              </Text>
              <Text style={[styles.penaltyText, isWinner && styles.winnerText]}>
                {t('game.roundSummary.penalty', { points: formatNumber(latestPenalty, locale) })}
              </Text>
              <Text style={[styles.totalText, isWinner && styles.winnerText]}>
                {t('game.score.label', { name: '', score: formatNumber(player.score, locale) }).trim()}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.actions}>
        {!isGameOver && (
          <SummaryButton label={t('game.roundSummary.nextRound')} onPress={onNextRound} primary testID="btn-next-round" />
        )}
        {isGameOver && (
          <>
            <SummaryButton label={t('game.roundSummary.playAgain')} onPress={onPlayAgain} primary testID="btn-play-again" />
            <SummaryButton label={t('game.roundSummary.gameOver')} onPress={onNewGame} testID="btn-game-over" />
          </>
        )}
      </View>
    </View>
  );
}

interface SummaryButtonProps {
  label: string;
  onPress(): void;
  primary?: boolean;
  testID?: string;
}

function SummaryButton({ label, onPress, primary = false, testID }: SummaryButtonProps) {
  return (
    <Pressable
      style={[styles.button, primary ? styles.primaryButton : styles.secondaryButton]}
      onPress={onPress}
      testID={testID}
    >
      <Text style={[styles.buttonText, !primary && styles.secondaryButtonText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
    zIndex: 200,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  sectionLabel: {
    ...typography.label,
    color: colors.text.secondary,
  },
  scoreList: {
    width: '100%',
    maxHeight: 240,
  },
  scoreContent: {
    gap: spacing.sm,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  winnerRow: {
    backgroundColor: colors.accent + '33',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  playerName: {
    ...typography.label,
    color: colors.text.primary,
    flex: 1,
  },
  penaltyText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
  totalText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  winnerText: {
    color: colors.accent,
  },
  actions: {
    gap: spacing.sm,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    width: '100%',
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
    color: colors.surface,
    fontWeight: '700',
  },
  secondaryButtonText: {
    color: colors.text.primary,
  },
});
