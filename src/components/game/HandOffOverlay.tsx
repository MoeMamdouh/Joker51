import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, radii } from '../../theme/tokens';

interface HandOffOverlayProps {
  nextPlayerName: string;
  onConfirm(): void;
}

export function HandOffOverlay({ nextPlayerName, onConfirm }: HandOffOverlayProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.overlay}>
      <Text style={styles.prompt}>
        {t('game.handOff.prompt', { name: nextPlayerName })}
      </Text>
      <Pressable style={styles.button} onPress={onConfirm}>
        <Text style={styles.buttonText}>
          {t('game.handOff.confirm', { name: nextPlayerName })}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.lg,
    zIndex: 100,
  },
  prompt: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    ...typography.label,
    color: colors.surface,
    fontWeight: '700',
  },
});
