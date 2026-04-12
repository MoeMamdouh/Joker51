import { create } from 'zustand';
import { initGame, deckCountForPlayers } from '../engine';
import { useGameStore } from './gameStore';

export { deckCountForPlayers };

interface SetupState {
  playerCount: number;
  playerNames: string[];
  roundFormat: 4 | 8 | 12;
  fieldErrors: (string | null)[];

  setPlayerCount(count: number): void;
  setPlayerName(index: number, name: string): void;
  setRoundFormat(format: 4 | 8 | 12): void;
  validateAndStart(): { valid: boolean };
  startGame(): { valid: boolean };
  resetForm(): void;
}

export const useSetupStore = create<SetupState>((set, get) => ({
  playerCount: 2,
  playerNames: ['', ''],
  roundFormat: 4,
  fieldErrors: [null, null],

  setPlayerCount(count) {
    const clamped = Math.min(8, Math.max(2, count));
    const { playerNames, fieldErrors } = get();

    const newNames = Array.from({ length: clamped }, (_, i) => playerNames[i] ?? '');
    const newErrors = Array.from({ length: clamped }, (_, i) => fieldErrors[i] ?? null);

    set({ playerCount: clamped, playerNames: newNames, fieldErrors: newErrors });
  },

  setPlayerName(index, name) {
    const { playerNames, fieldErrors } = get();
    const newNames = [...playerNames];
    newNames[index] = name;
    // Clear error when user starts typing
    const newErrors = [...fieldErrors];
    if (name.trim().length > 0) newErrors[index] = null;
    set({ playerNames: newNames, fieldErrors: newErrors });
  },

  setRoundFormat(format) {
    set({ roundFormat: format });
  },

  validateAndStart() {
    const { playerNames } = get();
    const newErrors: (string | null)[] = playerNames.map(name => {
      if (name.trim().length === 0) return 'validation.nameRequired';
      if (name.length > 20) return 'validation.nameTooLong';
      return null;
    });
    set({ fieldErrors: newErrors });
    return { valid: newErrors.every(e => e === null) };
  },

  startGame() {
    const { playerNames, roundFormat } = get();
    const newErrors: (string | null)[] = playerNames.map(name => {
      if (name.trim().length === 0) return 'validation.nameRequired';
      if (name.length > 20) return 'validation.nameTooLong';
      return null;
    });
    set({ fieldErrors: newErrors });
    if (!newErrors.every(e => e === null)) return { valid: false };

    const config = {
      players: playerNames.map((name, i) => ({ id: `player-${i}`, name: name.trim() })),
      totalRounds: roundFormat,
    };
    const gameState = initGame(config);
    useGameStore.getState().setGame(gameState);
    return { valid: true };
  },

  resetForm() {
    set({
      playerCount: 2,
      playerNames: ['', ''],
      roundFormat: 4,
      fieldErrors: [null, null],
    });
  },
}));
