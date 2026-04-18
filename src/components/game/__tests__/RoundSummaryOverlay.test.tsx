import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoundSummaryOverlay } from '../RoundSummaryOverlay';

jest.mock('../../../store/languageStore', () => ({
  useLanguageStore: (selector: (s: { locale: string }) => unknown) => selector({ locale: 'en' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'game.roundSummary.title') return `Round ${opts?.round} Complete`;
      if (key === 'game.roundSummary.gameOverTitle') return 'Game Over!';
      if (key === 'game.roundSummary.nextRound') return 'Next Round';
      if (key === 'game.roundSummary.gameOver') return 'New Game';
      if (key === 'game.roundSummary.playAgain') return 'Play Again';
      if (key === 'game.roundSummary.winner') return 'Round Winner';
      if (key === 'game.roundSummary.coWinners') return 'Round Co-Winners';
      if (key === 'game.roundSummary.champion') return 'Champion';
      if (key === 'game.roundSummary.thisRound') return 'This Round';
      if (key === 'game.roundSummary.standings') return 'Standings';
      if (key === 'game.roundSummary.history') return 'Round History';
      if (key === 'game.roundSummary.pts') return 'pts';
      return key;
    },
  }),
}));

const players = [
  { playerId: 'p1', name: 'Alice' },
  { playerId: 'p2', name: 'Bob' },
];

const scores = [
  { playerId: 'p1', name: 'Alice', score: 10 },
  { playerId: 'p2', name: 'Bob', score: 25 },
];

const latestRoundScores = [
  { playerId: 'p1', penalty: 10 },
  { playerId: 'p2', penalty: 25 },
];

const defaultProps = {
  players,
  totalRounds: 4 as const,
  roundResults: [] as const,
  cumulativeScores: scores,
  roundWinnerIds: ['p1'],
  latestRoundScores,
  isGameOver: false,
  onNextRound: jest.fn(),
  onNewGame: jest.fn(),
  onPlayAgain: jest.fn(),
};

describe('RoundSummaryOverlay', () => {
  it('renders round title', () => {
    const { getByText } = render(
      <RoundSummaryOverlay {...defaultProps} currentRound={2} />
    );
    expect(getByText('Round 2 Complete')).toBeTruthy();
  });

  it('renders player names in this-round section', () => {
    const { getAllByText } = render(
      <RoundSummaryOverlay {...defaultProps} currentRound={1} />
    );
    // Alice and Bob both appear in the standings
    expect(getAllByText('Alice').length).toBeGreaterThan(0);
    expect(getAllByText('Bob').length).toBeGreaterThan(0);
  });

  it('highlights single winner label', () => {
    const { getByText, getAllByText } = render(
      <RoundSummaryOverlay {...defaultProps} currentRound={1} />
    );
    expect(getByText('Round Winner')).toBeTruthy();
    // Alice appears in multiple sections (winner banner, this-round, standings)
    expect(getAllByText('Alice').length).toBeGreaterThan(0);
  });

  it('shows co-winners label when two players tie', () => {
    const { getByText } = render(
      <RoundSummaryOverlay
        {...defaultProps}
        currentRound={1}
        roundWinnerIds={['p1', 'p2']}
      />
    );
    expect(getByText('Round Co-Winners')).toBeTruthy();
  });

  it('shows Next Round button when not game over', () => {
    const { getByTestId } = render(
      <RoundSummaryOverlay {...defaultProps} currentRound={1} />
    );
    expect(getByTestId('btn-next-round')).toBeTruthy();
  });

  it('shows Game Over title and Play Again / New Game buttons when game is over', () => {
    const onNewGame = jest.fn();
    const onPlayAgain = jest.fn();
    const { getByTestId, getByText } = render(
      <RoundSummaryOverlay
        {...defaultProps}
        currentRound={4}
        isGameOver={true}
        onNewGame={onNewGame}
        onPlayAgain={onPlayAgain}
      />
    );
    expect(getByText('Game Over!')).toBeTruthy();
    expect(getByTestId('btn-play-again')).toBeTruthy();
    expect(getByTestId('btn-game-over')).toBeTruthy();
    fireEvent.press(getByTestId('btn-play-again'));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });

  it('shows round history dots when roundResults are provided', () => {
    const { getByText } = render(
      <RoundSummaryOverlay
        {...defaultProps}
        currentRound={2}
        roundResults={[
          { roundNumber: 1, scores: latestRoundScores, winnerId: 'p1' },
        ]}
      />
    );
    expect(getByText('Round History')).toBeTruthy();
  });
});
