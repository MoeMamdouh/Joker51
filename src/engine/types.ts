// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Suit {
  SPADES = 'SPADES',
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
}

export enum Rank {
  TWO = 'TWO',
  THREE = 'THREE',
  FOUR = 'FOUR',
  FIVE = 'FIVE',
  SIX = 'SIX',
  SEVEN = 'SEVEN',
  EIGHT = 'EIGHT',
  NINE = 'NINE',
  TEN = 'TEN',
  JACK = 'JACK',
  QUEEN = 'QUEEN',
  KING = 'KING',
  ACE = 'ACE',
}

export enum GameStatus {
  IN_PROGRESS = 'in_progress',
  ROUND_ENDED = 'round_ended',
  GAME_OVER = 'game_over',
}

export enum TurnPhase {
  DRAWING = 'drawing',
  ACTING = 'acting',
}

// ─── Error Codes ──────────────────────────────────────────────────────────────

export type EngineErrorCode =
  | 'NOT_YOUR_TURN'
  | 'WRONG_TURN_PHASE'
  | 'INVALID_COMBINATION'
  | 'COMBINATION_TOO_SHORT'
  | 'SET_TOO_LONG'
  | 'SET_DUPLICATE_SUIT'
  | 'SEQUENCE_MIXED_SUITS'
  | 'SEQUENCE_NOT_CONSECUTIVE'
  | 'ACE_WRAPAROUND'
  | 'JOKER_LIMIT_EXCEEDED'
  | 'MELD_BELOW_51_POINTS'
  | 'PLAYER_NOT_YET_MELDED'
  | 'JOKER_CLAIM_NOT_YOUR_TURN'
  | 'JOKER_CLAIM_WRONG_CARD'
  | 'JOKER_CLAIM_BREAKS_COMBINATION'
  | 'DISCARD_REQUIRED_TO_WIN'
  | 'CARD_NOT_IN_HAND'
  | 'COMBINATION_NOT_ON_TABLE';

// ─── Point Values ─────────────────────────────────────────────────────────────

export const RANK_POINTS: Record<Rank, number> = {
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 10,
  [Rank.QUEEN]: 10,
  [Rank.KING]: 10,
  [Rank.ACE]: 11,
};

export const RANK_ORDER: Rank[] = [
  Rank.ACE,
  Rank.TWO,
  Rank.THREE,
  Rank.FOUR,
  Rank.FIVE,
  Rank.SIX,
  Rank.SEVEN,
  Rank.EIGHT,
  Rank.NINE,
  Rank.TEN,
  Rank.JACK,
  Rank.QUEEN,
  Rank.KING,
];

export const JOKER_HAND_PENALTY = 25;

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Card {
  readonly rank: Rank | null;
  readonly suit: Suit | null;
  readonly isJoker: boolean;
}

export interface Combination {
  readonly id: string;
  readonly cards: readonly Card[];
  readonly type: 'sequence' | 'set';
  readonly ownerId: string;
}

export interface Hand {
  readonly playerId: string;
  readonly cards: readonly Card[];
}

export interface DrawPile {
  readonly cards: readonly Card[];
}

export interface DiscardPile {
  readonly cards: readonly Card[];
}

export interface TableState {
  readonly combinations: readonly Combination[];
}

export interface TurnState {
  readonly activePlayerId: string;
  readonly phase: TurnPhase;
}

export interface RoundResult {
  readonly roundNumber: number;
  readonly scores: readonly { playerId: string; penalty: number }[];
  readonly winnerId: string;
}

export interface PlayerConfig {
  readonly id: string;
  readonly name: string;
}

export interface GameConfig {
  readonly players: readonly PlayerConfig[];
  readonly totalRounds: 4 | 8 | 12;
  readonly random?: () => number;
}

export interface GameState {
  readonly config: GameConfig;
  readonly status: GameStatus;
  readonly currentRound: number;
  readonly hands: readonly Hand[];
  readonly drawPile: DrawPile;
  readonly discardPile: DiscardPile;
  readonly tableState: TableState;
  readonly turnState: TurnState;
  readonly meldedPlayerIds: readonly string[];
  readonly roundResults: readonly RoundResult[];
  readonly deckCount: number;
}

export interface ActionResult {
  readonly success: boolean;
  readonly state?: GameState;
  readonly error?: EngineErrorCode;
}
