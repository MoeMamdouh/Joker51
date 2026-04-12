import { initGame } from '../deal';
import { draw } from '../actions/draw';
import { discard } from '../actions/discard';
import { GameState, GameStatus, TurnPhase } from '../types';

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function simulateGame(seed: number): number {
  const rng = seededRng(seed);
  let state: GameState = initGame({
    players: [
      { id: 'p1', name: 'P1' },
      { id: 'p2', name: 'P2' },
      { id: 'p3', name: 'P3' },
      { id: 'p4', name: 'P4' },
    ],
    totalRounds: 4,
    random: rng,
  });

  let turns = 0;
  while (state.status === GameStatus.IN_PROGRESS && turns < 500) {
    const { activePlayerId, phase } = state.turnState;
    if (phase === TurnPhase.DRAWING) {
      const r = draw(state, { playerId: activePlayerId, source: 'draw_pile' });
      if (!r.success) break;
      state = r.state!;
    } else {
      const hand = state.hands.find(h => h.playerId === activePlayerId)!;
      if (hand.cards.length === 0) break;
      const r = discard(state, { playerId: activePlayerId, card: hand.cards[0] });
      if (!r.success) break;
      state = r.state!;
    }
    turns++;
  }
  return turns;
}

describe('Engine performance', () => {
  it('simulates 100 games in under 5 seconds', () => {
    const start = Date.now();
    let totalTurns = 0;
    for (let i = 0; i < 100; i++) {
      totalTurns += simulateGame(i * 7 + 1);
    }
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
    expect(totalTurns).toBeGreaterThan(0);
  });
});
