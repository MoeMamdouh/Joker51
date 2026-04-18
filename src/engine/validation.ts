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
/**
 * Returns the card-array index of the specific Joker the player can claim, or -1.
 * For sets, returns the index of the (only) Joker when the player holds all required cards.
 * For sequences, returns the index of the first Joker whose rank the player holds.
 */
export function getClaimableJokerIndex(
  combination: Combination,
  playerHand: readonly Card[]
): number {
  const nonJokers = combination.cards.filter(c => !c.isJoker) as Card[];

  if (combination.type === 'set') {
    const rank = nonJokers[0]?.rank;
    if (!rank) return -1;
    const presentSuits = new Set(nonJokers.map(c => c.suit));
    const missingSuits = ALL_SUITS.filter(s => !presentSuits.has(s));
    const needed: Card[] = missingSuits.map(s => ({ rank, suit: s, isJoker: false }));
    const canClaim = needed.every(card =>
      playerHand.some(h => !h.isJoker && h.rank === card.rank && h.suit === card.suit)
    );
    if (!canClaim) return -1;
    return combination.cards.findIndex(c => c.isJoker);
  }

  // Sequence: find which Joker position the player can replace
  const suit = nonJokers[0]?.suit;
  if (!suit) return -1;

  const aceHigh = nonJokers.some(c => c.rank === Rank.ACE) && nonJokers.some(c => c.rank === Rank.KING);
  const seqRankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  for (let jPos = 0; jPos < combination.cards.length; jPos++) {
    if (!combination.cards[jPos].isJoker) continue;
    let prevVIdx: number | null = null;
    let prevOffset = 0;
    for (let i = jPos - 1; i >= 0; i--) {
      if (!combination.cards[i].isJoker) {
        prevVIdx = seqRankIdx(combination.cards[i].rank as Rank);
        prevOffset = jPos - i;
        break;
      }
    }
    let nextVIdx: number | null = null;
    let nextOffset = 0;
    for (let i = jPos + 1; i < combination.cards.length; i++) {
      if (!combination.cards[i].isJoker) {
        nextVIdx = seqRankIdx(combination.cards[i].rank as Rank);
        nextOffset = i - jPos;
        break;
      }
    }
    let rankVIdx: number | null = null;
    if (prevVIdx !== null) rankVIdx = prevVIdx + prevOffset;
    else if (nextVIdx !== null) rankVIdx = nextVIdx - nextOffset;
    if (rankVIdx === null || rankVIdx < 0 || rankVIdx >= RANK_ORDER.length) continue;
    const jokerRank = RANK_ORDER[rankVIdx];
    if (!jokerRank) continue;
    const needed: Card = { rank: jokerRank, suit, isJoker: false };
    if (playerHand.some(h => !h.isJoker && h.rank === needed.rank && h.suit === needed.suit)) {
      return jPos;
    }
  }

  return -1;
}

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

  // Sequence: for each Joker in the combination, determine its rank by its position
  // relative to neighbouring natural cards, then check if the player holds that card.
  // This handles internal-gap Jokers, boundary Jokers, and multi-Joker sequences.
  const suit = nonJokers[0]?.suit;
  if (!suit) return null;

  const aceHigh = nonJokers.some(c => c.rank === Rank.ACE) && nonJokers.some(c => c.rank === Rank.KING);
  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  for (let jPos = 0; jPos < combination.cards.length; jPos++) {
    if (!combination.cards[jPos].isJoker) continue;

    // Determine rank at this Joker's position by anchoring off the nearest natural cards
    let prevVIdx: number | null = null;
    let prevOffset = 0;
    for (let i = jPos - 1; i >= 0; i--) {
      if (!combination.cards[i].isJoker) {
        prevVIdx = rankIdx(combination.cards[i].rank as Rank);
        prevOffset = jPos - i;
        break;
      }
    }
    let nextVIdx: number | null = null;
    let nextOffset = 0;
    for (let i = jPos + 1; i < combination.cards.length; i++) {
      if (!combination.cards[i].isJoker) {
        nextVIdx = rankIdx(combination.cards[i].rank as Rank);
        nextOffset = i - jPos;
        break;
      }
    }

    let rankVIdx: number | null = null;
    if (prevVIdx !== null) rankVIdx = prevVIdx + prevOffset;
    else if (nextVIdx !== null) rankVIdx = nextVIdx - nextOffset;

    if (rankVIdx === null || rankVIdx < 0 || rankVIdx >= RANK_ORDER.length) continue;
    const jokerRank = RANK_ORDER[rankVIdx];
    if (!jokerRank) continue;

    const needed: Card = { rank: jokerRank, suit, isJoker: false };
    if (playerHand.some(h => !h.isJoker && h.rank === needed.rank && h.suit === needed.suit)) {
      return [needed];
    }
  }

  return null;
}

export function validateCombination(
  cards: Card[],
  context: { isInitialMeld: boolean }
): { valid: boolean; error?: EngineErrorCode } {
  if (cards.length < 3) return { valid: false, error: 'COMBINATION_TOO_SHORT' };

  const jokerCount = cards.filter(c => c.isJoker).length;

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

  // Remap Ace to virtual index 13 when it appears alongside KING (Ace-high).
  // No explicit wraparound guard is needed: the span/gap check below already
  // rejects true wraparounds (e.g. K-A-2 has span=12, gaps=10, jokerCount=0 →
  // SEQUENCE_NOT_CONSECUTIVE) and correctly accepts long Ace-high runs like
  // 9-10-J-Q-K-A (gaps match joker count).
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
