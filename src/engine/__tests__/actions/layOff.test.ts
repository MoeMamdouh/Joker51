import { layOff } from '../../actions/layOff';
import { placeInitialMeld } from '../../actions/meld';
import { initGame } from '../../deal';
import { Card, GameState, Rank, Suit } from '../../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function stateWithMeldedPlayer(): { state: GameState; combinationId: string } {
  const seq = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
  const set = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];
  let state = initGame({ players: players(2), totalRounds: 4, random: seededRng(20) });
  state = {
    ...state,
    turnState: { activePlayerId: 'p1', phase: 'acting' as any, discardDrawnBeforeMeld: null },
    hands: state.hands.map(h =>
      h.playerId === 'p1' ? { ...h, cards: [...h.cards, ...seq, ...set] } : h
    ),
  };
  const result = placeInitialMeld(state, { playerId: 'p1', combinations: [seq, set] });
  const combinationId = result.state!.tableState.combinations[0].id;
  return { state: result.state!, combinationId };
}

describe('layOff', () => {
  it('adds a card to an existing sequence', () => {
    const { state, combinationId } = stateWithMeldedPlayer();
    const card = c(Rank.NINE, Suit.SPADES);
    const stateWithCard: GameState = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [...h.cards, card] } : h
      ),
    };

    const result = layOff(stateWithCard, { playerId: 'p1', combinationId, card });
    expect(result.success).toBe(true);
    const combo = result.state!.tableState.combinations.find(c => c.id === combinationId)!;
    expect(combo.cards).toContainEqual(card);
    const hand = result.state!.hands.find(h => h.playerId === 'p1')!;
    expect(hand.cards).not.toContainEqual(card);
  });

  it('rejects PLAYER_NOT_YET_MELDED', () => {
    let state = initGame({ players: players(2), totalRounds: 4, random: seededRng(21) });
    state = { ...state, turnState: { activePlayerId: 'p1', phase: 'acting' as any, discardDrawnBeforeMeld: null } };
    const card = c(Rank.FOUR, Suit.CLUBS);
    const result = layOff(state, { playerId: 'p1', combinationId: 'any', card });
    expect(result.success).toBe(false);
    expect(result.error).toBe('PLAYER_NOT_YET_MELDED');
  });

  it('rejects CARD_NOT_IN_HAND', () => {
    const { state, combinationId } = stateWithMeldedPlayer();
    const card = c(Rank.ACE, Suit.CLUBS); // not in hand
    const result = layOff(state, { playerId: 'p1', combinationId, card });
    expect(result.success).toBe(false);
    expect(result.error).toBe('CARD_NOT_IN_HAND');
  });

  it('rejects COMBINATION_NOT_ON_TABLE', () => {
    const { state } = stateWithMeldedPlayer();
    const card = c(Rank.NINE, Suit.SPADES);
    const stateWithCard = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [...h.cards, card] } : h
      ),
    };
    const result = layOff(stateWithCard, { playerId: 'p1', combinationId: 'nonexistent', card });
    expect(result.success).toBe(false);
    expect(result.error).toBe('COMBINATION_NOT_ON_TABLE');
  });

  it('rejects INVALID_COMBINATION when card breaks the combination', () => {
    const { state, combinationId } = stateWithMeldedPlayer();
    const badCard = c(Rank.ACE, Suit.HEARTS); // doesn't extend 6♠7♠8♠
    const stateWithCard = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [...h.cards, badCard] } : h
      ),
    };
    const result = layOff(stateWithCard, { playerId: 'p1', combinationId, card: badCard });
    expect(result.success).toBe(false);
    expect(result.error).toBe('INVALID_COMBINATION');
  });
});
