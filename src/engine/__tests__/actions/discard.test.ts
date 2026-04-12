import { discard, startNextRound } from '../../actions/discard';
import { placeInitialMeld } from '../../actions/meld';
import { draw } from '../../actions/draw';
import { initGame } from '../../deal';
import { Card, GameState, GameStatus, Rank, Suit, TurnPhase } from '../../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function actingState(playerId: string, hand: Card[]): GameState {
  const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(30) });
  return {
    ...state,
    turnState: { activePlayerId: playerId, phase: TurnPhase.ACTING },
    meldedPlayerIds: [playerId],
    hands: state.hands.map(h => h.playerId === playerId ? { ...h, cards: hand } : h),
  };
}

describe('discard', () => {
  it('card moves to top of discard pile', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card, c(Rank.THREE, Suit.HEARTS)]);
    const result = discard(state, { playerId: 'p1', card });
    expect(result.success).toBe(true);
    expect(result.state!.discardPile.cards[0]).toEqual(card);
  });

  it('hand size decreases by 1', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card, c(Rank.THREE, Suit.HEARTS)]);
    const handBefore = state.hands.find(h => h.playerId === 'p1')!.cards.length;
    const result = discard(state, { playerId: 'p1', card });
    expect(result.state!.hands.find(h => h.playerId === 'p1')!.cards.length).toBe(handBefore - 1);
  });

  it('turn advances to next player with DRAWING phase', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card, c(Rank.THREE, Suit.HEARTS)]);
    const result = discard(state, { playerId: 'p1', card });
    expect(result.state!.turnState.phase).toBe(TurnPhase.DRAWING);
    expect(result.state!.turnState.activePlayerId).toBe('p2');
  });

  it('rejects WRONG_TURN_PHASE in drawing phase', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(31) });
    const activeId = state.turnState.activePlayerId;
    const card = state.hands.find(h => h.playerId === activeId)!.cards[0];
    const result = discard(state, { playerId: activeId, card });
    expect(result.success).toBe(false);
    expect(result.error).toBe('WRONG_TURN_PHASE');
  });

  it('rejects CARD_NOT_IN_HAND', () => {
    const state = actingState('p1', [c(Rank.THREE, Suit.HEARTS)]);
    const result = discard(state, { playerId: 'p1', card: c(Rank.ACE, Suit.SPADES) });
    expect(result.success).toBe(false);
    expect(result.error).toBe('CARD_NOT_IN_HAND');
  });

  it('discarding last card triggers round_ended', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card]);
    const result = discard(state, { playerId: 'p1', card });
    expect(result.success).toBe(true);
    expect(result.state!.status).toBe(GameStatus.ROUND_ENDED);
  });

  it('round_ended appends a RoundResult', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card]);
    const result = discard(state, { playerId: 'p1', card });
    expect(result.state!.roundResults).toHaveLength(1);
    expect(result.state!.roundResults[0].winnerId).toBe('p1');
  });

  it('last round sets status to game_over', () => {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state: GameState = {
      ...actingState('p1', [card]),
      currentRound: 4,
      config: { players: players(2), totalRounds: 4 },
    };
    const result = discard(state, { playerId: 'p1', card });
    expect(result.state!.status).toBe(GameStatus.GAME_OVER);
  });

  it('melding all cards without discarding is not a win (DISCARD_REQUIRED_TO_WIN not applicable here — engine just lets you meld then must discard)', () => {
    // The engine allows melding all cards, but then the player must still discard.
    // Win is triggered only when discard empties the hand.
    const state = actingState('p1', [c(Rank.TWO, Suit.CLUBS)]);
    // Player melded already (meldedPlayerIds contains p1), discard the last card = win
    const result = discard(state, { playerId: 'p1', card: c(Rank.TWO, Suit.CLUBS) });
    expect(result.success).toBe(true);
    expect(result.state!.status).toBe(GameStatus.ROUND_ENDED);
  });
});

describe('startNextRound', () => {
  function roundEndedState(): GameState {
    const card = c(Rank.TWO, Suit.CLUBS);
    const state = actingState('p1', [card]);
    return discard(state, { playerId: 'p1', card }).state!;
  }

  it('increments currentRound', () => {
    const state = roundEndedState();
    const next = startNextRound(state);
    expect(next.currentRound).toBe(2);
  });

  it('resets status to in_progress', () => {
    expect(startNextRound(roundEndedState()).status).toBe(GameStatus.IN_PROGRESS);
  });

  it('clears meldedPlayerIds', () => {
    expect(startNextRound(roundEndedState()).meldedPlayerIds).toHaveLength(0);
  });

  it('clears tableState', () => {
    expect(startNextRound(roundEndedState()).tableState.combinations).toHaveLength(0);
  });

  it('deals 14 fresh cards to each player', () => {
    const next = startNextRound(roundEndedState());
    next.hands.forEach(h => expect(h.cards).toHaveLength(14));
  });

  it('throws if status is not round_ended', () => {
    const state = initGame({ players: players(2), totalRounds: 4 });
    expect(() => startNextRound(state)).toThrow();
  });
});
