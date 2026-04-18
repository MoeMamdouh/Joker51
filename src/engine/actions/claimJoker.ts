import { ActionResult, Card, Combination, GameState, Rank, RANK_ORDER, Suit, TurnPhase } from '../types';
import { validateCombination } from '../validation';
import { sortCombinationCards } from '../sort';

const ALL_SUITS: Suit[] = [Suit.SPADES, Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS];

function hasCard(hand: readonly Card[], card: Card): boolean {
  return hand.some(c =>
    c.isJoker === card.isJoker && c.rank === card.rank && c.suit === card.suit
  );
}

function removeCard(cards: readonly Card[], card: Card): Card[] {
  const result = [...cards];
  const idx = result.findIndex(
    c => c.isJoker === card.isJoker && c.rank === card.rank && c.suit === card.suit
  );
  if (idx !== -1) result.splice(idx, 1);
  return result;
}

function requiredCardsForSetClaim(combo: Combination): Card[] | null {
  const nonJokers = combo.cards.filter(c => !c.isJoker) as Card[];
  const rank = nonJokers[0]?.rank;
  if (!rank) return null;
  const presentSuits = new Set(nonJokers.map(c => c.suit));
  const missingSuits = ALL_SUITS.filter(s => !presentSuits.has(s));
  return missingSuits.map(s => ({ rank, suit: s, isJoker: false }));
}

export function claimJoker(
  state: GameState,
  params: { playerId: string; combinationId: string; realCards: Card[] }
): ActionResult {
  const { playerId, combinationId, realCards } = params;

  if (state.turnState.activePlayerId !== playerId) {
    return { success: false, error: 'NOT_YOUR_TURN' };
  }
  if (state.turnState.phase !== TurnPhase.ACTING) {
    return { success: false, error: 'WRONG_TURN_PHASE' };
  }
  if (!state.meldedPlayerIds.includes(playerId)) {
    return { success: false, error: 'PLAYER_NOT_YET_MELDED' };
  }

  const combo = state.tableState.combinations.find(c => c.id === combinationId);
  if (!combo) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  const hasAnyJoker = combo.cards.some(c => c.isJoker);
  if (!hasAnyJoker) return { success: false, error: 'COMBINATION_NOT_ON_TABLE' };

  const hand = state.hands.find(h => h.playerId === playerId)!.cards;

  // For sets: validate that the player provided ALL missing suit cards
  if (combo.type === 'set') {
    const required = requiredCardsForSetClaim(combo);
    if (!required) return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };

    if (realCards.length < required.length) {
      return { success: false, error: 'JOKER_CLAIM_AMBIGUOUS_SET' };
    }

    // Verify player holds all required cards
    for (const card of required) {
      if (!hasCard(hand, card)) {
        return { success: false, error: 'CARD_NOT_IN_HAND' };
      }
    }

    // Build updated combination: remove Joker, add all required natural cards
    const comboWithoutJoker = combo.cards.filter(c => !c.isJoker) as Card[];
    const updatedCardsRaw = [...comboWithoutJoker, ...required];
    const vr = validateCombination(updatedCardsRaw, { isInitialMeld: false });
    if (!vr.valid) return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };
    const updatedCards = sortCombinationCards(updatedCardsRaw, 'set');

    const jokerCard: Card = { rank: null, suit: null, isJoker: true };
    let updatedHand = [...hand];
    for (const card of required) {
      updatedHand = removeCard(updatedHand, card);
    }
    updatedHand.push(jokerCard);

    return {
      success: true,
      state: {
        ...state,
        hands: state.hands.map(h =>
          h.playerId === playerId ? { ...h, cards: updatedHand } : h
        ),
        tableState: {
          combinations: state.tableState.combinations.map(c =>
            c.id === combinationId ? { ...c, cards: updatedCards } : c
          ),
        },
      },
    };
  }

  // Sequence: 1-for-1 swap — find which Joker the realCard replaces by position
  if (realCards.length === 0) return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };
  const realCard = realCards[0];

  if (!hasCard(hand, realCard)) {
    return { success: false, error: 'CARD_NOT_IN_HAND' };
  }

  // Determine rank of each Joker by its position relative to surrounding natural cards,
  // then find the Joker whose rank matches realCard.rank.
  const nonJokersSeq = combo.cards.filter(c => !c.isJoker);
  const seqAceHigh =
    nonJokersSeq.some(c => c.rank === Rank.ACE) &&
    nonJokersSeq.some(c => c.rank === Rank.KING);
  const seqRankIdx = (rank: Rank): number => {
    if (rank === Rank.ACE && seqAceHigh) return 13;
    return RANK_ORDER.indexOf(rank);
  };

  let targetJokerIndex = -1;
  for (let jPos = 0; jPos < combo.cards.length; jPos++) {
    if (!combo.cards[jPos].isJoker) continue;
    let prevVIdx: number | null = null;
    let prevOffset = 0;
    for (let i = jPos - 1; i >= 0; i--) {
      if (!combo.cards[i].isJoker) {
        prevVIdx = seqRankIdx(combo.cards[i].rank as Rank);
        prevOffset = jPos - i;
        break;
      }
    }
    let nextVIdx: number | null = null;
    let nextOffset = 0;
    for (let i = jPos + 1; i < combo.cards.length; i++) {
      if (!combo.cards[i].isJoker) {
        nextVIdx = seqRankIdx(combo.cards[i].rank as Rank);
        nextOffset = i - jPos;
        break;
      }
    }
    let rankVIdx: number | null = null;
    if (prevVIdx !== null) rankVIdx = prevVIdx + prevOffset;
    else if (nextVIdx !== null) rankVIdx = nextVIdx - nextOffset;
    if (rankVIdx === null || rankVIdx < 0 || rankVIdx >= RANK_ORDER.length) continue;
    if (RANK_ORDER[rankVIdx] === realCard.rank) {
      targetJokerIndex = jPos;
      break;
    }
  }

  if (targetJokerIndex === -1) return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };

  const swappedCardsRaw = combo.cards.map((c, i) => (i === targetJokerIndex ? realCard : c)) as Card[];
  const vr = validateCombination(swappedCardsRaw, { isInitialMeld: false });
  if (!vr.valid) return { success: false, error: 'JOKER_CLAIM_WRONG_CARD' };
  const swappedCards = sortCombinationCards(swappedCardsRaw, 'sequence');

  const jokerCard: Card = { rank: null, suit: null, isJoker: true };
  const updatedHand = [...removeCard(hand, realCard), jokerCard];

  return {
    success: true,
    state: {
      ...state,
      hands: state.hands.map(h =>
        h.playerId === playerId ? { ...h, cards: updatedHand } : h
      ),
      tableState: {
        combinations: state.tableState.combinations.map(c =>
          c.id === combinationId ? { ...c, cards: swappedCards } : c
        ),
      },
    },
  };
}
