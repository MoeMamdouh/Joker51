import { Card, Rank, RANK_ORDER, Suit } from './types';

const SUIT_ORDER: Suit[] = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

/**
 * Returns a new array of cards sorted according to combination type:
 * - sequence: natural cards in ascending rank order (Ace contextually high after King);
 *   Jokers re-inserted at their structural gap positions.
 * - set: natural cards in fixed suit order (SPADES→HEARTS→DIAMONDS→CLUBS);
 *   Jokers re-inserted at the first missing suit slot.
 *
 * Pure function — does not mutate the input array.
 */
export function sortCombinationCards(cards: readonly Card[], type: 'sequence' | 'set'): Card[] {
  return type === 'sequence' ? sortSequence(cards) : sortSet(cards);
}

// ─── Sequence ─────────────────────────────────────────────────────────────────

function sortSequence(cards: readonly Card[]): Card[] {
  const naturals = cards.filter(card => !card.isJoker) as Card[];
  const jokerCount = cards.length - naturals.length;

  if (naturals.length === 0) return [...cards];

  const aceHigh = naturals.some(card => card.rank === Rank.ACE) &&
                  naturals.some(card => card.rank === Rank.KING);

  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const sorted = [...naturals].sort((a, b) => rankIdx(a.rank as Rank) - rankIdx(b.rank as Rank));

  if (jokerCount === 0) return sorted;

  // Identify internal gaps within the natural range
  const minIdx = rankIdx(sorted[0].rank as Rank);
  const maxIdx = rankIdx(sorted[sorted.length - 1].rank as Rank);
  const naturalSet = new Set(sorted.map(card => rankIdx(card.rank as Rank)));

  const internalGapCount = (maxIdx - minIdx + 1) - naturals.length;
  const internalJokers = Math.min(jokerCount, internalGapCount);
  const boundaryJokers = jokerCount - internalJokers;

  // Merge naturals and gap Jokers in slot order
  const result: Card[] = [];
  let natPtr = 0;
  let gapFilled = 0;

  for (let slot = minIdx; slot <= maxIdx; slot++) {
    if (naturalSet.has(slot)) {
      result.push(sorted[natPtr++]);
    } else if (gapFilled < internalJokers) {
      result.push({ rank: null, suit: null, isJoker: true });
      gapFilled++;
    }
  }

  // Append boundary Jokers at the end
  for (let i = 0; i < boundaryJokers; i++) {
    result.push({ rank: null, suit: null, isJoker: true });
  }

  return result;
}

// ─── Set ──────────────────────────────────────────────────────────────────────

function sortSet(cards: readonly Card[]): Card[] {
  const naturals = cards.filter(card => !card.isJoker) as Card[];
  const jokerCount = cards.length - naturals.length;

  if (jokerCount === 0) {
    return [...naturals].sort(
      (a, b) => SUIT_ORDER.indexOf(a.suit as Suit) - SUIT_ORDER.indexOf(b.suit as Suit)
    );
  }

  const presentSuits = new Set(naturals.map(card => card.suit as Suit));
  const missingSuits = SUIT_ORDER.filter(s => !presentSuits.has(s));

  // Build result in fixed suit order, inserting Jokers at missing slots
  const result: Card[] = [];
  let jokerIdx = 0;

  for (const suit of SUIT_ORDER) {
    const natural = naturals.find(card => card.suit === suit);
    if (natural) {
      result.push(natural);
    } else if (jokerIdx < jokerCount) {
      result.push({ rank: null, suit: null, isJoker: true });
      jokerIdx++;
    }
  }

  return result;
}
