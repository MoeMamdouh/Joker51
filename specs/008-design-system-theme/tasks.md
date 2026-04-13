# Tasks: Design System, Theme & Game UX

**Input**: Design documents from `specs/008-design-system-theme/`  
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel with other [P] tasks in the same phase (different files, no conflicts)
- **[Story]**: Maps to user story in spec.md (US1–US8)
- Exact file paths given for every task

---

## Phase 1: Setup

**Purpose**: Create new directories and stub files so all parallel Tier 2+ work can proceed.

- [ ] T001 Create `src/components/settings/` directory (new component domain for card style picker)
- [ ] T002 [P] Stub `app/settings.tsx` as an empty default export pointing to a placeholder `SettingsScreen` — this route must exist before navigation wiring in later tasks

---

## Phase 2: Foundational — Design Token System + Card Style Store (US1)

**Purpose**: Core infrastructure that MUST be complete before ANY user story work. Completes **User Story 1** (Consistent Token-Based Visual System).

**⚠️ CRITICAL**: Nothing in Phase 3+ can begin until this phase is complete.

- [ ] T003 Extend `src/theme/tokens.ts` with all new tokens from `data-model.md`: add `colors.card.dimmed` (rgba overlay), `colors.card.faceCard.classicBg` + `classicText`, `colors.overlay.backdrop`; update `colors.suit.black` to `'#2C3E50'` for contrast on white card face; add `typography.cardCorner` (11px/700), `typography.cardCenter` (22px/800), `typography.cardCenterSm` (14px/800); add `shadows.cardLifted` (elevation 12) and `shadows.bottomSheet` (upward shadow); add `zIndex` section (`card: 1`, `cardDragging: 100`, `overlay: 200`, `modal: 300`)
- [ ] T004 [P] Audit `src/components/` for raw style values not referencing tokens — search for hex color strings and numeric padding/margin literals in StyleSheet definitions; patch any found to reference the appropriate token
- [ ] T005 [P] Audit `src/screens/` for raw style values not referencing tokens — same audit as T004; patch any found
- [ ] T006 Create `src/store/cardStyleStore.ts` — define `CardStyleId = 'classic' | 'minimal'`; define `CardStyleDefinition` interface (id, label, faceCardCenterBg, faceCardCenterTextColor, showNumberCardCenterSuit); define `CARD_STYLES` constant and `DEFAULT_CARD_STYLE = 'classic'`; implement `useCardStyleStore` (Zustand) with `activeStyleId`, `setStyle(id)` (updates store + persists to AsyncStorage key `@joker51/cardStyle`, fire-and-forget), and `loadPersistedStyle()` (reads AsyncStorage, falls back to default silently)

**Checkpoint — US1 complete**: Token system expanded. `grep -r "color: '#" src/components src/screens` returns zero matches. Card style store ready. All Tier 2 phases can now begin.

---

## Phase 3: US2 — Realistic Playing Card Visuals (Priority: P1) 🎯 MVP

**Goal**: Cards visually resemble physical playing cards with corner rank+suit labels, distinct face card treatment, large Ace suit symbol, and unmistakable Joker design.

**Independent Test**: Render a full mixed hand (7♥, J♠, A♦, Joker, K♣, 3♥, 10♠) and verify each card is identifiable by rank and suit without instruction. Verify Joker is unambiguous. All under the active card style.

