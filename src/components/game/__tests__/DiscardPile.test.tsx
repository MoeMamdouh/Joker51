import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DiscardPile } from '../DiscardPile';
import { Card, Rank, Suit } from '../../../engine/types';

const queenOfDiamonds: Card = { rank: Rank.QUEEN, suit: Suit.DIAMONDS, isJoker: false };

describe('DiscardPile', () => {
  it('renders the top card face-up when provided', () => {
    const { getByText } = render(<DiscardPile topCard={queenOfDiamonds} />);
    expect(getByText('Q')).toBeTruthy();
    expect(getByText('♦')).toBeTruthy();
  });

  it('renders empty placeholder when topCard is null', () => {
    const { queryByText } = render(<DiscardPile topCard={null} />);
    // No rank or suit should be visible
    expect(queryByText('Q')).toBeNull();
  });

  it('calls onPress when pressed and onPress is defined', () => {
    const onPress = jest.fn();
    const { getByText } = render(<DiscardPile topCard={queenOfDiamonds} onPress={onPress} />);
    fireEvent.press(getByText('Q'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash when topCard is null and no onPress', () => {
    const { toJSON } = render(<DiscardPile topCard={null} />);
    expect(toJSON()).toBeTruthy();
  });
});
