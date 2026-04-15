import { renderHook, act } from '@testing-library/react-native';
import { useHandOrder } from '../useHandOrder';
import { Card, Rank, Suit } from '../../engine/types';

const c1: Card = { rank: Rank.ACE, suit: Suit.SPADES, isJoker: false };
const c2: Card = { rank: Rank.TWO, suit: Suit.HEARTS, isJoker: false };
const c3: Card = { rank: Rank.THREE, suit: Suit.CLUBS, isJoker: false };
const c4: Card = { rank: Rank.FOUR, suit: Suit.DIAMONDS, isJoker: false };
const c5: Card = { rank: Rank.FIVE, suit: Suit.SPADES, isJoker: false };

describe('useHandOrder', () => {
  it('initial order equals input order', () => {
    const cards = [c1, c2, c3];
    const { result } = renderHook(() => useHandOrder(cards));
    expect(result.current.orderedCards).toEqual([c1, c2, c3]);
  });

  it('moveCard(0, 4) in 5-card hand moves first card to end', () => {
    const { result } = renderHook(() => useHandOrder([c1, c2, c3, c4, c5]));
    act(() => {
      result.current.moveCard(0, 4);
    });
    expect(result.current.orderedCards[4]).toBe(c1);
    expect(result.current.orderedCards[0]).toBe(c2);
  });

  it('moveCard with same index is a no-op', () => {
    const { result } = renderHook(() => useHandOrder([c1, c2, c3]));
    const before = result.current.orderedCards;
    act(() => {
      result.current.moveCard(1, 1);
    });
    expect(result.current.orderedCards).toEqual(before);
  });

  it('moveCard with out-of-bounds from is a no-op', () => {
    const { result } = renderHook(() => useHandOrder([c1, c2, c3]));
    act(() => {
      result.current.moveCard(10, 1);
    });
    expect(result.current.orderedCards).toEqual([c1, c2, c3]);
  });

  it('moveCard with out-of-bounds to is a no-op', () => {
    const { result } = renderHook(() => useHandOrder([c1, c2, c3]));
    act(() => {
      result.current.moveCard(0, 10);
    });
    expect(result.current.orderedCards).toEqual([c1, c2, c3]);
  });

  it('reconcile removes card no longer in hand, preserving other order', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [c1, c2, c3] } }
    );
    act(() => {
      result.current.moveCard(0, 2); // order: c2, c3, c1
    });
    rerender({ cards: [c1, c3] }); // c2 removed
    // c2 dropped, order among c1/c3 preserved from reordered state
    expect(result.current.orderedCards).not.toContain(c2);
    expect(result.current.orderedCards).toHaveLength(2);
  });

  it('reconcile appends new card to end', () => {
    const { result, rerender } = renderHook(
      ({ cards }: { cards: Card[] }) => useHandOrder(cards),
      { initialProps: { cards: [c1, c2] } }
    );
    rerender({ cards: [c1, c2, c3] });
    expect(result.current.orderedCards[2]).toBe(c3);
  });
});
