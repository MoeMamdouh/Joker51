import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../engine/types';
import { sortCombinationCards } from '../engine';

const SESSION_KEY = '@joker51/savedSession';

interface UseSavedSessionResult {
  session: GameState | null;
  loading: boolean;
  clearSession(): Promise<void>;
}

export function useSavedSession(): UseSavedSessionResult {
  const [session, setSession] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then(raw => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as GameState;
            const combinations = parsed.tableState?.combinations ?? [];
            const migrated: GameState = {
              ...parsed,
              tableState: {
                combinations: combinations.map(combo => ({
                  ...combo,
                  cards: sortCombinationCards(combo.cards, combo.type),
                })),
              },
            };
            setSession(migrated);
          } catch {
            setSession(null);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function clearSession(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSession(null);
  }

  return { session, loading, clearSession };
}
