import { initGame } from '../deal';
import { GameStatus, TurnPhase } from '../types';

const players = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `Player ${i + 1}` }));

describe('initGame', () => {
  it('returns status in_progress and round 1', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(state.status).toBe(GameStatus.IN_PROGRESS);
    expect(state.currentRound).toBe(1);
  });

  it('each player has 14 cards', () => {
    const state = initGame({ players: players(3), totalRounds: 4 });
    state.hands.forEach(h => expect(h.cards).toHaveLength(14));
  });

  it('discard pile has 1 card', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(state.discardPile.cards).toHaveLength(1);
  });

  it('2-player game uses 1 deck, draw pile = 25', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(state.deckCount).toBe(1);
    expect(state.drawPile.cards).toHaveLength(25);
  });

  it('3-player game uses 1 deck, draw pile = 11', () => {
    const state = initGame({ players: players(3), totalRounds: 4 });
    expect(state.deckCount).toBe(1);
    expect(state.drawPile.cards).toHaveLength(11);
  });

  it('4-player game uses 2 decks, draw pile = 51', () => {
    const state = initGame({ players: players(4), totalRounds: 4 });
    expect(state.deckCount).toBe(2);
    expect(state.drawPile.cards).toHaveLength(51);
  });

  it('8-player game uses 3 decks', () => {
    const state = initGame({ players: players(8), totalRounds: 4 });
    expect(state.deckCount).toBe(3);
  });

  it('player ids from config are used in hands', () => {
    const state = initGame({ players: players(3), totalRounds: 4 });
    const handIds = state.hands.map(h => h.playerId).sort();
    expect(handIds).toEqual(['p1', 'p2', 'p3']);
  });

  it('first active player is set', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(['p1', 'p2']).toContain(state.turnState.activePlayerId);
    expect(state.turnState.phase).toBe(TurnPhase.DRAWING);
  });

  it('meldedPlayerIds starts empty', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(state.meldedPlayerIds).toHaveLength(0);
  });

  it('tableState starts empty', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(state.tableState.combinations).toHaveLength(0);
  });

  it('seeded RNG produces deterministic deal', () => {
    const rng1 = seededRng(42);
    const s1 = initGame({ players: players(2), totalRounds: 4, random: rng1 });
    const rng2 = seededRng(42);
    const s2 = initGame({ players: players(2), totalRounds: 4, random: rng2 });
    expect(s1.hands[0].cards[0]).toEqual(s2.hands[0].cards[0]);
  });

  it('throws on fewer than 2 players', () => {
    expect(() => initGame({ players: players(1), totalRounds: 4 })).toThrow();
  });

  it('throws on more than 8 players', () => {
    expect(() => initGame({ players: players(9), totalRounds: 4 })).toThrow();
  });

  it('throws on invalid totalRounds', () => {
    expect(() => initGame({ players: players(2), totalRounds: 5 as 4 })).toThrow();
  });
});

function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
