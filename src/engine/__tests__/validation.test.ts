import { validateCombination, calculateMeldPoints, isFullSet, isFullSequence, getClaimableJokerCards } from '../validation';
import { Card, Rank, Suit } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });

// ─── Sequence validation ─────────────────────────────────────────────────────

describe('validateCombination — sequences', () => {
  it('valid same-suit consecutive sequence', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('invalid: mixed suits', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.DIAMONDS)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SEQUENCE_MIXED_SUITS');
  });

  it('invalid: non-consecutive', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), c(Rank.EIGHT, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SEQUENCE_NOT_CONSECUTIVE');
  });

  it('valid Ace low: A-2-3', () => {
    const result = validateCombination([c(Rank.ACE, Suit.SPADES), c(Rank.TWO, Suit.SPADES), c(Rank.THREE, Suit.SPADES)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('valid Ace high: Q-K-A', () => {
    const result = validateCombination([c(Rank.QUEEN, Suit.SPADES), c(Rank.KING, Suit.SPADES), c(Rank.ACE, Suit.SPADES)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('invalid: K-A-2 (not enough jokers to form a full run)', () => {
    const result = validateCombination([c(Rank.KING, Suit.SPADES), c(Rank.ACE, Suit.SPADES), c(Rank.TWO, Suit.SPADES)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SEQUENCE_NOT_CONSECUTIVE');
  });

  it('valid: J-K-A with Joker as Q (ace-high)', () => {
    const result = validateCombination([c(Rank.JACK, Suit.HEARTS), joker(), c(Rank.KING, Suit.HEARTS), c(Rank.ACE, Suit.HEARTS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('valid: 9-J-K-A with two Jokers as 10 and Q', () => {
    const result = validateCombination([c(Rank.NINE, Suit.HEARTS), joker(), c(Rank.JACK, Suit.HEARTS), joker(), c(Rank.KING, Suit.HEARTS), c(Rank.ACE, Suit.HEARTS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('invalid: A-K-2-3 (span too wide, not enough jokers)', () => {
    const result = validateCombination([c(Rank.ACE, Suit.SPADES), c(Rank.KING, Suit.SPADES), c(Rank.TWO, Suit.SPADES), c(Rank.THREE, Suit.SPADES)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SEQUENCE_NOT_CONSECUTIVE');
  });

  it('minimum 3 cards required', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('COMBINATION_TOO_SHORT');
  });

  it('long valid sequence (6 cards)', () => {
    const cards = [Rank.THREE, Rank.FOUR, Rank.FIVE, Rank.SIX, Rank.SEVEN, Rank.EIGHT]
      .map(r => c(r, Suit.HEARTS));
    expect(validateCombination(cards, { isInitialMeld: false }).valid).toBe(true);
  });
});

// ─── Set validation ───────────────────────────────────────────────────────────

describe('validateCombination — sets', () => {
  it('valid 3-card set', () => {
    const result = validateCombination([c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('valid 4-card set (all suits)', () => {
    const result = validateCombination([c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('invalid: duplicate suit', () => {
    const result = validateCombination([c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.DIAMONDS)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SET_DUPLICATE_SUIT');
  });

  it('invalid: 5-card set', () => {
    const result = validateCombination([
      c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS),
      c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS),
      c(Rank.NINE, Suit.SPADES),
    ], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('SET_TOO_LONG');
  });
});

// ─── Joker substitution ───────────────────────────────────────────────────────

describe('validateCombination — Joker substitution', () => {
  it('Joker as middle card in sequence', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), joker(), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('Joker as first card in sequence', () => {
    const result = validateCombination([joker(), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('Joker as last card in sequence', () => {
    const result = validateCombination([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), joker()], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('Joker in set (substitutes missing suit)', () => {
    const result = validateCombination([c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), joker()], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });

  it('2 Jokers allowed in initial meld', () => {
    const result = validateCombination([joker(), joker(), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: true });
    expect(result.valid).toBe(true);
  });

  it('2 Jokers allowed after initial meld', () => {
    const result = validateCombination([joker(), joker(), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: false });
    expect(result.valid).toBe(true);
  });
});

// ─── calculateMeldPoints ─────────────────────────────────────────────────────

describe('calculateMeldPoints', () => {
  it('number cards at face value', () => {
    const combo = [c(Rank.TWO, Suit.CLUBS), c(Rank.THREE, Suit.CLUBS), c(Rank.FOUR, Suit.CLUBS)];
    expect(calculateMeldPoints([combo])).toBe(9);
  });

  it('J/Q/K = 10 each', () => {
    const combo = [c(Rank.JACK, Suit.CLUBS), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.DIAMONDS)];
    expect(calculateMeldPoints([combo])).toBe(30);
  });

  it('Ace = 11', () => {
    const combo = [c(Rank.ACE, Suit.SPADES), c(Rank.TWO, Suit.SPADES), c(Rank.THREE, Suit.SPADES)];
    expect(calculateMeldPoints([combo])).toBe(16);
  });

  it('Joker uses substituted rank value (not 25)', () => {
    // 5♣ [Joker=6♣] 7♣ → 5+6+7 = 18
    const combo = [c(Rank.FIVE, Suit.CLUBS), joker(), c(Rank.SEVEN, Suit.CLUBS)];
    expect(calculateMeldPoints([combo])).toBe(18);
  });

  it('51-point opening example from spec: 6-7-8 + 10-10-10', () => {
    const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
    const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
    expect(calculateMeldPoints([seq, set])).toBe(51);
  });

  it('multi-combination sum', () => {
    const c1 = [c(Rank.TWO, Suit.CLUBS), c(Rank.THREE, Suit.CLUBS), c(Rank.FOUR, Suit.CLUBS)]; // 9
    const c2 = [c(Rank.KING, Suit.SPADES), c(Rank.KING, Suit.HEARTS), c(Rank.KING, Suit.DIAMONDS)]; // 30
    expect(calculateMeldPoints([c1, c2])).toBe(39);
  });
});

// ─── isFullSet / isFullSequence ───────────────────────────────────────────────

describe('isFullSet', () => {
  it('returns true when all 4 suits of same rank present', () => {
    const combo = {
      id: '1', type: 'set' as const, ownerId: 'p1',
      cards: [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS)],
    };
    expect(isFullSet(combo)).toBe(true);
  });

  it('returns false for 3-card set', () => {
    const combo = {
      id: '1', type: 'set' as const, ownerId: 'p1',
      cards: [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS)],
    };
    expect(isFullSet(combo)).toBe(false);
  });
});

describe('isFullSequence', () => {
  it('returns true for A→K same suit (13 cards)', () => {
    const cards = Object.values(Rank).map(r => c(r, Suit.HEARTS));
    const combo = { id: '1', type: 'sequence' as const, ownerId: 'p1', cards };
    expect(isFullSequence(combo)).toBe(true);
  });

  it('returns false for partial sequence', () => {
    const cards = [c(Rank.ACE, Suit.HEARTS), c(Rank.TWO, Suit.HEARTS), c(Rank.THREE, Suit.HEARTS)];
    const combo = { id: '1', type: 'sequence' as const, ownerId: 'p1', cards };
    expect(isFullSequence(combo)).toBe(false);
  });
});

// ─── getClaimableJokerCards ───────────────────────────────────────────────────

describe('getClaimableJokerCards', () => {
  const combo = (cards: Card[], type: 'sequence' | 'set' = 'sequence') => ({
    id: 'c1', type, ownerId: 'p1', cards,
  });

  it('returns null when combination has no Joker', () => {
    const combination = combo([c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS)]);
    expect(getClaimableJokerCards(combination, [c(Rank.SIX, Suit.CLUBS)])).toBeNull();
  });

  it('sequence: returns [required card] when player holds it', () => {
    // [5♣ Joker 7♣] — Joker must be 6♣
    const combination = combo([c(Rank.FIVE, Suit.CLUBS), joker(), c(Rank.SEVEN, Suit.CLUBS)]);
    const hand = [c(Rank.SIX, Suit.CLUBS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.SIX, Suit.CLUBS));
  });

  it('sequence: returns null when player does not hold the required card', () => {
    const combination = combo([c(Rank.FIVE, Suit.CLUBS), joker(), c(Rank.SEVEN, Suit.CLUBS)]);
    const hand = [c(Rank.EIGHT, Suit.CLUBS)];
    expect(getClaimableJokerCards(combination, hand)).toBeNull();
  });

  it('sequence: Joker at start (boundary below) — [Joker, K♥, A♥] → needs Q♥', () => {
    // Joker extends below K, representing Q♥
    const combination = combo([joker(), c(Rank.KING, Suit.HEARTS), c(Rank.ACE, Suit.HEARTS)]);
    const hand = [c(Rank.QUEEN, Suit.HEARTS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.QUEEN, Suit.HEARTS));
  });

  it('sequence: Joker at end (boundary above) — [6♣, 7♣, Joker] → needs 8♣', () => {
    const combination = combo([c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS), joker()]);
    const hand = [c(Rank.EIGHT, Suit.CLUBS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.EIGHT, Suit.CLUBS));
  });

  it('sequence: Joker at start — returns null when player does not hold boundary card', () => {
    const combination = combo([joker(), c(Rank.KING, Suit.HEARTS), c(Rank.ACE, Suit.HEARTS)]);
    const hand = [c(Rank.JACK, Suit.HEARTS)]; // has J, not Q
    expect(getClaimableJokerCards(combination, hand)).toBeNull();
  });

  it('multi-Joker sequence: [5♥,6♥,7♥,8♥,9♥,Joker,J♥,Joker,K♥] — player holds Q♥ → returns Q♥', () => {
    // Joker1 = 10♥, Joker2 = Q♥; player has Q♥ → should claim Joker2
    const combination = combo([
      c(Rank.FIVE, Suit.HEARTS), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.HEARTS),
      c(Rank.EIGHT, Suit.HEARTS), c(Rank.NINE, Suit.HEARTS),
      joker(),
      c(Rank.JACK, Suit.HEARTS),
      joker(),
      c(Rank.KING, Suit.HEARTS),
    ]);
    const hand = [c(Rank.QUEEN, Suit.HEARTS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.QUEEN, Suit.HEARTS));
  });

  it('multi-Joker sequence: [5♥,6♥,7♥,8♥,9♥,Joker,J♥,Joker,K♥] — player holds 10♥ → returns 10♥', () => {
    const combination = combo([
      c(Rank.FIVE, Suit.HEARTS), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.HEARTS),
      c(Rank.EIGHT, Suit.HEARTS), c(Rank.NINE, Suit.HEARTS),
      joker(),
      c(Rank.JACK, Suit.HEARTS),
      joker(),
      c(Rank.KING, Suit.HEARTS),
    ]);
    const hand = [c(Rank.TEN, Suit.HEARTS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.TEN, Suit.HEARTS));
  });

  it('multi-Joker sequence: returns null when player holds neither replacement card', () => {
    const combination = combo([
      c(Rank.FIVE, Suit.HEARTS), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.HEARTS),
      c(Rank.EIGHT, Suit.HEARTS), c(Rank.NINE, Suit.HEARTS),
      joker(),
      c(Rank.JACK, Suit.HEARTS),
      joker(),
      c(Rank.KING, Suit.HEARTS),
    ]);
    const hand = [c(Rank.ACE, Suit.HEARTS)]; // has A, not 10 or Q
    expect(getClaimableJokerCards(combination, hand)).toBeNull();
  });

  it('4-card set (3 naturals + Joker): returns [one missing suit] when player holds it', () => {
    // [9♠ 9♥ 9♦ Joker] — Joker must be 9♣
    const combination = combo(
      [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS), joker()],
      'set'
    );
    const hand = [c(Rank.NINE, Suit.CLUBS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0]).toEqual(c(Rank.NINE, Suit.CLUBS));
  });

  it('3-card set (2 naturals + Joker): returns [both missing suits] when player holds both', () => {
    // [9♠ 9♥ Joker] — missing: 9♦ and 9♣
    const combination = combo(
      [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), joker()],
      'set'
    );
    const hand = [c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS)];
    const result = getClaimableJokerCards(combination, hand);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS)]));
  });

  it('3-card set (2 naturals + Joker): returns null when player holds only 1 of 2 missing suits', () => {
    const combination = combo(
      [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), joker()],
      'set'
    );
    const hand = [c(Rank.NINE, Suit.DIAMONDS)]; // holds only one of the two missing suits
    expect(getClaimableJokerCards(combination, hand)).toBeNull();
  });
});
