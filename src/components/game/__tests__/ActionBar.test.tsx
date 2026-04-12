import React from 'react';
import { render } from '@testing-library/react-native';
import { ActionBar } from '../ActionBar';
import { TurnPhase } from '../../../engine/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'game.actions.meld': 'Meld',
        'game.actions.discard': 'Discard',
        'game.actions.layOff': 'Lay Off',
        'game.actions.claimJoker': 'Claim Joker',
      };
      return map[key] ?? key;
    },
  }),
}));

const noop = () => {};

// Pressable passes disabled state via accessibilityState in RN test renderer
function isDisabled(element: ReturnType<ReturnType<typeof render>['getByTestId']>): boolean {
  return (
    element.props.accessibilityState?.disabled === true ||
    element.props.disabled === true
  );
}

describe('ActionBar', () => {
  it('shows Meld (disabled) and Discard (disabled) in DRAWING phase', () => {
    const { getByTestId } = render(
      <ActionBar
        phase={TurnPhase.DRAWING}
        hasMelded={false}
        hasSelectedCards={false}
        canClaimJoker={false}
        onMeld={noop} onDiscard={noop} onLayOff={noop} onClaimJoker={noop}
      />
    );
    expect(isDisabled(getByTestId('btn-meld'))).toBe(true);
    expect(isDisabled(getByTestId('btn-discard'))).toBe(true);
  });

  it('shows Meld disabled when ACTING but no cards selected', () => {
    const { getByTestId, queryByTestId } = render(
      <ActionBar
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={false}
        canClaimJoker={false}
        onMeld={noop} onDiscard={noop} onLayOff={noop} onClaimJoker={noop}
      />
    );
    expect(isDisabled(getByTestId('btn-meld'))).toBe(true);
    // Discard enabled
    expect(isDisabled(getByTestId('btn-discard'))).toBe(false);
    // No lay-off when not melded
    expect(queryByTestId('btn-lay-off')).toBeNull();
  });

  it('shows Meld enabled when ACTING and cards selected', () => {
    const { getByTestId } = render(
      <ActionBar
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={true}
        canClaimJoker={false}
        onMeld={noop} onDiscard={noop} onLayOff={noop} onClaimJoker={noop}
      />
    );
    expect(isDisabled(getByTestId('btn-meld'))).toBe(false);
  });

  it('shows LayOff + Discard + ClaimJoker when melded with canClaimJoker', () => {
    const { getByTestId, queryByTestId } = render(
      <ActionBar
        phase={TurnPhase.ACTING}
        hasMelded={true}
        hasSelectedCards={true}
        canClaimJoker={true}
        onMeld={noop} onDiscard={noop} onLayOff={noop} onClaimJoker={noop}
      />
    );
    expect(getByTestId('btn-lay-off')).toBeTruthy();
    expect(getByTestId('btn-discard')).toBeTruthy();
    expect(getByTestId('btn-claim-joker')).toBeTruthy();
    // No Meld button after first meld
    expect(queryByTestId('btn-meld')).toBeNull();
  });

  it('does not show LayOff when not yet melded', () => {
    const { queryByTestId } = render(
      <ActionBar
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={true}
        canClaimJoker={false}
        onMeld={noop} onDiscard={noop} onLayOff={noop} onClaimJoker={noop}
      />
    );
    expect(queryByTestId('btn-lay-off')).toBeNull();
  });
});
