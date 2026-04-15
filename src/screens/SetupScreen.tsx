import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useSetupStore, deckCountForPlayers } from '../store/setupStore';
import { useLanguageStore } from '../store/languageStore';
import { useGameStore } from '../store/gameStore';
import { useDirection } from '../contexts/DirectionContext';
import { useSavedSession } from '../hooks/useSavedSession';
import { SafeScrollView } from '../components/layout/SafeScrollView';
import { PlayerCountStepper } from '../components/setup/PlayerCountStepper';
import { PlayerNameInput } from '../components/setup/PlayerNameInput';
import { ResumeGamePrompt } from '../components/setup/ResumeGamePrompt';
import { DeckCountNotice } from '../components/setup/DeckCountNotice';
import { RoundFormatSelector } from '../components/setup/RoundFormatSelector';
import { LanguageSelector } from '../components/setup/LanguageSelector';
import { Button } from '../components/ui/Button';
import { colors, spacing, typography, radii } from '../theme/tokens';

export function SetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isRTL } = useDirection();

  const { session, loading, clearSession } = useSavedSession();

  const locale = useLanguageStore(s => s.locale);
  const setLocale = useLanguageStore(s => s.setLocale);

  const playerCount = useSetupStore(s => s.playerCount);
  const playerNames = useSetupStore(s => s.playerNames);
  const roundFormat = useSetupStore(s => s.roundFormat);
  const fieldErrors = useSetupStore(s => s.fieldErrors);
  const setPlayerCount = useSetupStore(s => s.setPlayerCount);
  const setPlayerName = useSetupStore(s => s.setPlayerName);
  const setRoundFormat = useSetupStore(s => s.setRoundFormat);
  const startGame = useSetupStore(s => s.startGame);

  function handleResume() {
    if (session) {
      useGameStore.getState().setGame(session);
    }
    router.replace('/game');
  }

  async function handleNewGame() {
    await clearSession();
  }

  function handleStart() {
    const { valid } = startGame();
    if (!valid) return;
    router.replace('/game');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <>
      {session && (
        <ResumeGamePrompt
          onResume={handleResume}
          onNewGame={handleNewGame}
          testID="resume-game-prompt"
        />
      )}
      <SafeScrollView testID="setup-screen">
        <View style={styles.titleRow}>
          <Text style={[styles.title, isRTL && styles.titleRTL]} testID="setup-title">
            {t('setup.title')}
          </Text>
          <Pressable
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
            testID="btn-settings"
          >
            <Text style={styles.settingsButtonText}>{t('settings.title')}</Text>
          </Pressable>
        </View>

        <LanguageSelector
          value={locale}
          onChange={setLocale}
          testID="language-selector"
        />

        <PlayerCountStepper
          value={playerCount}
          onChange={setPlayerCount}
          testID="player-count-stepper"
        />

        <DeckCountNotice
          deckCount={deckCountForPlayers(playerCount)}
          testID="deck-count-notice"
        />

        <RoundFormatSelector
          value={roundFormat}
          onChange={setRoundFormat}
          testID="round-format-selector"
        />

        {playerNames.map((name, index) => (
          <PlayerNameInput
            key={index}
            index={index}
            value={name}
            error={fieldErrors[index]}
            onChange={n => setPlayerName(index, n)}
          />
        ))}

        <View style={styles.startButtonContainer}>
          <Button
            label={t('setup.startButton')}
            onPress={handleStart}
            variant="primary"
            testID="start-game-button"
            style={styles.startButton}
          />
        </View>
      </SafeScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  settingsButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  titleRTL: {},
  startButtonContainer: {
    marginTop: spacing.lg,
  },
  startButton: {
    width: '100%',
  },
});
