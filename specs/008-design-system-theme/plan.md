# Implementation Plan: Design System, Theme & Game UX

**Branch**: `008-phase-7-game` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/008-design-system-theme/spec.md`

## Summary

Expand the existing token system to a full semantic design system, redesign `CardTile` to a realistic physical card layout with a user-selectable style system, add staged-card dimming with interaction lock, drag-to-reorder hand management, a Joker placement bottom sheet for sequence melds, and a Settings screen to house card style and language preferences. No new npm dependencies are required — all animation and gesture work uses the already-installed Reanimated 4 and Gesture Handler 2.

## Technical Context

**Language/Version**: TypeScript 5.9 strict  
**Primary Dependencies**: React Native + Expo SDK ~54, Expo Router ~6.0, Zustand ^5.0, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, AsyncStorage 2.2.0  
**Storage**: AsyncStorage — new key `@joker51/cardStyle`; existing `@joker51/language` and `@joker51/savedSession` unchanged  
**Testing**: Jest + React Native Testing Library (jest-expo ~54)  
**Target Platform**: iOS + Android (Expo managed workflow)  
**Performance Goals**: 60 fps drag animation (Reanimated UI thread worklets); card re-render on style change must be imperceptible (<16ms per frame)  
**Constraints**: No new npm packages; all gesture/animation via existing Reanimated + Gesture Handler  
**Scale/Scope**: ~13 files created or modified; 2 new screens; 1 new store; 3 new hooks/components

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game Rule Fidelity | ✅ Pass | No engine changes. Joker position selection is UI-only; engine receives the resolved combination. |
| II. Layered Architecture | ✅ Pass | `cardStyleStore` is UI state only — never imported by engine. `JokerPlacementSheet` is presentational; meld submission still goes through `useGameActions`. |
| III. Test-First Game Logic | ✅ Pass | No engine logic added. New hooks (`useHandOrder`) and components have integration/unit tests. |
| IV. Cross-Platform Excellence | ✅ Pass | All components verified on iOS + Android. Shadow tokens use elevation for Android. Drag uses Gesture Handler (cross-platform). |
| V. State Predictability | ✅ Pass | `cardStyleStore` state is `CardStyleId` string — serializable. Hand order is local React state only, not in the game store. |
| VI. Multilingual Support | ✅ Pass | Settings screen + all new components support RTL. New i18n keys added to both `en.json` and `ar.json` in the same commit. |
| VII. Design System (NON-NEGOTIABLE) | ✅ Pass | **This phase IS the design system.** All new and modified code uses tokens exclusively. No raw values in any component. |
| VIII. Simplicity | ✅ Pass | No new libraries. Bottom sheet and drag-to-reorder built with existing tools. Card style system has 2 initial styles (min requirement). |

## Project Structure

### Documentation (this feature)

```text
specs/008-design-system-theme/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-component-api.md   ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code Changes

```text
src/
├── theme/
│   └── tokens.ts              MODIFY — add dimmed overlay, faceCard style tokens,
│                                        cardCorner/cardCenter typography, cardLifted/
│                                        bottomSheet shadows, zIndex section
│
├── store/
│   └── cardStyleStore.ts      NEW — CardStyleId, CardStyleDefinition, CARD_STYLES,
│                                     useCardStyleStore (Zustand), AsyncStorage persistence
│
├── hooks/
│   └── useHandOrder.ts        NEW — cosmetic hand reorder state, reconciles with live hand
│
├── components/
│   ├── game/
│   │   ├── CardTile.tsx       MODIFY — corner layout, dimmed prop, style-aware center,
│   │   │                                reads cardStyleStore internally
│   │   ├── HandArea.tsx       MODIFY — drag-to-reorder (GH + Reanimated), dimming
│   │   │                                orchestration, useHandOrder integration
│   │   └── JokerPlacementSheet.tsx  NEW — bottom sheet picker for Joker sequence position
│   │
│   ├── ui/
│   │   └── BottomSheet.tsx    NEW — generic animated bottom sheet (Reanimated + GH,
│   │                                 swipe-to-dismiss, backdrop)
│   │
│   └── settings/
│       └── CardStylePicker.tsx  NEW — style grid with CardTile previews
│
├── screens/
│   └── SettingsScreen.tsx     NEW — language selector + card style picker
│
└── i18n/
    ├── en.json                MODIFY — add settings.* and game.jokerPlacement.* keys
    └── ar.json                MODIFY — same keys, Arabic translations

app/
├── _layout.tsx                MODIFY — call cardStyleStore.loadPersistedStyle() at startup
└── settings.tsx               NEW — Expo Router stack route for SettingsScreen
```

**Screens that call `GameBoardScreen.tsx` — modifications needed**:
- Add settings navigation button in board header
- Wire `JokerPlacementSheet` into the meld staging flow (detect Joker + ambiguous sequence → show picker before confirming meld)
- No other game logic changes

