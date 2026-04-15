import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../ui/BottomSheet';
import { CardTile } from './CardTile';
import { Card } from '../../engine/types';
import { colors, spacing, radii, typography } from '../../theme/tokens';
import { useDirection } from '../../contexts/DirectionContext';

/**
 * One valid position option for the Joker within a sequence.
 * `cards` is the fully resolved sequence (Joker at the correct index).
 * `label` is a human-readable description (e.g. "Joker as 6♥").
 */
export interface JokerSequenceOption {
  /** Resolved card sequence with Joker at the chosen position */
  cards: Card[];
  /** Human-readable position hint shown in the picker row */
  label: string;
}

interface JokerPlacementSheetProps {
  visible: boolean;
  options: JokerSequenceOption[];
  onConfirm(option: JokerSequenceOption): void;
  onDismiss(): void;
}

export function JokerPlacementSheet({
  visible,
  options,
  onConfirm,
  onDismiss,
}: JokerPlacementSheetProps) {
  const { t } = useTranslation();
  const { direction } = useDirection();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleConfirm() {
    if (selectedIndex === null) return;
    onConfirm(options[selectedIndex]);
    setSelectedIndex(null);
  }

  function handleDismiss() {
    setSelectedIndex(null);
    onDismiss();
  }

  return (
    <BottomSheet visible={visible} onDismiss={handleDismiss}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('game.jokerPlacement.title')}</Text>

        <ScrollView style={styles.optionsList} testID="joker-options-list">
          {options.map((option, index) => (
            <Pressable
              key={index}
              style={[styles.optionRow, selectedIndex === index && styles.optionRowSelected]}
              onPress={() => setSelectedIndex(index)}
              testID={`joker-option-${index}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedIndex === index }}
            >
              <Text style={[styles.optionLabel, { textAlign: direction === 'rtl' ? 'right' : 'left' }]}>
                {option.label}
              </Text>
              <View style={[styles.cardRow, { flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }]}>
                {option.cards.map((card, ci) => (
                  <CardTile
                    key={ci}
                    card={card}
                    size="sm"
                    testID={`joker-option-${index}-card-${ci}`}
                  />
                ))}
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, styles.cancelButton]}
            onPress={handleDismiss}
            testID="joker-placement-cancel"
          >
            <Text style={styles.cancelText}>{t('game.jokerPlacement.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              styles.confirmButton,
              selectedIndex === null && styles.confirmButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={selectedIndex === null}
            testID="joker-placement-confirm"
          >
            <Text style={styles.confirmText}>{t('game.jokerPlacement.confirm')}</Text>
          </Pressable>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  optionsList: {
    maxHeight: 280,
  },
  optionRow: {
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  optionRowSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  optionLabel: {
    ...typography.label,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  cardRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  confirmButton: {
    backgroundColor: colors.accent,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmText: {
    ...typography.label,
    color: colors.background,
  },
});
