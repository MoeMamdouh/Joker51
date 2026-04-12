import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { CombinationRow } from './CombinationRow';
import { spacing } from '../../theme/tokens';
import { Combination } from '../../engine/types';

interface PlayerInfo {
  playerId: string;
  name: string;
}

interface TableAreaProps {
  combinations: readonly Combination[];
  players: PlayerInfo[];
  canLayOff: boolean;
  activeCombinationId?: string;
  onCombinationPress?(combinationId: string): void;
  canClaimJokerForCombination?(combination: Combination): boolean;
  onClaimJoker?(combinationId: string): void;
}

export function TableArea({
  combinations,
  players,
  canLayOff,
  activeCombinationId,
  onCombinationPress,
  canClaimJokerForCombination,
  onClaimJoker,
}: TableAreaProps) {
  function getOwnerName(ownerId: string): string {
    return players.find(p => p.playerId === ownerId)?.name ?? ownerId;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {combinations.map(combination => {
        const showClaim = canClaimJokerForCombination
          ? canClaimJokerForCombination(combination)
          : false;
        return (
          <CombinationRow
            key={combination.id}
            combination={combination}
            ownerName={getOwnerName(combination.ownerId)}
            onPress={
              canLayOff && onCombinationPress
                ? () => onCombinationPress(combination.id)
                : undefined
            }
            showClaimJoker={showClaim}
            onClaimJoker={
              showClaim && onClaimJoker
                ? () => onClaimJoker(combination.id)
                : undefined
            }
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
  },
});
