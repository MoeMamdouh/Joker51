# Research: Hand Sort Enhancements

**Feature**: 009-hand-sort-enhancements
**Date**: 2026-04-14
**Status**: Complete — no external unknowns

## Decision Log

### 1. New Card Detection Strategy

**Decision**: Diff-based detection inside `useHandOrder` — compare previous card set to incoming set; if exactly one card was added, it is the newly drawn card.

**Rationale**: No engine or store changes required. `useHandOrder` already maintains a `prevCardsRef` for identity diffing. If `added.length === 1`, emit that card as `newCard`. If `added.length >= 2`, treat as batch deal (round start / game start) — no indicator, reset sort to By Suit.

**Alternatives considered**:
- Store action returns drawn card → requires store API change, couples game logic to UI concern.
- `GameBoardScreen` tracks last drawn card separately → duplicates diffing logic already in hook.

---

### 2. Ace Power Rank

**Decision**: Ace is displayed as the highest-value card (above King) using a dedicated `RANK_POWER` lookup in `useHandOrder`. This is UI-only — engine `RANK_ORDER` is unchanged.

**Rationale**: Engine uses Ace-low for sequence validation (Ace-2-3 sequences). Changing `RANK_ORDER` would break engine tests. Separate display power mapping keeps concerns isolated.

**Alternatives considered**:
- Modify `RANK_ORDER` → breaks sequence validation and 27 engine tests.

---

### 3. Round Reset Detection

**Decision**: When `added.length >= 2` in the `useHandOrder` `useEffect`, treat as round start / batch deal. Reset `sortMode` to `'bySuit'` and `isCustomOrder` to `false`.

**Rationale**: A single draw adds exactly 1 card. Two or more cards added simultaneously signals a fresh deal. Simple and correct for this game's mechanics.

---

### 4. Segmented Control Implementation

**Decision**: Custom implementation using two `Pressable` components inside a `View` with shared border, styled via design tokens. No new library needed.

**Rationale**: The app already has a full token system and `Pressable`-based `Button`. A ~30-line custom segmented control avoids a dependency for a simple two-option toggle. Matches constitution §VIII (simplicity over cleverness).

---

### 5. New Card Indicator Visual Treatment

**Decision**: A pulsing accent-coloured border (`colors.accent` or `colors.card.selected`) using a Reanimated `withRepeat` + `withTiming` loop on border colour/opacity. Timer managed via `useEffect` + `setTimeout` in `HandArea`, clearing on card tap or staging.

**Rationale**: Reanimated is already a dependency. A border pulse is lightweight and doesn't conflict with the existing selection border (selected uses `borderWidth: 2`). Staging suppression is handled by checking `dimmed` prop in `CardTile`.