- [ ] T007 [US2] Redesign `src/components/game/CardTile.tsx` — restructure layout to corner-based: **top-left** block (rank label + suit symbol, stacked, `typography.cardCorner`, suit color); **bottom-right** block (identical content, `transform: [{ rotate: '180deg' }]`); **center** block driven by card type: Ace = large suit symbol (`typography.cardCenter`, suit color); Face (J/Q/K) = large rank letter (`typography.cardCenter`) on `faceCardCenterBg` background fill from `useCardStyleStore` active style; Number (2–10) = large suit symbol if `showNumberCardCenterSuit`, else empty; Joker = "JOKER" label (`typography.cardCenter`, white) on `colors.card.joker` background; card face background always `colors.card.face` (white); preserve existing `selected` animation (translateY -8px); preserve `faceDown` pattern using `colors.card.back`
- [ ] T008 [P] [US2] Add `dimmed` prop to `CardTile` — when `dimmed=true`: wrap card in `Animated.View` with opacity animated to `0.35` via `withTiming(150)`; set `Pressable` `disabled` to `true`; when `dimmed` changes from `true` to `false`: animate opacity back to `1.0`; `selected` and `dimmed` are mutually exclusive (enforce via prop types or comment)
- [ ] T009 [P] [US2] Update `src/components/game/__tests__/CardTile.test.tsx` — rewrite layout assertions for corner structure; add tests for: Ace (large center suit symbol rendered), face card classic style (center background set), face card minimal style (no center background), Joker ("JOKER" text present, joker background color), dimmed state (opacity reduced, Pressable disabled), face-down (no rank/suit content), suit color (red for Hearts/Diamonds, dark for Clubs/Spades)
- [ ] T010 [P] [US2] Verify `src/components/game/DiscardPile.tsx` and `src/components/game/DrawPile.tsx` render without regressions after CardTile redesign — run their existing tests; fix any snapshot or layout failures

**Checkpoint — US2 complete**: All card types render with realistic corner layout. Face/number/Ace/Joker/face-down each visually distinct. CardTile tests pass.

---

## Phase 4: US3 — Card Style Selection in Settings (Priority: P1)

**Goal**: Player opens Settings, picks a card style, sees cards update immediately everywhere in the app, preference survives app restart.

**Independent Test**: Select "Minimal" style → navigate to game board → face cards show no background fill. Force-quit app → reopen → Minimal still active.

- [ ] T011 [P] [US3] Add `settings.*` and `game.jokerPlacement.*` i18n keys to **both** `src/i18n/en.json` AND `src/i18n/ar.json` in the same edit — keys per `contracts/ui-component-api.md` i18n schema: `settings.title`, `settings.cardStyle.label`, `settings.cardStyle.classic`, `settings.cardStyle.minimal`, `settings.language.label`, `game.jokerPlacement.title`, `game.jokerPlacement.confirm`, `game.jokerPlacement.cancel`
- [ ] T012 [US3] Create `src/components/settings/CardStylePicker.tsx` — renders a horizontal row (or 2-column grid) of all `CARD_STYLES` options; each option: `CardTile size='sm'` preview of a face card (e.g., K♠) and a number card (e.g., 7♥); style label below preview from i18n `settings.cardStyle.*`; active style has `colors.card.selected` border; tapping calls `onSelect(id: CardStyleId)`; RTL-compatible using `useDirection()` from `src/contexts/DirectionContext`; consumes tokens exclusively
- [ ] T013 [US3] Create `src/screens/SettingsScreen.tsx` — `SafeScrollView` layout wrapper; "Card Style" section with header from `t('settings.cardStyle.label')` and `CardStylePicker` wired to `useCardStyleStore().setStyle`; "Language" section with header from `t('settings.language.label')` and `LanguageSelector` component (already exists at `src/components/setup/LanguageSelector.tsx`); all strings via i18n; consumes tokens
- [ ] T014 [US3] Update `app/settings.tsx` — replace stub with real import of `SettingsScreen` from `src/screens/SettingsScreen`
- [ ] T015 [US3] Update `app/_layout.tsx` — in the startup `useEffect`, add `useCardStyleStore.getState().loadPersistedStyle()` call alongside the existing `initI18n()` / `loadPersistedLocale` calls; the settings screen must be registered in the `Stack` if not already
- [ ] T016 [P] [US3] Add settings navigation to `src/screens/SetupScreen.tsx` — settings icon/button in the top-right corner (or header area); uses `router.push('/settings')`; icon/label uses tokens + i18n `settings.title`
- [ ] T017 [P] [US3] Add settings navigation button to `src/screens/GameBoardScreen.tsx` header — placed alongside the existing scoreboard button; uses `router.push('/settings')`; uses existing `styles.scoreboardButton` pattern or equivalent token-based style

