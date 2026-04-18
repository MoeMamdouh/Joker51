import { Card, Combination, Rank, RANK_ORDER, Suit } from '../../engine/types';
import { isAceHigh } from '../../engine/validation';
import { JokerSequenceOption } from './JokerPlacementSheet';

const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.HEARTS]: '♥',
  [Suit.DIAMONDS]: '♦',
  [Suit.SPADES]: '♠',
  [Suit.CLUBS]: '♣',
};

const RANK_LABELS: Record<Rank, string> = {
  [Rank.ACE]: 'A',
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
};

/**
 * Given a set of staged cards containing one or more Jokers and 2+ natural
 * sequence cards, returns all valid placements for those Jokers.
 *
 * Rules:
 * - All internal gaps (within the natural card span) MUST be filled by jokers.
 *   If there are more gaps than jokers, no valid placement exists → return [].
 * - Any extra jokers (beyond what fills gaps) extend the sequence at the
 *   boundaries. All possible below/above distributions are enumerated as
 *   separate options.
 * - Returns [] when no valid option exists (caller should reject the meld).
 * - Returns 1 item when exactly one arrangement is possible (auto-confirm).
 * - Returns >1 items when the user must choose a boundary extension.
 */
export function computeJokerSequenceOptions(stagedCards: Card[]): JokerSequenceOption[] {
  const jokers = stagedCards.filter(c => c.isJoker);
  const jokerCount = jokers.length;
  if (jokerCount === 0) return [];

  const naturals = stagedCards.filter(c => !c.isJoker);
  // Need at least 1 natural (for suit/rank context) and 3 total cards (minimum valid combination).
  // 1 natural + 2 jokers = 3 cards is valid; 1 natural + 1 joker = 2 cards is too short.
  if (naturals.length < 1 || stagedCards.length < 3) return [];

  // All natural cards must share the same suit
  const suit = naturals[0].suit;
  if (!suit || naturals.some(c => c.suit !== suit)) return [];

  // Ace is contextually high when it can follow King (natural or Joker-represented).
  // isAceHigh detects this even when King's position is filled by a Joker.
  const aceHigh = isAceHigh(naturals, jokerCount);
  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const naturalRankIndices = naturals
    .filter(c => c.rank !== null)
    .map(c => rankIdx(c.rank!))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  if (naturalRankIndices.length === 0) return [];

  const min = naturalRankIndices[0];
  const max = naturalRankIndices[naturalRankIndices.length - 1];
  const naturalSet = new Set(naturalRankIndices);
  const sortedNaturals = [...naturals].sort((a, b) => rankIdx(a.rank!) - rankIdx(b.rank!));

  // Upper bound for rank indices: Ace (virtual 13) can always extend above King.
  // Allow endIdx=13 when the sequence's natural max, or natural max + Jokers, reaches King.
  const kingIdx = RANK_ORDER.indexOf(Rank.KING);
  const canExtendToAce = max >= kingIdx || max + jokerCount > kingIdx;
  const maxRankBound = aceHigh ? 13 : (canExtendToAce ? 13 : RANK_ORDER.length - 1);

  // All gaps strictly between min and max that are not covered by naturals
  const internalGaps: number[] = [];
  for (let i = min + 1; i < max; i++) {
    if (!naturalSet.has(i)) internalGaps.push(i);
  }

  // If there are more gaps than jokers, no valid sequence can be formed
  if (internalGaps.length > jokerCount) return [];

  // Extra jokers (beyond gap-filling) extend the sequence at boundaries
  const extraJokerCount = jokerCount - internalGaps.length;
  const options: JokerSequenceOption[] = [];

  // Enumerate all ways to distribute extra jokers: belowCount below + aboveCount above
  for (let belowCount = 0; belowCount <= extraJokerCount; belowCount++) {
    const aboveCount = extraJokerCount - belowCount;
    const startIdx = min - belowCount;
    const endIdx = max + aboveCount;

    // Stay within valid rank bounds
    if (startIdx < 0 || endIdx > maxRankBound) continue;

    const cards = buildFullSequence(sortedNaturals, jokers, naturalSet, rankIdx, startIdx, endIdx);
    const label = buildLabel(internalGaps, belowCount, aboveCount, min, max, suit, jokerCount);
    options.push({ cards, label });
  }

  return options;
}

/**
 * Builds the complete ordered Card[] for a sequence spanning [startIdx, endIdx].
 * Natural cards fill their own rank slots; jokers fill the remaining slots in order.
 */
function buildFullSequence(
  sortedNaturals: Card[],
  jokers: Card[],
  naturalSet: Set<number>,
  rankIdx: (rank: Rank) => number,
  startIdx: number,
  endIdx: number,
): Card[] {
  const result: Card[] = [];
  let jokerUsed = 0;

  for (let slot = startIdx; slot <= endIdx; slot++) {
    if (naturalSet.has(slot)) {
      const card = sortedNaturals.find(c => rankIdx(c.rank!) === slot)!;
      result.push(card);
    } else {
      result.push(jokers[jokerUsed++] ?? { rank: null, suit: null, isJoker: true });
    }
  }
  return result;
}

/**
 * Builds a human-readable label describing which ranks the jokers represent.
 * Single joker → "Joker as Q♥"; multiple → "Jokers as 10♥ & Q♥".
 */
