import { ActionResult, Card, GameState, TurnPhase } from '../types';
import { validateCombination } from '../validation';

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

export function claimJoker(
  state: GameState,
  params: { playerId: string; combinationId: string; realCard: Card }
): ActionResult {
  const { playerId, combinationId, realCard } = params;

  if (state.turnState.activePlayerId !== playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.ACTING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }
  if (!state.meldedPlayerIds.includes(playerId)) {
    return { success: false, error: 'PLAYER_NOT_YET_MELDED' };
  }

  const combo = state.tableState.combinations.find(c => c.id === combinationId);
  if (!combo) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  const jokerIndex = combo.cards.findIndex(c => c.isJoker);
  if (jokerIndex === -1) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  // After swap, combo count stays the same — check it won't drop below minimum
  if (combo.cards.length < 3) {
    return { success: false, error: 'JOKER_CLAIM_BREAKS_COMBINATION' };
  }

  // Validate that realCard correctly replaces the Joker (combo remains valid)
  const swappedCards = combo.cards.map((c, i) => (i === jokerIndex ? realCard : c)) as Card[];
  const vr = validateCombination(swappedCards, { isInitialMeld: false });
  if (!vr.valid) {
    return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };
  }

  // Verify player actually holds realCard
  const hand = state.hands.find(h => h.playerId === playerId)!.cards;
  if (!hasCard(hand, realCard)) {
    return { success: false, error: 'CARD_NOT_IN_HAND' };
  }

  const jokerCard: Card = { rank: null, suit: null, isJoker: true };

  const updatedCombinations = state.tableState.combinations.map(c =>
    c.id === combinationId ? { ...c, cards: swappedCards } : c
  );

  const updatedHand = [...removeCard(hand, realCard), jokerCard];

  return {
    success: true,
    state: {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === playerId ? { ...h, cards: updatedHand } : h
      ),
      tableState: { combinations: updatedCombinations },
    },
  };
}
