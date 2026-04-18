import { Card, Rank, RANK_ORDER, Suit } from '../../engine/types';
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
  if (naturals.length < 2) return [];

  // All natural cards must share the same suit
  const suit = naturals[0].suit;
  if (!suit || naturals.some(c => c.suit !== suit)) return [];

  // Ace is contextually high when King is also present (Q-K-A), not a wraparound.
  // Map Ace to virtual index 13 (one above King=12) in that case.
  const hasAce = naturals.some(c => c.rank === Rank.ACE);
  const hasKing = naturals.some(c => c.rank === Rank.KING);
  const aceHigh = hasAce && hasKing;
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

  // Upper bound for rank indices: virtual 13 for Ace-high, otherwise the last RANK_ORDER index
  const maxRankBound = aceHigh ? 13 : RANK_ORDER.length - 1;

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

  // Above-extension jokers (ascending)
  for (let i = 1; i <= aboveCount; i++) {
    const rank = RANK_ORDER[max + i];
    positions.push(`${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`);
  }

  if (positions.length === 1) return `Joker as ${positions[0]}`;
  return `Jokers as ${positions.join(' & ')}`;
}
