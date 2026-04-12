---
description: "Task list for Meld & Table Management implementation"
---

# Tasks: Meld & Table Management

**Input**: Design documents from `specs/004-meld-table-management/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/meld-table-ui.md ✅ quickstart.md ✅

**Tests**: Included — constitution Principle III mandates TDD for engine code; UI component tests written after implementation.
**Note**: Phase 3 (003-game-board-screen) implemented the board infrastructure. Phase 4 corrects three gaps and adds the multi-combination meld builder. All changes are targeted modifications — no screen or component is rewritten from scratch.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no shared state)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in all descriptions

---

## Phase 1: Foundational (type + i18n prerequisites)

**Purpose**: Add the new error code and i18n strings that every user story phase depends on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 [P] Add `'JOKER_CLAIM_AMBIGUOUS_SET'` to the `EngineErrorCode` union type in `src/engine/types.ts` (single-line addition to the type alias)
- [X] T002 [P] Add 4 new keys to `src/i18n/en.json` under existing namespaces: `game.errors.jokerClaimAmbiguousSet` → `"Select both missing suit cards to claim this Joker"`; `game.actions.stageCombination` → `"Stage"`; `game.actions.confirmMeld` → `"Confirm Meld"`; `game.actions.cancelMeld` → `"Cancel Meld"`
- [X] T003 [P] Add same 4 keys to `src/i18n/ar.json` with Arabic translations mirroring `en.json` structure exactly (both files must have identical key sets per constitution Principle VI)

**Checkpoint**: types and translations ready — user story phases can proceed.

---

## Phase 2: User Story 4 — Claim a Joker (Engine, Priority: P2)

**Purpose**: Engine-first. Fix `claimJoker` and add the `getClaimableJokerCards` helper before any UI wiring. Engine changes are self-contained and unblock all downstream UI tasks.

**Goal**: `claimJoker` accepts `realCards: Card[]`; correctly handles 3-natural-card sets (1 card) and 2-natural-card sets (2 cards); rejects ambiguous claims with `JOKER_CLAIM_AMBIGUOUS_SET`.

**Independent Test (engine only)**: Run `npx jest src/engine/__tests__/actions/claimJoker.test.ts src/engine/__tests__/validation.test.ts` — all new cases pass; existing cases unchanged.

- [X] T004 [P] [US4] Write failing tests for `getClaimableJokerCards` in `src/engine/__tests__/validation.test.ts` per quickstart.md test checklist — 6 cases: combo with no Joker → `null`; sequence, player holds required card → `[card]`; sequence, player missing required card → `null`; 4-card set (3 naturals + Joker), player holds 1 missing suit → `[card]`; 3-card set (2 naturals + Joker), player holds both missing suits → `[card1, card2]`; 3-card set, player holds only 1 missing suit → `null`
- [X] T005 [US4] Add `getClaimableJokerCards(combination: Combination, playerHand: readonly Card[]): Card[] | null` to `src/engine/validation.ts` per `data-model.md` logic; export it from `src/engine/index.ts` alongside existing exports — make T004 tests pass
- [X] T006 [P] [US4] Write failing tests for updated `claimJoker` in `src/engine/__tests__/actions/claimJoker.test.ts` — 3 new cases: (a) claim from 4-card set (`9♠ 9♥ 9♦ [Joker]`) with `realCards: [9♣]` → success, set becomes all-natural; (b) claim from 3-card set (`9♠ 9♥ [Joker]`) with `realCards: [9♦, 9♣]` → success, Joker to hand, set becomes `[9♠ 9♥ 9♦ 9♣]`; (c) claim from 3-card set with `realCards: [9♦]` (only 1 of 2 needed) → `JOKER_CLAIM_AMBIGUOUS_SET`
- [X] T007 [US4] Update `src/engine/actions/claimJoker.ts` — change `params.realCard: Card` → `params.realCards: Card[]`; detect combination structure (sequence vs set, natural card count); validate required card count vs provided count; for 2-natural-card sets: add both cards to combo and remove both from hand; return `JOKER_CLAIM_AMBIGUOUS_SET` when too few cards; make T006 tests pass

**Checkpoint**: Engine changes complete. `claimJoker` multi-card API correct; `getClaimableJokerCards` helper ready for UI layer.

---

## Phase 3: User Story 1 — Place Initial Meld (Priority: P1) 🎯 MVP

**Goal**: Player can stage multiple combinations independently before submitting the full initial meld. Running point total shown. Meld confirms as a single atomic action.

**Independent Test**: Start game → P1 draws → selects `[6♠ 7♠ 8♠]` → taps "Stage" (21 pts staged) → selects `[10♦ 10♣ 10♥]` → taps "Stage" (51 pts, "Confirm Meld" enabled) → taps "Confirm Meld" → both combinations appear on table under P1's name; staged strip clears; P1 marked as melded.

- [X] T008 [US1] Update `src/hooks/useGameActions.ts` — (a) change `placeMeld(cards: Card[])` → `placeMeld(combinations: Card[][])`, calling `placeInitialMeld(state, { playerId, combinations })`; (b) change `claimJokerFromCombination(combinationId: string, realCard: Card)` → `claimJokerFromCombination(combinationId: string, realCards: Card[])`, calling `claimJoker(state, { playerId, combinationId, realCards })`; (c) add `JOKER_CLAIM_AMBIGUOUS_SET: 'jokerClaimAmbiguousSet'` to `ERROR_CODE_MAP`
- [X] T009 [P] [US1] Create `src/components/game/StagedMeldPreview.tsx` per `contracts/meld-table-ui.md` — props: `stagedCombinations: Card[][]`, `pointTotal: number`, `onCancel(): void`; renders horizontal strip; each staged combination displayed as a row of `CardTile` (size="sm"); shows `t('game.stagedPoints', { points: pointTotal })`; "✕" cancel button calls `onCancel`; returns `null` when `stagedCombinations.length === 0`; all values from `src/theme/tokens.ts`; all strings via `useTranslation()`
- [X] T010 [US1] Update `src/components/game/ActionBar.tsx` per `contracts/meld-table-ui.md` — add props: `isStagingMeld: boolean`, `meldReady: boolean`, `onStage(): void`; ACTING + not melded + not staging: show "Stage" button (enabled if `hasSelectedCards`); ACTING + not melded + staging: show "Stage" (enabled if `hasSelectedCards`) + "Confirm Meld" (`t('game.actions.confirmMeld')`, enabled if `meldReady`) + "Cancel" (`t('game.actions.cancelMeld')`); ACTING + melded: unchanged (LayOff, Discard, ClaimJoker); DRAWING: all disabled; all labels via `useTranslation()`; all tokens
- [X] T011 [US1] Update `src/screens/GameBoardScreen.tsx` — add `const [stagedCombinations, setStagedCombinations] = useState<Card[][]>([])`; derive `stagedPointTotal = calculateMeldPoints(stagedCombinations)` and `meldReady = stagedPointTotal >= 51`; add `handleStageCombination` (calls `validateCombination(selectedCards, { isInitialMeld: true })`, shows error if invalid, else pushes to staged and clears selection); add `handleConfirmMeld` (calls `actions.placeMeld(stagedCombinations)`, clears staged + selection on success); add `handleCancelMeld` (clears staged + selection); render `<StagedMeldPreview stagedCombinations={stagedCombinations} pointTotal={stagedPointTotal} onCancel={handleCancelMeld} />` between `TableArea` and error banner; pass `isStagingMeld`, `meldReady`, `onStage={handleStageCombination}`, `onMeld={handleConfirmMeld}` to `ActionBar`; import `validateCombination`, `calculateMeldPoints` from `src/engine`
- [X] T012 [P] [US1] Write `src/components/game/__tests__/StagedMeldPreview.test.tsx` per quickstart.md — renders each staged combination as CardTile rows; shows running point total; Cancel button calls `onCancel`; returns null (nothing rendered) when `stagedCombinations` is empty
- [X] T013 [P] [US1] Update `src/components/game/__tests__/ActionBar.test.tsx` — add 4 new test cases per quickstart.md: ACTING + not melded + no staged → Stage enabled (hasSelectedCards), no Meld button; ACTING + not melded + staged < 51 pts → Stage + Cancel visible, Meld disabled; ACTING + not melded + staged ≥ 51 pts → Meld enabled; ACTING + melded → unchanged behavior from Phase 3

**Checkpoint**: US1 complete — multi-combination initial meld fully functional; player can stage, review point total, and confirm or cancel.

---

## Phase 4: User Story 3 — View Table Combinations (Priority: P1)

**Goal**: All table combinations displayed in player turn order (setup order), not insertion order. Layout is stable throughout the game.

**Independent Test**: 3-player game (P1→P2→P3 turn order) — P3 melds first, P1 melds second → assert table renders P1's group above P3's group (turn order, not insertion order).

- [X] T014 [P] [US3] Write failing test in `src/screens/__tests__/GameBoardScreen.test.tsx` — 3-player scenario: set up state where P3's combination is inserted first and P1's second; render screen; assert P1's combination group appears before P3's in the rendered output — this test must fail before T015
- [X] T015 [US3] Update `src/screens/GameBoardScreen.tsx` — after existing derivations, add: `const orderedCombinations = [...tableState.combinations].sort((a, b) => config.players.findIndex(p => p.id === a.ownerId) - config.players.findIndex(p => p.id === b.ownerId));`; pass `orderedCombinations` to `<TableArea combinations={orderedCombinations} ...>` instead of `tableState.combinations` — make T014 test pass

**Checkpoint**: US3 complete — table always renders in turn order; layout stable throughout the game.

---

## Phase 5: User Story 4 — Claim a Joker (UI wiring, Priority: P2)

**Purpose**: Wire the corrected engine `claimJoker` API and `getClaimableJokerCards` helper into the screen. Fix the incorrect claim affordance check from Phase 3.

**Goal**: "Claim" badge only appears when the player's hand contains ALL required replacement cards. Claim action automatically derives and passes the correct cards.

**Independent Test**: Table has `[9♠ 9♥ [Joker]]`; player holds `[9♦]` only → claim badge absent. Same table; player holds `[9♦, 9♣]` → claim badge shown; tap claim → Joker in hand, table becomes `[9♠ 9♥ 9♦ 9♣]`.

- [X] T016 [US4] Update `src/screens/GameBoardScreen.tsx` — replace `canClaimJokerForCombination(combination)` implementation: import `getClaimableJokerCards` from `src/engine`; return `getClaimableJokerCards(combination, activeCards) !== null`; update `handleClaimJoker(combinationId)`: find combo in `orderedCombinations`, call `getClaimableJokerCards(combo, activeCards)`, if null show error, else call `actions.claimJokerFromCombination(combinationId, realCards)` and clear selection
- [X] T017 [P] [US4] Write integration tests in `src/screens/__tests__/GameBoardScreen.test.tsx` per quickstart.md Scenarios 9–12 — claim from 3-natural set (1 card, success); claim from 2-natural set (2 cards, success, set grows to 4); badge absent when player holds only 1 of 2 missing suits; claim from sequence (1 card, success)

**Checkpoint**: US4 complete — Joker claim affordance correct; multi-card claim from 2-natural-card sets works end-to-end.

---

## Phase 6: User Story 2 — Lay Off Cards (Integration tests, Priority: P1)

**Purpose**: Lay-off engine and hook are already correct from Phase 3. This phase adds regression tests to confirm lay-off continues to work with all Phase 4 changes applied.

**Goal**: Lay-off onto own and other players' combinations passes; invalid extensions (wrong suit, duplicate suit, 5th card in set) are rejected with specific errors.

- [X] T018 [US2] Write integration tests in `src/screens/__tests__/GameBoardScreen.test.tsx` per quickstart.md Scenarios 5–8 — extend own sequence (Scenario 5, prepend `4♣` to `[5♣ 6♣ 7♣]`); add card to another player's set (Scenario 6, add `9♣` to `[9♠ 9♥ 9♦]`); reject wrong suit in sequence (Scenario 7, `8♦` → error `sequenceMixedSuits`); reject duplicate suit in set (Scenario 8, `9♠` → error `setDuplicateSuit`)

**Checkpoint**: US2 complete — lay-off regression tests confirm no regressions from Phase 4 changes.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety verification, i18n audit, and platform smoke tests.

- [X] T019 [P] Run `npx tsc --noEmit` from repo root — resolve all TypeScript errors from changed signatures: `realCard→realCards` in `claimJoker`, `placeMeld(Card[][])` in hook and screen, new `StagedMeldPreview` and updated `ActionBar` props, `getClaimableJokerCards` import in screen
- [X] T020 [P] Audit i18n — verify `src/i18n/en.json` and `src/i18n/ar.json` have identical key sets after all additions; confirm all 4 new keys present in both files; add any missing keys
- [ ] T021 Manual smoke test on iOS Simulator — PENDING (requires device) — run all 14 quickstart.md scenarios; verify ≤ 300 ms table re-render after each action; verify staged meld strip renders correctly; RTL layout correct for Arabic at 320pt and 430pt widths
- [ ] T022 Manual smoke test on Android Emulator — PENDING (requires device) — repeat all 14 scenarios; verify `shadows.card.elevation` renders correctly; RTL layout; staged meld strip scrollable if many combinations

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US4 Engine (Phase 2)**: Depends on Phase 1 (new error code must exist) — can start immediately after T001
- **US1 (Phase 3)**: Depends on Phase 1 (i18n keys) + Phase 2 (updated hook signatures from T008 reference `JOKER_CLAIM_AMBIGUOUS_SET`)
- **US3 (Phase 4)**: Depends on Phase 3 (both modify `GameBoardScreen.tsx` — must be sequential)
- **US4 UI (Phase 5)**: Depends on Phase 2 engine (T005, T007) + Phase 4 (modifies same `GameBoardScreen.tsx`)
- **US2 (Phase 6)**: Depends on Phase 5 (adds to `GameBoardScreen.test.tsx` last); can overlap with T021/T022
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

```
Phase 1 (Foundational)
  └─► Phase 2 (US4 Engine): T004 [P], T006 [P] → T005 → T007
        └─► Phase 3 (US1): T008 → T009[P] + T010 → T011 → T012[P] + T013[P]
              └─► Phase 4 (US3): T014[P] → T015
                    └─► Phase 5 (US4 UI): T016 → T017[P]
                          └─► Phase 6 (US2): T018
                                └─► Phase 7: T019[P] + T020[P] → T021 → T022
