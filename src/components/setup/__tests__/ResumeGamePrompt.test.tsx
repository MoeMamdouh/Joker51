import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ResumeGamePrompt } from '../ResumeGamePrompt';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('ResumeGamePrompt', () => {
  it('renders title and body text', () => {
    const { getByTestId } = render(
      <ResumeGamePrompt onResume={jest.fn()} onNewGame={jest.fn()} />
    );
    expect(getByTestId('resume-prompt-title')).toBeTruthy();
    expect(getByTestId('resume-prompt-body')).toBeTruthy();
  });

  it('calls onResume when Resume Game button is tapped', () => {
    const onResume = jest.fn();
    const { getByTestId } = render(
      <ResumeGamePrompt onResume={onResume} onNewGame={jest.fn()} />
    );
    fireEvent.press(getByTestId('resume-prompt-resume'));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it('calls onNewGame when New Game button is tapped', () => {
    const onNewGame = jest.fn();
    const { getByTestId } = render(
      <ResumeGamePrompt onResume={jest.fn()} onNewGame={onNewGame} />
    );
    fireEvent.press(getByTestId('resume-prompt-new-game'));
    expect(onNewGame).toHaveBeenCalledTimes(1);
  });
});
