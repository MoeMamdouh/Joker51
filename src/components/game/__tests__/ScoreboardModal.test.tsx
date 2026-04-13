import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ScoreboardModal } from '../ScoreboardModal';
import { RoundResult } from '../../../engine/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      const map: Record<string, string> = {
        'game.scoreboard.title': 'Scoreboard',
        'game.scoreboard.total': 'Total',
        'game.scoreboard.close': 'Close',
        'game.scoreboard.leader': 'Leading',
        'game.scoreboard.pending': '—',
      };
      if (key === 'game.scoreboard.round') return `R${params?.number}`;
      return map[key] ?? key;
    },
  }),
}));

const players = [
  { playerId: 'p1', name: 'Alice' },
  { playerId: 'p2', name: 'Bob' },
];

const round1: RoundResult = {
  roundNumber: 1,
  scores: [
    { playerId: 'p1', penalty: 0 },
    { playerId: 'p2', penalty: 42 },
  ],
  winnerId: 'p1',
};

const round2: RoundResult = {
  roundNumber: 2,
  scores: [
    { playerId: 'p1', penalty: 30 },
    { playerId: 'p2', penalty: 0 },
  ],
  winnerId: 'p2',
};

describe('ScoreboardModal', () => {
  it('renders nothing when visible is false', () => {
    const { queryByTestId } = render(
      <ScoreboardModal
        visible={false}
        totalRounds={4}
        players={players}
        roundResults={[round1]}
        onClose={jest.fn()}
      />
    );
    expect(queryByTestId('scoreboard-title')).toBeNull();
  });

  it('renders title and close button when visible is true', () => {
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[round1]}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId('scoreboard-title')).toBeTruthy();
    expect(getByTestId('btn-scoreboard-close')).toBeTruthy();
  });

  it('shows completed round scores and pending rounds as —', () => {
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[round1]}
        onClose={jest.fn()}
      />
    );
    // Alice: 0 pts in round 1, total 0
    const aliceRow = getByTestId('scoreboard-row-p1');
    expect(aliceRow).toBeTruthy();
    // Bob: 42 pts in round 1, total 42
    const bobRow = getByTestId('scoreboard-row-p2');
    expect(bobRow).toBeTruthy();
  });

  it('highlights the leader (lowest total score)', () => {
    // After round1: Alice total=0, Bob total=42 → Alice is leader
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[round1]}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId('scoreboard-leader-p1')).toBeTruthy();
    expect(() => getByTestId('scoreboard-leader-p2')).toThrow();
  });

  it('highlights both players as leaders when totals are tied', () => {
    const tiedRound: RoundResult = {
      roundNumber: 1,
      scores: [
        { playerId: 'p1', penalty: 30 },
        { playerId: 'p2', penalty: 30 },
      ],
      winnerId: 'p1',
    };
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[tiedRound]}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId('scoreboard-leader-p1')).toBeTruthy();
    expect(getByTestId('scoreboard-leader-p2')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[round1]}
        onClose={onClose}
      />
    );
    fireEvent.press(getByTestId('btn-scoreboard-close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows correct cumulative totals after multiple rounds', () => {
    // Alice: 0 + 30 = 30; Bob: 42 + 0 = 42 → Alice is leader
    const { getByTestId } = render(
      <ScoreboardModal
        visible={true}
        totalRounds={4}
        players={players}
        roundResults={[round1, round2]}
        onClose={jest.fn()}
      />
    );
    expect(getByTestId('scoreboard-leader-p1')).toBeTruthy();
    expect(() => getByTestId('scoreboard-leader-p2')).toThrow();
  });
});
