import { sortCombinationCards } from '../sort';
import { Card, Rank, Suit } from '../types';

const mk = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });

// ─── Sequence tests ────────────────────────────────────────────────────────────

describe('sortCombinationCards — sequence', () => {
  it('sorts out-of-order natural cards ascending by rank', () => {
    const cards = [mk(Rank.EIGHT, Suit.SPADES), mk(Rank.SIX, Suit.SPADES), mk(Rank.SEVEN, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result.map((card: Card) => card.rank)).toEqual([Rank.SIX, Rank.SEVEN, Rank.EIGHT]);
  });

  it('leaves an already-sorted sequence unchanged', () => {
    const cards = [mk(Rank.FIVE, Suit.CLUBS), mk(Rank.SIX, Suit.CLUBS), mk(Rank.SEVEN, Suit.CLUBS)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result.map((card: Card) => card.rank)).toEqual([Rank.FIVE, Rank.SIX, Rank.SEVEN]);
  });

  it('places Joker in the gap between natural cards', () => {
    // 6♠ [Joker] 8♠ — Joker fills the 7 gap
    const cards = [mk(Rank.EIGHT, Suit.SPADES), joker(), mk(Rank.SIX, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result[0].rank).toBe(Rank.SIX);
    expect(result[1].isJoker).toBe(true);
    expect(result[2].rank).toBe(Rank.EIGHT);
  });

  it('Ace-low: A-2-3 sequence keeps Ace at start', () => {
    const cards = [mk(Rank.THREE, Suit.HEARTS), mk(Rank.ACE, Suit.HEARTS), mk(Rank.TWO, Suit.HEARTS)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result.map((card: Card) => card.rank)).toEqual([Rank.ACE, Rank.TWO, Rank.THREE]);
  });

  it('Ace-high: Q-K-A sequence keeps Ace at end', () => {
    const cards = [mk(Rank.ACE, Suit.DIAMONDS), mk(Rank.QUEEN, Suit.DIAMONDS), mk(Rank.KING, Suit.DIAMONDS)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result.map((card: Card) => card.rank)).toEqual([Rank.QUEEN, Rank.KING, Rank.ACE]);
  });

  it('boundary Joker (no internal gap): Joker appended after highest natural card', () => {
    // 7♠ 8♠ with 1 boundary Joker — no internal gap, Joker extends beyond 8
    const cards = [mk(Rank.EIGHT, Suit.SPADES), joker(), mk(Rank.SEVEN, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result[0].rank).toBe(Rank.SEVEN);
    expect(result[1].rank).toBe(Rank.EIGHT);
    expect(result[2].isJoker).toBe(true);
  });

  it('leading boundary Joker preserved at start (represents rank below first natural)', () => {
    // [Joker, 6♠, 7♠] — Joker is leading (represents 5), must stay at index 0
    const cards = [joker(), mk(Rank.SIX, Suit.SPADES), mk(Rank.SEVEN, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result[0].isJoker).toBe(true);
    expect(result[1].rank).toBe(Rank.SIX);
    expect(result[2].rank).toBe(Rank.SEVEN);
  });

  it('leading boundary Joker preserved for [Joker, Q, K] (Joker = J)', () => {
    // User chose "Joker as J" — sort must keep Joker at the start
    const cards = [joker(), mk(Rank.QUEEN, Suit.SPADES), mk(Rank.KING, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result[0].isJoker).toBe(true);
    expect(result[1].rank).toBe(Rank.QUEEN);
    expect(result[2].rank).toBe(Rank.KING);
  });

  it('trailing boundary Joker stays at end for [Q, K, Joker] (Joker = A)', () => {
    const cards = [mk(Rank.QUEEN, Suit.SPADES), mk(Rank.KING, Suit.SPADES), joker()];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result[0].rank).toBe(Rank.QUEEN);
    expect(result[1].rank).toBe(Rank.KING);
    expect(result[2].isJoker).toBe(true);
  });
});

  it('all-Joker sequence (no naturals) returns cards unchanged', () => {
    const cards = [joker(), joker(), joker()];
    const result = sortCombinationCards(cards, 'sequence');
    expect(result.every((card: Card) => card.isJoker)).toBe(true);
    expect(result).toHaveLength(3);
  });

// ─── Set tests ─────────────────────────────────────────────────────────────────

describe('sortCombinationCards — set', () => {
  it('sorts suits in fixed order: SPADES → HEARTS → DIAMONDS → CLUBS', () => {
    const cards = [
      mk(Rank.TEN, Suit.CLUBS),
      mk(Rank.TEN, Suit.SPADES),
      mk(Rank.TEN, Suit.DIAMONDS),
    ];
    const result = sortCombinationCards(cards, 'set');
    expect(result.map((card: Card) => card.suit)).toEqual([Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS]);
  });

  it('places Joker at the first missing suit position', () => {
    // SPADES and DIAMONDS present → Joker fills HEARTS slot (index 1)
    const cards = [mk(Rank.NINE, Suit.DIAMONDS), joker(), mk(Rank.NINE, Suit.SPADES)];
    const result = sortCombinationCards(cards, 'set');
    expect(result[0].suit).toBe(Suit.SPADES);
    expect(result[1].isJoker).toBe(true);
    expect(result[2].suit).toBe(Suit.DIAMONDS);
  });

  it('full 4-suit set sorts correctly', () => {
    const cards = [
      mk(Rank.KING, Suit.CLUBS),
      mk(Rank.KING, Suit.DIAMONDS),
      mk(Rank.KING, Suit.HEARTS),
      mk(Rank.KING, Suit.SPADES),
    ];
    const result = sortCombinationCards(cards, 'set');
    expect(result.map((card: Card) => card.suit)).toEqual([Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS]);
  });

  it('no-Joker set (jokerCount === 0) sorts by suit order', () => {
    const cards = [mk(Rank.SEVEN, Suit.CLUBS), mk(Rank.SEVEN, Suit.SPADES), mk(Rank.SEVEN, Suit.HEARTS)];
    const result = sortCombinationCards(cards, 'set');
    expect(result.map((card: Card) => card.suit)).toEqual([Suit.SPADES, Suit.HEARTS, Suit.CLUBS]);
  });

  it('Joker at end when only last suit is missing (CLUBS)', () => {
    // SPADES, HEARTS, DIAMONDS present → Joker fills CLUBS (last)
    const cards = [mk(Rank.ACE, Suit.DIAMONDS), mk(Rank.ACE, Suit.HEARTS), mk(Rank.ACE, Suit.SPADES), joker()];
    const result = sortCombinationCards(cards, 'set');
    expect(result[0].suit).toBe(Suit.SPADES);
    expect(result[1].suit).toBe(Suit.HEARTS);
    expect(result[2].suit).toBe(Suit.DIAMONDS);
    expect(result[3].isJoker).toBe(true);
  });
});
