# Contract: UI Component APIs — Design System & Game UX

**Feature**: `008-design-system-theme`  
**Date**: 2026-04-13

---

## CardTile (modified)

**File**: `src/components/game/CardTile.tsx`

```typescript
interface CardTileProps {
  card: Card;
  selected?: boolean;   // staged state — card lifts up
  dimmed?: boolean;     // non-interactive, reduced opacity
  faceDown?: boolean;
  onPress?(): void;
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}
```

**Changes from current**:
- Adds `dimmed` prop (new). When `true`: opacity = 0.35, `Pressable` disabled regardless of `onPress`.
- Restructures card face layout from "center rank+suit" to corner layout:
  - **Top-left**: small rank label + suit symbol (stacked, `typography.cardCorner`)
  - **Bottom-right**: same content rotated 180° (`transform: [{ rotate: '180deg' }]`)
  - **Center**: content determined by card type × active card style (see below)
- Card style is read internally via `useCardStyleStore()` — not a prop.

**Center content by card type**:

| Card Type | `classic` style | `minimal` style |
|-----------|-----------------|-----------------|
| Number (2–10) | Large suit symbol (`typography.cardCenter`) | Empty center |
| Ace | Large suit symbol centered | Large suit symbol centered |
| Face (J, Q, K) | Large rank letter on `colors.card.faceCard.classicBg` fill | Empty center |
| Joker | "JOKER" label, `colors.card.joker` background | "JOKER" label, same |

**Invariants**:
- `selected` and `dimmed` must not both be `true` — caller responsibility.
- `faceDown=true` takes precedence over all other props; renders back pattern only.
- Card face background is always `colors.card.face` (white) regardless of style.

---

## HandArea (modified)

**File**: `src/components/game/HandArea.tsx`

```typescript
interface HandAreaProps {
  cards: Card[];
  selectedCards: Card[];
  onCardPress(card: Card): void;
  onReorder?(orderedCards: Card[]): void;  // called after drag completes; optional
}
```

**Changes from current**:
- Adds `onReorder` callback (optional). When provided, enables drag-to-reorder.
- Internally manages cosmetic card order via `useHandOrder(cards)` hook.
- Derives `dimmed` per card: `selectedCards.length > 0 && !selectedCards.includes(card)`.
- Replaces `ScrollView` with a Gesture-Handler-compatible horizontal layout.
- Each card is wrapped in a `GestureDetector` with a long-press + pan gesture (200ms threshold).
- Dragged card visually lifts (`shadows.cardLifted`) and peers animate aside.
- On drag release at valid position: calls `useHandOrder.moveCard(from, to)`.
- RTL: when `isRTL`, the visual order is reversed (existing behaviour preserved).

**Interaction invariant**: A drag gesture on a `dimmed` card is ignored — drag only activates on interactive (non-dimmed) cards.

---

## BottomSheet (new)

**File**: `src/components/ui/BottomSheet.tsx`

```typescript
interface BottomSheetProps {
  visible: boolean;
  onClose(): void;
  children: React.ReactNode;
  testID?: string;
}

export function BottomSheet(props: BottomSheetProps): React.ReactElement
```

**Contract**:
- Rendered as a React Native `Modal` (transparent, animationType="none").
- When `visible` becomes `true`: sheet animates up from off-screen (`withSpring`, stiffness 200, damping 20).
- When `visible` becomes `false` (or backdrop tapped, or swipe-down detected): sheet animates down then `onClose` is called.
- Backdrop is a full-screen `Pressable` with `colors.overlay.backdrop` background.
- Swipe-down dismiss: gesture delta > 80px OR vertical velocity > 500 triggers close.
- Sheet container uses `shadows.bottomSheet`, `radii.lg` on top corners, `colors.surface` background.
- Does not scroll; caller is responsible for fitting content within the sheet.
- Consumes design tokens exclusively — no raw values.

---

## JokerPlacementSheet (new)

**File**: `src/components/game/JokerPlacementSheet.tsx`

