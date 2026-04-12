import { GameState } from './types';
import { isFullSet, isFullSequence } from './validation';
import { shuffle } from './deck';

export function handleDrawPileExhaustion(state: GameState): GameState {
  // Preserve the top card of the discard pile
  const topCard = state.discardPile.cards[0];
  const reshuffleCards = state.discardPile.cards.slice(1);

  // Identify and remove full combinations from the table
  const remainingCombinations = state.tableState.combinations.filter(
    combo => !isFullSet(combo) && !isFullSequence(combo)
  );
  const clearedCombinations = state.tableState.combinations.filter(
    combo => isFullSet(combo) || isFullSequence(combo)
  );

  // Collect cards from cleared combinations
  for (const combo of clearedCombinations) {
    reshuffleCards.push(...combo.cards);
  }

  const random = state.config.random ?? Math.random;
  const newDrawPile = shuffle(reshuffleCards, random);

  return {
    ...state,
    drawPile: { cards: newDrawPile },
    discardPile: { cards: [topCard] },
    tableState: { combinations: remainingCombinations },
  };
}
