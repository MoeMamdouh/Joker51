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
      if (key === 'game.roundSummary.penalty') return `Penalty: ${opts?.points} pts`;
      if (key === 'game.roundSummary.nextRound') return 'Next Round';
      if (key === 'game.roundSummary.gameOver') return 'Game Over';
      if (key === 'game.roundSummary.playAgain') return 'Play Again';
      if (key === 'game.roundSummary.winner') return 'Round Winner';
      if (key === 'game.roundSummary.coWinners') return 'Round Co-Winners';
      if (key === 'game.score.label') return `: ${opts?.score}`;
      return key;
    },
  }),
}));

const scores = [
  { playerId: 'p1', name: 'Alice', score: 10 },
  { playerId: 'p2', name: 'Bob', score: 25 },
];

const latestRoundScores = [
  { playerId: 'p1', penalty: 10 },
  { playerId: 'p2', penalty: 25 },
];

describe('RoundSummaryOverlay', () => {
  it('renders round title and player penalties', () => {
    const { getByText } = render(
      <RoundSummaryOverlay
        currentRound={2}
        cumulativeScores={scores}
        roundWinnerIds={['p1']}
        latestRoundScores={latestRoundScores}
        isGameOver={false}
        onNextRound={jest.fn()} onNewGame={jest.fn()} onPlayAgain={jest.fn()}
      />
    );
    expect(getByText('Round 2 Complete')).toBeTruthy();
    expect(getByText('Penalty: 10 pts')).toBeTruthy();
    expect(getByText('Penalty: 25 pts')).toBeTruthy();
  });

  it('highlights single winner', () => {
    const { getByText } = render(
      <RoundSummaryOverlay
        currentRound={1}
        cumulativeScores={scores}
        roundWinnerIds={['p1']}
        latestRoundScores={latestRoundScores}
        isGameOver={false}
        onNextRound={jest.fn()} onNewGame={jest.fn()} onPlayAgain={jest.fn()}
      />
    );
    expect(getByText('Round Winner')).toBeTruthy();
    expect(getByText('Alice')).toBeTruthy();
  });

  it('shows co-winners label when two players tie', () => {
    const { getByText } = render(
      <RoundSummaryOverlay
        currentRound={1}
        cumulativeScores={scores}
        roundWinnerIds={['p1', 'p2']}
        latestRoundScores={latestRoundScores}
        isGameOver={false}
        onNextRound={jest.fn()} onNewGame={jest.fn()} onPlayAgain={jest.fn()}
      />
    );
    expect(getByText('Round Co-Winners')).toBeTruthy();
  });

  it('shows Next Round button when not game over', () => {
    const { getByTestId } = render(
      <RoundSummaryOverlay
        currentRound={1}
        cumulativeScores={scores}
        roundWinnerIds={['p1']}
        latestRoundScores={latestRoundScores}
        isGameOver={false}
        onNextRound={jest.fn()} onNewGame={jest.fn()} onPlayAgain={jest.fn()}
      />
    );
    expect(getByTestId('btn-next-round')).toBeTruthy();
  });

  it('shows Game Over and Play Again when game is over', () => {
    const onNewGame = jest.fn();
    const onPlayAgain = jest.fn();
    const { getByTestId } = render(
      <RoundSummaryOverlay
        currentRound={4}
        cumulativeScores={scores}
        roundWinnerIds={['p1']}
        latestRoundScores={latestRoundScores}
        isGameOver={true}
        onNextRound={jest.fn()} onNewGame={onNewGame} onPlayAgain={onPlayAgain}
      />
    );
    expect(getByTestId('btn-play-again')).toBeTruthy();
    expect(getByTestId('btn-game-over')).toBeTruthy();
    fireEvent.press(getByTestId('btn-play-again'));
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
  });
});
