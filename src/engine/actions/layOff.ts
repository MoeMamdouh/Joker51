import { ActionResult, Card, GameState, Rank, RANK_ORDER, TurnPhase } from '../types';
import { validateCombination } from '../validation';
import { sortCombinationCards } from '../sort';

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

/**
 * Determines the correct position ('start' | 'end') for a lay-off card on a sequence.
 * Uses the natural boundary ranks (ignoring Jokers) to decide:
 *   - card rank === minNaturalRank - 1  →  'start'
 *   - card rank === maxNaturalRank + 1  →  'end'
 *   - both valid (rare edge case)       →  'end' (default)
 *   - neither valid                     →  null (reject)
 */
function detectLayOffPosition(
  combination: readonly Card[],
  card: Card
): 'start' | 'end' | null {
  if (card.isJoker) return 'end';

  const naturals = combination.filter(c => !c.isJoker);
  if (naturals.length === 0) return 'end';

  const hasAce = naturals.some(c => c.rank === Rank.ACE);
  const hasKing = naturals.some(c => c.rank === Rank.KING);
  const aceHigh = hasAce && hasKing;

  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const indices = naturals.map(c => rankIdx(c.rank as Rank)).sort((a, b) => a - b);
  const minIdx = indices[0];
  const maxIdx = indices[indices.length - 1];
  const cardIdx = rankIdx(card.rank as Rank);

  const fitsStart = cardIdx === minIdx - 1;
  const fitsEnd = cardIdx === maxIdx + 1;

  if (fitsEnd) return 'end';   // prefer end when both valid
  if (fitsStart) return 'start';
  return null;
}

export function layOff(
  state: GameState,
  params: { playerId: string; combinationId: string; card: Card }
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

  const { playerId, combinationId, card } = params;
  const hand = state.hands.find(h => h.playerId === playerId)!.cards;

  if (!hasCard(hand, card)) return { success: false, error: 'CARD_NOT_IN_HAND' };

  const comboIndex = state.tableState.combinations.findIndex(c => c.id === combinationId);
  if (comboIndex === -1) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  const combination = state.tableState.combinations[comboIndex];

  // For sequences: auto-detect position; for sets: append is irrelevant (validateCombination handles it)
  let newCards: Card[];
  if (combination.type === 'sequence') {
    const position = detectLayOffPosition(combination.cards, card);
    if (position === null) return { success: false, error: 'INVALID_COMBINATION' };
    newCards = position === 'start'
      ? [card, ...combination.cards]
      : [...combination.cards, card];
  } else {
    newCards = [...combination.cards, card];
  }

  const vr = validateCombination([...newCards], { isInitialMeld: false });
  if (!vr.valid) return { success: false, error: 'INVALID_COMBINATION' };

  const sortedCards = sortCombinationCards(newCards, combination.type);
  const updatedCombinations = [...state.tableState.combinations];
  updatedCombinations[comboIndex] = { ...combination, cards: sortedCards };

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
