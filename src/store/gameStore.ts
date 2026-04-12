import { create } from 'zustand';
import { GameState } from '../engine/types';

interface GameStoreState {
  currentGame: GameState | null;
  setGame(state: GameState): void;
  clearGame(): void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  currentGame: null,
  setGame(state) {
    set({ currentGame: state });
  },
  clearGame() {
    set({ currentGame: null });
  },
}));
