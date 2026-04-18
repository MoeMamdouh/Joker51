import { Card, Rank, RANK_ORDER, Suit } from './types';
import { isAceHigh } from './validation';

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

  const aceHigh = isAceHigh(naturals, jokerCount);

  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const sorted = [...naturals].sort((a, b) => rankIdx(a.rank as Rank) - rankIdx(b.rank as Rank));

  if (jokerCount === 0) return sorted;

  // Preserve leading Jokers (before first natural in original order) and
  // trailing Jokers (after last natural). This keeps the intended rank of a
  // boundary Joker: [Joker, Q, K] stays [Joker, Q, K] (Joker = J), while
  // [Q, K, Joker] stays [Q, K, Joker] (Joker = A).
  let leadingCount = 0;
  for (const card of cards) {
    if (card.isJoker) leadingCount++;
    else break;
  }
  let trailingCount = 0;
  for (let i = cards.length - 1; i >= 0; i--) {
    if (cards[i].isJoker) trailingCount++;
    else break;
  }
  // Jokers sandwiched between naturals fill internal gaps
  const internalCount = jokerCount - leadingCount - trailingCount;

  const minIdx = rankIdx(sorted[0].rank as Rank);
  const maxIdx = rankIdx(sorted[sorted.length - 1].rank as Rank);
  const naturalSet = new Set(sorted.map(card => rankIdx(card.rank as Rank)));

  const internalGapCount = (maxIdx - minIdx + 1) - naturals.length;
  // Use as many internal Jokers as there are gaps; any leftovers fall to trailing
  const internalJokers = Math.min(Math.max(internalCount, 0), internalGapCount);

  const jokerCard = (): Card => ({ rank: null, suit: null, isJoker: true });
  const result: Card[] = Array.from({ length: leadingCount }, jokerCard);

  let natPtr = 0;
  let gapFilled = 0;
  for (let slot = minIdx; slot <= maxIdx; slot++) {
    if (naturalSet.has(slot)) {
      result.push(sorted[natPtr++]);
    } else if (gapFilled < internalJokers) {
      result.push(jokerCard());
      gapFilled++;
    }
  }

  // Trailing Jokers (explicit + any internal that had no gap to fill)
  const explicitTrailing = trailingCount;
  const overflow = Math.max(internalCount - gapFilled, 0);
  for (let i = 0; i < explicitTrailing + overflow; i++) {
    result.push(jokerCard());
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
