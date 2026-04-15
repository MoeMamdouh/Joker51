import { placeInitialMeld } from '../../actions/meld';
import { draw } from '../../actions/draw';
import { initGame } from '../../deal';
import { Card, GameState, Rank, Suit } from '../../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function stateInActingPhase(playerId: string, handCards: Card[] = []): GameState {
  const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(10) });
  return {
    ...state,
    turnState: { activePlayerId: playerId, phase: 'acting' as any, discardDrawnBeforeMeld: null },
    hands: state.hands.map(h =>
      h.playerId === playerId ? { ...h, cards: handCards } : h
    ),
  };
}

describe('placeInitialMeld', () => {
  it('valid 51-point meld is accepted', () => {
    // 6♠7♠8♠ (21pts) + 10♦10♣10♥ (30pts) = 51
    const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
    const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
    const state = stateInActingPhase('p1', [...seq, ...set]);

    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
    expect(result.success).toBe(true);
    expect(result.state!.meldedPlayerIds).toContain('p1');
    // Cards removed from hand
    const handAfter = result.state!.hands.find(h => h.playerId === 'p1')!.cards;
    seq.forEach(card => expect(handAfter).not.toContainEqual(card));
    // Combinations appear on table
    expect(result.state!.tableState.combinations).toHaveLength(2);
  });

  it('rejects MELD_BELOW_51_POINTS when total < 51', () => {
    // 5♣6♣7♣ (18pts) + 9♠9♥9♦ (27pts) = 45pts < 51
    const seq = [c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS)];
    const set = [c(Rank.NINE, Suit.SPADES), c(Rank.NINE, Suit.HEARTS), c(Rank.NINE, Suit.DIAMONDS)];
    const state = stateInActingPhase('p1', [...seq, ...set]);

    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
    expect(result.success).toBe(false);
    expect(result.error).toBe('MELD_BELOW_51_POINTS');
  });

  it('rejects INVALID_COMBINATION for bad combination', () => {
    const badCombo = [c(Rank.FIVE, Suit.CLUBS), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.CLUBS)];
    const state = stateInActingPhase('p1', badCombo);
    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [badCombo] });
    expect(result.success).toBe(false);
  });

  it('rejects CARD_NOT_IN_HAND', () => {
    const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
    const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
    // Don't add cards to hand
    const state = stateInActingPhase('p1');
    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
    expect(result.success).toBe(false);
    expect(result.error).toBe('CARD_NOT_IN_HAND');
  });

  it('rejects NOT_YOUR_TURN', () => {
    const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
    const state = stateInActingPhase('p1');
    const result = placeInitialMeld(state, { playerId: 'p2', combinations: [seq] });
    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_YOUR_TURN');
  });

  it('allows 2 Jokers in one combination during initial meld', () => {
    // 2 jokers + 7♣ is a valid set (jokers substitute missing suits); points counted
    const combo = [joker(), joker(), c(Rank.SEVEN, Suit.CLUBS)];
    const state = stateInActingPhase('p1', combo);
    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [combo] });
    // The combo only scores ~21 pts, so the initial meld fails on points, not on joker count
    expect(result.success).toBe(false);
    expect(result.error).toBe('MELD_BELOW_51_POINTS');
  });
});

describe('placeInitialMeld — sorted output', () => {
  it('sequence submitted out-of-order is stored sorted ascending', () => {
    // Submit 8♠ 6♠ 7♠ — should be stored as 6♠ 7♠ 8♠
    const seq = [c(Rank.EIGHT, Suit.SPADES), c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES)];
    const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
    const state = stateInActingPhase('p1', [...seq, ...set]);
    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
    expect(result.success).toBe(true);
    const seqCombo = result.state!.tableState.combinations[0];
    expect(seqCombo.cards.map((card: Card) => card.rank)).toEqual([Rank.SIX, Rank.SEVEN, Rank.EIGHT]);
  });

  it('set submitted out-of-suit-order is stored in SPADES→HEARTS→DIAMONDS→CLUBS order', () => {
    // Submit 10♦ 10♣ 10♥ — should be stored as 10♥ 10♦ 10♣ (HEARTS→DIAMONDS→CLUBS, no SPADES)
    const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
    const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
    const state = stateInActingPhase('p1', [...seq, ...set]);
    const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
    expect(result.success).toBe(true);
    const setCombo = result.state!.tableState.combinations[1];
    expect(setCombo.cards.map((card: Card) => card.suit)).toEqual([Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS]);
  });
});
