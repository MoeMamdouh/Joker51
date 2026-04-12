import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { DrawPile } from '../DrawPile';

describe('DrawPile', () => {
  it('renders card count badge', () => {
    const { getByText } = render(<DrawPile cardCount={24} />);
    expect(getByText('24')).toBeTruthy();
  });

  it('renders zero count badge', () => {
    const { getByText } = render(<DrawPile cardCount={0} />);
    expect(getByText('0')).toBeTruthy();
  });

  it('calls onPress when pressed and onPress is defined', () => {
    const onPress = jest.fn();
    const { getByText } = render(<DrawPile cardCount={10} onPress={onPress} />);
    fireEvent.press(getByText('10'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not crash when onPress is undefined', () => {
    const { getByText } = render(<DrawPile cardCount={5} />);
    expect(getByText('5')).toBeTruthy();
  });
});
