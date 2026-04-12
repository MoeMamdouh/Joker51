import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { colors, radii, spacing, typography } from '../../theme/tokens';

interface ResumeGamePromptProps {
  onResume(): void;
  onNewGame(): void;
  testID?: string;
}

export function ResumeGamePrompt({ onResume, onNewGame, testID }: ResumeGamePromptProps) {
  const { t } = useTranslation();

  return (
    <Modal transparent animationType="fade" testID={testID}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title} testID="resume-prompt-title">
            {t('setup.resumeTitle')}
          </Text>
          <Text style={styles.body} testID="resume-prompt-body">
            {t('setup.resumeBody')}
          </Text>
          <View style={styles.actions}>
            <Button
              label={t('setup.resumeButton')}
              onPress={onResume}
              variant="primary"
              testID="resume-prompt-resume"
              style={styles.button}
            />
            <Button
              label={t('setup.newGameButton')}
              onPress={onNewGame}
              variant="secondary"
              testID="resume-prompt-new-game"
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 380,
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
  },
  body: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    width: '100%',
  },
});
