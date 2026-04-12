import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HandArea } from '../HandArea';
import { Card, Rank, Suit } from '../../../engine/types';

const card1: Card = { rank: Rank.ACE, suit: Suit.SPADES, isJoker: false };
const card2: Card = { rank: Rank.TWO, suit: Suit.HEARTS, isJoker: false };
const card3: Card = { rank: Rank.THREE, suit: Suit.CLUBS, isJoker: false };
const card4: Card = { rank: Rank.FOUR, suit: Suit.DIAMONDS, isJoker: false };
const card5: Card = { rank: Rank.FIVE, suit: Suit.SPADES, isJoker: false };

const fiveCards = [card1, card2, card3, card4, card5];

describe('HandArea', () => {
  it('renders all 5 cards', () => {
    const { getAllByTestId } = render(
      <HandArea cards={fiveCards} selectedCards={[]} onCardPress={jest.fn()} />
    );
    expect(getAllByTestId(/^hand-card-/).length).toBe(5);
  });

  it('calls onCardPress when a card is tapped', () => {
    const onCardPress = jest.fn();
    const { getByTestId } = render(
      <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
    );
    fireEvent.press(getByTestId('hand-card-0'));
    expect(onCardPress).toHaveBeenCalledWith(card1);
  });

  it('does not crash with an empty hand', () => {
    const { toJSON } = render(
      <HandArea cards={[]} selectedCards={[]} onCardPress={jest.fn()} />
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders with 2 selected cards without crashing', () => {
    const { getAllByTestId } = render(
      <HandArea cards={fiveCards} selectedCards={[card1, card3]} onCardPress={jest.fn()} />
    );
    // All 5 cards should still render regardless of selection
    expect(getAllByTestId(/^hand-card-/).length).toBe(5);
  });
});
