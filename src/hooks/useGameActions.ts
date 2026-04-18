import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { draw } from '../engine/actions/draw';
import { placeInitialMeld } from '../engine/actions/meld';
import { placeCombinations } from '../engine/actions/placeCombinations';
import { layOff } from '../engine/actions/layOff';
import { discard, startNextRound as engineStartNextRound } from '../engine/actions/discard';
import { claimJoker } from '../engine/actions/claimJoker';
import { useGameStore } from '../store/gameStore';
import { Card } from '../engine/types';

const SESSION_KEY = '@joker51/savedSession';

const ERROR_CODE_MAP: Record<string, string> = {
  NOT_YOUR_TURN: 'notYourTurn',
  WRONG_TURN_PHASE: 'wrongPhase',
  INVALID_COMBINATION: 'invalidCombination',
  COMBINATION_TOO_SHORT: 'combinationTooShort',
  SET_TOO_LONG: 'setTooLong',
  SET_DUPLICATE_SUIT: 'setDuplicateSuit',
  SEQUENCE_MIXED_SUITS: 'sequenceMixedSuits',
  SEQUENCE_NOT_CONSECUTIVE: 'sequenceNotConsecutive',
  ACE_WRAPAROUND: 'aceWraparound',
  JOKER_LIMIT_EXCEEDED: 'jokerLimitExceeded',
  MELD_BELOW_51_POINTS: 'meldBelow51',
  PLAYER_NOT_YET_MELDED: 'notYetMelded',
  JOKER_CLAIM_NOT_YOUR_TURN: 'jokerClaimNotYourTurn',
  JOKER_CLAIM_WRONG_CARD: 'jokerClaimWrongCard',
  JOKER_CLAIM_BREAKS_COMBINATION: 'jokerClaimBreaks',
  JOKER_CLAIM_AMBIGUOUS_SET: 'jokerClaimAmbiguousSet',
  DRAWN_DISCARD_NOT_IN_MELD: 'drawnDiscardNotInMeld',
  DISCARD_REQUIRED_TO_WIN: 'discardRequiredToWin',
  CARD_NOT_IN_HAND: 'cardNotInHand',
  COMBINATION_NOT_ON_TABLE: 'combinationNotOnTable',
};

interface GameActionResult {
  error: string | null;
}

interface UseGameActionsReturn {
  drawFromPile(): GameActionResult;
  pickUpDiscardTop(): GameActionResult;
  placeMeld(combinations: Card[][]): GameActionResult;
  layOffCard(card: Card, combinationId: string, jokerPosition?: 'start' | 'end'): GameActionResult;
  discardCard(card: Card): GameActionResult;
  claimJokerFromCombination(combinationId: string, realCards: Card[]): GameActionResult;
  startNextRound(): GameActionResult;
}

export function useGameActions(): UseGameActionsReturn {
  const { t } = useTranslation();
  const currentGame = useGameStore(s => s.currentGame);
  const setGame = useGameStore(s => s.setGame);

  function persist(state: Parameters<typeof setGame>[0]): void {
    setGame(state);
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(state)).catch(() => {});
  }

  function errorResult(code: string): GameActionResult {
    const key = ERROR_CODE_MAP[code] ?? code;
    return { error: t(`game.errors.${key}`) };
  }

  function drawFromPile(): GameActionResult {
    if (!currentGame) return { error: null };
    const result = draw(currentGame, {
      playerId: currentGame.turnState.activePlayerId,
      source: 'draw_pile',
    });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function pickUpDiscardTop(): GameActionResult {
    if (!currentGame) return { error: null };
    const result = draw(currentGame, {
      playerId: currentGame.turnState.activePlayerId,
      source: 'discard_pile',
    });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function placeMeld(combinations: Card[][]): GameActionResult {
    if (!currentGame) return { error: null };
    const playerId = currentGame.turnState.activePlayerId;
    const hasMelded = currentGame.meldedPlayerIds.includes(playerId);
    const action = hasMelded ? placeCombinations : placeInitialMeld;
    const result = action(currentGame, { playerId, combinations });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function layOffCard(card: Card, combinationId: string, jokerPosition?: 'start' | 'end'): GameActionResult {
    if (!currentGame) return { error: null };
    const result = layOff(currentGame, {
      playerId: currentGame.turnState.activePlayerId,
      card,
      combinationId,
      jokerPosition,
    });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function discardCard(card: Card): GameActionResult {
    if (!currentGame) return { error: null };
    const result = discard(currentGame, {
      playerId: currentGame.turnState.activePlayerId,
      card,
    });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function claimJokerFromCombination(combinationId: string, realCards: Card[]): GameActionResult {
    if (!currentGame) return { error: null };
    const result = claimJoker(currentGame, {
      playerId: currentGame.turnState.activePlayerId,
      combinationId,
      realCards,
    });
    if (!result.success || !result.state) return errorResult(result.error!);
    persist(result.state);
    return { error: null };
  }

  function startNextRound(): GameActionResult {
    if (!currentGame) return { error: null };
    try {
      const nextState = engineStartNextRound(currentGame);
      persist(nextState);
      return { error: null };
    } catch (e) {
      return errorResult('WRONG_TURN_PHASE');
    }
  }

  return {
    drawFromPile,
    pickUpDiscardTop,
    placeMeld,
    layOffCard,
    discardCard,
    claimJokerFromCombination,
    startNextRound,
  };
}
