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

export function layOff(
  state: GameState,
  params: { playerId: string; combinationId: string; card: Card; position?: 'start' | 'end' }
): ActionResult {
  if (state.turnState.activePlayerId !== params.playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.ACTING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }
  if (!state.meldedPlayerIds.includes(params.playerId)) {
    return { success: false, error: 'PLAYER_NOT_YET_MELDED' };
  }

  const { playerId, combinationId, card, position = 'end' } = params;
  const hand = state.hands.find(h => h.playerId === playerId)!.cards;

  if (!hasCard(hand, card)) return { success: false, error: 'CARD_NOT_IN_HAND' };

  const comboIndex = state.tableState.combinations.findIndex(c => c.id === combinationId);
  if (comboIndex === -1) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  const combination = state.tableState.combinations[comboIndex];
  const newCards = position === 'start'
    ? [card, ...combination.cards]
    : [...combination.cards, card];

  const vr = validateCombination([...newCards], { isInitialMeld: false });
  if (!vr.valid) return { success: false, error: 'INVALID_COMBINATION' };

  const updatedCombinations = [...state.tableState.combinations];
  updatedCombinations[comboIndex] = { ...combination, cards: newCards };

  const hands = state.hands.map(h =>
    h.playerId === playerId ? { ...h, cards: removeCard(h.cards, card) } : h
  );

  return {
    success: true,
    state: {
      ...state,
      hands,
      tableState: { combinations: updatedCombinations },
    },
  };
}
