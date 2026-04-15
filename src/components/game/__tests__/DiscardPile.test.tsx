import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DiscardPile } from '../DiscardPile';
import { Card, Rank, Suit } from '../../../engine/types';

const queenOfDiamonds: Card = { rank: Rank.QUEEN, suit: Suit.DIAMONDS, isJoker: false };

describe('DiscardPile', () => {
  it('renders the top card face-up when provided', () => {
    const { getAllByText } = render(<DiscardPile topCard={queenOfDiamonds} />);
    // CardTile renders rank+suit in two corners, so multiple elements expected
    expect(getAllByText('Q').length).toBeGreaterThan(0);
    expect(getAllByText('♦').length).toBeGreaterThan(0);
  });

  it('renders empty placeholder when topCard is null', () => {
    const { queryByText } = render(<DiscardPile topCard={null} />);
    // No rank or suit should be visible
    expect(queryByText('Q')).toBeNull();
  });

  it('calls onPress when pressed and onPress is defined', () => {
    const onPress = jest.fn();
    const { getAllByText } = render(<DiscardPile topCard={queenOfDiamonds} onPress={onPress} />);
    fireEvent.press(getAllByText('Q')[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash when topCard is null and no onPress', () => {
    const { toJSON } = render(<DiscardPile topCard={null} />);
    expect(toJSON()).toBeTruthy();
  });
});
