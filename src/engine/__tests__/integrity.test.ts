import { initGame } from '../deal';
import { draw } from '../actions/draw';
import { discard } from '../actions/discard';
import { GameState, GameStatus, TurnPhase } from '../types';

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function countAllCards(state: GameState): number {
  return (
    state.drawPile.cards.length +
    state.discardPile.cards.length +
    state.hands.reduce((s, h) => s + h.cards.length, 0) +
    state.tableState.combinations.reduce((s, c) => s + c.cards.length, 0)
  );
}

describe('Game state integrity', () => {
  it('total card count is preserved across 1000 random turns', () => {
    const rng = seededRng(42);
    let state = initGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
        { id: 'p3', name: 'P3' },
      ],
      totalRounds: 4,
      random: rng,
    });

    const expectedTotal = countAllCards(state);

    for (let turn = 0; turn < 1000; turn++) {
      if (state.status !== GameStatus.IN_PROGRESS) break;

      const { activePlayerId, phase } = state.turnState;

      if (phase === TurnPhase.DRAWING) {
        // Draw from draw pile (triggers reshuffle if empty)
        const result = draw(state, { playerId: activePlayerId, source: 'draw_pile' });
        if (!result.success) break;
        state = result.state!;
      } else {
        // Discard first card from hand
        const hand = state.hands.find(h => h.playerId === activePlayerId)!;
        if (hand.cards.length === 0) break;
        const cardToDiscard = hand.cards[0];
        const result = discard(state, { playerId: activePlayerId, card: cardToDiscard });
        if (!result.success) break;
        state = result.state!;
      }

      const currentTotal = countAllCards(state);
      expect(currentTotal).toBe(expectedTotal);
    }
  });

  it('no duplicate cards in state after deal', () => {
    const state = initGame({
      players: [
        { id: 'p1', name: 'P1' },
        { id: 'p2', name: 'P2' },
      ],
      totalRounds: 4,
    });

    const allCards = [
      ...state.drawPile.cards,
      ...state.discardPile.cards,
      ...state.hands.flatMap(h => h.cards),
    ];

    // Count non-Joker cards by rank+suit — each should appear at most deckCount times
    const seen = new Map<string, number>();
    for (const card of allCards) {
      if (card.isJoker) continue;
      const key = `${card.rank}-${card.suit}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }

    for (const [key, count] of seen.entries()) {
      expect(count).toBeLessThanOrEqual(state.deckCount);
    }
  });
});
