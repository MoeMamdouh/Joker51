import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StagedMeldPreview } from '../StagedMeldPreview';
import { Card, Rank, Suit } from '../../../engine/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'game.stagedPoints') return `${params?.points} pts staged`;
      return key;
    },
  }),
}));

jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

const c = (rank: Rank, suit: Suit): Card => ({ rank, suit, isJoker: false });

const seq1: Card[] = [c(Rank.SIX, Suit.SPADES), c(Rank.SEVEN, Suit.SPADES), c(Rank.EIGHT, Suit.SPADES)];
const set1: Card[] = [c(Rank.TEN, Suit.DIAMONDS), c(Rank.TEN, Suit.CLUBS), c(Rank.TEN, Suit.HEARTS)];

describe('StagedMeldPreview', () => {
  it('returns null when stagedCombinations is empty', () => {
    const { queryByTestId } = render(
      <StagedMeldPreview stagedCombinations={[]} pointTotal={0} onCancel={() => {}} />
    );
    expect(queryByTestId('staged-meld-preview')).toBeNull();
  });

  it('renders each staged combination as a group', () => {
    const { getByTestId } = render(
      <StagedMeldPreview stagedCombinations={[seq1, set1]} pointTotal={51} onCancel={() => {}} />
    );
    expect(getByTestId('staged-meld-preview')).toBeTruthy();
    expect(getByTestId('staged-combo-0')).toBeTruthy();
    expect(getByTestId('staged-combo-1')).toBeTruthy();
  });

  it('renders CardTile for each card in staged combinations', () => {
    const { getByTestId } = render(
      <StagedMeldPreview stagedCombinations={[seq1]} pointTotal={21} onCancel={() => {}} />
    );
    expect(getByTestId('staged-card-0-0')).toBeTruthy();
    expect(getByTestId('staged-card-0-1')).toBeTruthy();
    expect(getByTestId('staged-card-0-2')).toBeTruthy();
  });

  it('shows the running point total', () => {
    const { getByText } = render(
      <StagedMeldPreview stagedCombinations={[seq1, set1]} pointTotal={51} onCancel={() => {}} />
    );
    expect(getByText('51 pts staged')).toBeTruthy();
  });

  it('calls onCancel when Cancel button is pressed', () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <StagedMeldPreview stagedCombinations={[seq1]} pointTotal={21} onCancel={onCancel} />
    );
    fireEvent.press(getByTestId('staged-cancel-button'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