```typescript
interface JokerPlacementSheetProps {
  visible: boolean;
  options: JokerSequenceOption[];      // computed by caller
  onSelect(optionIndex: number): void; // called when player confirms
  onDismiss(): void;                   // called on cancel or swipe-down
}

export function JokerPlacementSheet(props: JokerPlacementSheetProps): React.ReactElement
```

**Contract**:
- Wraps `BottomSheet`.
- Renders each `JokerSequenceOption` as a selectable row showing `option.label`. The Joker's position is highlighted (e.g., bold or accent colour).
- Single selection: tapping a row sets it as the pending selection.
- A "Confirm" button becomes active when a row is selected; calls `onSelect(selectedIndex)`.
- A "Cancel" link or the `BottomSheet` dismiss gesture calls `onDismiss()`.
- On `onDismiss`: local selection state is reset (clean state for next open).
- When `options.length === 0`: sheet does not render (caller must ensure `visible=false` in this case).
- Consumes design tokens exclusively.

---

## CardStylePicker (new)

**File**: `src/components/settings/CardStylePicker.tsx`

```typescript
interface CardStylePickerProps {
  activeStyleId: CardStyleId;
  onSelect(id: CardStyleId): void;
}

export function CardStylePicker(props: CardStylePickerProps): React.ReactElement
```

**Contract**:
- Renders a horizontal row (or 2-column grid) of style option cards.
- Each option shows: a preview (one face card + one number card rendered as `CardTile` at `size='sm'`) and the style label below.
- Active style has a highlighted border (`colors.card.selected` or `colors.accent`).
- Tapping an option calls `onSelect(id)` immediately — no confirm step.
- The component is display-only: it does not write to the store directly. The `SettingsScreen` wires `onSelect` to `cardStyleStore.setStyle`.
- Consumes design tokens exclusively. Supports RTL layout.

---

## CardStyleStore public interface

**File**: `src/store/cardStyleStore.ts`

```typescript
interface CardStyleState {
  activeStyleId: CardStyleId;
  setStyle(id: CardStyleId): void;
  loadPersistedStyle(): Promise<void>;
}

export const useCardStyleStore: UseBoundStore<StoreApi<CardStyleState>>
```

**setStyle contract**:
1. Updates `activeStyleId` in store (triggers reactive re-render of all `CardTile` subscribers).
2. Persists `id` to AsyncStorage key `@joker51/cardStyle` (fire-and-forget; errors swallowed).

**loadPersistedStyle contract**:
1. Reads `@joker51/cardStyle` from AsyncStorage.
2. If value is a valid `CardStyleId`, calls `setStyle(value)`.
3. If absent or unrecognised, silently retains `DEFAULT_CARD_STYLE` ('classic').
4. Called once at app startup (in `_layout.tsx` alongside `loadPersistedLocale`).

---

## useHandOrder hook

**File**: `src/hooks/useHandOrder.ts`

```typescript
interface UseHandOrderReturn {
  orderedCards: Card[];
  moveCard(fromIndex: number, toIndex: number): void;
}

export function useHandOrder(cards: readonly Card[]): UseHandOrderReturn
```

**Contract**:
- `orderedCards`: the cosmetic ordering of `cards`. Initially equals `cards` order.
- When `cards` prop changes: cards no longer present are dropped from order; cards newly added are appended to the end. Existing relative order preserved.
- `moveCard(from, to)`: splices card at `from` and inserts before `to`. Indices refer to `orderedCards` positions.
- Does not read or write AsyncStorage.
- Does not interact with game state — order is purely cosmetic.

---

## i18n additions

**Files**: `src/i18n/en.json`, `src/i18n/ar.json`

New keys required (both files, same structure):

```json
{
  "settings": {
    "title": "Settings",
    "cardStyle": {
      "label": "Card Style",
      "classic": "Classic",
      "minimal": "Minimal"
    },
    "language": {
      "label": "Language"
    }
  },
  "game": {
    "jokerPlacement": {
      "title": "Place Joker As",
      "confirm": "Confirm",
      "cancel": "Cancel"
    }
  }
}
```

**Constraint**: Both files must receive these keys in the same commit (constitution §VI).
