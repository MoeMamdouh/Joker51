import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useGameStore } from '../store/gameStore';
import { useGameActions } from '../hooks/useGameActions';
import { useCardSelection } from '../hooks/useCardSelection';
import { DrawPile } from '../components/game/DrawPile';
import { DiscardPile } from '../components/game/DiscardPile';
import { HandArea } from '../components/game/HandArea';
import { PlayerBadge } from '../components/game/PlayerBadge';
import { ScoreboardRow } from '../components/game/ScoreboardRow';
import { HandOffOverlay } from '../components/game/HandOffOverlay';
import { TableArea } from '../components/game/TableArea';
import { ActionBar } from '../components/game/ActionBar';
import { RoundSummaryOverlay } from '../components/game/RoundSummaryOverlay';
import { colors, spacing, typography, radii } from '../theme/tokens';
import { Combination, GameStatus, TurnPhase } from '../engine/types';

export function GameBoardScreen() {
  const { t } = useTranslation();
  const game = useGameStore(s => s.currentGame);
  const clearGame = useGameStore(s => s.clearGame);
  const actions = useGameActions();
  const { selectedCards, toggleCard, clearSelection } = useCardSelection();

  const [pendingHandOff, setPendingHandOff] = useState(false);
  const [nextPlayerName, setNextPlayerName] = useState('');
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showError(msg: string) {
    if (errorTimer.current) clearTimeout(errorTimer.current);
    setErrorMessage(msg);
    errorTimer.current = setTimeout(() => setErrorMessage(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (errorTimer.current) clearTimeout(errorTimer.current);
    };
  }, []);

  if (!game) return null;

  const {
    config,
    turnState,
    hands,
    drawPile,
    discardPile,
    tableState,
    meldedPlayerIds,
    roundResults,
    status,
    currentRound,
  } = game;

  const activePlayerId = turnState.activePlayerId;
  const activeHand = hands.find(h => h.playerId === activePlayerId);
  const activeCards = activeHand ? [...activeHand.cards] : [];
  const discardTop = discardPile.cards.length > 0 ? discardPile.cards[0] : null;
  const hasMelded = meldedPlayerIds.includes(activePlayerId);
  const isDrawing = turnState.phase === TurnPhase.DRAWING;

  const playerList = config.players.map(p => ({ playerId: p.id, name: p.name }));
  const opponentPlayers = playerList.filter(p => p.playerId !== activePlayerId);

  // Joker claim: check if active player holds a replacement card for any combo's joker
  function canClaimJokerForCombination(combination: Combination): boolean {
    if (!hasMelded) return false;
    return combination.cards.some(c => c.isJoker);
  }

  const canClaimJoker = hasMelded &&
    tableState.combinations.some(canClaimJokerForCombination);

  // Cumulative scores
  function getCumulativeScore(playerId: string): number {
    return roundResults.reduce((total, round) => {
      const entry = round.scores.find(s => s.playerId === playerId);
      return total + (entry ? entry.penalty : 0);
    }, 0);
  }

  const cumulativeScores = config.players.map(p => ({
    playerId: p.id,
    name: p.name,
    score: getCumulativeScore(p.id),
  }));

  // Round winners: all players sharing the minimum penalty in the latest round
  const latestRound = roundResults[roundResults.length - 1];
  const roundWinnerIds: string[] = (() => {
    if (!latestRound) return [];
    const minPenalty = Math.min(...latestRound.scores.map(s => s.penalty));
    return latestRound.scores.filter(s => s.penalty === minPenalty).map(s => s.playerId);
  })();

  const isGameOver = status === GameStatus.GAME_OVER;

  function deriveNextPlayerName(): string {
    const playerIds = config.players.map(p => p.id);
    const nextId = playerIds[(playerIds.indexOf(activePlayerId) + 1) % playerIds.length];
    return config.players.find(p => p.id === nextId)?.name ?? '';
  }

  function handleDrawFromPile() {
    const result = actions.drawFromPile();
    if (result.error) showError(result.error);
  }

  function handlePickUpDiscard() {
    const result = actions.pickUpDiscardTop();
    if (result.error) showError(result.error);
  }

  function handleMeld() {
    const result = actions.placeMeld(selectedCards);
    if (result.error) showError(result.error);
    else clearSelection();
  }

  function handleDiscard() {
    if (selectedCards.length === 0) return;
    const result = actions.discardCard(selectedCards[0]);
    if (result.error) {
      showError(result.error);
    } else {
      clearSelection();
      const updatedGame = useGameStore.getState().currentGame;
      if (
        updatedGame?.status === GameStatus.ROUND_ENDED ||
        updatedGame?.status === GameStatus.GAME_OVER
      ) {
        setShowRoundSummary(true);
      } else {
        setNextPlayerName(deriveNextPlayerName());
        setPendingHandOff(true);
      }
    }
  }

  function handleLayOff(combinationId: string) {
    if (selectedCards.length === 0) return;
    const result = actions.layOffCard(selectedCards[0], combinationId);
    if (result.error) showError(result.error);
    else clearSelection();
  }

  function handleClaimJoker(combinationId: string) {
    if (selectedCards.length === 0) {
      showError(t('game.errors.cardNotInHand'));
      return;
    }
    const result = actions.claimJokerFromCombination(combinationId, selectedCards[0]);
    if (result.error) showError(result.error);
    else clearSelection();
  }

  function handleNextRound() {
    const result = actions.startNextRound();
    if (result.error) showError(result.error);
    else setShowRoundSummary(false);
  }

  function handleNewGame() {
    clearGame();
    router.replace('/');
  }

  function handlePlayAgain() {
    // Restart with same config — clearGame then navigate to setup
    clearGame();
    router.replace('/');
  }

  function handleHandOffConfirm() {
    setPendingHandOff(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Scoreboard */}
      <ScoreboardRow
        players={playerList}
        roundResults={roundResults}
        activePlayerId={activePlayerId}
      />

      {/* Opponent badges */}
      <View style={styles.opponents}>
        {opponentPlayers.map(player => (
          <PlayerBadge
            key={player.playerId}
            name={player.name}
            cardCount={hands.find(h => h.playerId === player.playerId)?.cards.length ?? 0}
            isActive={false}
          />
        ))}
      </View>

      {/* Piles */}
      <View style={styles.piles}>
        <DrawPile
          cardCount={drawPile.cards.length}
          onPress={isDrawing ? handleDrawFromPile : undefined}
        />
        <DiscardPile
          topCard={discardTop}
          onPress={isDrawing ? handlePickUpDiscard : undefined}
        />
      </View>

      {/* Table combinations */}
      <TableArea
        combinations={tableState.combinations}
        players={playerList}
        canLayOff={hasMelded && !isDrawing}
        onCombinationPress={handleLayOff}
        canClaimJokerForCombination={canClaimJokerForCombination}
        onClaimJoker={handleClaimJoker}
      />

      {/* Error banner */}
      {errorMessage !== null && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {/* Action bar */}
      <ActionBar
        phase={turnState.phase}
        hasMelded={hasMelded}
        hasSelectedCards={selectedCards.length > 0}
        canClaimJoker={canClaimJoker}
        onMeld={handleMeld}
        onDiscard={handleDiscard}
        onLayOff={() => {
          // lay-off is triggered by tapping a combination row in TableArea
        }}
        onClaimJoker={() => {
          // claim joker is triggered by tapping the claim badge in CombinationRow
        }}
      />

      {/* Active player's hand */}
      <View style={styles.handContainer}>
        <PlayerBadge
          name={config.players.find(p => p.id === activePlayerId)?.name ?? ''}
          cardCount={activeCards.length}
          isActive
        />
        <HandArea
          cards={activeCards}
          selectedCards={selectedCards}
          onCardPress={toggleCard}
        />
      </View>

      {/* Overlays */}
      {pendingHandOff && (
        <HandOffOverlay
          nextPlayerName={nextPlayerName}
          onConfirm={handleHandOffConfirm}
        />
      )}

      {showRoundSummary && (
        <RoundSummaryOverlay
          currentRound={currentRound}
          cumulativeScores={cumulativeScores}
          roundWinnerIds={roundWinnerIds}
          latestRoundScores={latestRound?.scores ?? []}
          isGameOver={isGameOver}
          onNextRound={handleNextRound}
          onNewGame={handleNewGame}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  opponents: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  piles: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.lg,
  },
  handContainer: {
    paddingBottom: spacing.md,
  },
  errorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.error,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    ...typography.label,
    color: colors.card.face,
    textAlign: 'center',
  },
});
