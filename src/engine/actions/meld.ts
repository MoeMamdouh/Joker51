import { ActionResult, Card, Combination, GameState, TurnPhase } from '../types';
import { validateCombination, calculateMeldPoints } from '../validation';

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

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

export function placeInitialMeld(
  state: GameState,
  params: { playerId: string; combinations: Card[][] }
): ActionResult {
  if (state.turnState.activePlayerId !== params.playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.ACTING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }

  const { playerId, combinations } = params;

  // Validate each combination
  for (const combo of combinations) {
    const vr = validateCombination(combo, { isInitialMeld: true });
    if (!vr.valid) return { success: false, error: vr.error };
  }

  // Verify all cards are in hand
  let hand = state.hands.find(h => h.playerId === playerId)!.cards;
  for (const combo of combinations) {
    for (const card of combo) {
      if (!hasCard(hand, card)) return { success: false, error: 'CARD_NOT_IN_HAND' };
      hand = removeCard(hand, card);
    }
  }

  // Verify 51-point threshold
  const points = calculateMeldPoints(combinations);
  if (points < 51) return { success: false, error: 'MELD_BELOW_51_POINTS' };

  // Build new combinations and remove cards from hand
  let updatedHand = state.hands.find(h => h.playerId === playerId)!.cards as Card[];
  const newCombinations: Combination[] = combinations.map(cards => {
    cards.forEach(card => { updatedHand = removeCard(updatedHand, card); });
    return {
      id: uuid(),
      cards,
      type: isSetCombination(cards) ? 'set' : 'sequence',
      ownerId: playerId,
    };
  });

  const hands = state.hands.map(h =>
    h.playerId === playerId ? { ...h, cards: updatedHand } : h
  );

  return {
    success: true,
    state: {
      ...state,
      hands,
      tableState: { combinations: [...state.tableState.combinations, ...newCombinations] },
      meldedPlayerIds: [...state.meldedPlayerIds, playerId],
    },
  };
}

function isSetCombination(cards: Card[]): boolean {
  const nonJokers = cards.filter(c => !c.isJoker);
  return nonJokers.length > 0 && nonJokers.every(c => c.rank === nonJokers[0].rank);
}
