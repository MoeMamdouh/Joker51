# Research: Design System, Theme & Game UX

**Feature**: `008-design-system-theme`  
**Date**: 2026-04-13

---

## Decision 1: Drag-to-Reorder Implementation

**Decision**: Build drag-to-reorder with `react-native-gesture-handler` v2 `PanGesture` + `GestureDetector` + Reanimated 4 shared values. No new library.

**Rationale**: Both `react-native-gesture-handler` ~2.28.0 and `react-native-reanimated` ~4.1.1 are already installed. The Gesture Handler v2 API (`GestureDetector` + `Gesture.Pan()`) runs gesture callbacks on the JS thread but allows Reanimated `useAnimatedGestureHandler` patterns on the UI thread. The pattern for horizontal list reordering:

1. Each card item tracks its own layout x/width via `onLayout`.
2. A `useSharedValue<number>` holds the dragged card index and current x offset.
3. `useAnimatedStyle` translates non-dragged cards to open a gap at the insertion point.
4. On gesture end, `runOnJS` updates the React state with the new order.
5. The dragged card's lifted appearance (scale + shadow) is driven by a `useSharedValue<boolean>` for active state.

**Key constraint**: `HandArea` currently uses a `ScrollView`. Drag-to-reorder and `ScrollView` gesture conflict. Resolution: replace the horizontal `ScrollView` with a plain `View` containing a `FlatList`-like fixed layout (cards flex in a row). Since hands are small (≤14 cards) and cards are compact (52px wide + gaps), overflow can be handled with horizontal scroll wrapping the entire gesture-aware layout.

**Alternative considered**: `react-native-draggable-flatlist` — a specialized library with a clean API. Rejected because it would add a new dependency (constitution §VIII) when existing tools are sufficient.

---

## Decision 2: Bottom Sheet for Joker Placement Picker

**Decision**: Custom `BottomSheet` component using Reanimated `useSharedValue` + `withSpring` for `translateY`, with a Gesture Handler `PanGesture` for swipe-to-dismiss. Rendered via React Native `Modal` (backdrop handled by modal's transparent overlay).

**Rationale**: The Joker placement picker requires only open/close behavior with a single content panel — no scroll snapping, no multi-snap-point logic, no keyboard avoidance. A 60-line Reanimated component covers the requirement cleanly. Using `Modal` from React Native for the backdrop avoids z-index conflicts with game board elements.

**Implementation pattern**:
```
translateY = useSharedValue(SHEET_HEIGHT)   // starts off-screen
open()  → translateY.value = withSpring(0)
close() → translateY.value = withSpring(SHEET_HEIGHT, {}, callback)
```
Swipe-down gesture: if drag delta > threshold (80px) or velocity > 500, trigger close.

**Alternative considered**: `@gorhom/bottom-sheet` — production-grade, handles keyboard, scrollable content, etc. Rejected per constitution §VIII (simplicity): for a static option list with ≤5 items, the full library is overkill and adds ~35KB.

---

## Decision 3: Card Style Architecture

**Decision**: `CardStyleId = 'classic' | 'minimal'` string union. A `CardStyleDefinition` object encodes per-style render properties. `cardStyleStore` (Zustand) holds the active `CardStyleId` and handles persistence. `CardTile` reads the active style via `useCardStyleStore()` — no prop drilling.

**Rationale**: Zustand subscriptions mean card style changes reactively update every mounted `CardTile` without re-rendering parent components. The `CardStyleDefinition` interface keeps the style system open for future additions (add a new style = add a constant, no component changes needed).

**Style definitions** (initial set):
- `classic`: face cards show large centered rank letter on a muted gold/amber background fill. Number cards show rank in corners + suit symbol cluster in center.
- `minimal`: face cards show rank letter in corners only (same layout as number cards, no background fill). Clean, modern look.

**Persistence**: AsyncStorage key `@joker51/cardStyle`. Loaded in `cardStyleStore.loadPersistedStyle()` called at app startup alongside `loadPersistedLocale`.

**Alternative considered**: Pass `cardStyle` as a prop from screens down to every `CardTile`. Rejected: would require threading the prop through `HandArea`, `TableArea`, `CombinationRow`, `DiscardPile`, `DrawPile` — pervasive prop drilling without added clarity.

---

## Decision 4: Staged Card Dimming & Interaction Lock

**Decision**: Dimming and interaction lock are orchestrated in `HandArea`. `CardTile` gains a `dimmed` prop. `useCardSelection.toggleCard` guards against adding a non-staged card while others are staged.

**Rationale**: The rule is: "while any card is staged, non-staged cards are non-interactive." `HandArea` knows which cards are staged (receives `selectedCards` prop). It derives `dimmed = selectedCards.length > 0 && !selectedCards.includes(card)` and passes it to each `CardTile`. The `CardTile` renders at reduced opacity and its `Pressable` is disabled when `dimmed`. The `useCardSelection.toggleCard` guard is a safety net (also blocks the toggle at the hook level).

**Alternative considered**: Block taps only in `GameBoardScreen` by wrapping `toggleCard` — would work but means the non-interactive contract is enforced at the screen level, not co-located with the hand rendering logic.

---

## Decision 5: Hand Order Persistence Scope

**Decision**: Hand order is stored in per-render React state (`useState`) inside a `useHandOrder` hook. It is **not** persisted to AsyncStorage. Order survives re-renders but resets when the game ends or the app restarts.

**Rationale**: The spec says the order "MUST persist for the remainder of the session (not reset on re-render)". A session = one game play. AsyncStorage persistence for display order adds complexity and raises questions about invalidation (what if the hand changes after a draw?). Local state keyed by active player's hand snapshot index achieves the spec requirement without storage overhead.

**Hand change handling**: When a card is drawn or discarded, the hand changes. The `useHandOrder` hook receives the current hand from props and reconciles the stored order — new cards are appended to the end, removed cards are dropped. This keeps the user's arrangement intact as the hand evolves during a turn.

---

## Decision 6: Settings Screen Navigation

**Decision**: `SettingsScreen` is added as a new stack route `app/settings.tsx`. It is accessible via a settings icon/button on the `SetupScreen` (lobby). It is **not** a tab — the settings flow is infrequent and does not warrant a persistent tab.

**Rationale**: Expo Router stack navigation is already in use. Adding a `settings` stack screen costs one file and one navigation call. Adding a third tab for settings would clutter the tab bar for an infrequently-used screen.

**Accessibility point**: The settings route must also be reachable from within the game (e.g., from the game board header) for mid-game card style changes (as noted in the spec edge case).

---

## Decision 7: Realistic Card Layout Structure

**Decision**: `CardTile` is restructured with an absolute-positioned corner system:
- Top-left: rank label + suit symbol (small, stacked vertically)
- Bottom-right: same content, rotated 180° (standard physical card convention)
- Center: variant-based — Ace = large suit symbol; face card = large rank letter on style-defined background; number card (optional) = large suit symbol or empty; Joker = "JOKER" text + distinct background

**Dimensions**: No changes to `cardSizes` token values. Layout re-uses existing `sm/md/lg` size steps.

**Suit symbols**: Already defined in `CardTile.tsx` as `SUIT_SYMBOLS` — kept as-is.

**Font scaling**: Small corner text uses `typography.caption` (12px). Center content uses a larger size defined as a new token `typography.cardCenter` (20–26px depending on card size).
