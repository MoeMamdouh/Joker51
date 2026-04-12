import { validateCombination, calculateMeldPoints, isFullSet, isFullSequence } from '../validation';
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

  it('invalid: Ace wraparound K-A-2', () => {
    const result = validateCombination([c(Rank.KING, Suit.SPADES), c(Rank.ACE, Suit.SPADES), c(Rank.TWO, Suit.SPADES)], { isInitialMeld: false });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('ACE_WRAPAROUND');
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

  it('2 Jokers rejected during initial meld', () => {
    const result = validateCombination([joker(), joker(), c(Rank.SEVEN, Suit.CLUBS)], { isInitialMeld: true });
    expect(result.valid).toBe(false);
    expect(result.error).toBe('JOKER_LIMIT_EXCEEDED');
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
