import { claimJoker } from '../../actions/claimJoker';
import { initGame } from '../../deal';
import { Card, GameState, Rank, Suit, TurnPhase } from '../../types';

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });

function stateWithJokerOnTable(): { state: GameState; combinationId: string } {
  const state = initGame({ players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }], totalRounds: 4 });
  // 5♣ [Joker] 7♣ on table
  const combinationId = 'combo-1';
  const tableState = {
    combinations: [{
      id: combinationId,
      cards: [c(Rank.FIVE, Suit.CLUBS), joker(), c(Rank.SEVEN, Suit.CLUBS)],
      type: 'sequence' as const,
      ownerId: 'p1',
    }],
  };
  const handWithRealCard: GameState = {
    ...state,
    turnState: { activePlayerId: 'p1', phase: TurnPhase.ACTING },
    meldedPlayerIds: ['p1'],
    tableState,
    hands: state.hands.map(h =>
      h.playerId === 'p1' ? { ...h, cards: [c(Rank.SIX, Suit.CLUBS)] } : h
    ),
  };
  return { state: handWithRealCard, combinationId };
}

describe('claimJoker', () => {
  it('successful claim: Joker moves to hand, real card goes to table', () => {
    const { state, combinationId } = stateWithJokerOnTable();
    const result = claimJoker(state, { playerId: 'p1', combinationId, realCard: c(Rank.SIX, Suit.CLUBS) });

    expect(result.success).toBe(true);
    // Table has real card, no Joker
    const combo = result.state!.tableState.combinations.find(c => c.id === combinationId)!;
    expect(combo.cards).toContainEqual(c(Rank.SIX, Suit.CLUBS));
    expect(combo.cards.some(c => c.isJoker)).toBe(false);
    // Hand has Joker
    const hand = result.state!.hands.find(h => h.playerId === 'p1')!;
    expect(hand.cards.some(c => c.isJoker)).toBe(true);
    // Hand no longer has the real card
    expect(hand.cards).not.toContainEqual(c(Rank.SIX, Suit.CLUBS));
  });

  it('rejects NOT_YOUR_TURN', () => {
    const { state, combinationId } = stateWithJokerOnTable();
    const result = claimJoker(state, { playerId: 'p2', combinationId, realCard: c(Rank.SIX, Suit.CLUBS) });
    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_YOUR_TURN');
  });

  it('rejects JOKER_CLAIM_WRONG_CARD when player holds wrong card', () => {
    const { state, combinationId } = stateWithJokerOnTable();
    const wrongCard = c(Rank.EIGHT, Suit.CLUBS);
    const stateWithWrongCard = {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [wrongCard] } : h
      ),
    };
    const result = claimJoker(stateWithWrongCard, { playerId: 'p1', combinationId, realCard: wrongCard });
    expect(result.success).toBe(false);
    expect(result.error).toBe('JOKER_CLAIM_WRONG_CARD');
  });

  it('rejects JOKER_CLAIM_BREAKS_COMBINATION if result < 3 cards', () => {
    const state = initGame({ players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }], totalRounds: 4 });
    const combinationId = 'combo-2';
    // Only 2 cards after swap: [5♣, joker] → swap joker with 6♣ → [5♣, 6♣] = 2 cards < 3
    const tableState = {
      combinations: [{
        id: combinationId,
        cards: [c(Rank.FIVE, Suit.CLUBS), joker()],
        type: 'sequence' as const,
        ownerId: 'p1',
      }],
    };
    const forcedState: GameState = {
      ...state,
      turnState: { activePlayerId: 'p1', phase: TurnPhase.ACTING },
      meldedPlayerIds: ['p1'],
      tableState,
      hands: state.hands.map(h =>
        h.playerId === 'p1' ? { ...h, cards: [c(Rank.SIX, Suit.CLUBS)] } : h
      ),
    };
    const result = claimJoker(forcedState, { playerId: 'p1', combinationId, realCard: c(Rank.SIX, Suit.CLUBS) });
    expect(result.success).toBe(false);
    expect(result.error).toBe('JOKER_CLAIM_BREAKS_COMBINATION');
  });

  it('claimed Joker is in hand and usable same turn', () => {
    const { state, combinationId } = stateWithJokerOnTable();
    const result = claimJoker(state, { playerId: 'p1', combinationId, realCard: c(Rank.SIX, Suit.CLUBS) });
    const hand = result.state!.hands.find(h => h.playerId === 'p1')!;
    expect(hand.cards.some(c => c.isJoker)).toBe(true);
    // Turn is still in ACTING phase — can use Joker
    expect(result.state!.turnState.phase).toBe(TurnPhase.ACTING);
  });
});
