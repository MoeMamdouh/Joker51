import { calculateRoundScores } from '../scoring';
import { initGame } from '../deal';
import { Card, GameStatus, Rank, Suit } from '../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function baseState(hands: { playerId: string; cards: Card[] }[], meldedIds: string[]) {
  const state = initGame({ players: players(hands.length), totalRounds: 4 });
  return {
    ...state,
    status: GameStatus.ROUND_ENDED,
    hands: hands.map((h, i) => ({ playerId: state.config.players[i].id, cards: h.cards })),
    meldedPlayerIds: meldedIds,
  };
}

describe('calculateRoundScores', () => {
  it('winner receives 0 penalty', () => {
    const state = baseState([
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [c(Rank.KING, Suit.HEARTS)] },
    ], ['p1', 'p2']);
    const result = calculateRoundScores(state, state.config.players[0].id);
    expect(result.scores.find(s => s.playerId === state.config.players[0].id)!.penalty).toBe(0);
  });

  it('melded but not won: penalty = sum of remaining cards', () => {
    // K♥ + 7♦ + A♠ = 10 + 7 + 11 = 28
    const state = baseState([
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [c(Rank.KING, Suit.HEARTS), c(Rank.SEVEN, Suit.DIAMONDS), c(Rank.ACE, Suit.SPADES)] },
    ], ['p1', 'p2']);
    const result = calculateRoundScores(state, state.config.players[0].id);
    expect(result.scores.find(s => s.playerId === state.config.players[1].id)!.penalty).toBe(28);
  });

  it('never melded: flat 100 penalty regardless of hand', () => {
    const state = baseState([
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [c(Rank.ACE, Suit.SPADES), c(Rank.ACE, Suit.HEARTS)] },
    ], ['p1']); // p2 never melded
    const result = calculateRoundScores(state, state.config.players[0].id);
    expect(result.scores.find(s => s.playerId === state.config.players[1].id)!.penalty).toBe(100);
  });

  it('Joker in hand counts as 25 points', () => {
    const state = baseState([
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [joker(), c(Rank.TWO, Suit.CLUBS)] },
    ], ['p1', 'p2']);
    const result = calculateRoundScores(state, state.config.players[0].id);
    expect(result.scores.find(s => s.playerId === state.config.players[1].id)!.penalty).toBe(27);
  });

  it('sets correct winnerId and roundNumber', () => {
    const state = baseState([
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [] },
    ], ['p1', 'p2']);
    const winnerId = state.config.players[0].id;
    const result = calculateRoundScores(state, winnerId);
    expect(result.winnerId).toBe(winnerId);
    expect(result.roundNumber).toBe(1);
  });
});
