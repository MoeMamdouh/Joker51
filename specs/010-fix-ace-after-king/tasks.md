# Tasks: Fix Ace-After-King Sequence Validation

**Input**: Design documents from `specs/010-fix-ace-after-king/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

**Tests**: TDD is MANDATORY per Constitution §III — all failing tests must be written and confirmed RED before implementation.

**Organization**: Tasks grouped by user story for independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: No new project structure is needed. All files already exist.

- [x] T001 Confirm all 6 target files exist and `npm test` passes from a clean state: `src/engine/validation.ts`, `src/engine/actions/layOff.ts`, `src/components/game/jokerPlacement.ts`, `src/engine/__tests__/validation.test.ts` (add), `src/engine/__tests__/layOff.test.ts` (create), `src/components/game/__tests__/jokerPlacement.test.ts` (create)

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Extract the `isAceHigh` helper — the single building block consumed by every story-phase fix. No user story can be correctly fixed without it.

**⚠️ CRITICAL**: All US phases depend on this helper existing first.

- [x] T002 Add exported helper `isAceHigh(nonJokers: Card[], jokerCount: number): boolean` to `src/engine/validation.ts` immediately before the public API section — detects Ace-high when King is natural OR when `maxNonAceRankIndex + jokerCount >= 12`
- [x] T003 [P] Update `getClaimableJokerCards` in `src/engine/validation.ts` to replace `const aceHigh = nonJokers.some(c => c.rank === Rank.ACE) && nonJokers.some(c => c.rank === Rank.KING)` with `const aceHigh = isAceHigh(nonJokers, combination.cards.filter(c => c.isJoker).length)` (same fix in `getClaimableJokerIndex`)
- [x] T004 [P] Update `getClaimableJokerIndex` in `src/engine/validation.ts` to replace its duplicate `aceHigh` line with the `isAceHigh` helper call using the same jokerCount pattern as T003

**Checkpoint**: `isAceHigh` is exported, both claimable-Joker functions use it, `npm test` still passes (no regressions)

---

## Phase 3: User Story 1 — Extend Run with Ace After Natural King (Priority: P1) 🎯 MVP

**Goal**: An Ace can be placed at the end of any run whose last natural card is King — whether the run includes internal Jokers or not.

**Independent Test**: Stage or lay off an Ace onto a sequence ending with natural King and confirm the move is accepted with no error.

### Tests for User Story 1 ⚠️ Write FIRST — must FAIL before T008

- [x] T005 [US1] Add failing test `'valid: J-K-A (natural king + ace high)'` to `src/engine/__tests__/validation.test.ts` for `[J♥, K♥, A♥]` → expect `valid: true` (currently passes; confirm still does)
- [x] T006 [US1] Add failing test `'valid: J-Joker-K-A with Joker as Q (natural king + ace high)'` to `src/engine/__tests__/validation.test.ts` for `[J♥, Joker, K♥, A♥]` → expect `valid: true` (this is an existing test — verify it still passes)
- [x] T007 [US1] Add failing test `'valid: 10-Joker-Q-K-A'` to `src/engine/__tests__/validation.test.ts` for `[10♥, Joker, Q♥, K♥, A♥]` → expect `valid: true` (**should currently FAIL**)
- [x] T008 [P] [US1] Create `src/engine/__tests__/layOff.test.ts` with failing test: lay off Ace onto an existing `[J♥, Q♥, K♥]` table combination → expect `success: true` (**should currently FAIL**); use a minimal `GameState` fixture with one combination and the Ace in a player's hand after their initial meld

### Implementation for User Story 1

- [x] T009 [US1] Fix `validateAsSequence` in `src/engine/validation.ts`: replace `const aceHigh = hasAce && hasKing` with `const aceHigh = isAceHigh(nonJokers, jokerCount)` (one-line change, ~line 234)
- [x] T010 [US1] Fix `detectLayOffPosition` in `src/engine/actions/layOff.ts`: after computing `maxIdx`, add trailing-Joker counter (`trailingJokers`) and `effectiveMax = maxIdx + trailingJokers`; add Ace-high early-return: `if (card.rank === Rank.ACE && effectiveMax === RANK_ORDER.indexOf(Rank.KING)) return 'end'`; update `fitsEnd` to use `effectiveMax + 1` instead of `maxIdx + 1`
- [x] T011 [US1] Verify T007 and T008 now pass GREEN: run `npx jest src/engine/__tests__/validation.test.ts src/engine/__tests__/layOff.test.ts`

**Checkpoint**: `[10♥, Joker, Q♥, K♥, A♥]` validates as valid; laying Ace onto `[J♥, Q♥, K♥]` succeeds — User Story 1 is independently testable and complete

---

## Phase 4: User Story 2 — Extend Run with Ace When King Is Joker (Priority: P1)

**Goal**: An Ace can be placed at the end of any run whose King position is represented by a Joker, not just when a natural King is present.

**Independent Test**: Stage or lay off an Ace onto a sequence like `[J♥, Q♥, Joker]` and confirm the move is accepted.

### Tests for User Story 2 ⚠️ Write FIRST — must FAIL before T016

- [x] T012 [US2] Add failing test `'valid: J-Q-Joker-A (joker as king, ace high)'` to `src/engine/__tests__/validation.test.ts` for `[J♥, Q♥, Joker, A♥]` → expect `valid: true` (**should currently FAIL**)
- [x] T013 [US2] Add failing test `'valid: 10-J-Q-Joker-A (joker as king)'` to `src/engine/__tests__/validation.test.ts` for `[10♥, J♥, Q♥, Joker, A♥]` → expect `valid: true` (**should currently FAIL**)
- [x] T014 [US2] Add failing test `'valid: J-Joker-Joker-A (two jokers as Q and K)'` to `src/engine/__tests__/validation.test.ts` for `[J♥, Joker, Joker, A♥]` → expect `valid: true` (**should currently FAIL**)
- [x] T015 [P] [US2] Add failing layoff test to `src/engine/__tests__/layOff.test.ts`: lay off Ace onto existing `[J♥, Q♥, Joker]` combination → expect `success: true` (**should currently FAIL**)
- [x] T016 [P] [US2] Create `src/components/game/__tests__/jokerPlacement.test.ts` with failing test: `computeJokerSequenceOptions([J♥, Q♥, Joker, A♥])` should return exactly 1 option with label `'Joker as K♥'` (**should currently return `[]`**)

### Implementation for User Story 2

- [x] T017 [US2] Fix `computeJokerSequenceOptions` in `src/components/game/jokerPlacement.ts`: import `isAceHigh` from `../../engine/validation` and replace the inline `const aceHigh = hasAce && hasKing` (line ~57) with `const aceHigh = isAceHigh(naturals, jokerCount)`
- [x] T018 [US2] Verify T012, T013, T014, T015 tests now pass GREEN: run `npx jest src/engine/__tests__/validation.test.ts src/engine/__tests__/layOff.test.ts`
- [x] T019 [US2] Verify T016 test now passes GREEN: run `npx jest src/components/game/__tests__/jokerPlacement.test.ts`

**Checkpoint**: `[J♥, Q♥, Joker, A♥]` validates as valid; Ace lays off successfully onto `[J♥, Q♥, Joker]`; Joker Placement sheet shows `'Joker as K♥'` — User Story 2 independently complete

---

## Phase 5: User Story 3 — Ace-Low Regression + Scoring Fix (Priority: P2)

**Goal**: The Ace-high fix must not break Ace-low runs (A-2-3 etc.), and Joker substituted value in Ace-high runs must score correctly.

**Independent Test**: Validate that A-2-3, A-Joker-3, and A-2-Joker all still pass; confirm Joker in `[J, Q, Joker, A]` scores as King (10 pts), not as Two (2 pts).

### Tests for User Story 3 ⚠️ Write FIRST — regression tests should PASS; scoring tests should FAIL

- [x] T020 [US3] Add/confirm regression test `'valid: A-2-3 (ace low)'` in `src/engine/__tests__/validation.test.ts` — already exists (T029 in original file); run and confirm it still passes after Phase 4 changes
- [x] T021 [US3] Add/confirm regression test `'valid: A-2-Joker'` and `'valid: A-Joker-3'` in `src/engine/__tests__/validation.test.ts` — confirm still valid after `isAceHigh` fix
- [x] T022 [P] [US3] Add failing test `'K-A-2 remains invalid (no wrap-around)'` to `src/engine/__tests__/validation.test.ts` — already exists; confirm still fails correctly
- [x] T023 [P] [US3] Add failing scoring test: `jokerSubstitutedValue` for `[J♥, Q♥, Joker, A♥]` should return `10` (King points), not `2` — add to `src/engine/__tests__/validation.test.ts` (**should currently FAIL**)
- [x] T024 [US3] Add failing meld-points test: `calculateMeldPoints([[J♥, Q♥, Joker, A♥]])` should return `10+10+10+11 = 41` — add to `src/engine/__tests__/validation.test.ts` (**should currently FAIL**)

### Implementation for User Story 3

- [x] T025 [US3] Fix `jokerSubstitutedValue` in `src/engine/validation.ts`: add aceHigh detection using `isAceHigh(nonJokers, jokerCount)` then define `rankIdx = (rank: Rank) => rank === Rank.ACE && aceHigh ? 13 : RANK_ORDER.indexOf(rank)` and update `rankIndices` computation to use it; ensure gap detection uses the corrected index range
- [x] T026 [US3] Verify T020, T021, T022 regression tests still GREEN (no Ace-low regressions)
- [x] T027 [US3] Verify T023 and T024 scoring tests now pass GREEN

**Checkpoint**: Ace-low runs unaffected; Joker in K-A ending scores as King (10 pts) — User Story 3 independently complete

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and edge case coverage across all stories

- [x] T028 Add invalid edge-case test `'invalid: K-Joker-A (no rank between K and A-high — pre-existing known pass)'` to `src/engine/__tests__/validation.test.ts` documenting that this returns `valid: true` as pre-existing behaviour (out of scope — tracked separately)
- [x] T029 [P] Run full test suite `npm test` from repo root and verify ALL tests pass with no new failures
- [x] T030 [P] Run `npm run lint` and fix any TypeScript/ESLint issues introduced in the changed files
- [x] T031 Run `npx tsc --noEmit` to confirm strict TypeScript compilation passes across all changed files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS** all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — can start immediately after `isAceHigh` exists
- **Phase 4 (US2)**: Depends on Phase 2 — can start in parallel with Phase 3 (different test file, same implementation site)
- **Phase 5 (US3)**: Depends on Phase 3 and 4 complete (scoring fix depends on `isAceHigh` and `validateAsSequence` being correct)
- **Phase 6 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational (T002). No dependency on US2.
- **US2 (P1)**: Depends only on Foundational (T002). No dependency on US1. T017 (jokerPlacement fix) also depends on T009 (validateAsSequence fix from US1) being in place first.
- **US3 (P2)**: Depends on US1 complete (jokerSubstitutedValue uses same `isAceHigh` helper); regression tests also verify US1/US2 work correctly.

### Within Each Story

1. Write tests first (RED) — verify they FAIL before implementation
2. Implement fix
3. Verify tests pass (GREEN)
4. Run full suite before moving to next story

### Parallel Opportunities

- T003 and T004 (claimable-Joker helper updates) can run in parallel within Phase 2
- T008 (layOff test file creation) can start in parallel with T005/T006/T007 in Phase 3
- T015 and T016 (layOff test + jokerPlacement test creation) can run in parallel in Phase 4
- T022 and T023/T024 tests within Phase 5 can be written in parallel
- T029, T030, T031 in Polish phase can run in parallel

---

## Parallel Example: User Story 2

```bash
# Launch test writing in parallel (different files, no dependencies):
Task T015: "Add failing layoff test for Ace onto J-Q-Joker in src/engine/__tests__/layOff.test.ts"
Task T016: "Create jokerPlacement.test.ts with failing computeJokerSequenceOptions test"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 — both P1)

