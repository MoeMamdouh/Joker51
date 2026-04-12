# Tasks: Sort Melded Cards & Fix Lay-Off

**Input**: Design documents from `specs/005-sort-meld-fix-layoff/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included — engine code requires TDD per the project constitution (§III).

**Organization**: Tasks grouped by user story. Both stories share a common sort utility (Phase 2 Foundational), then each story has its own implementation phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2)

---

## Phase 1: Setup

**Purpose**: Create the two new source files that the feature requires. No new dependencies or config needed.

- [x] T001 Create empty `src/engine/sort.ts` with a placeholder export (`export {}`)
- [x] T002 [P] Create empty `src/engine/__tests__/sort.test.ts` with a placeholder `describe` block

**Checkpoint**: New files exist and the project compiles (`npm test` passes with no new failures).

---

## Phase 2: Foundational — Sort Utility (Blocks Both User Stories)

**Purpose**: Implement and fully test `sortCombinationCards`. Both US1 (applying sort to mutations) and US2 (applying sort after lay-off) depend on this utility.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

> **Write tests FIRST — ensure they FAIL before implementing**

- [x] T003 Write failing unit tests for `sortCombinationCards` (sequence cases: ascending rank, out-of-order input, Joker in middle gap, Q-K-A Ace-high, A-2-3 Ace-low) in `src/engine/__tests__/sort.test.ts`
- [x] T004 Write failing unit tests for `sortCombinationCards` (set cases: fixed suit order SPADES→HEARTS→DIAMONDS→CLUBS, Joker at first missing suit slot) in `src/engine/__tests__/sort.test.ts`
- [x] T005 Implement `sortCombinationCards(cards: readonly Card[], type: 'sequence' | 'set'): Card[]` in `src/engine/sort.ts` — pure function, no imports from React/UI (turn T003 + T004 GREEN)
- [x] T006 Export `sortCombinationCards` from `src/engine/index.ts`

**Checkpoint**: `npm test` passes; all sort utility tests green; `sortCombinationCards` available as a named export from `src/engine`.

---

## Phase 3: User Story 1 — Sorted Combinations on Table (Priority: P1) 🎯 MVP

**Goal**: Every combination stored in `GameState.tableState.combinations` has its cards in sorted order, regardless of the order they were submitted. Sorting is applied at all four mutation sites.

**Independent Test**: Meld `[8♠, 6♠, 7♠]` → resulting combination's `cards` array equals `[6♠, 7♠, 8♠]`. Claim a Joker from `[Q♠, [Joker], K♠]` with `J♠` → resulting combination's `cards` equals `[J♠, Q♠, K♠]`.

> **Write tests FIRST (add assertions to existing test files) — ensure they FAIL before implementation**

### Tests for User Story 1

- [x] T007 [P] [US1] Add sort-output assertions to existing meld tests in `src/engine/__tests__/actions/meld.test.ts` (e.g., meld `[8♠, 6♠, 7♠]` → `cards` is `[6♠, 7♠, 8♠]`; meld a set in random suit order → `cards` in SPADES→HEARTS→DIAMONDS→CLUBS order)
- [x] T008 [P] [US1] Create `src/engine/__tests__/actions/placeCombinations.test.ts` with sort-output assertions (place `[K♠, Q♠, J♠]` → `cards` is `[J♠, Q♠, K♠]`)
- [x] T009 [P] [US1] Add sort-output assertions to existing claimJoker tests in `src/engine/__tests__/actions/claimJoker.test.ts` (after claim, combination `cards` array is sorted)

### Implementation for User Story 1

- [x] T010 [US1] Apply `sortCombinationCards` to each new combination's `cards` in `src/engine/actions/meld.ts` before writing to `tableState` (turn T007 GREEN)
- [x] T011 [US1] Apply `sortCombinationCards` to each new combination's `cards` in `src/engine/actions/placeCombinations.ts` before writing to `tableState` (turn T008 GREEN)
- [x] T012 [US1] Apply `sortCombinationCards` to the updated combination's `cards` in `src/engine/actions/claimJoker.ts` (both sequence swap path and set expansion path) before writing to `tableState` (turn T009 GREEN)

**Checkpoint**: All meld, placeCombinations, and claimJoker tests pass; every combination returned by those actions has sorted `cards`; `npm test` passes with no regressions.

---

## Phase 4: User Story 2 — Lay-Off Position Auto-Detection & Session Sort (Priority: P1)

**Goal**: A player can lay off a card at either end of a sequence by tapping the combination once; the engine auto-detects the correct position. Sessions loaded from storage also display combinations sorted.

**Independent Test**: Table has `[6♠, 7♠, 8♠]`; player holds `5♠` → `layOff` with no position specified succeeds and combination becomes `[5♠, 6♠, 7♠, 8♠]`. Separately: a GameState loaded from JSON with unsorted combination `[8♠, 6♠, 7♠]` returns sorted after `useSavedSession` parses it.

> **Write tests FIRST — ensure they FAIL before implementation**

### Tests for User Story 2

- [x] T013 [P] [US2] Add failing prepend lay-off test cases to `src/engine/__tests__/actions/layOff.test.ts`:
  - `5♠` on `[6♠, 7♠, 8♠]` → success, cards become `[5♠, 6♠, 7♠, 8♠]`
  - `A♠` on `[2♠, 3♠, 4♠]` → success (Ace-low prepend)
  - `Q♠` on `[K♠, A♠]` → success (Ace-high, Q prepended → `[Q♠, K♠, A♠]`)
  - Card not fitting either end → `INVALID_COMBINATION` error
- [x] T014 [P] [US2] Create `src/hooks/__tests__/useSavedSession.test.ts` with a test that parses a raw JSON session containing unsorted combination `[8♠, 6♠, 7♠]` and asserts the returned `session.tableState.combinations[0].cards` equals `[6♠, 7♠, 8♠]`

### Implementation for User Story 2

- [x] T015 [US2] Refactor `src/engine/actions/layOff.ts`:
  - Remove optional `position` parameter from the function signature
  - Implement auto-detection: compute `minIdx` / `maxIdx` of natural card rank indices; incoming card at `minIdx - 1` → prepend; at `maxIdx + 1` → append; both valid → append; neither → `INVALID_COMBINATION`
  - Apply `sortCombinationCards` to `newCards` after insertion
  - (Turns T013 GREEN)
- [x] T016 [US2] Apply sort on session load in `src/hooks/useSavedSession.ts`:
  - After `JSON.parse(raw) as GameState`, map all `tableState.combinations` through `sortCombinationCards(combo.cards, combo.type)` before `setSession`
  - (Turns T014 GREEN)

**Checkpoint**: All layOff tests pass including new prepend cases; useSavedSession test passes; `npm test` passes with no regressions.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and coverage check across the full feature.

- [x] T017 Run `npm test` and confirm overall test suite passes; verify ≥ 90% line coverage on `src/engine/sort.ts`, `src/engine/actions/layOff.ts`, `src/engine/actions/meld.ts`, `src/engine/actions/placeCombinations.ts`, `src/engine/actions/claimJoker.ts`
- [ ] T018 [P] Perform manual acceptance checks per `specs/005-sort-meld-fix-layoff/quickstart.md`:
  - Meld out-of-order cards → combination displays sorted
  - Lay off prepend card → succeeds without position input
  - Lay off append card → succeeds
  - Card fitting neither end → error shown
  - Resume saved session → existing combinations display sorted
  - Q♠ K♠ A♠ → displays as `Q♠ K♠ A♠`, not `A♠ Q♠ K♠`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS both user stories**
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion; US1 and US2 can run in parallel after Phase 2
- **Polish (Phase 5)**: Depends on Phase 3 + Phase 4 completion

### User Story Dependencies

- **US1**: No dependency on US2 — independently testable and releasable
- **US2**: No dependency on US1 — the lay-off fix and session sort are orthogonal to the meld/claimJoker sort

### Within Each User Story (TDD order)

Tests → write and confirm RED → Implementation → confirm GREEN → Checkpoint

### Parallel Opportunities

- T001 and T002 (Phase 1) can run in parallel
- T003 and T004 (sort tests) can run in parallel
- T007, T008, T009 (US1 test stubs) can run in parallel
- T013 and T014 (US2 test stubs) can run in parallel
- T010, T011, T012 (US1 implementation) can run in parallel once T007–T009 are RED
- T015 and T016 (US2 implementation) can run in parallel once T013–T014 are RED
- US1 (Phase 3) and US2 (Phase 4) can run in parallel once Phase 2 completes

---

## Parallel Example: Foundational Phase

```
# These two test stubs can be written simultaneously:
Task T003: sequence sort tests in src/engine/__tests__/sort.test.ts
Task T004: set sort tests in src/engine/__tests__/sort.test.ts
```

## Parallel Example: User Story 1

```
# Once Phase 2 is complete, launch all three test stubs together:
Task T007: sort assertions in src/engine/__tests__/actions/meld.test.ts
Task T008: new placeCombinations test in src/engine/__tests__/actions/placeCombinations.test.ts
Task T009: sort assertions in src/engine/__tests__/actions/claimJoker.test.ts

# Then implement simultaneously (different files, no shared state):
Task T010: sort in src/engine/actions/meld.ts
Task T011: sort in src/engine/actions/placeCombinations.ts
Task T012: sort in src/engine/actions/claimJoker.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — sort utility built and tested
3. Complete Phase 3: US1 — all mutation sites sort their output
4. **STOP and VALIDATE**: sorted combinations confirmed in tests and manual run
5. US2 (lay-off fix) can be added in a follow-up if needed

### Incremental Delivery

1. Phase 1 + 2 → sort utility ready
2. Phase 3 → table always shows sorted combinations (visual fix)
3. Phase 4 → lay-off prepend unblocked + session resume sorted (gameplay fix)
4. Phase 5 → full validation pass

---

## Notes

- [P] tasks operate on different files and have no dependency on each other's completion
- Constitution §III mandates TDD for all engine code — tests MUST be written and confirmed RED before implementation
- `sortCombinationCards` is the only new exported symbol; no other public API changes
- The `position` parameter removal from `layOff` is safe: no caller in the codebase passes it
- `src/hooks/__tests__/` directory does not yet exist — T014 implicitly creates it
