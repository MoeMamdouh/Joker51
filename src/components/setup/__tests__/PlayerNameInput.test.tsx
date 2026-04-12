import React from 'react';
import { render } from '@testing-library/react-native';
import { PlayerNameInput } from '../PlayerNameInput';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, opts?: { number?: number }) => opts?.number ? `Player ${opts.number}` : key }),
}));

jest.mock('../../../contexts/DirectionContext', () => ({
  useDirection: () => ({ isRTL: false, direction: 'ltr' }),
}));

describe('PlayerNameInput', () => {
  it('renders player label with correct number', () => {
    const { getByText } = render(
      <PlayerNameInput index={0} value="" error={null} onChange={jest.fn()} />
    );
    expect(getByText('Player 1')).toBeTruthy();
  });

  it('does not render error text when error is null', () => {
    const { queryByTestId } = render(
      <PlayerNameInput index={0} value="" error={null} onChange={jest.fn()} testID="name-0" />
    );
    expect(queryByTestId('name-0-error')).toBeNull();
  });

  it('renders translated error text when error key provided', () => {
    const { getByTestId } = render(
      <PlayerNameInput index={0} value="" error="validation.nameRequired" onChange={jest.fn()} testID="name-0" />
    );
    expect(getByTestId('name-0-error')).toBeTruthy();
  });

  it('respects maxLength of 20', () => {
    const { getByTestId } = render(
      <PlayerNameInput index={0} value="" error={null} onChange={jest.fn()} testID="name-0" />
    );
    expect(getByTestId('name-0').props.maxLength).toBe(20);
  });
});
