import { Card, Rank, Suit } from './types';

export function deckCountForPlayers(playerCount: number): number {
  if (playerCount <= 3) return 1;
  if (playerCount <= 6) return 2;
  return 3;
}

export function createDeck(deckCount: number): Card[] {
  const cards: Card[] = [];
  const suits = Object.values(Suit);
  const ranks = Object.values(Rank);

  for (let d = 0; d < deckCount; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push({ rank, suit, isJoker: false });
      }
    }
    // 2 Jokers per deck
    cards.push({ rank: null, suit: null, isJoker: true });
    cards.push({ rank: null, suit: null, isJoker: true });
  }

  return cards;
}

export function shuffle(cards: Card[], random: () => number = Math.random): Card[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
