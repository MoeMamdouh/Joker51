import { computeJokerSequenceOptions } from '../jokerPlacement';
import { Card, Rank, Suit } from '../../../engine/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });

// ─── Existing behaviour (regression) ─────────────────────────────────────────

describe('computeJokerSequenceOptions — existing behaviour', () => {
  it('returns [] when no Jokers present', () => {
    expect(computeJokerSequenceOptions([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS)])).toEqual([]);
  });

  it('returns [] when fewer than 2 natural cards', () => {
    expect(computeJokerSequenceOptions([joker(), c(Rank.FIVE, Suit.CLUBS)])).toEqual([]);
  });

  it('returns gap-fill option for internal Joker (5-Joker-7)', () => {
    const options = computeJokerSequenceOptions([c(Rank.FIVE, Suit.HEARTS), joker(), c(Rank.SEVEN, Suit.HEARTS)]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Joker as 6♥');
  });

  it('returns two boundary options for extra Joker (6-7 + Joker)', () => {
    const options = computeJokerSequenceOptions([c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS), joker()]);
    // Joker can extend below (5) or above (8)
    expect(options.length).toBeGreaterThanOrEqual(2);
  });

  it('valid ace-high: Q-K-A with Joker below (J)', () => {
    // Existing natural K present — existing aceHigh path
    const options = computeJokerSequenceOptions([
      c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS), joker(), c(Rank.ACE, Suit.HEARTS),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Joker as J♥');
  });
});

// ─── One natural + two Jokers ────────────────────────────────────────────────

describe('computeJokerSequenceOptions — 1 natural + 2 Jokers (click-order independent)', () => {
  it('[8, Joker, Joker] returns 3 options regardless of click order', () => {
    const orders = [
      [c(Rank.EIGHT, Suit.SPADES), joker(), joker()],
      [joker(), c(Rank.EIGHT, Suit.SPADES), joker()],
      [joker(), joker(), c(Rank.EIGHT, Suit.SPADES)],
    ];
    for (const cards of orders) {
      const options = computeJokerSequenceOptions(cards);
      expect(options).toHaveLength(3);
      const labels = options.map(o => o.label);
      expect(labels).toContain('Jokers as 6♠ & 7♠');  // [Joker(6), Joker(7), 8]
      expect(labels).toContain('Jokers as 7♠ & 9♠');  // [Joker(7), 8, Joker(9)]
      expect(labels).toContain('Jokers as 9♠ & 10♠'); // [8, Joker(9), Joker(10)]
    }
  });

  it('[8, Joker, Joker] — Jokers-below option produces [Joker, Joker, 8] card order', () => {
    const options = computeJokerSequenceOptions([c(Rank.EIGHT, Suit.SPADES), joker(), joker()]);
    const below = options.find(o => o.label === 'Jokers as 6♠ & 7♠')!;
    expect(below).toBeDefined();
    expect(below.cards[0].isJoker).toBe(true);
    expect(below.cards[1].isJoker).toBe(true);
    expect(below.cards[2].rank).toBe(Rank.EIGHT);
  });

  it('[8, Joker, Joker] — Jokers-above option produces [8, Joker, Joker] card order', () => {
    const options = computeJokerSequenceOptions([c(Rank.EIGHT, Suit.SPADES), joker(), joker()]);
    const above = options.find(o => o.label === 'Jokers as 9♠ & 10♠')!;
    expect(above).toBeDefined();
    expect(above.cards[0].rank).toBe(Rank.EIGHT);
    expect(above.cards[1].isJoker).toBe(true);
    expect(above.cards[2].isJoker).toBe(true);
  });

  it('returns [] for [8, Joker] (1 natural + 1 Joker = only 2 cards, too short)', () => {
    expect(computeJokerSequenceOptions([c(Rank.EIGHT, Suit.SPADES), joker()])).toEqual([]);
  });

  it('[K, Joker, Joker] returns Jokers-below and Jokers-as-A options', () => {
    const options = computeJokerSequenceOptions([c(Rank.KING, Suit.HEARTS), joker(), joker()]);
    expect(options.length).toBeGreaterThanOrEqual(2);
    const labels = options.map(o => o.label);
    expect(labels).toContain('Jokers as J♥ & Q♥');  // both below K
    // One option extends to Ace: Joker as Q + Joker as A
    expect(labels).toContain('Jokers as Q♥ & A♥');
  });
});

