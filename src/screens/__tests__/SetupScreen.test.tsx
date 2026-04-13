import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { SetupScreen } from '../SetupScreen';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: Record<string, unknown>) => opts?.number ? `Player ${opts.number}` : key }),
}));

// Mock direction context
jest.mock('../../contexts/DirectionContext', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' }),
}));

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock AsyncStorage — factory must not reference outer variables (jest.mock is hoisted)
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

// Resolve typed references after mock is registered
import AsyncStorage from '@react-native-async-storage/async-storage';
const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

// Mock engine
jest.mock('../../engine', () => ({
  initGame: jest.fn(() => ({ config: {}, status: 'in_progress' })),
  deckCountForPlayers: jest.fn(() => 1),
}));

// Mock gameStore
jest.mock('../../store/gameStore', () => ({
  useGameStore: {
    getState: () => ({ setGame: jest.fn() }),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null);
  mockRemoveItem.mockResolvedValue(undefined);
});

describe('SetupScreen', () => {
  it('shows loading state initially then renders form', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByTestId, queryByTestId } = render(<SetupScreen />);

    // After async session load
    await act(async () => {});

    expect(getByTestId('setup-screen')).toBeTruthy();
    expect(queryByTestId('resume-game-prompt')).toBeNull();
  });

  it('shows ResumeGamePrompt when a saved session exists', async () => {
    const savedSession = JSON.stringify({ config: {}, status: 'in_progress' });
    mockGetItem.mockResolvedValue(savedSession);

    const { getByTestId } = render(<SetupScreen />);
    await act(async () => {});

    expect(getByTestId('resume-game-prompt')).toBeTruthy();
  });

  it('clears session and hides prompt when New Game is tapped', async () => {
    const savedSession = JSON.stringify({ config: {}, status: 'in_progress' });
    mockGetItem.mockResolvedValue(savedSession);

    const { getByTestId, queryByTestId } = render(<SetupScreen />);
    await act(async () => {});

    expect(getByTestId('resume-game-prompt')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('resume-prompt-new-game'));
    });

    expect(mockRemoveItem).toHaveBeenCalled();
    expect(queryByTestId('resume-game-prompt')).toBeNull();
  });

  it('navigates to /game when Resume is tapped', async () => {
    const savedSession = JSON.stringify({ config: {}, status: 'in_progress' });
    mockGetItem.mockResolvedValue(savedSession);

    const { getByTestId } = render(<SetupScreen />);
    await act(async () => {});

    fireEvent.press(getByTestId('resume-prompt-resume'));
    expect(mockReplace).toHaveBeenCalledWith('/game');
  });

  it('shows validation errors and does not navigate when names are empty', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByTestId } = render(<SetupScreen />);
    await act(async () => {});

    fireEvent.press(getByTestId('start-game-button'));
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('renders the language selector on the setup screen', async () => {
    mockGetItem.mockResolvedValue(null);
    const { getByTestId } = render(<SetupScreen />);
    await act(async () => {});
    expect(getByTestId('language-selector')).toBeTruthy();
  });
});
