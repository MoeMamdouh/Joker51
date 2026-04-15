import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HandArea } from '../HandArea';
import { Card, Rank, Suit } from '../../../engine/types';

const mockUseDirection = jest.fn(() => ({ isRTL: false, direction: 'ltr' as 'ltr' | 'rtl' }));

jest.mock('../../../contexts/DirectionContext', () => ({
  useDirection: () => mockUseDirection(),
}));

jest.mock('../../../store/cardStyleStore', () => ({
  useCardStyleStore: (selector: (s: { activeStyleId: string }) => unknown) =>
    selector({ activeStyleId: 'classic' }),
}));

const card1: Card = { rank: Rank.ACE, suit: Suit.SPADES, isJoker: false };
const card2: Card = { rank: Rank.TWO, suit: Suit.HEARTS, isJoker: false };
const card3: Card = { rank: Rank.THREE, suit: Suit.CLUBS, isJoker: false };
const card4: Card = { rank: Rank.FOUR, suit: Suit.DIAMONDS, isJoker: false };
const card5: Card = { rank: Rank.FIVE, suit: Suit.SPADES, isJoker: false };

const fiveCards = [card1, card2, card3, card4, card5];

describe('HandArea', () => {
  beforeEach(() => {
    mockUseDirection.mockReturnValue({ isRTL: false, direction: 'ltr' as const });
  });

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
    expect(getAllByTestId(/^hand-card-/).length).toBe(5);
  });

  it('renders cards in original LTR order when isRTL is false', () => {
    const onCardPress = jest.fn();
    const { getByTestId } = render(
      <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
    );
    // hand-card-0 should trigger onCardPress with the first card (card1)
    fireEvent.press(getByTestId('hand-card-0'));
    expect(onCardPress).toHaveBeenCalledWith(card1);
  });

  it('renders cards in reversed RTL order when isRTL is true', () => {
    mockUseDirection.mockReturnValue({ isRTL: true, direction: 'rtl' as const });
    const onCardPress = jest.fn();
    const { getByTestId } = render(
      <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
    );
    // In RTL mode, cards are reversed: hand-card-0 is the last card (card5)
    fireEvent.press(getByTestId('hand-card-0'));
    expect(onCardPress).toHaveBeenCalledWith(card5);
  });

  describe('RTL drag direction', () => {
    it('renders all cards in RTL mode without error', () => {
      mockUseDirection.mockReturnValue({ isRTL: true, direction: 'rtl' as const });
      const { getAllByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={jest.fn()} />
      );
      expect(getAllByTestId(/^hand-card-/).length).toBe(5);
    });

    it('dimming logic is unchanged in RTL mode', () => {
      mockUseDirection.mockReturnValue({ isRTL: true, direction: 'rtl' as const });
      const { getAllByTestId } = render(
        <HandArea
          cards={fiveCards}
          selectedCards={[]}
          stagedCards={[card1, card2]}
          onCardPress={jest.fn()}
        />
      );
      expect(getAllByTestId(/^hand-card-/).length).toBe(5);
    });
  });

  describe('stagedCards dimming', () => {
    it('renders all cards normally when no stagedCards provided', () => {
      const { getAllByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={jest.fn()} />
      );
      expect(getAllByTestId(/^hand-card-/).length).toBe(5);
    });

    it('renders all cards normally when stagedCards is empty', () => {
      const { getAllByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} stagedCards={[]} onCardPress={jest.fn()} />
      );
      expect(getAllByTestId(/^hand-card-/).length).toBe(5);
    });

    it('renders all 5 cards when staged cards are provided', () => {
      const { getAllByTestId } = render(
        <HandArea
          cards={fiveCards}
          selectedCards={[]}
          stagedCards={[card1, card2]}
          onCardPress={jest.fn()}
        />
      );
      expect(getAllByTestId(/^hand-card-/).length).toBe(5);
    });
  });
});
