import { ActionResult, GameState, TurnPhase } from '../types';
import { handleDrawPileExhaustion } from '../reshuffle';

export function draw(
  state: GameState,
  params: { playerId: string; source: 'draw_pile' | 'discard_pile' }
): ActionResult {
  if (state.turnState.activePlayerId !== params.playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.DRAWING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }

  const { source, playerId } = params;

  if (source === 'draw_pile') {
    const currentState = state.drawPile.cards.length === 0
      ? handleDrawPileExhaustion(state)
      : state;
    const drawCards = [...currentState.drawPile.cards];
    const drawnCard = drawCards.shift()!;

    const hands = currentState.hands.map(h =>
      h.playerId === playerId ? { ...h, cards: [...h.cards, drawnCard] } : h
    );

    return {
      success: true,
      state: {
        ...currentState,
        hands,
        drawPile: { cards: drawCards },
        turnState: { ...state.turnState, phase: TurnPhase.ACTING },
      },
    };
  } else {
    const discardCards = [...state.discardPile.cards];
    const drawnCard = discardCards.shift()!;

    const hands = state.hands.map(h =>
      h.playerId === playerId ? { ...h, cards: [...h.cards, drawnCard] } : h
    );

    return {
      success: true,
      state: {
        ...state,
        hands,
        discardPile: { cards: discardCards },
        turnState: { ...state.turnState, phase: TurnPhase.ACTING },
      },
    };
  }
}
