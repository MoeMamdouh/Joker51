import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CombinationRow } from '../CombinationRow';
import { Card, Rank, Suit, Combination } from '../../../engine/types';

const cards: Card[] = [
  { rank: Rank.SEVEN, suit: Suit.CLUBS, isJoker: false },
  { rank: Rank.EIGHT, suit: Suit.CLUBS, isJoker: false },
  { rank: Rank.NINE, suit: Suit.CLUBS, isJoker: false },
];

const comboWithJoker: Combination = {
  id: 'c2',
  cards: [
    { rank: Rank.KING, suit: Suit.HEARTS, isJoker: false },
    { rank: null, suit: null, isJoker: true },
    { rank: Rank.QUEEN, suit: Suit.HEARTS, isJoker: false },
  ],
  type: 'sequence',
  ownerId: 'p1',
};

const combo: Combination = {
  id: 'c1',
  cards,
  type: 'sequence',
  ownerId: 'p1',
};

describe('CombinationRow', () => {
  it('renders all cards and owner name', () => {
    const { getByText } = render(
      <CombinationRow combination={combo} ownerName="Alice" />
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('7')).toBeTruthy();
    expect(getByText('8')).toBeTruthy();
    expect(getByText('9')).toBeTruthy();
  });

  it('calls onPress when tapped with canLayOff (onPress defined)', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CombinationRow combination={combo} ownerName="Alice" onPress={onPress} />
    );
    fireEvent.press(getByText('7'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows Joker claim badge when showClaimJoker is true', () => {
    const { getByTestId } = render(
      <CombinationRow
        combination={comboWithJoker}
        ownerName="Bob"
        showClaimJoker
        onClaimJoker={jest.fn()}
      />
    );
    expect(getByTestId('claim-joker-badge')).toBeTruthy();
  });

  it('calls onClaimJoker when claim badge is tapped', () => {
    const onClaimJoker = jest.fn();
    const { getByTestId } = render(
      <CombinationRow
        combination={comboWithJoker}
        ownerName="Bob"
        showClaimJoker
        onClaimJoker={onClaimJoker}
      />
    );
    fireEvent.press(getByTestId('claim-joker-badge'));
    expect(onClaimJoker).toHaveBeenCalledTimes(1);
  });

  it('does not show claim badge when showClaimJoker is false', () => {
    const { queryByTestId } = render(
      <CombinationRow combination={comboWithJoker} ownerName="Bob" showClaimJoker={false} />
    );
    expect(queryByTestId('claim-joker-badge')).toBeNull();
  });
});
