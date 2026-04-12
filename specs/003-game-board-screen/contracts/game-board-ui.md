# UI Contract: Game Board Screen

**Branch**: `003-game-board-screen` | **Date**: 2026-04-12

Defines the prop contracts for all new components. Existing components (Button, TextInput, SafeScrollView, etc.) are unchanged.

---

## Screen: GameBoardScreen

**File**: `src/screens/GameBoardScreen.tsx`
**Route**: `/game`

Reads from `gameStore.currentGame`. Has no props (route-level component).

**Renders**:
1. `ScoreboardRow` (always visible, top)
2. `TurnIndicator` (active player name + phase)
3. `OpponentBadges` (card count per non-active player)
4. `TableArea` (all combinations)
5. `DrawPile` + `DiscardPile` (side by side)
6. `HandArea` (active player's cards, face-up)
7. `ActionBar` (Meld / Lay Off / Discard / Claim Joker buttons)
8. `ErrorBanner` (transient, below ActionBar)
9. `HandOffOverlay` (full-screen, between turns)
10. `RoundSummaryOverlay` (full-screen, on round_ended / game_over)

---

## Component: CardTile

**File**: `src/components/game/CardTile.tsx`

```typescript
interface CardTileProps {
  card: Card;
  selected?: boolean;           // drives translateY elevation + selected border
  faceDown?: boolean;           // renders card back pattern
  onPress?(): void;             // undefined = non-interactive
  size?: 'sm' | 'md' | 'lg';  // sm: 40×56, md: 52×72, lg: 64×90 (px)
  testID?: string;
}
```

**Visual rules**:
- Joker: `colors.card.joker` background, wildcard symbol
- Red suits (hearts/diamonds): `colors.suit.red` rank text
- Black suits (spades/clubs): `colors.suit.black` rank text
- Selected: `translateY(-8)`, `colors.card.selected` border
- Face-down: `colors.card.back` solid fill, no rank/suit

---

## Component: HandArea

**File**: `src/components/game/HandArea.tsx`

```typescript
interface HandAreaProps {
  cards: Card[];
  selectedCards: Card[];
  onCardPress(card: Card): void;
  testID?: string;
}
```

Renders a horizontal `ScrollView` of `CardTile` (size="md") with `selected` prop derived by reference equality against `selectedCards`.

---

## Component: DrawPile

**File**: `src/components/game/DrawPile.tsx`

```typescript
interface DrawPileProps {
  cardCount: number;
  onPress?(): void;             // undefined when not DRAWING phase or not active player
  testID?: string;
}
```

Renders a face-down `CardTile` (size="lg") with a badge showing `cardCount`.

---

## Component: DiscardPile

**File**: `src/components/game/DiscardPile.tsx`

```typescript
interface DiscardPileProps {
  topCard: Card | null;         // null = empty pile (edge case: all cards in hands)
  onPress?(): void;             // undefined when not DRAWING phase or not active player
  testID?: string;
}
```

Renders the top card face-up or an empty placeholder.

---

## Component: CombinationRow

**File**: `src/components/game/CombinationRow.tsx`

```typescript
interface CombinationRowProps {
  combination: Combination;
  ownerName: string;
  onPress?(): void;             // triggered when melded player taps in ACTING phase
  showClaimJoker?: boolean;     // true when active player holds the replacement card
  onClaimJoker?(): void;
  testID?: string;
}
```

---

## Component: TableArea

**File**: `src/components/game/TableArea.tsx`

```typescript
interface TableAreaProps {
  combinations: Combination[];
  players: PlayerConfig[];      // for owner name lookup
  onCombinationPress(combination: Combination): void;
  onClaimJoker(combination: Combination): void;
  activeCombinationId?: string; // highlighted during lay-off target selection
  canLayOff: boolean;           // false if not yet melded or wrong phase
  testID?: string;
}
```

---

## Component: ScoreboardRow

**File**: `src/components/game/ScoreboardRow.tsx`

```typescript
interface ScoreboardRowProps {
  players: PlayerConfig[];
  roundResults: RoundResult[];  // derives cumulative score per player
  activePlayerId: string;       // bold/highlighted entry
  testID?: string;
}
```

Renders a horizontal compact row: `[Name: 0 pts]  [Name: 12 pts]  ...`

---

## Component: ActionBar

**File**: `src/components/game/ActionBar.tsx`

```typescript
interface ActionBarProps {
  phase: TurnPhase;
  hasSelectedCards: boolean;
  hasMelded: boolean;           // false = show Meld; true = show LayOff
  canClaimJoker: boolean;
  onMeld(): void;
  onLayOff(): void;
  onDiscard(): void;
  onClaimJoker(): void;
  testID?: string;
}
```

**Button visibility rules**:
- DRAWING phase: all action buttons disabled
- ACTING + not melded: show Meld (enabled if ≥1 card selected), Discard (always enabled)
- ACTING + melded: show Lay Off (enabled if ≥1 card selected), Discard (always enabled), Claim Joker (enabled only if `canClaimJoker`)

---

## Component: PlayerBadge

**File**: `src/components/game/PlayerBadge.tsx`

```typescript
interface PlayerBadgeProps {
  name: string;
  cardCount: number;
  isActive: boolean;            // outlined in accent color
  testID?: string;
}
```

---

## Component: HandOffOverlay

**File**: `src/components/game/HandOffOverlay.tsx`

```typescript
interface HandOffOverlayProps {
  nextPlayerName: string;
  onConfirm(): void;            // reveals hand area
  testID?: string;
}
```

Full-screen overlay shown between turns. Renders:
- "Pass device to [nextPlayerName]"
- Large "I'm [Name], show my hand" primary Button

---

## Component: RoundSummaryOverlay

**File**: `src/components/game/RoundSummaryOverlay.tsx`

```typescript
interface RoundSummaryOverlayProps {
  roundResult: RoundResult;
  players: PlayerConfig[];
  cumulativeScores: Record<string, number>;
  roundWinnerIds: string[];     // may be multiple (co-winners)
  isGameOver: boolean;
  currentRound: number;
  totalRounds: number;
  onNextRound(): void;          // only shown if !isGameOver
  onNewGame(): void;            // shown if isGameOver
  onPlayAgain(): void;          // shown if isGameOver
  testID?: string;
}
```

---

## Hook: useGameActions

**File**: `src/hooks/useGameActions.ts`

```typescript
interface GameActionResult {
  error: string | null;         // translated i18n key, null on success
}

interface UseGameActionsReturn {
  drawFromPile(): GameActionResult;
  pickUpDiscardTop(): GameActionResult;
  placeMeld(cards: Card[]): GameActionResult;
  layOff(card: Card, combinationId: string): GameActionResult;
  discardCard(card: Card): GameActionResult;
  claimJoker(combinationId: string): GameActionResult;
  startNextRound(): GameActionResult;
}
```

All methods:
1. Call the corresponding engine action with current `gameStore.currentGame`
2. On success: `gameStore.setGame(result.state)` + `AsyncStorage.setItem(SESSION_KEY, JSON.stringify(result.state))`
3. On failure: return `{ error: t('game.errors.' + result.error) }`

---

## Hook: useCardSelection

**File**: `src/hooks/useCardSelection.ts`

```typescript
interface UseCardSelectionReturn {
  selectedCards: Card[];
  toggleCard(card: Card): void;
  clearSelection(): void;
}
```

`toggleCard` uses reference equality to add/remove. `clearSelection` resets to `[]`.
