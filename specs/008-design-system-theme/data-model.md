# Data Model: Design System, Theme & Game UX

**Feature**: `008-design-system-theme`  
**Date**: 2026-04-13

---

## New Types

### CardStyleId (`src/store/cardStyleStore.ts`)

```typescript
export type CardStyleId = 'classic' | 'minimal';
```

The `classic` style renders face cards with a large centered rank letter on an amber/gold background fill. The `minimal` style uses only the corner rank-and-suit layout with no center fill for face cards.

---

### CardStyleDefinition (`src/store/cardStyleStore.ts`)

```typescript
export interface CardStyleDefinition {
  id: CardStyleId;
  label: string;                         // display name (i18n key or static string)
  faceCardCenterBg: string | null;       // token color for face card center fill; null = no fill
  faceCardCenterTextColor: string;       // token color for the large rank letter
  showNumberCardCenterSuit: boolean;     // whether 2–10 cards show a large center suit symbol
}
```

**Constants** (defined alongside the type):
```typescript
export const CARD_STYLES: Record<CardStyleId, CardStyleDefinition> = {
  classic: {
    id: 'classic',
    label: 'Classic',
    faceCardCenterBg: colors.card.faceCard.classicBg,   // amber/gold token
    faceCardCenterTextColor: colors.card.faceCard.classicText,
    showNumberCardCenterSuit: true,
  },
  minimal: {
    id: 'minimal',
    label: 'Minimal',
    faceCardCenterBg: null,
    faceCardCenterTextColor: colors.card.face,           // white on no-fill
    showNumberCardCenterSuit: false,
  },
};

export const DEFAULT_CARD_STYLE: CardStyleId = 'classic';
```

---

### CardStyleStore (`src/store/cardStyleStore.ts`)

```typescript
interface CardStyleState {
  activeStyleId: CardStyleId;
  setStyle(id: CardStyleId): void;
  loadPersistedStyle(): Promise<void>;
}
```

- `activeStyleId`: reactive — all mounted `CardTile` components re-render when this changes.
- `setStyle`: updates store + persists to AsyncStorage key `@joker51/cardStyle` (fire-and-forget).
- `loadPersistedStyle`: called at app startup; falls back to `DEFAULT_CARD_STYLE` if key is absent or value is unrecognised.

**AsyncStorage key**: `@joker51/cardStyle`

---

### CardTile Visual States

`CardTile` renders in one of four visual states derived from props:

| State     | Condition                                      | Visual                                              |
|-----------|------------------------------------------------|-----------------------------------------------------|
| `normal`  | `selected=false`, `dimmed=false`, `faceDown=false` | Full opacity, interactive                           |
| `staged`  | `selected=true`                                | Translated up 8px, highlighted border, full opacity |
| `dimmed`  | `dimmed=true`                                  | Opacity 0.35, `Pressable` disabled                  |
| `faceDown`| `faceDown=true`                                | Shows back pattern, no rank/suit content            |

These states are mutually exclusive in usage: `selected` and `dimmed` are never both `true` on the same card (enforced by `HandArea` derivation logic).

---

### JokerSequenceOption (`src/components/game/JokerPlacementSheet.tsx`)

```typescript
export interface JokerSequenceOption {
  /** Full sequence of cards as they would appear on the table, with the Joker at this position. */
  sequence: readonly Card[];
  /** Zero-based index of the Joker within `sequence`. */
  jokerIndex: number;
  /** Human-readable label, e.g. "6♠ – J – 8♠" */
  label: string;
}
```

This type is computed by the caller (GameBoardScreen) and passed into `JokerPlacementSheet`. The component is display-only — it does not compute valid Joker positions.

---

### useHandOrder hook (`src/hooks/useHandOrder.ts`)

```typescript
interface UseHandOrderReturn {
  orderedCards: Card[];
  moveCard(fromIndex: number, toIndex: number): void;
}

export function useHandOrder(cards: readonly Card[]): UseHandOrderReturn
```

**Behaviour**:
- Maintains a cosmetic ordering of `cards` in local state.
- When `cards` changes (draw, discard, meld): new cards not in the current order are appended; cards no longer in `cards` are removed. Existing relative order is preserved.
- `moveCard(from, to)` updates the cosmetic order — used by `HandArea` on drag completion.
- Does not interact with AsyncStorage or game state; purely local render state.

---

## Modified Types

### tokens.ts additions (`src/theme/tokens.ts`)

New entries to add — all keys MUST be semantic, not literal:

```typescript
// Extended colors
export const colors = {
  // existing...
  card: {
    face: '#FFFFFF',
    back: '#1E3A5F',
    selected: '#E8B84B',
    joker: '#8B5CF6',
    dimmed: 'rgba(0,0,0,0.45)',        // NEW: overlay color for dimmed state
    faceCard: {                         // NEW: per-style face card tokens
      classicBg: '#C8972A',            // amber/gold fill for classic face cards
      classicText: '#FFFFFF',
    },
  },
  suit: {
    red: '#E74C3C',
    black: '#2C3E50',                  // UPDATED: was '#1A2632' — darker for contrast on white card face
  },
  overlay: {
    backdrop: 'rgba(0,0,0,0.55)',      // NEW: bottom sheet backdrop
  },
} as const;

// Extended typography
export const typography = {
  // existing...
  cardCorner: {                         // NEW: small corner rank/suit text
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 13,
  },
  cardCenter: {                         // NEW: large center rank letter / suit symbol
    fontSize: 22,
    fontWeight: '800' as const,
    lineHeight: 26,
  },
  cardCenterSm: {                       // NEW: center text for 'sm' card size
    fontSize: 14,
    fontWeight: '800' as const,
    lineHeight: 17,
  },
} as const;

// Extended shadows
export const shadows = {
  card: { /* existing */ },
  cardLifted: {                         // NEW: elevated shadow for dragged/staged card
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  bottomSheet: {                        // NEW: bottom sheet container shadow
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
} as const;

// Extended z-index
export const zIndex = {                  // NEW section
  card: 1,
  cardDragging: 100,
  overlay: 200,
  modal: 300,
} as const;
```

---

## Existing Types — No Changes

The following engine types are used unchanged by this feature:
- `Card` (`src/engine/types.ts`) — rank, suit, isJoker
- `Combination` — used to derive valid Joker positions (caller's responsibility)
- `GameState`, `Hand` — unchanged; hand order is cosmetic only

---

## Storage Keys Summary

| Key | Store | Type | Purpose |
|-----|-------|------|---------|
| `@joker51/language` | `languageStore` | `'en' \| 'ar'` | Locale preference (existing) |
| `@joker51/savedSession` | `gameStore` | `GameState \| null` | Active game session (existing) |
| `@joker51/cardStyle` | `cardStyleStore` | `CardStyleId` | Card style preference (NEW) |
