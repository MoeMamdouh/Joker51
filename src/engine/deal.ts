import { Card, DrawPile, DiscardPile, Hand, GameConfig, GameState, GameStatus, TurnPhase } from './types';
import { createDeck, deckCountForPlayers, shuffle } from './deck';

export function initGame(config: GameConfig): GameState {
  const playerCount = config.players.length;
  if (playerCount < 2 || playerCount > 8) {
    throw new Error(`Player count must be between 2 and 8, got ${playerCount}`);
  }
  if (![4, 8, 12].includes(config.totalRounds)) {
    throw new Error(`totalRounds must be 4, 8, or 12, got ${config.totalRounds}`);
  }

  const deckCount = deckCountForPlayers(playerCount);
  const deck = shuffle(createDeck(deckCount), config.random);
  const { hands: rawHands, drawPile, discardPile } = dealCards(deck, playerCount);

  // Replace placeholder playerIds with real ones from config
  const hands: Hand[] = rawHands.map((h, i) => ({
    playerId: config.players[i].id,
    cards: h.cards,
  }));

  // Pick a random starting player
  const startIndex = Math.floor((config.random ?? Math.random)() * playerCount);
  const activePlayerId = config.players[startIndex].id;

  return {
    config,
    status: GameStatus.IN_PROGRESS,
    currentRound: 1,
    hands,
    drawPile,
    discardPile,
    tableState: { combinations: [] },
    turnState: { activePlayerId, phase: TurnPhase.DRAWING },
    meldedPlayerIds: [],
    roundResults: [],
    deckCount,
  };
}

export function dealCards(
  deck: Card[],
  playerCount: number
): { hands: Hand[]; drawPile: DrawPile; discardPile: DiscardPile } {
  const remaining = [...deck];

  const hands: Hand[] = Array.from({ length: playerCount }, (_, i) => ({
    playerId: `player_${i}`,
    cards: remaining.splice(0, 14),
  }));

  const discardPile: DiscardPile = { cards: [remaining.splice(0, 1)[0]] };
  const drawPile: DrawPile = { cards: remaining };

  return { hands, drawPile, discardPile };
}