**Checkpoint — US3 complete**: Settings screen is reachable from both Setup and Game screens. CardStylePicker shows previews. Selecting a style updates all cards immediately. Preference persists after app restart.

---

## Phase 5: US4 — Staged Card Dimming Feedback (Priority: P1)

**Goal**: When the player has staged one or more cards into the meld preview area, all remaining hand cards visually dim and become non-interactive until the staged group is confirmed or cancelled.

**Independent Test**: Stage 3 cards into a combination preview. Attempt to tap any of the 4 remaining hand cards — none respond. Tap "Cancel Meld" — all cards restore full opacity and become interactive.

- [ ] T018 [US4] Update `src/components/game/HandArea.tsx` — add `stagedCards?: readonly Card[]` prop; derive per-card `isDimmed = (stagedCards?.length ?? 0) > 0 && !(stagedCards?.includes(card) ?? false)`; pass `dimmed={isDimmed}` to each `CardTile`; preserve existing RTL order reversal logic; preserve `selectedCards` elevated display (still passes `selected={selectedCards.includes(card)}` to `CardTile`)
- [ ] T019 [US4] Update `src/screens/GameBoardScreen.tsx` — pass `stagedCards={stagedCombinations.flat()}` to `HandArea`; verify `handleCancelMeld` clears `stagedCombinations` (restoring dimming); verify `handleConfirmMeld` on success also clears `stagedCombinations`
- [ ] T020 [P] [US4] Update `src/components/game/__tests__/HandArea.test.tsx` — add tests: with `stagedCards=[cardA]` and hand `[cardA, cardB, cardC]`: cardA is NOT dimmed, cardB and cardC ARE dimmed; with `stagedCards=[]`: no card is dimmed; with `stagedCards=undefined`: no card is dimmed

**Checkpoint — US4 complete**: Staged combinations cause remaining hand cards to dim and block taps. Confirm or cancel restores full interactivity.

---

## Phase 6: US5 — Drag-to-Reorder Hand (Priority: P2)

**Goal**: Long-press (200ms) any hand card to drag it left or right. Other cards slide apart to show the insertion gap. Releasing places the card in the new position.

**Independent Test**: Drag card from position 0 to position 4 in a 7-card hand. Release. Verify hand order updates and card stays at new position on re-render. Drag outside hand area — card snaps back.

- [ ] T021 [US5] Create `src/hooks/useHandOrder.ts` — implements `UseHandOrderReturn` per `contracts/ui-component-api.md`; `orderedCards` state (initially equals `cards` prop order); reconciliation `useEffect`: when `cards` changes, retain existing order, append new cards, drop removed; `moveCard(from, to)` splices at `from` and inserts before `to`; handles edge cases (same index, out-of-bounds — no-op)
- [ ] T022 [US5] Update `src/components/game/HandArea.tsx` — integrate `useHandOrder(cards)` replacing direct use of `displayCards` for render order; replace `ScrollView` with a `GestureHandlerRootView`-compatible horizontal `View` wrapping a scrollable region; for each card, attach `Gesture.LongPress({ minDuration: 200 }).onStart(() => activateDrag(index))` simultaneously composed with a `Gesture.Pan()` that: translates the dragged card with a `useAnimatedStyle`, applies `shadows.cardLifted` and `scale: 1.08` via Reanimated, shifts neighbouring cards to open a gap based on drag x-offset, and on `onEnd` calls `runOnJS(useHandOrder.moveCard)(fromIndex, resolvedIndex)` or snaps back if dropped outside; drag on a `dimmed` card is blocked (guard at gesture level)
- [ ] T023 [P] [US5] Create `src/hooks/__tests__/useHandOrder.test.ts` — unit tests: initial order equals input, reconcile adds new card to end, reconcile removes missing card preserving other order, moveCard(0, 4) in 5-card hand, moveCard same index is no-op
- [ ] T024 [P] [US5] Update `src/components/game/__tests__/HandArea.test.tsx` — add tests: drag gesture calls moveCard, invalid drop (outside bounds) does not call moveCard, long-press on dimmed card does not activate drag

