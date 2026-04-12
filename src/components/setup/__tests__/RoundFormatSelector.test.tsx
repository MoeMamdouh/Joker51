import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoundFormatSelector } from '../RoundFormatSelector';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('RoundFormatSelector', () => {
  it('renders all three options', () => {
    const { getByTestId } = render(
      <RoundFormatSelector value={4} onChange={jest.fn()} testID="rfs" />
    );
    expect(getByTestId('rfs-4')).toBeTruthy();
    expect(getByTestId('rfs-8')).toBeTruthy();
    expect(getByTestId('rfs-12')).toBeTruthy();
  });

  it('marks Short (4) as selected by default', () => {
    const { getByTestId } = render(
      <RoundFormatSelector value={4} onChange={jest.fn()} testID="rfs" />
    );
    expect(getByTestId('rfs-4').props.accessibilityState?.checked).toBe(true);
    expect(getByTestId('rfs-8').props.accessibilityState?.checked).toBe(false);
  });

  it('calls onChange with 8 when Medium is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <RoundFormatSelector value={4} onChange={onChange} testID="rfs" />
    );
    fireEvent.press(getByTestId('rfs-8'));
    expect(onChange).toHaveBeenCalledWith(8);
  });

  it('marks the currently selected option as checked', () => {
    const { getByTestId } = render(
      <RoundFormatSelector value={12} onChange={jest.fn()} testID="rfs" />
    );
    expect(getByTestId('rfs-12').props.accessibilityState?.checked).toBe(true);
    expect(getByTestId('rfs-4').props.accessibilityState?.checked).toBe(false);
  });
});
