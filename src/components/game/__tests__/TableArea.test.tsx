import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TableArea } from '../TableArea';
import { Combination, Card, Rank, Suit } from '../../../engine/types';

const cards: Card[] = [
  { rank: Rank.TEN, suit: Suit.SPADES, isJoker: false },
  { rank: Rank.JACK, suit: Suit.SPADES, isJoker: false },
  { rank: Rank.QUEEN, suit: Suit.SPADES, isJoker: false },
];

const comboWithJoker: Card[] = [
  { rank: Rank.ACE, suit: Suit.HEARTS, isJoker: false },
  { rank: null, suit: null, isJoker: true },
  { rank: Rank.KING, suit: Suit.HEARTS, isJoker: false },
];

const combinations: Combination[] = [
  { id: 'c1', cards, type: 'sequence', ownerId: 'p1' },
  { id: 'c2', cards: comboWithJoker, type: 'sequence', ownerId: 'p2' },
];

const players = [
  { playerId: 'p1', name: 'Alice' },
  { playerId: 'p2', name: 'Bob' },
];

describe('TableArea', () => {
  it('renders all combinations', () => {
    const { getByText } = render(
      <TableArea combinations={combinations} players={players} canLayOff={false} />
    );
    expect(getByText('Alice')).toBeTruthy();
    expect(getByText('Bob')).toBeTruthy();
  });

  it('calls onCombinationPress when canLayOff is true', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TableArea
        combinations={combinations}
        players={players}
        canLayOff={true}
        onCombinationPress={onPress}
      />
    );
    fireEvent.press(getByTestId('combination-row-c1'));
    expect(onPress).toHaveBeenCalledWith('c1');
  });

  it('does not call onCombinationPress when canLayOff is false', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <TableArea
        combinations={combinations}
        players={players}
        canLayOff={false}
        onCombinationPress={onPress}
      />
    );
    // Pressing should not trigger since canLayOff=false means no onPress prop
    fireEvent.press(getByTestId('combination-row-c1'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows claim joker badge on combination with joker when canClaimJokerForCombination returns true', () => {
    const { getByTestId } = render(
      <TableArea
        combinations={combinations}
        players={players}
        canLayOff={false}
        canClaimJokerForCombination={c => c.id === 'c2'}
        onClaimJoker={jest.fn()}
      />
    );
    expect(getByTestId('claim-joker-badge')).toBeTruthy();
  });
});
