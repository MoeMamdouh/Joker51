import { draw } from '../../actions/draw';
import { initGame } from '../../deal';
import { TurnPhase } from '../../types';

const players = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `P${i + 1}` }));

function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

describe('draw', () => {
  it('drawing from draw pile increases hand by 1 and decreases draw pile by 1', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(1) });
    const activeId = state.turnState.activePlayerId;
    const handBefore = state.hands.find(h => h.playerId === activeId)!.cards.length;
    const pileBefore = state.drawPile.cards.length;

    const result = draw(state, { playerId: activeId, source: 'draw_pile' });

    expect(result.success).toBe(true);
    const newHand = result.state!.hands.find(h => h.playerId === activeId)!.cards.length;
    expect(newHand).toBe(handBefore + 1);
    expect(result.state!.drawPile.cards.length).toBe(pileBefore - 1);
  });

  it('drawing from discard pile takes the top card', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(2) });
    const activeId = state.turnState.activePlayerId;
    const topCard = state.discardPile.cards[0];
    const discardSizeBefore = state.discardPile.cards.length;

    const result = draw(state, { playerId: activeId, source: 'discard_pile' });

    expect(result.success).toBe(true);
    const newHand = result.state!.hands.find(h => h.playerId === activeId)!;
    expect(newHand.cards).toContainEqual(topCard);
    expect(result.state!.discardPile.cards.length).toBe(discardSizeBefore - 1);
  });

  it('phase advances to ACTING after draw', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(3) });
    const activeId = state.turnState.activePlayerId;
    const result = draw(state, { playerId: activeId, source: 'draw_pile' });
    expect(result.state!.turnState.phase).toBe(TurnPhase.ACTING);
  });

  it('rejects NOT_YOUR_TURN when wrong player draws', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(4) });
    const activeId = state.turnState.activePlayerId;
    const otherId = state.config.players.find(p => p.id !== activeId)!.id;
    const result = draw(state, { playerId: otherId, source: 'draw_pile' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('NOT_YOUR_TURN');
  });

  it('rejects WRONG_TURN_PHASE if already drawn', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(5) });
    const activeId = state.turnState.activePlayerId;
    const afterDraw = draw(state, { playerId: activeId, source: 'draw_pile' }).state!;
    const result = draw(afterDraw, { playerId: activeId, source: 'draw_pile' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('WRONG_TURN_PHASE');
  });

  it('original state is not mutated', () => {
    const state = initGame({ players: players(2), totalRounds: 4, random: seededRng(6) });
    const activeId = state.turnState.activePlayerId;
    const originalPileSize = state.drawPile.cards.length;
    draw(state, { playerId: activeId, source: 'draw_pile' });
    expect(state.drawPile.cards.length).toBe(originalPileSize);
  });
});