```

### Files changed per task (conflict map)

| File | Tasks |
|---|---|
| `src/engine/types.ts` | T001 |
| `src/i18n/en.json` | T002 |
| `src/i18n/ar.json` | T003 |
| `src/engine/__tests__/validation.test.ts` | T004 |
| `src/engine/validation.ts` + `src/engine/index.ts` | T005 |
| `src/engine/__tests__/actions/claimJoker.test.ts` | T006 |
| `src/engine/actions/claimJoker.ts` | T007 |
| `src/hooks/useGameActions.ts` | T008 |
| `src/components/game/StagedMeldPreview.tsx` (NEW) | T009 |
| `src/components/game/ActionBar.tsx` | T010 |
| `src/screens/GameBoardScreen.tsx` | T011, T015, T016 (sequential) |
| `src/components/game/__tests__/StagedMeldPreview.test.tsx` (NEW) | T012 |
| `src/components/game/__tests__/ActionBar.test.tsx` | T013 |
| `src/screens/__tests__/GameBoardScreen.test.tsx` | T014, T017, T018 (sequential) |

---

## Implementation Strategy

### MVP (US1 + US3 — correct meld and visible table)

1. Complete Phase 1 (Foundational)
2. Complete Phase 2 (US4 Engine — `getClaimableJokerCards` needed by Phase 3 screen)
3. Complete Phase 3 (US1 — multi-combination meld builder)
4. Complete Phase 4 (US3 — turn-order table display)
5. **STOP and VALIDATE**: A full game can be played; initial meld with multiple combinations works; table displays in turn order
6. Phases 5–6 add Joker claim correctness and lay-off regression tests (incremental)

### Full Delivery (all 22 tasks)

Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7

---

## Notes

- `[P]` tasks = different files, no shared state — safe to parallelize
- All components MUST reference `src/theme/tokens.ts` — zero raw style values (constitution Principle VII)
- All display strings MUST use `useTranslation()` — zero hard-coded strings (constitution Principle VI)
- Engine TDD: T004 and T006 must fail before T005 and T007 respectively (constitution Principle III)
- `en.json` and `ar.json` MUST stay in sync on every commit (constitution Principle VI)
- `GameBoardScreen.tsx` is touched by T011, T015, T016 — these MUST be implemented sequentially
- `GameBoardScreen.test.tsx` is touched by T014, T017, T018 — these MUST be implemented sequentially
- Verify each P1 checkpoint on both iOS and Android before calling a phase complete (constitution Principle IV)