**Checkpoint — US5 complete**: Drag-to-reorder works. Long-press activates in 200ms. Cards animate aside during drag. Order persists across re-renders. Cosmetic only — game state unchanged.

---

## Phase 7: US6 — Joker Placement Selection in Sequences (Priority: P2)

**Goal**: Staging a Joker + 2+ sequence cards shows a bottom sheet with all valid Joker positions. Player picks one, confirms, and the correct sequence lands on the table. Also applies to lay-offs on existing table sequences.

**Independent Test**: Stage 7♠ + 8♠ + Joker → initiate meld → bottom sheet appears with "6♠–J–8♠" and "7♠–J–9♠" options → select first → confirm → table shows 6♠–Joker–8♠ sequence.

- [ ] T025 [US6] Create `src/components/ui/BottomSheet.tsx` per `contracts/ui-component-api.md` — `visible` / `onClose` / `children` props; Reanimated `useSharedValue(SHEET_HEIGHT)` for translateY; `withSpring({ stiffness: 200, damping: 20 })` for open, same for close (close calls `onClose` in callback); Gesture Handler `Gesture.Pan()` on sheet handle: if `translationY > 80` or `velocityY > 500` → trigger close; React Native `Modal` (transparent, `animationType='none'`) wrapping a full-screen backdrop `Pressable` (`colors.overlay.backdrop`, `zIndex.overlay`) + the animated sheet container (`colors.surface`, `radii.lg` top-left/top-right only, `shadows.bottomSheet`, positioned at bottom); consumes tokens only
- [ ] T026 [US6] Create `src/components/game/JokerPlacementSheet.tsx` per `contracts/ui-component-api.md` — wraps `BottomSheet`; renders title from `t('game.jokerPlacement.title')`; maps `options: JokerSequenceOption[]` to selectable rows showing `option.label` with Joker position in accent color; single-select: tapping a row sets `selectedIndex` state; "Confirm" `Button` enabled only when `selectedIndex !== null` → calls `onSelect(selectedIndex)` then resets; "Cancel" text button → calls `onDismiss`; on `BottomSheet.onClose` → calls `onDismiss` + resets selection state; consumes tokens only; RTL-compatible
- [ ] T027 [US6] Update `src/screens/GameBoardScreen.tsx` — add `jokerPlacementOptions: JokerSequenceOption[] | null` state (null = hidden); add `jokerPendingCards: Card[] | null` state; update `handleStageCombination`: after `validateCombination` passes, if combination type is `'sequence'` AND combination contains a Joker AND sequence has ≥2 known cards, compute candidate placements (try inserting Joker at rank-1 and rank+1 of the known boundary cards using `validateCombination` to test each); if >1 valid placement, store pending cards in `jokerPendingCards`, set `jokerPlacementOptions`, return early (sheet shows); if exactly 1 valid placement, proceed directly to `setStagedCombinations`; add `handleJokerPlacementConfirm(index)`: build sequence from `jokerPlacementOptions[index].sequence`, call `setStagedCombinations`, clear `jokerPlacementOptions` and `jokerPendingCards`; add `handleJokerPlacementDismiss`: clear pending state; wire `<JokerPlacementSheet>` into JSX
- [ ] T028 [P] [US6] Extract Joker placement computation to `src/components/game/jokerPlacement.ts` helper and write unit tests — test cases: ambiguous (7+8+Joker → 2 options), unambiguous (A+2+Joker in sequence → only 1 valid), single known card (Joker+7♠ → 3 options: 5♠–J–7♠, 6♠–J–7♠ etc.), set combination (Joker in set → no placement options needed, returns empty)
- [ ] T029 [P] [US6] Create `src/components/game/__tests__/JokerPlacementSheet.test.tsx` — tests: renders all options, tapping row sets selection, Confirm disabled without selection, Confirm calls `onSelect` with correct index, Cancel calls `onDismiss`, swipe-down (via mock) calls `onDismiss`, selection state resets after dismiss

