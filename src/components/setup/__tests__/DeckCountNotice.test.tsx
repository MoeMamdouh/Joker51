import React from 'react';
import { render } from '@testing-library/react-native';
import { DeckCountNotice } from '../DeckCountNotice';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { count?: number }) =>
      opts?.count ? `${opts.count} decks required` : key,
  }),
}));

describe('DeckCountNotice', () => {
  it('renders nothing when deckCount is 1', () => {
    const { toJSON } = render(<DeckCountNotice deckCount={1} testID="deck-notice" />);
    expect(toJSON()).toBeNull();
  });

  it('renders notice text when deckCount is 2', () => {
    const { getByText } = render(<DeckCountNotice deckCount={2} testID="deck-notice" />);
    expect(getByText('2 decks required')).toBeTruthy();
  });

  it('renders notice text when deckCount is 3', () => {
    const { getByText } = render(<DeckCountNotice deckCount={3} testID="deck-notice" />);
    expect(getByText('3 decks required')).toBeTruthy();
  });

  it('renders the container with testID when visible', () => {
    const { getByTestId } = render(<DeckCountNotice deckCount={2} testID="deck-notice" />);
    expect(getByTestId('deck-notice')).toBeTruthy();
  });
});
