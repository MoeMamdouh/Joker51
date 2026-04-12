import { placeCombinations } from '../../actions/placeCombinations';
import { placeInitialMeld } from '../../actions/meld';
import { initGame } from '../../deal';
import { Card, GameState, Rank, Suit } from '../../types';

const mk = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const players = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

function meldedState(): GameState {
  const meldSeq = [mk(Rank.SIX, Suit.SPADES), mk(Rank.SEVEN, Suit.SPADES), mk(Rank.EIGHT, Suit.SPADES)];
  const meldSet = [mk(Rank.TEN, Suit.DIAMONDS), mk(Rank.TEN, Suit.CLUBS), mk(Rank.TEN, Suit.HEARTS)];
  let state = initGame({ players: players(2), totalRounds: 4, random: seededRng(42) });
  state = {
    ...state,
    turnState: { activePlayerId: 'p1', phase: 'acting' as any, discardDrawnBeforeMeld: null },
    hands: state.hands.map(h =>
      h.playerId === 'p1' ? { ...h, cards: [...h.cards, ...meldSeq, ...meldSet] } : h
    ),
  };
  const r = placeInitialMeld(state, { playerId: 'p1', combinations: [meldSeq, meldSet] });
  return r.state!;
}

describe('placeCombinations — sorted output', () => {
  it('sequence submitted out-of-order is stored sorted ascending', () => {
    const state = meldedState();
    const outOfOrder = [mk(Rank.KING, Suit.HEARTS), mk(Rank.JACK, Suit.HEARTS), mk(Rank.QUEEN, Suit.HEARTS)];
    const stateWithCards: GameState = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [...h.cards, ...outOfOrder] } : h
      ),
    };
    const result = placeCombinations(stateWithCards, { playerId: 'p1', combinations: [outOfOrder] });
    expect(result.success).toBe(true);
    const newCombo = result.state!.tableState.combinations[result.state!.tableState.combinations.length - 1];
    expect(newCombo.cards.map((card: Card) => card.rank)).toEqual([Rank.JACK, Rank.QUEEN, Rank.KING]);
  });

  it('set submitted in any suit order is stored in fixed suit order', () => {
    const state = meldedState();
    const outOfOrder = [mk(Rank.ACE, Suit.CLUBS), mk(Rank.ACE, Suit.SPADES), mk(Rank.ACE, Suit.HEARTS)];
    const stateWithCards: GameState = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [...h.cards, ...outOfOrder] } : h
      ),
    };
    const result = placeCombinations(stateWithCards, { playerId: 'p1', combinations: [outOfOrder] });
    expect(result.success).toBe(true);
    const newCombo = result.state!.tableState.combinations[result.state!.tableState.combinations.length - 1];
    expect(newCombo.cards.map((card: Card) => card.suit)).toEqual([Suit.SPADES, Suit.HEARTS, Suit.CLUBS]);
  });
});
