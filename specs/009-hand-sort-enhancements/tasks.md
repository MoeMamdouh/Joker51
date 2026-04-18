# Tasks: Hand Sort Enhancements

**Input**: Design documents from `specs/009-hand-sort-enhancements/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this belongs to (US1–US4)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: Remove the existing single "Sort" button infrastructure that will be replaced.

- [X] T001 Remove `game.actions.sortHand` key from `src/i18n/en.json` and `src/i18n/ar.json`; add `game.actions.sortBySuit` ("By Suit" / "بالشكل") and `game.actions.sortByRank` ("By Rank" / "بالرتبة") to both files in the same edit

---

## Phase 2: Foundational — `useHandOrder` Refactor

**Purpose**: Replace the current single `sortByPower()` API with the full two-mode sort system. All user story phases depend on this hook.

**⚠️ CRITICAL**: Phases 3–6 cannot begin until T002–T005 are complete.

- [X] T002 In `src/hooks/useHandOrder.ts`: add `SortMode = 'bySuit' | 'byRank'` type and `RANK_POWER` / `SUIT_POWER` constant maps (Ace=13 highest, ♠=3 ♥=2 ♣=1 ♦=0); remove the old `SUIT_ORDER` array and `cardPowerKey` helper
- [X] T003 In `src/hooks/useHandOrder.ts`: replace `sortByPower()` with `sortBySuit()` and add `sortByRank()`; both clear `isCustomOrder` and update `sortMode` state; `moveCard()` must set `isCustomOrder = true` on first call after a sort
- [X] T004 In `src/hooks/useHandOrder.ts`: update the reconcile `useEffect` — when `added.length >= 2` (batch deal / round start): reset `sortMode` to `'bySuit'`, clear `isCustomOrder`, set `newCard = null`, sort the full incoming hand by suit; when `added.length === 1`: if `!isCustomOrder` insert the new card at the correct sorted position for the active `sortMode`, else append at end; set `newCard = added[0]` in both cases
- [X] T005 In `src/hooks/useHandOrder.ts`: add `clearNewCard()` function that sets `newCard = null`; update the return type to export `{ orderedCards, sortMode, isCustomOrder, newCard, moveCard, sortBySuit, sortByRank, clearNewCard }`
- [X] T006 Update `src/hooks/__tests__/useHandOrder.test.ts`: rewrite tests for the new API — cover `sortBySuit` order (Joker → A♠ K♠ … 2♠ → A♥ … → A♣ … → A♦ … 2♦), `sortByRank` order (Joker → A♠A♥A♣A♦ → K♠K♥… → 2♦), `isCustomOrder` flag set by drag, reset by sort, batch-deal reset, single-draw `newCard` detection, round-reset (`>= 2` new cards) resets to bySuit

**Checkpoint**: `useHandOrder` fully tested and exported — user story work can begin.

---

## Phase 3: US1 — Automatic Default Sort on Deal

**Goal**: Hand is sorted by "By Suit" automatically on game start and round start.

**Independent Test**: Launch game → deal 7 cards → verify cards appear Joker-first then A→2 within ♠♥♣♦ groups without any user action.

- [X] T007 [US1] In `src/components/game/HandArea.tsx`: destructure `sortBySuit`, `sortByRank`, `sortMode` from `useHandOrder`; the hook now auto-sorts on mount/batch-deal (T004 handles it) — verify no manual `useEffect` sort call is needed in `HandArea`
- [X] T008 [P] [US1] Update `src/components/game/__tests__/HandArea.test.tsx`: add tests verifying that a freshly rendered `HandArea` with 5+ cards displays them in By Suit descending order (Ace before King, suit group order ♠♥♣♦)

---

## Phase 4: US2 — New Card Visual Indicator

**Goal**: A single drawn card shows a pulsing "new" border indicator, auto-dismissed after 3 s or on tap/staging.

**Independent Test**: Press "Draw" → one card shows a pulsing accent border → tap it → border disappears. Draw again → wait 3 s without tapping → border disappears automatically.

- [X] T009 [US2] In `src/components/game/CardTile.tsx`: add `isNew?: boolean` prop (default `false`); add a Reanimated `useAnimatedStyle` that drives a `borderColor` or `shadowOpacity` pulse via `withRepeat(withTiming(1, {duration:600}), -1, true)` when `isNew === true && !dimmed`; add `colors.card.newIndicator` (accent colour alias) to `src/theme/tokens.ts` if not already present
- [X] T010 [US2] In `src/components/game/HandArea.tsx`: consume `newCard` and `clearNewCard` from `useHandOrder`; add `useEffect` that sets a 3 s `setTimeout` when `newCard` changes (non-null), clearing it on cleanup; pass `isNew={card === newCard}` to each `DraggableCard`; in `DraggableCard` forward `isNew` to `CardTile` and call `clearNewCard()` inside the existing `onPress` handler when `isNew` is true
- [X] T011 [US2] In `src/components/game/HandArea.tsx`: suppress `isNew` when the card is staged — pass `isNew={card === newCard && !isDimmed}` (the `isDimmed` check already computed per-card); add a `useEffect` that watches `stagedCards` and calls `clearNewCard()` if `newCard` is present in the new `stagedCards` array
- [X] T012 [P] [US2] Update `src/components/game/__tests__/CardTile.test.tsx`: add test that `isNew=true` renders without error; add test that `isNew=true` with `dimmed=true` does not apply the pulse class (check `testID` or snapshot); update `src/components/game/__tests__/HandArea.test.tsx` with a test that `newCard` prop is cleared after card press

---

## Phase 5: US3 — Segmented Sort Control

**Goal**: A "By Suit / By Rank" segmented control replaces the old "Sort" button; active tab is visually highlighted; control is disabled while cards are staged.

**Independent Test**: Render `HandArea` with mixed cards → press "By Rank" tab → cards group by rank → press "By Suit" tab → cards revert to suit groups → stage a card → both tabs are non-interactive.

- [X] T013 [US3] Create `src/components/ui/SegmentedControl.tsx`: props `{ options: Array<{label:string; value:string}>, value:string, onChange:(v:string)=>void, disabled?:boolean, testID?:string }`; active tab: `colors.accent` fill + white text; inactive tab: `colors.surface` fill + `colors.text.secondary` text; disabled: full control at `opacity: 0.4` with `pointerEvents='none'`; all sizing from tokens (`spacing`, `radii`, `typography.caption`)
- [X] T014 [US3] In `src/components/game/HandArea.tsx`: replace the existing `<Pressable>` "Sort ↕" toolbar with `<SegmentedControl>` using `options={[{label:t('game.actions.sortBySuit'), value:'bySuit'}, {label:t('game.actions.sortByRank'), value:'byRank'}]}`, `value={sortMode}`, `onChange={(v)=> v==='bySuit' ? sortBySuit() : sortByRank()}`, `disabled={isDragging || (stagedCards?.length ?? 0) > 0}` (disabled during active drag per FR-005 and during staging per FR-005), `testID="sort-mode-control"`; remove old `sortButton`, `sortButtonText`, `sortIcon` styles; remove the `sortByPower` import
- [X] T015 [P] [US3] Update `src/components/game/__tests__/HandArea.test.tsx`: add tests for segmented control presence (`getByTestId('sort-mode-control')`), that pressing "By Rank" calls `sortByRank` equivalent (mock `useHandOrder`), and that the control has `disabled` state when `stagedCards` is non-empty

---

## Phase 6: US4 — Drag Order Persistence

**Goal**: A dragged card's position is remembered across subsequent draws; pressing a sort tab reverts to sorted order.

**Independent Test**: Sort → drag card 0 to position 3 → draw a new card → dragged card is still at position 3, new card appended at end → press "By Suit" → all cards re-sorted, dragged card moves.

*Note: The drag-persist implementation itself is covered by T003 (useHandOrder). This phase adds the explicit test coverage.*

- [X] T016 [P] [US4] Add tests to `src/hooks/__tests__/useHandOrder.test.ts` for the drag-persist contract: drag → draw → verify order preserved (new card at end); drag → sortBySuit → verify full re-sort (isCustomOrder cleared); drag → sortByRank → verify full re-sort

---

## Phase 7: Polish

**Purpose**: Verification pass, RTL correctness, token audit, remove dead code.

- [X] T017 In `src/components/game/HandArea.tsx`: verify RTL toolbar alignment — `SegmentedControl` must sit at `flex-start` when `isRTL=true` (same as old `toolbarRTL` style); confirm card display order reversal still works with the new sort modes
- [X] T018 [P] Token audit — confirm `src/components/ui/SegmentedControl.tsx` and all `HandArea` style changes reference only tokens from `src/theme/tokens.ts`; no raw hex, dp, or font-size values
- [X] T019 [P] Run full test suite (`npm test`); fix any snapshot or unit regressions; TypeScript strict-mode check (`npx tsc --noEmit`); confirm 0 errors
- [X] T020 [P] Remove dead code: delete the old `sortIcon`, `sortButton`, `sortButtonText` style entries from `HandArea.tsx` (replaced by `SegmentedControl`); confirm `sortByPower` is fully removed from `useHandOrder.ts` and all callers

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1; **BLOCKS all story phases**
- **Phases 3–6 (US1–US4)**: All depend on Phase 2; can proceed in priority order
- **Phase 7 (Polish)**: Depends on all story phases

### User Story Dependencies

| Story | Depends On | Notes |
|---|---|---|
| US1 (Auto Sort) | Phase 2 | Hook auto-sorts on batch deal — no extra wiring needed |
| US2 (New Card Indicator) | Phase 2 | `newCard` from hook; `isNew` on CardTile |
| US3 (Segmented Control) | Phase 2 | Replaces old button; depends on `sortBySuit`/`sortByRank` from hook |
| US4 (Drag Persist) | Phase 2 | `isCustomOrder` and `moveCard` behaviour from hook |

### Parallel Opportunities

**Phase 2**: T002→T003→T004→T005 are sequential (single file, dependencies). T006 (tests) written after T005.

**Phase 3+**: T008, T012, T015, T016, T018, T019, T020 are all marked `[P]` — different files, safe to parallelize across stories once foundational phase is done.

---

## Implementation Strategy

### MVP (US1 + US3 only)

1. Complete Phase 1 (i18n cleanup)
2. Complete Phase 2 (hook refactor + tests)
3. Complete Phase 3 (auto-sort on deal)
4. Complete Phase 5 (segmented control)
5. **STOP and validate**: Hand auto-sorts on deal, player can switch between By Suit and By Rank, old button is gone.

### Full Delivery

After MVP, add in order:
- Phase 4 (US2 — new card indicator) → ergonomic improvement
- Phase 6 (US4 — drag persist formalisation) → already partially works, just needs test coverage
- Phase 7 (Polish) → production readiness

---

## Notes

- **`[P]`** tasks operate on different files — no merge conflicts when run in parallel
- **Token compliance** is non-negotiable per constitution §VII — `SegmentedControl` and all new styles must use tokens exclusively
- **i18n parity** is non-negotiable per constitution §VI — T001 must modify both locale files in one edit
- **Engine untouched**: `RANK_POWER` and `SUIT_POWER` live in `useHandOrder.ts` only; `src/engine/types.ts` is unchanged
- **No new npm packages**: `SegmentedControl` is a plain `Pressable`-based component
