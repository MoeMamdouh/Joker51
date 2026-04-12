import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSavedSession } from '../useSavedSession';
import { GameState, Rank, Suit } from '../../engine/types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  removeItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;

function makeUnsortedSession(): GameState {
  return {
    config: { players: [{ id: 'p1', name: 'P1' }, { id: 'p2', name: 'P2' }], totalRounds: 4 },
    status: 'in_progress' as any,
    currentRound: 1,
    hands: [
      { playerId: 'p1', cards: [] },
      { playerId: 'p2', cards: [] },
    ],
    drawPile: { cards: [] },
    discardPile: { cards: [] },
    tableState: {
      combinations: [
        {
          id: 'combo-1',
          // Unsorted: 8♠ 6♠ 7♠ — should become 6♠ 7♠ 8♠
          cards: [
            { rank: Rank.EIGHT, suit: Suit.SPADES, isJoker: false },
            { rank: Rank.SIX, suit: Suit.SPADES, isJoker: false },
            { rank: Rank.SEVEN, suit: Suit.SPADES, isJoker: false },
          ],
          type: 'sequence' as const,
          ownerId: 'p1',
        },
        {
          id: 'combo-2',
          // Unsorted set: 10♣ 10♠ 10♥ — should become 10♠ 10♥ 10♣
          cards: [
            { rank: Rank.TEN, suit: Suit.CLUBS, isJoker: false },
            { rank: Rank.TEN, suit: Suit.SPADES, isJoker: false },
            { rank: Rank.TEN, suit: Suit.HEARTS, isJoker: false },
          ],
          type: 'set' as const,
          ownerId: 'p2',
        },
      ],
    },
    turnState: { activePlayerId: 'p1', phase: 'acting' as any, discardDrawnBeforeMeld: null },
    meldedPlayerIds: ['p1', 'p2'],
    roundResults: [],
    deckCount: 1,
  };
}

describe('useSavedSession — retroactive sort on load', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sorts unsorted sequence combination on load', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(makeUnsortedSession()));
    const { result } = renderHook(() => useSavedSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const seqCombo = result.current.session!.tableState.combinations.find(c => c.id === 'combo-1')!;
    expect(seqCombo.cards.map(c => c.rank)).toEqual([Rank.SIX, Rank.SEVEN, Rank.EIGHT]);
  });

  it('sorts unsorted set combination on load', async () => {
    mockGetItem.mockResolvedValue(JSON.stringify(makeUnsortedSession()));
    const { result } = renderHook(() => useSavedSession());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const setCombo = result.current.session!.tableState.combinations.find(c => c.id === 'combo-2')!;
    expect(setCombo.cards.map(c => c.suit)).toEqual([Suit.SPADES, Suit.HEARTS, Suit.CLUBS]);
  });

  it('returns null session when storage is empty', async () => {
    mockGetItem.mockResolvedValue(null);
    const { result } = renderHook(() => useSavedSession());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.session).toBeNull();
  });
});
