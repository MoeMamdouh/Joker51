import { layOff } from '../actions/layOff';
import { Card, Combination, GameState, GameStatus, Rank, Suit, TurnPhase } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });
const joker = (): Card => ({ rank: null, suit: null, isJoker: true });

/**
 * Builds a minimal GameState for layoff testing.
 * - One combination on the table owned by p2 (the non-active player)
 * - Active player is p1, in ACTING phase, already melded
 * - p1's hand contains the provided cards
 */
function makeState(
  tableCombination: { cards: Card[]; type: 'sequence' | 'set' },
  hand: Card[]
): GameState {
  const combination: Combination = {
    id: 'combo-1',
    type: tableCombination.type,
    ownerId: 'p2',
    cards: tableCombination.cards,
  };

  return {
    config: {
      players: [
        { id: 'p1', name: 'Player 1' },
        { id: 'p2', name: 'Player 2' },
      ],
      totalRounds: 4,
    },
    status: GameStatus.IN_PROGRESS,
    currentRound: 1,
    hands: [
      { playerId: 'p1', cards: hand },
      { playerId: 'p2', cards: [] },
    ],
    drawPile: { cards: [] },
    discardPile: { cards: [] },
    tableState: { combinations: [combination] },
    turnState: {
      activePlayerId: 'p1',
      phase: TurnPhase.ACTING,
      discardDrawnBeforeMeld: null,
    },
    meldedPlayerIds: ['p1'],
    roundResults: [],
    deckCount: 1,
  };
}

// ─── Ace after natural King ───────────────────────────────────────────────────

describe('layOff — Ace after natural King', () => {
  it('accepts Ace laid off onto J-Q-K (US1: natural King)', () => {
    const state = makeState(
      { cards: [c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    expect(result.success).toBe(true);
  });

  it('accepts Ace laid off onto 10-Joker-Q-K (US1: natural King with internal Joker)', () => {
    const state = makeState(
      { cards: [c(Rank.TEN, Suit.HEARTS), joker(), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    expect(result.success).toBe(true);
  });

  it('accepts Ace laid off onto Q-K (minimal natural King ending)', () => {
    const state = makeState(
      { cards: [c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    // Q-K is only 2 cards; adding Ace makes it 3 — valid sequence
    expect(result.success).toBe(true);
  });
});

// ─── Ace after Joker-as-King ──────────────────────────────────────────────────

describe('layOff — Ace after Joker representing King', () => {
  it('accepts Ace laid off onto J-Q-Joker (US2: Joker as King)', () => {
    const state = makeState(
      { cards: [c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), joker()], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    expect(result.success).toBe(true);
  });

  it('accepts Ace laid off onto 10-J-Q-Joker (US2: four-card run ending in Joker)', () => {
    const state = makeState(
      { cards: [c(Rank.TEN, Suit.HEARTS), c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), joker()], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    expect(result.success).toBe(true);
  });
});

// ─── Rejections (regression) ──────────────────────────────────────────────────

describe('layOff — invalid Ace placements', () => {
  it('rejects Ace laid off onto 5-6-7 (King not in range)', () => {
    const state = makeState(
      { cards: [c(Rank.FIVE, Suit.HEARTS), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.ACE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.HEARTS) });
    expect(result.success).toBe(false);
  });

  it('rejects Ace from wrong suit', () => {
    const state = makeState(
      { cards: [c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.ACE, Suit.SPADES)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.SPADES) });
    expect(result.success).toBe(false);
  });

  it('accepts Ace as low card at start of A-2-3 continuation', () => {
    // Table has 2-3-4; Ace goes at start (Ace-low)
    const state = makeState(
      { cards: [c(Rank.TWO, Suit.SPADES), c(Rank.THREE, Suit.SPADES), c(Rank.FOUR, Suit.SPADES)], type: 'sequence' },
      [c(Rank.ACE, Suit.SPADES)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.ACE, Suit.SPADES) });
    expect(result.success).toBe(true);
  });
});

// ─── Leading Joker boundary ───────────────────────────────────────────────────

describe('layOff — card before leading Joker', () => {
  it('accepts 5 laid off onto [Joker(=6), 7, 8, 9, 10, J, Q, K, A]', () => {
    // Joker at start represents 6; 5 should fit at the new start
    const state = makeState(
      {
        cards: [
          joker(),
          c(Rank.SEVEN, Suit.DIAMONDS), c(Rank.EIGHT, Suit.DIAMONDS),
          c(Rank.NINE, Suit.DIAMONDS), c(Rank.TEN, Suit.DIAMONDS),
          c(Rank.JACK, Suit.DIAMONDS), c(Rank.QUEEN, Suit.DIAMONDS),
          c(Rank.KING, Suit.DIAMONDS), c(Rank.ACE, Suit.DIAMONDS),
        ],
        type: 'sequence',
      },
      [c(Rank.FIVE, Suit.DIAMONDS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.FIVE, Suit.DIAMONDS) });
    expect(result.success).toBe(true);
  });

  it('accepts 4 laid off onto [Joker(=5), 6, 7, 8]', () => {
    const state = makeState(
      { cards: [joker(), c(Rank.SIX, Suit.CLUBS), c(Rank.SEVEN, Suit.CLUBS), c(Rank.EIGHT, Suit.CLUBS)], type: 'sequence' },
      [c(Rank.FOUR, Suit.CLUBS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.FOUR, Suit.CLUBS) });
    expect(result.success).toBe(true);
  });

  it('accepts 3 laid off onto [Joker(=4), Joker(=5), 6, 7] (two leading Jokers)', () => {
    const state = makeState(
      { cards: [joker(), joker(), c(Rank.SIX, Suit.HEARTS), c(Rank.SEVEN, Suit.HEARTS)], type: 'sequence' },
      [c(Rank.THREE, Suit.HEARTS)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.THREE, Suit.HEARTS) });
    expect(result.success).toBe(true);
  });

  it('rejects 6 laid off onto [Joker(=6), 7, 8] (6 is already taken by Joker)', () => {
    const state = makeState(
      { cards: [joker(), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)], type: 'sequence' },
      [c(Rank.SIX, Suit.SPADES)]
    );
    const result = layOff(state, { playerId: 'p1', combinationId: 'combo-1', card: c(Rank.SIX, Suit.SPADES) });
    expect(result.success).toBe(false);
  });
});
