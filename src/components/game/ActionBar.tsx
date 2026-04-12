import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';
import { TurnPhase } from '../../engine/types';

interface ActionBarProps {
  phase: TurnPhase;
  hasMelded: boolean;
  hasSelectedCards: boolean;
  canClaimJoker: boolean;
  isStagingMeld: boolean;
  meldReady: boolean;
  onMeld(): void;
  onStage(): void;
  onCancelMeld(): void;
  onDiscard(): void;
  onClaimJoker(): void;
}

export function ActionBar({
  phase,
  hasMelded,
  hasSelectedCards,
  canClaimJoker,
  isStagingMeld,
  meldReady,
  onMeld,
  onStage,
  onCancelMeld,
  onDiscard,
  onClaimJoker,
}: ActionBarProps) {
  const { t } = useTranslation();

  const isDrawing = phase === TurnPhase.DRAWING;

  return (
    <View style={styles.container}>
      <ActionButton
        label={t('game.actions.stageCombination')}
        onPress={onStage}
        disabled={isDrawing || !hasSelectedCards}
        testID="btn-stage"
      />
      {isStagingMeld && (
        <>
          <ActionButton
            label={t('game.actions.confirmMeld')}
            onPress={onMeld}
            disabled={isDrawing || !meldReady}
            testID="btn-meld"
          />
          <ActionButton
            label={t('game.actions.cancelMeld')}
            onPress={onCancelMeld}
            disabled={isDrawing}
            testID="btn-cancel-meld"
          />
        </>
      )}

      <ActionButton
        label={t('game.actions.discard')}
        onPress={onDiscard}
        disabled={isDrawing}
        testID="btn-discard"
      />
      {hasMelded && canClaimJoker && (
        <ActionButton
          label={t('game.actions.claimJoker')}
          onPress={onClaimJoker}
          disabled={isDrawing}
          testID="btn-claim-joker"
        />
      )}
    </View>
  );
}

interface ActionButtonProps {
  label: string;
  onPress(): void;
  disabled?: boolean;
  testID?: string;
}

function ActionButton({ label, onPress, disabled = false, testID }: ActionButtonProps) {
  return (
    <Pressable
      style={[styles.button, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonText: {
    ...typography.label,
    color: colors.surface,
  },
  disabledText: {
    color: colors.text.placeholder,
  },
});
