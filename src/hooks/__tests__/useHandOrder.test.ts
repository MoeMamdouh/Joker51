import { renderHook, act } from '@testing-library/react-native';
import { useHandOrder } from '../useHandOrder';
import { Card, Rank, Suit } from '../../engine/types';

// --- Test card fixtures ---
const joker: Card = { rank: null, suit: null, isJoker: true };
const aSpades: Card = { rank: Rank.ACE, suit: Suit.SPADES, isJoker: false };
const kSpades: Card = { rank: Rank.KING, suit: Suit.SPADES, isJoker: false };
const twoSpades: Card = { rank: Rank.TWO, suit: Suit.SPADES, isJoker: false };
const aHearts: Card = { rank: Rank.ACE, suit: Suit.HEARTS, isJoker: false };
const kHearts: Card = { rank: Rank.KING, suit: Suit.HEARTS, isJoker: false };
const aClubs: Card = { rank: Rank.ACE, suit: Suit.CLUBS, isJoker: false };
const kClubs: Card = { rank: Rank.KING, suit: Suit.CLUBS, isJoker: false };
const aDiamonds: Card = { rank: Rank.ACE, suit: Suit.DIAMONDS, isJoker: false };
const kDiamonds: Card = { rank: Rank.KING, suit: Suit.DIAMONDS, isJoker: false };
const twoHearts: Card = { rank: Rank.TWO, suit: Suit.HEARTS, isJoker: false };

// ─── By Suit sort ───────────────────────────────────────────────────────────

describe('sortBySuit', () => {
  it('initial render auto-sorts by suit: Joker first, then ♠A K 2, ♥A K 2, ♣ ♦', () => {
    const cards = [twoSpades, kHearts, aSpades, joker, kSpades];
    const { result } = renderHook(() => useHandOrder(cards));
    const order = result.current.orderedCards;
    expect(order[0]).toBe(joker);
    expect(order[1]).toBe(aSpades);
    expect(order[2]).toBe(kSpades);
    expect(order[3]).toBe(twoSpades);
    expect(order[4]).toBe(kHearts);
  });

  it('sortBySuit groups by ♠♥♣♦, Ace before King, descending rank', () => {
    const cards = [aDiamonds, aClubs, aHearts, aSpades, joker];
    const { result } = renderHook(() => useHandOrder(cards));
    act(() => { result.current.sortBySuit(); });
    const order = result.current.orderedCards;
    expect(order[0]).toBe(joker);
    expect(order[1]).toBe(aSpades);
    expect(order[2]).toBe(aHearts);
    expect(order[3]).toBe(aClubs);
    expect(order[4]).toBe(aDiamonds);
  });

  it('sortBySuit places Ace above King within same suit', () => {
    const { result } = renderHook(() => useHandOrder([kSpades, aSpades]));
    act(() => { result.current.sortBySuit(); });
    expect(result.current.orderedCards[0]).toBe(aSpades);
    expect(result.current.orderedCards[1]).toBe(kSpades);
  });
});

// ─── By Rank sort ───────────────────────────────────────────────────────────

describe('sortByRank', () => {
  it('sortByRank groups all Aces first, then Kings, suit order ♠♥♣♦ within group', () => {
    const cards = [kHearts, aSpades, kSpades, aHearts, joker];
    const { result } = renderHook(() => useHandOrder(cards));
    act(() => { result.current.sortByRank(); });
    const order = result.current.orderedCards;
    expect(order[0]).toBe(joker);
    expect(order[1]).toBe(aSpades);
    expect(order[2]).toBe(aHearts);
    expect(order[3]).toBe(kSpades);
    expect(order[4]).toBe(kHearts);
  });

  it('sortByRank sets sortMode to byRank', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts]));
    act(() => { result.current.sortByRank(); });
    expect(result.current.sortMode).toBe('byRank');
  });

  it('sortBySuit sets sortMode to bySuit', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts]));
    act(() => { result.current.sortByRank(); });
    act(() => { result.current.sortBySuit(); });
    expect(result.current.sortMode).toBe('bySuit');
  });
});

// ─── Custom order & drag persist ───────────────────────────────────────────

