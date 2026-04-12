# UI Contracts: Meld & Table Management

**Feature**: `004-meld-table-management`
**Date**: 2026-04-12

Prop contracts for all components created or modified by Phase 4.

---

## Modified: `useGameActions` hook (`src/hooks/useGameActions.ts`)

### Changed method: `placeMeld`

```ts
// BEFORE (Phase 3 — single combination):
placeMeld(cards: Card[]): GameActionResult

// AFTER (Phase 4 — one or more combinations):
placeMeld(combinations: Card[][]): GameActionResult
```

- Calls `placeInitialMeld(state, { playerId, combinations })`.
- Returns `{ error: null }` on success, or `{ error: translatedMessage }` on failure.
- Error codes mapped: `MELD_BELOW_51_POINTS`, `COMBINATION_TOO_SHORT`, `JOKER_LIMIT_EXCEEDED`, `INVALID_COMBINATION`, `SET_DUPLICATE_SUIT`, `SEQUENCE_MIXED_SUITS`, `SEQUENCE_NOT_CONSECUTIVE`, `ACE_WRAPAROUND`, `CARD_NOT_IN_HAND`.

### Changed method: `claimJokerFromCombination`

```ts
// BEFORE (Phase 3 — single card):
claimJokerFromCombination(combinationId: string, realCard: Card): GameActionResult

// AFTER (Phase 4 — one or two cards):
claimJokerFromCombination(combinationId: string, realCards: Card[]): GameActionResult
```

- Calls `claimJoker(state, { playerId, combinationId, realCards })`.
- Additional error code mapped: `JOKER_CLAIM_AMBIGUOUS_SET` → `game.errors.jokerClaimAmbiguousSet`.

---

## Modified: `GameBoardScreen` (`src/screens/GameBoardScreen.tsx`)

### New local state

```ts
const [stagedCombinations, setStagedCombinations] = useState<Card[][]>([]);
```

### Updated `canClaimJokerForCombination`

```ts
// BEFORE: combination.cards.some(c => c.isJoker)
// AFTER: uses engine helper
function canClaimJokerForCombination(combination: Combination): boolean {
  if (!hasMelded || isDrawing) return false;
  return getClaimableJokerCards(combination, activeCards) !== null;
}
```

### Updated `handleClaimJoker`

```ts
function handleClaimJoker(combinationId: string) {
  const combo = tableState.combinations.find(c => c.id === combinationId);
  if (!combo) return;
  const realCards = getClaimableJokerCards(combo, activeCards);
  if (!realCards) { showError(t('game.errors.cardNotInHand')); return; }
  const result = actions.claimJokerFromCombination(combinationId, realCards);
  if (result.error) showError(result.error);
  else clearSelection();
}
```

### Updated `handleMeld` (staging flow)

```ts
function handleStageCombination() {
  if (selectedCards.length === 0) return;
  const vr = validateCombination(selectedCards, { isInitialMeld: true });
  if (!vr.valid) { showError(t(`game.errors.${ERROR_CODE_MAP[vr.error!] ?? vr.error}`)); return; }
  setStagedCombinations(prev => [...prev, selectedCards]);
  clearSelection();
}

function handleConfirmMeld() {
  if (stagedCombinations.length === 0) return;
  const result = actions.placeMeld(stagedCombinations);
  if (result.error) showError(result.error);
  else { setStagedCombinations([]); clearSelection(); }
}

function handleCancelMeld() {
  setStagedCombinations([]);
  clearSelection();
}
```

### Updated `orderedCombinations` derivation

```ts
const orderedCombinations = [...tableState.combinations].sort((a, b) => {
  const ia = config.players.findIndex(p => p.id === a.ownerId);
  const ib = config.players.findIndex(p => p.id === b.ownerId);
  return ia - ib;
});
// Pass orderedCombinations to TableArea instead of tableState.combinations
```

---

## New Component: `StagedMeldPreview` (`src/components/game/StagedMeldPreview.tsx`)

Displays staged combinations and running point total during the meld builder flow.

```ts
interface StagedMeldPreviewProps {
  stagedCombinations: Card[][];    // Each inner array = one staged combination
  pointTotal: number;              // Pre-computed sum (from calculateMeldPoints)
  onCancel(): void;                // Clears all staged combinations
}
```

**Rendering**:
- Horizontal strip below `TableArea`, above `ActionBar`.
- Each staged combination rendered as a row of `CardTile` (size="sm").
- Running total shown: `t('game.stagedPoints', { points: pointTotal })`.
- "✕" cancel button calls `onCancel`.
- Only visible when `stagedCombinations.length > 0`.
- All values from design tokens; all strings via `useTranslation()`.

---

## Modified: `ActionBar` (`src/components/game/ActionBar.tsx`)

### Updated props

```ts
interface ActionBarProps {
  phase: TurnPhase;
  hasMelded: boolean;
  hasSelectedCards: boolean;
  canClaimJoker: boolean;
  isStagingMeld: boolean;        // NEW — true when stagedCombinations.length > 0
  meldReady: boolean;            // NEW — true when staged total >= 51 pts and staged combos > 0
  onStage(): void;               // NEW — stage current selection as one combination
  onMeld(): void;                // NOW means "Confirm Meld" (submit all staged combinations)
  onDiscard(): void;
  onLayOff(): void;
  onClaimJoker(): void;
}
```

**Button states:**

| Phase | hasMelded | isStagingMeld | Button visible / enabled |
|---|---|---|---|
| DRAWING | any | any | All action buttons disabled |
| ACTING | false | false | "Stage" (enabled if hasSelectedCards), no Meld button yet |
| ACTING | false | true | "Stage" (enabled if hasSelectedCards), "Meld" (enabled if meldReady), "Cancel" |
| ACTING | true | — | "Lay Off" (enabled if hasSelectedCards), "Discard", "Claim Joker" (if canClaimJoker) |

**Label mapping**:
- "Stage" → `t('game.actions.stageCombination')`
- "Meld" → `t('game.actions.confirmMeld')`  (only shown when `isStagingMeld`)
- "Cancel" → `t('game.actions.cancelMeld')` (only shown when `isStagingMeld`)

---

## Modified: `TableArea` (`src/components/game/TableArea.tsx`)

No prop signature change. Receives `combinations` pre-sorted by the caller (`GameBoardScreen`). No internal sort logic added (keeps component pure).

---

## New engine helper: `getClaimableJokerCards` (`src/engine/validation.ts`)

```ts
export function getClaimableJokerCards(
  combination: Combination,
  playerHand: readonly Card[]
): Card[] | null
```

See `data-model.md` for full specification.
