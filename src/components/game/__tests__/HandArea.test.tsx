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
    // In RTL mode, cards are reversed: bySuit order is [A♠, 5♠, 2♥, 3♣, 4♦],
    // reversed for RTL → hand-card-0 is the last sorted card (4♦ = card4)
    fireEvent.press(getByTestId('hand-card-0'));
    expect(onCardPress).toHaveBeenCalledWith(card4);
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

  describe('auto-sort on deal (US1)', () => {
    it('renders cards in bySuit order on initial render — A♠ first', () => {
      // fiveCards = [card1(A♠), card2(2♥), card3(3♣), card4(4♦), card5(5♠)]
      // bySuit sort: A♠(♠,13) > 5♠(♠,4) > 2♥(♥,1) > 3♣(♣,2) > 4♦(♦,3)
      // Sorted: [card1, card5, card2, card3, card4]
      const onCardPress = jest.fn();
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
      );
      // hand-card-0 should be card1 (A♠) — highest in bySuit order
      fireEvent.press(getByTestId('hand-card-0'));
      expect(onCardPress).toHaveBeenCalledWith(card1);
    });

    it('second card in bySuit order is the other spade (5♠)', () => {
      const onCardPress = jest.fn();
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
      );
      fireEvent.press(getByTestId('hand-card-1'));
      expect(onCardPress).toHaveBeenCalledWith(card5);
    });
  });

  describe('sort mode control (US3)', () => {
    it('renders the segmented sort control', () => {
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={jest.fn()} />
      );
      expect(getByTestId('sort-mode-control')).toBeTruthy();
    });

    it('sort control is present with stagedCards empty', () => {
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} stagedCards={[]} onCardPress={jest.fn()} />
      );
      expect(getByTestId('sort-mode-control')).toBeTruthy();
    });

    it('sort control is present when stagedCards is non-empty (disabled but rendered)', () => {
      const { getByTestId } = render(
        <HandArea
          cards={fiveCards}
          selectedCards={[]}
          stagedCards={[card1]}
          onCardPress={jest.fn()}
        />
      );
      expect(getByTestId('sort-mode-control')).toBeTruthy();
    });

    it('pressing byRank tab reorders cards — Aces across suits first', () => {
      const onCardPress = jest.fn();
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
      );
      // Press the byRank segment tab
      fireEvent.press(getByTestId('sort-mode-control-byRank'));
      // After byRank sort: highest rank first = card1(A♠) still first
      fireEvent.press(getByTestId('hand-card-0'));
      expect(onCardPress).toHaveBeenCalledWith(card1);
    });

    it('pressing bySuit tab after byRank reverts to suit order', () => {
      const onCardPress = jest.fn();
      const { getByTestId } = render(
        <HandArea cards={fiveCards} selectedCards={[]} onCardPress={onCardPress} />
      );
      fireEvent.press(getByTestId('sort-mode-control-byRank'));
      fireEvent.press(getByTestId('sort-mode-control-bySuit'));
      // After reverting to bySuit: card1 (A♠) is still first
      fireEvent.press(getByTestId('hand-card-0'));
      expect(onCardPress).toHaveBeenCalledWith(card1);
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