describe('isCustomOrder', () => {
  it('starts as false', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts]));
    expect(result.current.isCustomOrder).toBe(false);
  });

  it('set to true after moveCard', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts, twoSpades]));
    act(() => { result.current.moveCard(0, 2); });
    expect(result.current.isCustomOrder).toBe(true);
  });

  it('cleared to false after sortBySuit', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts, twoSpades]));
    act(() => { result.current.moveCard(0, 2); });
    act(() => { result.current.sortBySuit(); });
    expect(result.current.isCustomOrder).toBe(false);
  });

  it('cleared to false after sortByRank', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts, twoSpades]));
    act(() => { result.current.moveCard(0, 2); });
    act(() => { result.current.sortByRank(); });
    expect(result.current.isCustomOrder).toBe(false);
  });
});

describe('drag-persist contract', () => {
  it('after drag, single draw appends to end (not sorted position)', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades, kHearts] } }
    );
    // Drag card
    act(() => { result.current.moveCard(0, 1); });
    expect(result.current.isCustomOrder).toBe(true);
    // Draw one card
    rerender({ cards: [aSpades, kHearts, twoSpades] });
    const order = result.current.orderedCards;
    expect(order[2]).toBe(twoSpades); // appended at end
  });

  it('after drag + sortBySuit, re-sorts full hand', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [twoSpades, aSpades, kHearts] } }
    );
    act(() => { result.current.moveCard(0, 2); });
    rerender({ cards: [twoSpades, aSpades, kHearts] });
    act(() => { result.current.sortBySuit(); });
    const order = result.current.orderedCards;
    // After sortBySuit: aSpades (♠ Ace), twoSpades (♠ 2) ... kHearts (♥ K)
    expect(order[0]).toBe(aSpades);
    expect(order[2]).toBe(kHearts);
    expect(result.current.isCustomOrder).toBe(false);
  });

  it('after drag + sortByRank, re-sorts full hand', () => {
    const { result } = renderHook(() => useHandOrder([twoSpades, aSpades, kHearts]));
    act(() => { result.current.moveCard(0, 2); });
    act(() => { result.current.sortByRank(); });
    // By rank: aSpades first (Ace=13), then kHearts (King=12), then twoSpades (2=1)
    const order = result.current.orderedCards;
    expect(order[0]).toBe(aSpades);
    expect(order[1]).toBe(kHearts);
    expect(order[2]).toBe(twoSpades);
  });
});

// ─── New card detection ─────────────────────────────────────────────────────

describe('newCard', () => {
  it('starts as null', () => {
    const { result } = renderHook(() => useHandOrder([aSpades]));
    expect(result.current.newCard).toBeNull();
  });

  it('set to drawn card when exactly 1 new card added', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades, kHearts] } }
    );
    rerender({ cards: [aSpades, kHearts, twoSpades] });
    expect(result.current.newCard).toBe(twoSpades);
  });

  it('NOT set when ≥2 cards added (batch deal)', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [] } }
    );
    rerender({ cards: [aSpades, kHearts, twoSpades] });
    expect(result.current.newCard).toBeNull();
  });

  it('cleared by clearNewCard()', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades] } }
    );
    rerender({ cards: [aSpades, kHearts] });
    expect(result.current.newCard).toBe(kHearts);
    act(() => { result.current.clearNewCard(); });
    expect(result.current.newCard).toBeNull();
  });

  it('cleared by sortBySuit()', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades] } }
    );
    rerender({ cards: [aSpades, kHearts] });
    act(() => { result.current.sortBySuit(); });
    expect(result.current.newCard).toBeNull();
  });
});

// ─── Batch deal / round-reset detection ────────────────────────────────────

describe('batch deal / round reset', () => {
  it('resets sortMode to bySuit when ≥2 cards added', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades, kHearts] } }
    );
    act(() => { result.current.sortByRank(); });
    expect(result.current.sortMode).toBe('byRank');
    // Simulate round reset: entirely new hand
    rerender({ cards: [twoSpades, twoHearts, aClubs] });
    expect(result.current.sortMode).toBe('bySuit');
  });

  it('clears isCustomOrder on batch deal', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [aSpades, kHearts] } }
    );
    act(() => { result.current.moveCard(0, 1); });
    expect(result.current.isCustomOrder).toBe(true);
    rerender({ cards: [twoSpades, twoHearts, aClubs] });
    expect(result.current.isCustomOrder).toBe(false);
  });
});

// ─── Player switch (turn handoff) ──────────────────────────────────────────

