import { handleDrawPileExhaustion } from '../reshuffle';
import { initGame } from '../deal';
import { Card, GameState, Rank, Suit } from '../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });

function emptyDrawPileState(): GameState {
  const state = initGame({ players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }], totalRounds: 4 });
  return {
    ...state,
    drawPile: { cards: [] },
    discardPile: {
      cards: [
        c(Rank.TWO, Suit.CLUBS), c(Rank.THREE, Suit.CLUBS), c(Rank.FOUR, Suit.CLUBS),
        c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS),
      ],
    },
  };
}

describe('handleDrawPileExhaustion', () => {
  it('discard pile (minus top card) becomes new draw pile', () => {
    const state = emptyDrawPileState();
    const topCard = state.discardPile.cards[0];
    const result = handleDrawPileExhaustion(state);

    // New draw pile has 4 cards (discardPile had 5, keep top as new discard)
    expect(result.drawPile.cards.length).toBe(4);
    // New discard pile has 1 card (the preserved top)
    expect(result.discardPile.cards).toHaveLength(1);
    expect(result.discardPile.cards[0]).toEqual(topCard);
  });

  it('total card count is preserved after reshuffle', () => {
    const state = emptyDrawPileState();
    const totalBefore = state.drawPile.cards.length + state.discardPile.cards.length
      + state.hands.reduce((s, h) => s + h.cards.length, 0)
      + state.tableState.combinations.reduce((s, c) => s + c.cards.length, 0);
    const result = handleDrawPileExhaustion(state);
    const totalAfter = result.drawPile.cards.length + result.discardPile.cards.length
      + result.hands.reduce((s, h) => s + h.cards.length, 0)
      + result.tableState.combinations.reduce((s, c) => s + c.cards.length, 0);
    expect(totalAfter).toBe(totalBefore);
  });

  it('full set (all 4 suits) on table is cleared into draw pile at reshuffle', () => {
    const state = emptyDrawPileState();
    const fullSetCards = [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS), c(Rank.NINE, Suit.CLUBS)];
    const stateWithFullSet: GameState = {
      ...state,
      tableState: {
        combinations: [{
          id: 'full-set', cards: fullSetCards, type: 'set', ownerId: 'p1',
        }],
      },
    };
    const result = handleDrawPileExhaustion(stateWithFullSet);
    // Full set removed from table
    expect(result.tableState.combinations).toHaveLength(0);
    // Those 4 cards are now in the draw pile
    expect(result.drawPile.cards.length).toBe(4 + 4); // 4 from discard + 4 from set
  });

  it('full A→K sequence on table is cleared at reshuffle', () => {
    const state = emptyDrawPileState();
    const allRanks = Object.values(Rank);
    const fullSeqCards = allRanks.map(r => c(r, Suit.HEARTS));
    const stateWithFullSeq: GameState = {
      ...state,
      tableState: {
        combinations: [{
          id: 'full-seq', cards: fullSeqCards, type: 'sequence', ownerId: 'p1',
        }],
      },
    };
    const result = handleDrawPileExhaustion(stateWithFullSeq);
    expect(result.tableState.combinations).toHaveLength(0);
    expect(result.drawPile.cards.length).toBe(4 + 13);
  });

  it('partial combination is NOT cleared at reshuffle', () => {
    const state = emptyDrawPileState();
    const partialSet = [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS)];
    const stateWithPartial: GameState = {
      ...state,
      tableState: {
        combinations: [{ id: 'partial', cards: partialSet, type: 'set', ownerId: 'p1' }],
      },
    };
    const result = handleDrawPileExhaustion(stateWithPartial);
    expect(result.tableState.combinations).toHaveLength(1);
  });
});
