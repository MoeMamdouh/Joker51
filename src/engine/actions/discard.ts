import { ActionResult, Card, GameState, GameStatus, TurnPhase } from '../types';
import { calculateRoundScores } from '../scoring';
import { createDeck, deckCountForPlayers, shuffle } from '../deck';
import { dealCards } from '../deal';

function hasCard(hand: readonly Card[], card: Card): boolean {
  return hand.some(c =>
    c.isJoker === card.isJoker && c.rank === card.rank && c.suit === card.suit
  );
}

function removeCard(cards: readonly Card[], card: Card): Card[] {
  const result = [...cards];
  const idx = result.findIndex(
    c => c.isJoker === card.isJoker && c.rank === card.rank && c.suit === card.suit
  );
  if (idx !== -1) result.splice(idx, 1);
  return result;
}

export function discard(
  state: GameState,
  params: { playerId: string; card: Card }
): ActionResult {
  if (state.turnState.activePlayerId !== params.playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.ACTING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }

  const { playerId, card } = params;
  const hand = state.hands.find(h => h.playerId === playerId)!;

  if (!hasCard(hand.cards, card)) return { success: false, error: 'CARD_NOT_IN_HAND' };

  const newHandCards = removeCard(hand.cards, card);
  const hands = state.hands.map(h =>
    h.playerId === playerId ? { ...h, cards: newHandCards } : h
  );
  const discardPile = { cards: [card, ...state.discardPile.cards] };

  // Win condition: hand is now empty
  if (newHandCards.length === 0) {
    const roundResult = calculateRoundScores({ ...state, hands }, playerId);
    const roundResults = [...state.roundResults, roundResult];
    const isLastRound = state.currentRound >= state.config.totalRounds;

    return {
      success: true,
      state: {
        ...state,
        hands,
        discardPile,
        roundResults,
        status: isLastRound ? GameStatus.GAME_OVER : GameStatus.ROUND_ENDED,
      },
    };
  }

  // Normal discard: advance to next player
  const playerIds = state.config.players.map(p => p.id);
  const currentIndex = playerIds.indexOf(playerId);
  const nextId = playerIds[(currentIndex + 1) % playerIds.length];

  return {
    success: true,
    state: {
      ...state,
      hands,
      discardPile,
      turnState: { activePlayerId: nextId, phase: TurnPhase.DRAWING, discardDrawnBeforeMeld: null },
    },
  };
}

export function startNextRound(state: GameState): GameState {
  if (state.status !== GameStatus.ROUND_ENDED) {
    throw new Error(`Cannot start next round: status is "${state.status}"`);
  }
  if (state.currentRound >= state.config.totalRounds) {
    throw new Error('Cannot start next round: all rounds complete');
  }

  const playerCount = state.config.players.length;
  const deckCount = deckCountForPlayers(playerCount);
  const deck = shuffle(createDeck(deckCount), state.config.random);
  const { hands: rawHands, drawPile, discardPile } = dealCards(deck, playerCount);
  const hands = rawHands.map((h, i) => ({
    playerId: state.config.players[i].id,
    cards: h.cards,
  }));

  const startIndex = Math.floor((state.config.random ?? Math.random)() * playerCount);

  return {
    ...state,
    status: GameStatus.IN_PROGRESS,
    currentRound: state.currentRound + 1,
    hands,
    drawPile,
    discardPile,
    tableState: { combinations: [] },
    meldedPlayerIds: [],
    turnState: {
      activePlayerId: state.config.players[startIndex].id,
      phase: TurnPhase.DRAWING,
      discardDrawnBeforeMeld: null,
    },
  };
}
