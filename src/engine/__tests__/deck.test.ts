import { createDeck, shuffle, deckCountForPlayers } from '../deck';
import { Suit, Rank } from '../types';

describe('deckCountForPlayers', () => {
  it.each([
    [2, 1], [3, 1],
    [4, 2], [5, 2], [6, 2],
    [7, 3], [8, 3],
  ])('%i players → %i deck(s)', (players, expected) => {
    expect(deckCountForPlayers(players)).toBe(expected);
  });
});

describe('createDeck', () => {
  it('1 deck has exactly 54 cards', () => {
    expect(createDeck(1)).toHaveLength(54);
  });

  it('2 decks have exactly 108 cards', () => {
    expect(createDeck(2)).toHaveLength(108);
  });

  it('3 decks have exactly 162 cards', () => {
    expect(createDeck(3)).toHaveLength(162);
  });

  it('1 deck has 2 Jokers', () => {
    const jokers = createDeck(1).filter(c => c.isJoker);
    expect(jokers).toHaveLength(2);
  });

  it('2 decks have 4 Jokers', () => {
    const jokers = createDeck(2).filter(c => c.isJoker);
    expect(jokers).toHaveLength(4);
  });

  it('1 deck has 52 non-Joker cards', () => {
    const nonJokers = createDeck(1).filter(c => !c.isJoker);
    expect(nonJokers).toHaveLength(52);
  });

  it('non-Joker cards cover all 4 suits × 13 ranks', () => {
    const nonJokers = createDeck(1).filter(c => !c.isJoker);
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank);
    for (const suit of suits) {
      for (const rank of ranks) {
        expect(nonJokers.some(c => c.suit === suit && c.rank === rank)).toBe(true);
      }
    }
  });

  it('Jokers have isJoker=true, rank=null, suit=null', () => {
    const jokers = createDeck(1).filter(c => c.isJoker);
    jokers.forEach(j => {
      expect(j.rank).toBeNull();
      expect(j.suit).toBeNull();
    });
  });
});

describe('shuffle', () => {
  const deck = createDeck(1);

  it('preserves card count', () => {
    expect(shuffle(deck)).toHaveLength(deck.length);
  });

  it('contains all the same cards', () => {
    const shuffled = shuffle(deck);
    expect(shuffled).toHaveLength(deck.length);
    // every card in original appears in shuffled
    const sorted = (arr: typeof deck) =>
      [...arr].map(c => `${c.isJoker ? 'J' : `${c.rank}-${c.suit}`}`).sort();
    expect(sorted(shuffled)).toEqual(sorted([...deck]));
  });

  it('seeded RNG produces deterministic order', () => {
    const rng = seededRng(42);
    const s1 = shuffle([...deck], rng);
    const rng2 = seededRng(42);
    const s2 = shuffle([...deck], rng2);
    expect(s1.map(c => `${c.rank}-${c.suit}`)).toEqual(s2.map(c => `${c.rank}-${c.suit}`));
  });

  it('different seeds produce different orders', () => {
    const s1 = shuffle([...deck], seededRng(1));
    const s2 = shuffle([...deck], seededRng(999));
    const order1 = s1.map(c => `${c.rank}-${c.suit}`).join();
    const order2 = s2.map(c => `${c.rank}-${c.suit}`).join();
    expect(order1).not.toEqual(order2);
  });
});

// Simple LCG seeded RNG for deterministic tests
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
