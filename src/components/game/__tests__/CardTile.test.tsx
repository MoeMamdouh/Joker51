import React from 'react';
import { render } from '@testing-library/react-native';
import { CardTile } from '../CardTile';
import { Card, Rank, Suit } from '../../../engine/types';

const kingOfSpades: Card = { rank: Rank.KING, suit: Suit.SPADES, isJoker: false };
const aceOfHearts: Card = { rank: Rank.ACE, suit: Suit.HEARTS, isJoker: false };
const sevenOfHearts: Card = { rank: Rank.SEVEN, suit: Suit.HEARTS, isJoker: false };
const jackOfClubs: Card = { rank: Rank.JACK, suit: Suit.CLUBS, isJoker: false };
const jokerCard: Card = { rank: null, suit: null, isJoker: true };

// Mock cardStyleStore — default 'classic'
jest.mock('../../../store/cardStyleStore', () => ({
  useCardStyleStore: (selector: (s: { activeStyleId: string }) => unknown) =>
    selector({ activeStyleId: 'classic' }),
}));

describe('CardTile — corner layout', () => {
  it('renders rank in corner for King of Spades', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} />);
    // rank appears in top-left and bottom-right corners
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });

  it('renders suit symbol for King of Spades', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} />);
    expect(getAllByText('♠').length).toBeGreaterThanOrEqual(1);
  });

  it('hides rank and suit when faceDown', () => {
    const { queryByText } = render(<CardTile card={kingOfSpades} faceDown />);
    expect(queryByText('K')).toBeNull();
    expect(queryByText('♠')).toBeNull();
  });
});

describe('CardTile — card types', () => {
  it('Ace shows large centered suit symbol', () => {
    const { getAllByText } = render(<CardTile card={aceOfHearts} />);
    // ♥ appears in corners AND center
    expect(getAllByText('♥').length).toBeGreaterThanOrEqual(2);
  });

  it('Joker shows joker glyph', () => {
    const { getAllByText } = render(<CardTile card={jokerCard} />);
    expect(getAllByText('🃏').length).toBeGreaterThan(0);
  });

  it('face card renders rank label', () => {
    const { getAllByText } = render(<CardTile card={jackOfClubs} />);
    expect(getAllByText('J').length).toBeGreaterThanOrEqual(1);
  });
});

describe('CardTile — suit colors', () => {
  it('red suit text present for Hearts', () => {
    const { getAllByText } = render(<CardTile card={aceOfHearts} />);
    const suitEls = getAllByText('♥');
    expect(suitEls.length).toBeGreaterThan(0);
  });

  it('dark suit text present for Spades', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} />);
    const suitEls = getAllByText('♠');
    expect(suitEls.length).toBeGreaterThan(0);
  });
});

describe('CardTile — dimmed state', () => {
  it('renders without error when dimmed', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} dimmed />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without error when not dimmed', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} dimmed={false} />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });
});

describe('CardTile — sizes', () => {
  it('renders sm size without error', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} size="sm" />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });

  it('renders lg size without error', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} size="lg" />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });
});

describe('CardTile — face down', () => {
  it('renders face down without any card content', () => {
    const { queryByText } = render(<CardTile card={sevenOfHearts} faceDown />);
    expect(queryByText('7')).toBeNull();
    expect(queryByText('♥')).toBeNull();
  });
});

describe('CardTile — isNew indicator', () => {
  it('renders without error when isNew is true', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} isNew />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without error when isNew is true and dimmed is true', () => {
    // dimmed suppresses the glow — card should still render
    const { getAllByText } = render(<CardTile card={kingOfSpades} isNew dimmed />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });

  it('renders without error when isNew is false (default)', () => {
    const { getAllByText } = render(<CardTile card={kingOfSpades} />);
    expect(getAllByText('K').length).toBeGreaterThanOrEqual(1);
  });
});