**Checkpoint — US6 complete**: Joker placement bottom sheet shown for ambiguous sequences (new meld AND lay-off). Single-position sequences skip picker. Cancel returns cards. Chosen placement matches table.

---

## Phase 8: US7 — Reusable UI Component Library (Priority: P2)

**Goal**: Button, Badge, Modal, and layout wrappers exist, use tokens exclusively, and support RTL so no screen needs to define new visual primitives.

**Independent Test**: Build a screen using only `Button`, `Badge`, `Modal`, `SafeScrollView` — no `StyleSheet.create` in the screen file — and confirm it renders correctly on both platforms.

- [ ] T030 [P] [US7] Review and update `src/components/ui/Button.tsx` — ensure it has default, pressed (use `Pressable` `style={({ pressed }) => ...}` with `colors.accent` dimming or scale), and disabled states using only tokens; add `disabled` prop if missing; remove any raw values; verify it is RTL-compatible
- [ ] T031 [P] [US7] Create `src/components/ui/Badge.tsx` — displays a text `label` or `value: number` string; `typography.label`, `colors.surface` background, `colors.text.primary` text, `radii.sm`, `spacing.xs` padding; optional `variant?: 'default' | 'accent'` for highlighted badges; RTL-compatible; consumes tokens only
- [ ] T032 [P] [US7] Create `src/components/ui/Modal.tsx` — wraps RN `Modal` (transparent); full-screen backdrop `Pressable` with `colors.overlay.backdrop`; centered content container with `colors.surface`, `radii.lg`, `shadows.bottomSheet`, `spacing.lg` padding; `onClose` called on backdrop tap; `children: React.ReactNode`; no raw values; RTL-compatible
- [ ] T033 [P] [US7] Verify `src/components/layout/SafeScrollView.tsx` — add `KeyboardAvoidingView` (behavior `'padding'` on iOS, `'height'` on Android) wrapping the `ScrollView` if not present; ensure it uses `spacing.*` tokens for padding; verify RTL layout direction is respected

**Checkpoint — US7 complete**: All four generic components exist and use tokens exclusively. Future screens can compose any UI without inline styles.

---

## Phase 9: US8 — RTL Layout Compatibility (Priority: P3)

**Goal**: Every new component renders correctly when Arabic is active — no broken layouts, overflows, or misalignments.

**Independent Test**: Switch app locale to Arabic via Settings. Navigate through SetupScreen → SettingsScreen → GameBoardScreen. All new components render correctly in RTL.

- [ ] T034 [US8] RTL integration pass — switch app to Arabic locale; manually inspect and fix RTL layout in: `CardStylePicker` (grid alignment), `SettingsScreen` (section headers, paddings), `JokerPlacementSheet` (option row text alignment), `BottomSheet` (sheet positioning), `HandArea` (card order reversed, drag direction correct), `CardTile` (corner labels correct side in RTL — top-left should remain top-left for rank, or swap if needed for physical card convention)
- [ ] T035 [P] [US8] Update `src/components/game/__tests__/HandArea.test.tsx` — add RTL test: with `isRTL=true`, `orderedCards` are reversed for display; drag direction inverted; dimming logic unchanged
- [ ] T036 [P] [US8] Review `src/i18n/ar.json` new keys for accuracy — verify `settings.*` and `game.jokerPlacement.*` Arabic strings are natural Egyptian Arabic (not transliterated); correct any machine-translated phrases

**Checkpoint — US8 complete**: All new UI renders correctly in both LTR and RTL. Arabic strings are accurate.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Integration testing, regression fixes, final token audit.

