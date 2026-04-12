import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HandOffOverlay } from '../HandOffOverlay';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'game.handOff.prompt') return `Pass device to ${opts?.name}`;
      if (key === 'game.handOff.confirm') return `I'm ${opts?.name}, show my hand`;
      return key;
    },
  }),
}));

describe('HandOffOverlay', () => {
  it('renders pass-device message with player name', () => {
    const { getByText } = render(
      <HandOffOverlay nextPlayerName="Alice" onConfirm={jest.fn()} />
    );
    expect(getByText('Pass device to Alice')).toBeTruthy();
  });

  it('renders confirm button with player name', () => {
    const { getByText } = render(
      <HandOffOverlay nextPlayerName="Bob" onConfirm={jest.fn()} />
    );
    expect(getByText("I'm Bob, show my hand")).toBeTruthy();
  });

  it('calls onConfirm when confirm button is pressed', () => {
    const onConfirm = jest.fn();
    const { getByText } = render(
      <HandOffOverlay nextPlayerName="Alice" onConfirm={onConfirm} />
    );
    fireEvent.press(getByText("I'm Alice, show my hand"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
