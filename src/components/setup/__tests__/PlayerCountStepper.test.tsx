import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PlayerCountStepper } from '../PlayerCountStepper';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('PlayerCountStepper', () => {
  it('disables decrement button at minimum value (2)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PlayerCountStepper value={2} onChange={onChange} testID="stepper" />
    );
    expect(getByTestId('stepper-decrement').props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('stepper-increment').props.accessibilityState?.disabled).toBe(false);
  });

  it('disables increment button at maximum value (8)', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PlayerCountStepper value={8} onChange={onChange} testID="stepper" />
    );
    expect(getByTestId('stepper-increment').props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('stepper-decrement').props.accessibilityState?.disabled).toBe(false);
  });

  it('calls onChange with incremented value when increment is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PlayerCountStepper value={3} onChange={onChange} testID="stepper" />
    );
    fireEvent.press(getByTestId('stepper-increment'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('calls onChange with decremented value when decrement is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <PlayerCountStepper value={3} onChange={onChange} testID="stepper" />
    );
    fireEvent.press(getByTestId('stepper-decrement'));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('displays current count value', () => {
    const { getByTestId } = render(
      <PlayerCountStepper value={5} onChange={jest.fn()} testID="stepper" />
    );
    expect(getByTestId('stepper-value').props.children).toBe(5);
  });
});
