import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LanguageSelector } from '../LanguageSelector';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'setup.language': 'Language',
        'common.language.en': 'English',
        'common.language.ar': 'العربية',
      };
      return map[key] ?? key;
    },
  }),
}));

describe('LanguageSelector', () => {
  it('marks EN as selected when value is en', () => {
    const { getByTestId } = render(
      <LanguageSelector value="en" onChange={jest.fn()} testID="ls" />
    );
    expect(getByTestId('ls-en').props.accessibilityState?.checked).toBe(true);
    expect(getByTestId('ls-ar').props.accessibilityState?.checked).toBe(false);
  });

  it('marks AR as selected when value is ar', () => {
    const { getByTestId } = render(
      <LanguageSelector value="ar" onChange={jest.fn()} testID="ls" />
    );
    expect(getByTestId('ls-ar').props.accessibilityState?.checked).toBe(true);
    expect(getByTestId('ls-en').props.accessibilityState?.checked).toBe(false);
  });

  it('calls onChange with ar when AR option is tapped', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <LanguageSelector value="en" onChange={onChange} testID="ls" />
    );
    fireEvent.press(getByTestId('ls-ar'));
    expect(onChange).toHaveBeenCalledWith('ar');
  });

  it('renders translated labels for both options', () => {
    const { getByText } = render(
      <LanguageSelector value="en" onChange={jest.fn()} testID="ls" />
    );
    expect(getByText('English')).toBeTruthy();
    expect(getByText('العربية')).toBeTruthy();
  });
});
