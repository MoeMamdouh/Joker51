import React from 'react';
import { render } from '@testing-library/react-native';
import { ActionBar } from '../ActionBar';
import { TurnPhase } from '../../../engine/types';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'game.actions.stageCombination': 'Stage',
        'game.actions.confirmMeld': 'Confirm Meld',
        'game.actions.cancelMeld': 'Cancel',
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

const defaultProps = {
  isStagingMeld: false,
  meldReady: false,
  onMeld: noop,
  onStage: noop,
  onCancelMeld: noop,
  onDiscard: noop,
  onLayOff: noop,
  onClaimJoker: noop,
};

describe('ActionBar', () => {
  it('shows Stage (disabled) and Discard (disabled) in DRAWING phase', () => {
    const { getByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.DRAWING}
        hasMelded={false}
        hasSelectedCards={false}
        canClaimJoker={false}
      />
    );
    expect(isDisabled(getByTestId('btn-stage'))).toBe(true);
    expect(isDisabled(getByTestId('btn-discard'))).toBe(true);
  });

  it('shows Stage disabled when ACTING but no cards selected', () => {
    const { getByTestId, queryByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={false}
        canClaimJoker={false}
      />
    );
    expect(isDisabled(getByTestId('btn-stage'))).toBe(true);
    // Discard enabled
    expect(isDisabled(getByTestId('btn-discard'))).toBe(false);
    // No lay-off when not melded
    expect(queryByTestId('btn-lay-off')).toBeNull();
    // No confirm meld when not staging
    expect(queryByTestId('btn-meld')).toBeNull();
  });

  it('shows Stage enabled when ACTING and cards selected (not staging)', () => {
    const { getByTestId, queryByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={true}
        canClaimJoker={false}
        isStagingMeld={false}
      />
    );
    expect(isDisabled(getByTestId('btn-stage'))).toBe(false);
    // No Confirm Meld or Cancel yet
    expect(queryByTestId('btn-meld')).toBeNull();
    expect(queryByTestId('btn-cancel-meld')).toBeNull();
  });

  it('shows Stage + LayOff + Discard + ClaimJoker when melded with canClaimJoker', () => {
    const { getByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={true}
        hasSelectedCards={true}
        canClaimJoker={true}
      />
    );
    // Stage is now always visible (melded players can place new combinations)
    expect(getByTestId('btn-stage')).toBeTruthy();
    expect(getByTestId('btn-lay-off')).toBeTruthy();
    expect(getByTestId('btn-discard')).toBeTruthy();
    expect(getByTestId('btn-claim-joker')).toBeTruthy();
  });

  it('does not show LayOff when not yet melded', () => {
    const { queryByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={true}
        canClaimJoker={false}
      />
    );
    expect(queryByTestId('btn-lay-off')).toBeNull();
  });

  // Phase 4 staging tests

  it('ACTING + not melded + staging (< 51 pts): Stage + Cancel visible, Confirm Meld disabled', () => {
    const { getByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={true}
        canClaimJoker={false}
        isStagingMeld={true}
        meldReady={false}
      />
    );
    expect(getByTestId('btn-stage')).toBeTruthy();
    expect(getByTestId('btn-cancel-meld')).toBeTruthy();
    expect(isDisabled(getByTestId('btn-meld'))).toBe(true);
  });

  it('ACTING + not melded + staging (≥ 51 pts): Confirm Meld enabled', () => {
    const { getByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={false}
        hasSelectedCards={false}
        canClaimJoker={false}
        isStagingMeld={true}
        meldReady={true}
      />
    );
    expect(isDisabled(getByTestId('btn-meld'))).toBe(false);
  });

  it('ACTING + melded: Stage button shown (additional melds allowed), lay-off/discard also shown', () => {
    const { getByTestId } = render(
      <ActionBar
        {...defaultProps}
        phase={TurnPhase.ACTING}
        hasMelded={true}
        hasSelectedCards={true}
        canClaimJoker={false}
        isStagingMeld={false}
        meldReady={false}
      />
    );
    // Stage is now shown for melded players too (additional combinations)
    expect(getByTestId('btn-stage')).toBeTruthy();
    expect(getByTestId('btn-lay-off')).toBeTruthy();
    expect(getByTestId('btn-discard')).toBeTruthy();
  });
});