1. Complete Phase 1: Confirm baseline passes
2. Complete Phase 2: Create `isAceHigh` helper (CRITICAL — blocks everything)
3. Complete Phase 3: US1 (natural King + Ace) → test RED → fix → GREEN
4. Complete Phase 4: US2 (Joker-as-King + Ace) → test RED → fix → GREEN
5. **STOP and VALIDATE**: Both bug scenarios from screenshots now work
6. Demo fix to user — the two reported failures are resolved

### Full Delivery

6. Complete Phase 5: US3 (Ace-low regression + scoring fix)
7. Complete Phase 6: Polish (full suite, lint, type check)

### Single-Developer Order

T001 → T002 → T003+T004 → T005 → T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015+T016 → T017 → T018 → T019 → T020 → T021 → T022+T023+T024 → T025 → T026 → T027 → T028 → T029+T030+T031

---

## Notes

- All engine function changes are one-line substitutions (replace `aceHigh = hasAce && hasKing` with `aceHigh = isAceHigh(...)`)
- `detectLayOffPosition` is the only function requiring structural change (~5 lines added)
- Constitution §III mandates TDD — never skip the RED step
- `K, Joker, A` currently passing validation is a **pre-existing separate issue** — do NOT fix it in this feature (T028 documents it)
- Commit after each phase checkpoint to preserve clean git history