describe('player switch', () => {
  it('each player has their own sortMode — Player A byRank does not affect Player B', () => {
    const playerACards = [aSpades, kHearts, twoSpades];
    const playerBCards = [aHearts, kClubs, aDiamonds];
    const { result, rerender } = renderHook(
      ({ cards, playerId }: { cards: Card[]; playerId: string }) =>
        useHandOrder(cards, playerId),
      { initialProps: { cards: playerACards, playerId: 'player-a' } }
    );
    act(() => { result.current.sortByRank(); });
    expect(result.current.sortMode).toBe('byRank');

    // Switch to Player B — B has never sorted, so defaults to bySuit
    rerender({ cards: playerBCards, playerId: 'player-b' });
    expect(result.current.sortMode).toBe('bySuit');
  });

  it('restores Player A sortMode when switching back from Player B', () => {
    const playerACards = [aSpades, kHearts, twoSpades];
    const playerBCards = [aHearts, kClubs, aDiamonds];
    const { result, rerender } = renderHook(
      ({ cards, playerId }: { cards: Card[]; playerId: string }) =>
        useHandOrder(cards, playerId),
      { initialProps: { cards: playerACards, playerId: 'player-a' } }
    );
    act(() => { result.current.sortByRank(); });

    rerender({ cards: playerBCards, playerId: 'player-b' });
    expect(result.current.sortMode).toBe('bySuit'); // B starts at default

    // Switch back to Player A — their byRank preference is restored
    rerender({ cards: playerACards, playerId: 'player-a' });
    expect(result.current.sortMode).toBe('byRank');
  });

  it('Player B can independently set their own sortMode', () => {
    const playerACards = [aSpades, kHearts, twoSpades];
    const playerBCards = [aHearts, kClubs, aDiamonds];
    const { result, rerender } = renderHook(
      ({ cards, playerId }: { cards: Card[]; playerId: string }) =>
        useHandOrder(cards, playerId),
      { initialProps: { cards: playerACards, playerId: 'player-a' } }
    );

    rerender({ cards: playerBCards, playerId: 'player-b' });
    act(() => { result.current.sortByRank(); });
    expect(result.current.sortMode).toBe('byRank');

    // Switch back to A — A still has default bySuit
    rerender({ cards: playerACards, playerId: 'player-a' });
    expect(result.current.sortMode).toBe('bySuit');

    // Back to B — B's byRank is restored
    rerender({ cards: playerBCards, playerId: 'player-b' });
    expect(result.current.sortMode).toBe('byRank');
  });

  it('resets isCustomOrder on player switch', () => {
    const playerACards = [aSpades, kHearts, twoSpades];
    const { result, rerender } = renderHook(
      ({ cards, playerId }: { cards: Card[]; playerId: string }) =>
        useHandOrder(cards, playerId),
      { initialProps: { cards: playerACards, playerId: 'player-a' } }
    );
    act(() => { result.current.moveCard(0, 2); });
    expect(result.current.isCustomOrder).toBe(true);

    rerender({ cards: [aHearts, kClubs, aDiamonds], playerId: 'player-b' });
    expect(result.current.isCustomOrder).toBe(false);
  });

  it('clears newCard on player switch', () => {
    const { result, rerender } = renderHook(
      ({ cards, playerId }: { cards: Card[]; playerId: string }) =>
        useHandOrder(cards, playerId),
      { initialProps: { cards: [aSpades, kHearts], playerId: 'player-a' } }
    );
    rerender({ cards: [aSpades, kHearts, twoSpades], playerId: 'player-a' });
    expect(result.current.newCard).toBe(twoSpades);

    rerender({ cards: [aHearts, kClubs, aDiamonds], playerId: 'player-b' });
    expect(result.current.newCard).toBeNull();
  });
});

// ─── moveCard edge cases ────────────────────────────────────────────────────

describe('moveCard edge cases', () => {
  it('moveCard with same index is a no-op', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts, twoSpades]));
    const before = [...result.current.orderedCards];
    act(() => { result.current.moveCard(1, 1); });
    expect(result.current.orderedCards).toEqual(before);
  });

  it('moveCard with out-of-bounds indices is a no-op', () => {
    const { result } = renderHook(() => useHandOrder([aSpades, kHearts]));
    act(() => { result.current.moveCard(10, 0); });
    expect(result.current.orderedCards).toHaveLength(2);
  });
});