function buildLabel(
  internalGaps: number[],
  belowCount: number,
  aboveCount: number,
  min: number,
  max: number,
  suit: Suit,
  _jokerCount: number,
): string {
  const positions: string[] = [];

  // Below-extension jokers (lowest first)
  for (let i = belowCount; i >= 1; i--) {
    const rank = RANK_ORDER[min - i];
    positions.push(`${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`);
  }

  // Internal gap jokers (ascending)
  for (const gapIdx of internalGaps) {
    positions.push(`${RANK_LABELS[RANK_ORDER[gapIdx]]}${SUIT_SYMBOLS[suit]}`);
  }

  // Above-extension jokers (ascending).
  // Position 13 is the virtual Ace-high slot (beyond RANK_ORDER's last index).
  for (let i = 1; i <= aboveCount; i++) {
    const posIdx = max + i;
    const rank = posIdx < RANK_ORDER.length ? RANK_ORDER[posIdx] : Rank.ACE;
    positions.push(`${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`);
  }

  if (positions.length === 1) return `Joker as ${positions[0]}`;
  return `Jokers as ${positions.join(' & ')}`;
}

/**
 * Returns a display label like "=K♠" showing what rank the Joker at `jokerIdx`
 * represents within `cards`, inferred from surrounding natural card positions.
 * Returns null if the rank cannot be determined.
 */
export function getJokerRankLabel(cards: Card[], jokerIdx: number): string | null {
  const suit = cards.find(c => !c.isJoker)?.suit ?? null;

  let prevRankIdx: number | null = null;
  let prevOffset = 0;
  for (let i = jokerIdx - 1; i >= 0; i--) {
    if (!cards[i].isJoker) {
      prevRankIdx = RANK_ORDER.indexOf(cards[i].rank as Rank);
      prevOffset = jokerIdx - i;
      break;
    }
  }
  let nextRankIdx: number | null = null;
  let nextOffset = 0;
  for (let i = jokerIdx + 1; i < cards.length; i++) {
    if (!cards[i].isJoker) {
      nextRankIdx = RANK_ORDER.indexOf(cards[i].rank as Rank);
      nextOffset = i - jokerIdx;
      break;
    }
  }

  let rankVIdx: number | null = null;
  if (prevRankIdx !== null) rankVIdx = prevRankIdx + prevOffset;
  else if (nextRankIdx !== null) rankVIdx = nextRankIdx - nextOffset;

  // Virtual index 13 = Ace-high (position after King); anything beyond is invalid.
  if (rankVIdx === null || rankVIdx < 0 || rankVIdx > RANK_ORDER.length) return null;
  const rank = rankVIdx >= RANK_ORDER.length ? Rank.ACE : RANK_ORDER[rankVIdx];
  if (!rank) return null;

  return `=${RANK_LABELS[rank]}${suit ? SUIT_SYMBOLS[suit] : ''}`;
}

/**
 * Computes valid positions for laying off a Joker onto an existing sequence.
 * Returns 0, 1, or 2 options (extend at start and/or end).
 */
export function computeJokerLayOffOptions(combination: Combination): JokerSequenceOption[] {
  if (combination.type !== 'sequence') return [];

  const naturals = combination.cards.filter(c => !c.isJoker) as Card[];
  if (naturals.length === 0) return [];

  const suit = naturals[0].suit;
  if (!suit) return [];

  // Determine effective sequence boundaries (accounting for existing boundary Jokers)
  let leadingJokers = 0;
  for (const card of combination.cards) {
    if (card.isJoker) leadingJokers++;
    else break;
  }
  let trailingJokers = 0;
  for (let i = combination.cards.length - 1; i >= 0; i--) {
    if (combination.cards[i].isJoker) trailingJokers++;
    else break;
  }

  const existingJokerCount = combination.cards.filter(c => c.isJoker).length;
  const aceHigh = isAceHigh(naturals, existingJokerCount + 1);
  const rankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && aceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  const indices = naturals.map(c => rankIdx(c.rank!)).sort((a, b) => a - b);
  const minIdx = indices[0];
  const maxIdx = indices[indices.length - 1];

  const effectiveMin = minIdx - leadingJokers;
  const effectiveMax = maxIdx + trailingJokers;

  const jokerCard = (): Card => ({ rank: null, suit: null, isJoker: true });
  const options: JokerSequenceOption[] = [];

  // Option: extend at start (Joker represents effectiveMin - 1)
  const startRankIdx = effectiveMin - 1;
  if (startRankIdx >= 0) {
    const jokerRank = RANK_ORDER[startRankIdx];
    if (jokerRank) {
      const newCards = [jokerCard(), ...combination.cards];
      options.push({ cards: newCards, label: `Joker as ${RANK_LABELS[jokerRank]}${SUIT_SYMBOLS[suit]}` });
    }
  }

  // Option: extend at end (Joker represents effectiveMax + 1, up to virtual Ace at 13)
  const endRankIdx = effectiveMax + 1;
  const kingIdx = RANK_ORDER.indexOf(Rank.KING);
  const maxBound = effectiveMax >= kingIdx ? 13 : RANK_ORDER.length - 1;
  if (endRankIdx <= maxBound) {
    const jokerRank = endRankIdx >= RANK_ORDER.length ? Rank.ACE : RANK_ORDER[endRankIdx];
    if (jokerRank) {
      const newCards = [...combination.cards, jokerCard()];
      options.push({ cards: newCards, label: `Joker as ${RANK_LABELS[jokerRank]}${SUIT_SYMBOLS[suit]}` });
    }
  }

  return options;
}
