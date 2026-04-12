import { dealCards } from '../deal';
import { createDeck, deckCountForPlayers } from '../deck';

describe('dealCards', () => {
  it('each player gets exactly 14 cards', () => {
    const deck = createDeck(1);
    const { hands } = dealCards(deck, 2);
    hands.forEach(h => expect(h.cards).toHaveLength(14));
  });

  it('discard pile has exactly 1 card', () => {
    const deck = createDeck(1);
    const { discardPile } = dealCards(deck, 2);
    expect(discardPile.cards).toHaveLength(1);
  });

  it('total card count is preserved', () => {
    const deck = createDeck(2);
    const { hands, drawPile, discardPile } = dealCards(deck, 4);
    const total = hands.reduce((s, h) => s + h.cards.length, 0)
      + drawPile.cards.length
      + discardPile.cards.length;
    expect(total).toBe(deck.length);
  });

  it.each([
    [2, 1], [3, 1],
    [4, 2], [5, 2], [6, 2],
    [7, 3], [8, 3],
  ])('%i players: draw pile matches formula', (players, decks) => {
    const deck = createDeck(decks);
    const { drawPile } = dealCards(deck, players);
    const expected = deck.length - players * 14 - 1;
    expect(drawPile.cards).toHaveLength(expected);
  });

  it('hands have correct playerIds', () => {
    const deck = createDeck(1);
    const { hands } = dealCards(deck, 3);
    expect(hands).toHaveLength(3);
    hands.forEach((h, i) => expect(h.playerId).toBe(`player_${i}`));
  });
});
