import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@joker51/cardStyle';

export type CardStyleId = 'classic' | 'minimal';

export interface CardStyleDefinition {
  id: CardStyleId;
  labelKey: string;
  /** Background color for the center of face cards (J/Q/K). null = no fill */
  faceCardCenterBg: string | null;
  /** Text color for the center rank letter of face cards */
  faceCardCenterTextColor: string;
  /** Whether number cards (2–10) show a large suit symbol in the center */
  showNumberCardCenterSuit: boolean;
}

export const CARD_STYLES: Record<CardStyleId, CardStyleDefinition> = {
  classic: {
    id: 'classic',
    labelKey: 'settings.cardStyle.classic',
    faceCardCenterBg: '#C8972A',
    faceCardCenterTextColor: '#FFFFFF',
    showNumberCardCenterSuit: false,
  },
  minimal: {
    id: 'minimal',
    labelKey: 'settings.cardStyle.minimal',
    faceCardCenterBg: null,
    faceCardCenterTextColor: '#1A2632',
    showNumberCardCenterSuit: true,
  },
};

export const DEFAULT_CARD_STYLE: CardStyleId = 'classic';

interface CardStyleState {
  activeStyleId: CardStyleId;
  setStyle: (id: CardStyleId) => void;
  loadPersistedStyle: () => Promise<void>;
}

export const useCardStyleStore = create<CardStyleState>((set) => ({
  activeStyleId: DEFAULT_CARD_STYLE,

  setStyle: (id: CardStyleId) => {
    set({ activeStyleId: id });
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
      // fire-and-forget; persistence failure is non-fatal
    });
  },

  loadPersistedStyle: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && stored in CARD_STYLES) {
        set({ activeStyleId: stored as CardStyleId });
      }
    } catch {
      // fall back to default silently
    }
  },
}));
