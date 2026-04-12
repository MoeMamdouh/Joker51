import { Card, Combination, EngineErrorCode, Rank, RANK_ORDER, RANK_POINTS, Suit } from './types';

const ALL_SUITS: Suit[] = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the Card[] the player must provide to claim the Joker in `combination`,
 * or null if: no Joker present, player doesn't hold all required cards, or claim impossible.
 *
 * Sequences: 1 card (the card at the Joker's position).
 * Sets with 3 natural cards: 1 card (the one missing suit).
 * Sets with 2 natural cards: 2 cards (both missing suits).
 */
export function getClaimableJokerCards(
  combination: Combination,
  playerHand: readonly Card[]
): Card[] | null {
  const jokerIndex = combination.cards.findIndex(c => c.isJoker);
  if (jokerIndex === -1) return null;

  const nonJokers = combination.cards.filter(c => !c.isJoker) as Card[];

  if (combination.type === 'set') {
    const rank = nonJokers[0]?.rank;
    if (!rank) return null;
    const presentSuits = new Set(nonJokers.map(c => c.suit));
    const missingSuits = ALL_SUITS.filter(s => !presentSuits.has(s));
    const needed: Card[] = missingSuits.map(s => ({ rank, suit: s, isJoker: false }));
    for (const card of needed) {
      if (!playerHand.some(h => !h.isJoker && h.rank === card.rank && h.suit === card.suit)) {
        return null;
      }
    }
    return needed;
  }

  // Sequence: determine the card the Joker represents by its position
  const suit = nonJokers[0]?.suit;
  if (!suit) return null;

  // Collect all rank indices occupied by non-Jokers
  const aceHigh = nonJokers.some(c => c.rank === Rank.ACE) && nonJokers.some(c => c.rank === Rank.KING);
  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const naturalIndices = nonJokers.map(c => rankIdx(c.rank as Rank)).sort((a, b) => a - b);
  const min = naturalIndices[0];
  const max = naturalIndices[naturalIndices.length - 1];
  const naturalSet = new Set(naturalIndices);
  const gapRanks: Rank[] = [];
  for (let r = min; r <= max; r++) {
    if (!naturalSet.has(r)) gapRanks.push(RANK_ORDER[r]);
  }

  // Map Joker (by its position among all jokers) to its gap rank
  const jokerPositions = combination.cards.reduce<number[]>((acc, c, i) => {
    if (c.isJoker) acc.push(i);
    return acc;
  }, []);
  const jokerPosInList = jokerPositions.indexOf(jokerIndex);
  const assignedRank = gapRanks[jokerPosInList];
  if (!assignedRank) return null;

  const needed: Card = { rank: assignedRank, suit, isJoker: false };
  if (!playerHand.some(h => !h.isJoker && h.rank === needed.rank && h.suit === needed.suit)) {
    return null;
  }
  return [needed];
}

export function validateCombination(
  cards: Card[],
  context: { isInitialMeld: boolean }
): { valid: boolean; error?: EngineErrorCode } {
  if (cards.length < 3) return { valid: false, error: 'COMBINATION_TOO_SHORT' };

  const jokerCount = cards.filter(c => c.isJoker).length;
  if (context.isInitialMeld && jokerCount > 1) {
    return { valid: false, error: 'JOKER_LIMIT_EXCEEDED' };
  }

  const nonJokers = cards.filter(c => !c.isJoker);

  // Determine primary type: if all non-Joker cards share a rank → try set first
  const allSameRank = nonJokers.length > 0 && nonJokers.every(c => c.rank === nonJokers[0].rank);

  if (allSameRank) {
    const setResult = validateAsSet(cards);
    if (setResult.valid) return setResult;
    // Try sequence only if the set attempt found it might work differently
    return setResult;
  }

  // Otherwise try sequence first
  const seqResult = validateAsSequence(cards);
  if (seqResult.valid) return seqResult;

  // If sequence failed and cards look like a set (mixed but same rank possible with jokers), try set
  const setResult = validateAsSet(cards);
  if (setResult.valid) return setResult;

  return seqResult;
}

export function calculateMeldPoints(combinations: Card[][]): number {
  return combinations.reduce((total, combo) => total + comboPoints(combo), 0);
}

export function isFullSet(combination: Combination): boolean {
  const nonJokers = combination.cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return false;
  const rank = nonJokers[0].rank;
  const suits = new Set(nonJokers.filter(c => !c.isJoker).map(c => c.suit));
  return (
    combination.cards.length === 4 &&
    nonJokers.every(c => c.rank === rank) &&
    suits.size === 4
  );
}

export function isFullSequence(combination: Combination): boolean {
  const nonJokers = combination.cards.filter(c => !c.isJoker);
  if (combination.cards.length !== 13) return false;
  const suit = nonJokers[0]?.suit;
  const ranks = new Set(nonJokers.map(c => c.rank));
  return nonJokers.every(c => c.suit === suit) && ranks.size === 13;
}

// ─── Sequence validation ──────────────────────────────────────────────────────

function validateAsSequence(cards: Card[]): { valid: boolean; error?: EngineErrorCode } {
  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return { valid: true };

  const suit = nonJokers[0].suit as Suit;
  if (nonJokers.some(c => c.suit !== suit)) {
    return { valid: false, error: 'SEQUENCE_MIXED_SUITS' };
  }

  const jokerCount = cards.length - nonJokers.length;
  const hasAce = nonJokers.some(c => c.rank === Rank.ACE);
  const hasKing = nonJokers.some(c => c.rank === Rank.KING);

  // Ace + King together with any rank in the middle (TWO–QUEEN) = wraparound
  if (hasAce && hasKing) {
    const hasMiddleRank = nonJokers.some(c => {
      const idx = RANK_ORDER.indexOf(c.rank as Rank);
      return idx >= 1 && idx <= 10; // TWO(1) through QUEEN(11)... wait QUEEN is 11
      // Actually: TWO=1, THREE=2, ..., TEN=9, JACK=10, QUEEN=11, KING=12
    });
    if (hasMiddleRank) {
      return { valid: false, error: 'ACE_WRAPAROUND' };
    }
  }

  // Remap Ace to 13 when it appears alongside KING (Ace-high position)
  const aceHigh = hasAce && hasKing;
  const rankIndex = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const rankIndices = nonJokers.map(c => rankIndex(c.rank as Rank)).sort((a, b) => a - b);

  // No duplicate ranks
  if (new Set(rankIndices).size !== nonJokers.length) {
    return { valid: false, error: 'SEQUENCE_NOT_CONSECUTIVE' };
  }

  const span = rankIndices[rankIndices.length - 1] - rankIndices[0];
  const gaps = span - (nonJokers.length - 1);

  if (gaps < 0 || gaps > jokerCount) {
    return { valid: false, error: 'SEQUENCE_NOT_CONSECUTIVE' };
  }

  return { valid: true };
}

// ─── Set validation ───────────────────────────────────────────────────────────

function validateAsSet(cards: Card[]): { valid: boolean; error?: EngineErrorCode } {
  if (cards.length > 4) return { valid: false, error: 'SET_TOO_LONG' };

  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return { valid: true };

  const rank = nonJokers[0].rank;
  if (nonJokers.some(c => c.rank !== rank)) {
    return { valid: false, error: 'INVALID_COMBINATION' };
  }

  const suits = nonJokers.map(c => c.suit);
  if (new Set(suits).size !== nonJokers.length) {
    return { valid: false, error: 'SET_DUPLICATE_SUIT' };
  }

  return { valid: true };
}

// ─── Point calculation ────────────────────────────────────────────────────────

function comboPoints(cards: Card[]): number {
  return cards.reduce((sum, card, index) => {
    if (!card.isJoker) return sum + RANK_POINTS[card.rank as Rank];
    return sum + jokerSubstitutedValue(cards, index);
  }, 0);
}

export function jokerSubstitutedValue(cards: Card[], jokerIndex: number): number {
  const nonJokers = cards.filter(c => !c.isJoker);
  if (nonJokers.length === 0) return 0;

  const rankIndices = nonJokers.map(c => RANK_ORDER.indexOf(c.rank as Rank)).sort((a, b) => a - b);
  const min = rankIndices[0];
  const max = rankIndices[rankIndices.length - 1];

  // Find gap rank indices (positions not occupied by non-Joker cards)
  const gapRanks: number[] = [];
  for (let r = min; r <= max; r++) {
    if (!rankIndices.includes(r)) gapRanks.push(r);
  }

  // Map which gap this joker fills based on its position among all Jokers
  const jokerPositions = cards.reduce<number[]>((acc, c, i) => {
    if (c.isJoker) acc.push(i);
    return acc;
  }, []);

  const jokerPositionInList = jokerPositions.indexOf(jokerIndex);
  const assignedRankIdx = gapRanks[jokerPositionInList] ?? min;
  return RANK_POINTS[RANK_ORDER[assignedRankIdx]] ?? 0;
}
