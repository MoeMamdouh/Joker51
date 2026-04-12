import { GameState, JOKER_HAND_PENALTY, RANK_POINTS, RoundResult } from './types';

export function calculateRoundScores(state: GameState, winnerId: string): RoundResult {
  const scores = state.hands.map(hand => {
    if (hand.playerId === winnerId) return { playerId: hand.playerId, penalty: 0 };

    const hasMelded = state.meldedPlayerIds.includes(hand.playerId);
    if (!hasMelded) return { playerId: hand.playerId, penalty: 100 };

    const penalty = hand.cards.reduce((sum, card) => {
      if (card.isJoker) return sum + JOKER_HAND_PENALTY;
      return sum + RANK_POINTS[card.rank!];
    }, 0);

    return { playerId: hand.playerId, penalty };
  });

  return { roundNumber: state.currentRound, scores, winnerId };
}