## Implementation Groups

Tasks are organized into dependency-ordered groups. Groups within the same tier can be implemented in parallel; each group depends on the tier above it.

---

### Tier 1 — Foundation (no dependencies)

**G1: Token System Expansion**
- Extend `src/theme/tokens.ts` with all new tokens defined in `data-model.md`
- Ensure all existing token references remain valid (no breaking renames)
- Add `zIndex`, extend `colors.card`, extend `typography`, extend `shadows`

**G2: Card Style Store**
- Create `src/store/cardStyleStore.ts`
- Define `CardStyleId`, `CardStyleDefinition`, `CARD_STYLES`, `DEFAULT_CARD_STYLE`
- Implement `useCardStyleStore` with `setStyle` + `loadPersistedStyle`

---

### Tier 2 — Core Components (depends on Tier 1)

**G3: CardTile Redesign**
- Restructure face layout: top-left corner (rank + suit, `typography.cardCorner`), bottom-right corner (180° rotated), center content by card type × style
- Add `dimmed` prop: opacity 0.35, `Pressable` disabled
- Read active style from `useCardStyleStore()` internally
- Update existing `CardTile` tests; add tests for: corner layout, dimmed state, each card type × each style

**G4: BottomSheet**
- Create `src/components/ui/BottomSheet.tsx`
- Reanimated `withSpring` open/close animation
- Gesture Handler `PanGesture` swipe-to-dismiss (>80px or >500 velocity)
- React Native `Modal` for backdrop
- Unit tests: open/close, swipe dismiss, backdrop tap dismiss

---

### Tier 3 — Feature Components (depends on Tier 2)

**G5: useHandOrder Hook**
- Create `src/hooks/useHandOrder.ts`
- Reconciliation logic: preserve order when hand changes
- `moveCard(from, to)` for drag completion
- Unit tests: initial order, reconcile add/remove, moveCard edge cases

**G6: HandArea Drag + Dimming**
- Replace `ScrollView` with Gesture-Handler-compatible horizontal layout
- Integrate `useHandOrder`
- Implement 200ms long-press + pan drag gesture
- Derive `dimmed` per card from `selectedCards` prop
- Pass lifted shadow during drag (`shadows.cardLifted`)
- Tests: dimming behaviour, drag reorder (via `moveCard`), RTL order reversal

**G7: JokerPlacementSheet**
- Create `src/components/game/JokerPlacementSheet.tsx`
- Uses `BottomSheet` + `CardTile` (sm size)
- Selectable rows for `JokerSequenceOption[]`; confirm + cancel controls
- Tests: option rendering, selection, confirm/cancel, dismiss resets state

**G8: CardStylePicker + SettingsScreen**
- Create `src/components/settings/CardStylePicker.tsx` with `CardTile` size='sm' previews
- Create `src/screens/SettingsScreen.tsx` (language selector + card style picker)
- Create `app/settings.tsx` route
- Tests: picker renders all styles, onSelect fires correctly, active style highlighted

---

### Tier 4 — Integration (depends on all Tiers)

**G9: i18n Keys**
- Add all `settings.*` and `game.jokerPlacement.*` keys to `en.json` and `ar.json` simultaneously

**G10: App Startup + GameBoardScreen Wiring**
- `app/_layout.tsx`: add `cardStyleStore.loadPersistedStyle()` call alongside `loadPersistedLocale`
- `src/screens/GameBoardScreen.tsx`:
  - Add settings navigation button (header area)
  - In `handleStageCombination`: after staging, detect if staged cards include a Joker in a sequence context with ambiguous position → set `jokerOptions` state → show `JokerPlacementSheet`
  - `handleJokerPlacementConfirm(index)`: use selected option's sequence as the combination, proceed with meld
  - `handleJokerPlacementDismiss()`: clear staged cards, reset picker state

---

## Complexity Tracking

No constitution violations. No table needed.

---

## Key Design Decisions

1. **No new npm packages**: Drag-to-reorder and bottom sheet built with existing Reanimated 4 + Gesture Handler 2. See `research.md` §1 and §2.

2. **Card style via Zustand, not prop**: `CardTile` reads `useCardStyleStore()` internally. Avoids threading a `cardStyle` prop through every component that renders a card. See `research.md` §3.

3. **Hand order is local React state**: `useHandOrder` does not write to AsyncStorage or game store. The spec requires order to survive re-renders — local state achieves this. Resetting on game restart is a feature (each player starts fresh). See `research.md` §5.

4. **Joker position computed by caller**: `JokerPlacementSheet` is a pure display component. `GameBoardScreen` computes valid `JokerSequenceOption[]` from staged cards + game engine's sequence validation. This preserves the UI → Engine separation (constitution §II).

5. **Settings as stack route**: Not a tab. Accessed from `SetupScreen` and game board header. See `research.md` §6.
