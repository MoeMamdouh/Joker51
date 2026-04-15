import { useState, useEffect, useRef } from 'react';
import { Card, Rank, Suit } from '../engine/types';

export type SortMode = 'bySuit' | 'byRank';

// Display power: higher number = shown further left (higher priority in descending sort)
const RANK_POWER: Record<Rank, number> = {
  [Rank.ACE]: 13,   // Ace is highest
  [Rank.KING]: 12,
  [Rank.QUEEN]: 11,
  [Rank.JACK]: 10,
  [Rank.TEN]: 9,
  [Rank.NINE]: 8,
  [Rank.EIGHT]: 7,
  [Rank.SEVEN]: 6,
  [Rank.SIX]: 5,
  [Rank.FIVE]: 4,
  [Rank.FOUR]: 3,
  [Rank.THREE]: 2,
  [Rank.TWO]: 1,    // Two is lowest
};

// Suit display power: ♠ first, then ♥, ♣, ♦
const SUIT_POWER: Record<Suit, number> = {
  [Suit.SPADES]: 3,
  [Suit.HEARTS]: 2,
  [Suit.CLUBS]: 1,
  [Suit.DIAMONDS]: 0,
};

type SortKey = [number, number];

function getSortKey(card: Card, mode: SortMode): SortKey {
  if (card.isJoker) return [Infinity, Infinity];
  const rankPow = card.rank !== null ? RANK_POWER[card.rank] : -1;
  const suitPow = card.suit !== null ? SUIT_POWER[card.suit] : -1;
  return mode === 'bySuit' ? [suitPow, rankPow] : [rankPow, suitPow];
}

function sortCards(cards: Card[], mode: SortMode): Card[] {
  return [...cards].sort((a, b) => {
    const [aP, aS] = getSortKey(a, mode);
    const [bP, bS] = getSortKey(b, mode);
    // Descending: higher primary power first, then higher secondary power
    if (bP !== aP) return bP - aP;
    return bS - aS;
  });
}

/**
 * Manages cosmetic hand ordering with two sort modes and drag-to-reorder.
 *
 * - Default sort: By Suit (♠♥♣♦), Ace-high descending
 * - Sort mode is session-scoped (component state, not persisted)
 * - Player switch (playerId changes): preserve sortMode, rebuild sorted order
 * - Batch deal (≥2 new cards, same player): reset to By Suit — handles round start
 * - Single draw: inserts at sorted position (if !isCustomOrder) or appends at end
 * - Drag sets isCustomOrder=true; sort buttons clear it
 *
 * @param playerId - The active player's ID. Required to distinguish a player-turn
 *   handoff (preserve sort mode) from a round-start re-deal (reset sort mode).
 */
export function useHandOrder(cards: Card[], playerId?: string): {
  orderedCards: Card[];
  sortMode: SortMode;
  isCustomOrder: boolean;
  newCard: Card | null;
  moveCard: (fromIndex: number, toIndex: number) => void;
  sortBySuit: () => void;
  sortByRank: () => void;
  clearNewCard: () => void;
} {
  const [orderedCards, setOrderedCards] = useState<Card[]>(() => sortCards(cards, 'bySuit'));
  const [sortMode, setSortMode] = useState<SortMode>('bySuit');
  const [isCustomOrder, setIsCustomOrder] = useState(false);
  const [newCard, setNewCard] = useState<Card | null>(null);

  // Refs mirror state so the reconcile useEffect always reads current values
  // without adding them as dependencies (which would cause infinite loops).
  const sortModeRef = useRef<SortMode>('bySuit');
  const isCustomOrderRef = useRef(false);
  const prevCardsRef = useRef<Card[]>(cards);
  const prevPlayerIdRef = useRef<string | undefined>(playerId);
  // Per-player sort preferences saved on handoff and restored on return.
  const playerPrefsRef = useRef<Record<string, SortMode>>({});

  function setSortModeSync(mode: SortMode) {
    sortModeRef.current = mode;
    setSortMode(mode);
  }

  function setIsCustomOrderSync(val: boolean) {
    isCustomOrderRef.current = val;
    setIsCustomOrder(val);
  }

  // Reconcile when the live hand changes (cards added/removed by game engine).
  useEffect(() => {
    const prev = prevCardsRef.current;
    const sameSet = prev.length === cards.length && cards.every(c => prev.includes(c));

    // Detect a player-turn handoff: the active player ID changed.
    // We must check this BEFORE the sameSet early-return so the prevPlayerIdRef is always updated.
    const playerChanged =
      playerId !== undefined && prevPlayerIdRef.current !== undefined &&
      playerId !== prevPlayerIdRef.current;

    if (playerChanged) {
      // Save the outgoing player's sort preference.
      const outgoingId = prevPlayerIdRef.current!;
      playerPrefsRef.current[outgoingId] = sortModeRef.current;

      // Restore the incoming player's preference (default: bySuit).
      const incomingMode = playerPrefsRef.current[playerId!] ?? 'bySuit';

      prevPlayerIdRef.current = playerId;
      prevCardsRef.current = cards;

      setNewCard(null);
      setIsCustomOrderSync(false);
      setSortModeSync(incomingMode);
      setOrderedCards(sortCards(cards, incomingMode));
      return;
    }

    prevPlayerIdRef.current = playerId;

    if (sameSet) return;

    prevCardsRef.current = cards;

    const added = cards.filter(c => !prev.includes(c));

    if (added.length >= 2) {
      // Batch deal or round start (same player): reset to By Suit, clear custom order
      setSortModeSync('bySuit');
      setIsCustomOrderSync(false);
      setNewCard(null);
      setOrderedCards(sortCards(cards, 'bySuit'));
    } else if (added.length === 1) {
      const drawn = added[0];
      setNewCard(drawn);
      setOrderedCards(prevOrdered => {
        const kept = prevOrdered.filter(c => cards.includes(c));
        if (!isCustomOrderRef.current) {
          // Insert at correct sorted position
          return sortCards([...kept, drawn], sortModeRef.current);
        }
        // Custom order: append at end
        return [...kept, drawn];
      });
    } else {
      // Card(s) removed (played/discarded): preserve relative order
      setOrderedCards(prevOrdered => prevOrdered.filter(c => cards.includes(c)));
    }
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
    // Mark as custom so future draws append rather than re-sort
    setIsCustomOrderSync(true);
  }

  function sortBySuit() {
    setSortModeSync('bySuit');
    setIsCustomOrderSync(false);
    setNewCard(null);
    setOrderedCards(prev => sortCards(prev, 'bySuit'));
  }

  function sortByRank() {
    setSortModeSync('byRank');
    setIsCustomOrderSync(false);
    setNewCard(null);
    setOrderedCards(prev => sortCards(prev, 'byRank'));
  }

  function clearNewCard() {
    setNewCard(null);
  }

  return { orderedCards, sortMode, isCustomOrder, newCard, moveCard, sortBySuit, sortByRank, clearNewCard };
}
