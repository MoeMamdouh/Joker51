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
  /** Returns the card-array index of the claimable Joker, or -1 if none. */
  getClaimJokerCardIndex?(combination: Combination): number;
  onClaimJoker?(combinationId: string): void;
}

export function TableArea({
  combinations,
  players,
  canLayOff,
  activeCombinationId,
  onCombinationPress,
  getClaimJokerCardIndex,
  onClaimJoker,
}: TableAreaProps) {
  function getOwnerName(ownerId: string): string {
    return players.find(p => p.playerId === ownerId)?.name ?? ownerId;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {combinations.map(combination => {
        const claimIdx = getClaimJokerCardIndex ? getClaimJokerCardIndex(combination) : -1;
        const canClaim = claimIdx >= 0;
        return (
          <CombinationRow
            key={combination.id}
            combination={combination}
            ownerName={getOwnerName(combination.ownerId)}
            onPress={
              canClaim && onClaimJoker
                ? () => onClaimJoker(combination.id)
                : canLayOff && onCombinationPress
                  ? () => onCombinationPress(combination.id)
                  : undefined
            }
            claimJokerCardIndex={canClaim ? claimIdx : undefined}
            onClaimJoker={
              canClaim && onClaimJoker
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
