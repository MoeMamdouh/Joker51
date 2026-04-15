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
 * Given a set of staged cards containing exactly one Joker and 2+ natural sequence cards,
 * returns all valid positions the Joker can occupy (one option per valid position).
 *
 * Returns an empty array if no valid options exist (caller should skip the sheet).
 * Returns exactly one option if only one position is valid (caller should skip the sheet).
 */
export function computeJokerSequenceOptions(stagedCards: Card[]): JokerSequenceOption[] {
  const joker = stagedCards.find(c => c.isJoker);
  if (!joker) return [];

  const naturals = stagedCards.filter(c => !c.isJoker);
  if (naturals.length < 2) return [];

  // All natural cards must share the same suit
  const suit = naturals[0].suit;
  if (!suit || naturals.some(c => c.suit !== suit)) return [];

  // Get sorted rank indices of natural cards
  const naturalRankIndices = naturals
    .filter(c => c.rank !== null)
    .map(c => RANK_ORDER.indexOf(c.rank!))
    .filter(i => i !== -1)
    .sort((a, b) => a - b);

  if (naturalRankIndices.length === 0) return [];

  const min = naturalRankIndices[0];
  const max = naturalRankIndices[naturalRankIndices.length - 1];
  const naturalSet = new Set(naturalRankIndices);

  const options: JokerSequenceOption[] = [];
  const sortedNaturals = [...naturals].sort(
    (a, b) => RANK_ORDER.indexOf(a.rank!) - RANK_ORDER.indexOf(b.rank!)
  );

  // Option 1: Joker fills a gap between natural cards
  for (let i = min + 1; i < max; i++) {
    if (!naturalSet.has(i)) {
      const rank = RANK_ORDER[i];
      // Insert the real Joker card at the correct sorted position
      const cards = buildSequenceWithJoker(sortedNaturals, joker, i);
      options.push({
        cards,
        label: `Joker as ${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`,
      });
    }
  }

  // Option 2: Joker extends below the sequence (natural cards are consecutive)
  if (min > 0 && naturalSet.size === max - min + 1) {
    const rank = RANK_ORDER[min - 1];
    options.push({
      cards: [joker, ...sortedNaturals],
      label: `Joker as ${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`,
    });
  }

  // Option 3: Joker extends above the sequence (natural cards are consecutive)
  if (max < RANK_ORDER.length - 1 && naturalSet.size === max - min + 1) {
    const rank = RANK_ORDER[max + 1];
    options.push({
      cards: [...sortedNaturals, joker],
      label: `Joker as ${RANK_LABELS[rank]}${SUIT_SYMBOLS[suit]}`,
    });
  }

  return options;
}

/**
 * Inserts the actual Joker card into the sorted natural cards at the position
 * that corresponds to `jokerRankIndex` in RANK_ORDER.
 * The Joker card itself stays isJoker:true so the engine and hand-dimming work correctly.
 */
function buildSequenceWithJoker(
  sortedNaturals: Card[],
  joker: Card,
  jokerRankIndex: number,
): Card[] {
  const insertAt = sortedNaturals.findIndex(
    c => RANK_ORDER.indexOf(c.rank!) > jokerRankIndex
  );
  const result = [...sortedNaturals];
  if (insertAt === -1) {
    result.push(joker);
  } else {
    result.splice(insertAt, 0, joker);
  }
  return result;
}