// ─── Joker adjacent to King — Ace extension ──────────────────────────────────

describe('computeJokerSequenceOptions — Joker can extend above King to Ace', () => {
  it('returns two options for [Q-Joker-K]: Joker as J or Joker as A', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.QUEEN, Suit.SPADES), joker(), c(Rank.KING, Suit.SPADES),
    ]);
    expect(options).toHaveLength(2);
    const labels = options.map(o => o.label);
    expect(labels).toContain('Joker as J♠');
    expect(labels).toContain('Joker as A♠');
  });

  it('Joker-as-A option produces [Q, K, Joker] card order', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.QUEEN, Suit.SPADES), joker(), c(Rank.KING, Suit.SPADES),
    ]);
    const aceOption = options.find(o => o.label === 'Joker as A♠')!;
    expect(aceOption).toBeDefined();
    expect(aceOption.cards[0].rank).toBe(Rank.QUEEN);
    expect(aceOption.cards[1].rank).toBe(Rank.KING);
    expect(aceOption.cards[2].isJoker).toBe(true);
  });

  it('Joker-as-J option produces [Joker, Q, K] card order', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.QUEEN, Suit.SPADES), joker(), c(Rank.KING, Suit.SPADES),
    ]);
    const jackOption = options.find(o => o.label === 'Joker as J♠')!;
    expect(jackOption).toBeDefined();
    expect(jackOption.cards[0].isJoker).toBe(true);
    expect(jackOption.cards[1].rank).toBe(Rank.QUEEN);
    expect(jackOption.cards[2].rank).toBe(Rank.KING);
  });

  it('returns two options for [J-Q-K-Joker]: Joker as A or Joker as 10', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS), joker(),
    ]);
    expect(options).toHaveLength(2);
    const labels = options.map(o => o.label);
    expect(labels).toContain('Joker as A♥');
    expect(labels).toContain('Joker as 10♥');
  });
});

// ─── Ace-after-Joker-as-King fix ─────────────────────────────────────────────

describe('computeJokerSequenceOptions — Ace after Joker-as-King', () => {
  it('returns one option "Joker as K♥" for [J-Q-Joker-A]', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), joker(), c(Rank.ACE, Suit.HEARTS),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Joker as K♥');
    // Resulting card order: J, Q, Joker(K), A
    const ranks = options[0].cards.map(card => (card.isJoker ? 'JOKER' : card.rank));
    expect(ranks).toEqual([Rank.JACK, Rank.QUEEN, 'JOKER', Rank.ACE]);
  });

  it('returns one option "Joker as K♥" for [10-J-Q-Joker-A]', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.TEN, Suit.HEARTS), c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), joker(), c(Rank.ACE, Suit.HEARTS),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Joker as K♥');
  });

  it('returns "Jokers as Q♥ & K♥" for [J-Joker-Joker-A]', () => {
    const options = computeJokerSequenceOptions([
      c(Rank.JACK, Suit.HEARTS), joker(), joker(), c(Rank.ACE, Suit.HEARTS),
    ]);
    // One Joker fills Q(11), one fills K(12); only arrangement is J-Q(Joker)-K(Joker)-A
    // The extra-joker distribution check: no extra jokers (both fill internal gaps)
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Jokers as Q♥ & K♥');
  });

  it('returns [] for [Q-Joker-A] (no rank between K-A for extra Joker below Q)', () => {
    // Q(11) + Joker + A-high(13): gap at 12 (K). But wait —
    // With aceHigh (Q+Joker can reach K): max non-ace=11, jokerCount=1, 11+1=12 → aceHigh=true
    // naturalRankIndices: Q=11, A=13 → min=11, max=13
    // internalGaps: slot 12 (K) → 1 gap, jokerCount=1 → OK
    // extraJokers=0 → 1 option (no boundary extension)
    const options = computeJokerSequenceOptions([
      c(Rank.QUEEN, Suit.HEARTS), joker(), c(Rank.ACE, Suit.HEARTS),
    ]);
    expect(options).toHaveLength(1);
    expect(options[0].label).toBe('Joker as K♥');
  });
});
