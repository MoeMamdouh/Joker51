import { useState, useEffect, useRef } from 'react';
import { Card, RANK_ORDER, Suit } from '../engine/types';

// Suit display order for power-sort: ♠ ♥ ♦ ♣
const SUIT_ORDER: Suit[] = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

function cardPowerKey(card: Card): [number, number] {
  if (card.isJoker) return [SUIT_ORDER.length, 0]; // Jokers at the end
  const suitIdx = card.suit !== null ? SUIT_ORDER.indexOf(card.suit) : SUIT_ORDER.length;
  const rankIdx = card.rank !== null ? RANK_ORDER.indexOf(card.rank) : 0;
  return [suitIdx, rankIdx];
}

/**
 * Manages cosmetic hand ordering for drag-to-reorder.
 * Order is local React state only — not persisted, not in game store.
 * Resets when the game resets (new `cards` reference with different identity set).
 */
export function useHandOrder(cards: Card[]): {
  orderedCards: Card[];
  moveCard: (fromIndex: number, toIndex: number) => void;
  sortByPower: () => void;
} {
  const [orderedCards, setOrderedCards] = useState<Card[]>(cards);

  // Track the previous cards array by reference to avoid re-running on
  // new array references that contain the same card objects.
  const prevCardsRef = useRef<Card[]>(cards);

  // Reconcile when the live hand changes (cards added/removed by game engine).
  // We compare by reference identity of the array AND its elements to avoid
  // infinite loops when the parent passes a new array literal with same items.
  useEffect(() => {
    const prev = prevCardsRef.current;
    const sameSet =
      prev.length === cards.length && cards.every(c => prev.includes(c));
    if (sameSet) return;

    prevCardsRef.current = cards;
    setOrderedCards(prevOrdered => {
      // Preserve existing order for cards still in hand
      const kept = prevOrdered.filter(c => cards.includes(c));
      // Append any new cards (drawn, etc.) at the end
      const added = cards.filter(c => !prevOrdered.includes(c));
      return [...kept, ...added];
    });
  }, [cards]);

  function moveCard(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || toIndex < 0) return;
    setOrderedCards(prev => {
      if (fromIndex >= prev.length || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function sortByPower() {
    setOrderedCards(prev =>
      [...prev].sort((a, b) => {
        const [aSuit, aRank] = cardPowerKey(a);
        const [bSuit, bRank] = cardPowerKey(b);
        return aSuit !== bSuit ? aSuit - bSuit : aRank - bRank;
      })
    );
  }

  return { orderedCards, moveCard, sortByPower };
}