- [ ] T037 Run full test suite `npm test` — fix any regressions in existing tests caused by `CardTile` layout changes or `HandArea` prop additions (update `HandArea.test.tsx`, `StagedMeldPreview.test.tsx`, `TableArea.test.tsx`, `ActionBar.test.tsx` as needed)
- [ ] T038 [P] Run `quickstart.md` verification checklist on iOS Simulator — tick every item; file any failures as inline code comments for follow-up
- [ ] T039 [P] Run `quickstart.md` verification checklist on Android Emulator — same as T038
- [ ] T040 Final token compliance audit — run `grep -rn "color: '#" src/components src/screens` and `grep -rn "padding: [0-9]" src/components src/screens`; both must return zero matches; fix any remaining raw values found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational/US1)**: Depends on Phase 1 — **BLOCKS all story phases**
- **Phases 3–9 (US2–US8)**: All depend on Phase 2 completion; can proceed in priority order or in parallel
- **Phase 10 (Polish)**: Depends on all story phases desired

### User Story Dependencies

| Story | Depends on | Notes |
|-------|------------|-------|
| US1 (Token System) | Phase 1 only | IS Phase 2; no cross-story deps |
| US2 (Card Visuals) | US1 (tokens) | CardTile uses `cardStyleStore` from US1 foundational |
| US3 (Card Style) | US1 + US2 | CardStylePicker uses redesigned CardTile for previews |
| US4 (Dimming) | US1 + US2 | Uses `dimmed` prop added in US2 |
| US5 (Drag Reorder) | US1 + US2 | Uses redesigned HandArea from US4 as base |
| US6 (Joker Picker) | US1 + US2 | Uses BottomSheet (new); GameBoardScreen wiring |
| US7 (Component Lib) | US1 | Button/Badge/Modal/layout — only need tokens |
| US8 (RTL) | US2–US7 | Verification pass over all prior stories |

### Parallel Opportunities Within Each Phase

**Phase 2**: T004 and T005 (audits) can run in parallel after T003 (tokens)  
**Phase 3**: T008, T009, T010 can run in parallel after T007  
**Phase 4**: T011 can run in parallel with T012; T016 and T017 can run in parallel  
**Phase 5**: T020 can run in parallel with T018+T019  
**Phase 6**: T023 and T024 can run in parallel with T021+T022  
**Phase 7**: T028 and T029 can run in parallel after T025+T026; T027 depends on T025+T026  
**Phase 8**: T030, T031, T032, T033 all fully parallel (different files)  
**Phase 9**: T035 and T036 parallel after T034  
**Phase 10**: T038 and T039 parallel after T037  

---

## Parallel Example: Phase 8 (US7)

```
All four tasks can launch simultaneously — completely different files:

Task: "Review Button.tsx for token compliance and pressed/disabled states"           → src/components/ui/Button.tsx
Task: "Create Badge.tsx with token-based label display"                              → src/components/ui/Badge.tsx
Task: "Create Modal.tsx with backdrop and token-based container"                     → src/components/ui/Modal.tsx
Task: "Verify SafeScrollView.tsx keyboard avoidance and RTL compliance"              → src/components/layout/SafeScrollView.tsx
```

---

## Implementation Strategy

### MVP (User Stories 1–4 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational/US1)
2. Complete Phase 3 (US2 — Realistic Cards)
3. Complete Phase 4 (US3 — Card Style Selection)
4. Complete Phase 5 (US4 — Staged Dimming)
5. **STOP and VALIDATE**: Realistic cards render, style can be changed in Settings, staged cards dim. Playable with improved visuals.

### Full Delivery (All Stories)

After MVP, add in priority order:
- Phase 6 (US5 — Drag Reorder) → ergonomic hand management
- Phase 7 (US6 — Joker Picker) → critical gameplay correctness for Joker sequences
- Phase 8 (US7 — Component Library) → developer infrastructure
- Phase 9 (US8 — RTL) → Arabic players unblocked
- Phase 10 (Polish) → production readiness

---

## Notes

- **[P]** tasks operate on different files — no merge conflicts when run in parallel
- **Token compliance** is non-negotiable per constitution §VII — every task that touches styles must leave zero raw values
- **i18n parity** is non-negotiable per constitution §VI — T011 must add keys to BOTH locale files in one edit
- **Engine untouched**: No tasks modify `src/engine/` — Joker placement is computed using existing `validateCombination` in the UI layer
- Commit after each checkpoint (or use `/speckit.git.commit`)
