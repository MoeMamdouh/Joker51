import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JokerPlacementSheet, JokerSequenceOption } from '../JokerPlacementSheet';
import { Card, Rank, Suit } from '../../../engine/types';

jest.mock('../../../store/cardStyleStore', () => ({
  useCardStyleStore: (selector: (s: { activeStyleId: string }) => unknown) =>
    selector({ activeStyleId: 'classic' }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const jokerCard: Card = { rank: null, suit: null, isJoker: true };
const six: Card = { rank: Rank.SIX, suit: Suit.HEARTS, isJoker: false };
const seven: Card = { rank: Rank.SEVEN, suit: Suit.HEARTS, isJoker: false };
const eight: Card = { rank: Rank.EIGHT, suit: Suit.HEARTS, isJoker: false };
const nine: Card = { rank: Rank.NINE, suit: Suit.HEARTS, isJoker: false };

const options: JokerSequenceOption[] = [
  { cards: [six, jokerCard, eight], label: 'Joker as 7♥' },
  { cards: [seven, eight, nine], label: 'Joker as 6♥' },
];

describe('JokerPlacementSheet', () => {
  it('renders all options when visible', () => {
    const { getByTestId } = render(
      <JokerPlacementSheet
        visible
        options={options}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(getByTestId('joker-option-0')).toBeTruthy();
    expect(getByTestId('joker-option-1')).toBeTruthy();
  });

  it('confirm button is disabled with no selection', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <JokerPlacementSheet
        visible
        options={options}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    );
    fireEvent.press(getByTestId('joker-placement-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('selecting an option then confirming calls onConfirm with that option', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <JokerPlacementSheet
        visible
        options={options}
        onConfirm={onConfirm}
        onDismiss={jest.fn()}
      />
    );
    fireEvent.press(getByTestId('joker-option-0'));
    fireEvent.press(getByTestId('joker-placement-confirm'));
    expect(onConfirm).toHaveBeenCalledWith(options[0]);
  });

  it('cancel button calls onDismiss', () => {
    const onDismiss = jest.fn();
    const { getByTestId } = render(
      <JokerPlacementSheet
        visible
        options={options}
        onConfirm={jest.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.press(getByTestId('joker-placement-cancel'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('does not render options when not visible', () => {
    const { queryByTestId } = render(
      <JokerPlacementSheet
        visible={false}
        options={options}
        onConfirm={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(queryByTestId('joker-option-0')).toBeNull();
  });
});
