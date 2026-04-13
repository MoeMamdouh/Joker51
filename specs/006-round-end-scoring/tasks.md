# Tasks: Round End & Scoring Screen

**Input**: Design documents from `specs/006-round-end-scoring/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included — new UI components require integration tests per the project constitution (§III).

**Organization**: US1 (round summary) and US3 (game over) are already fully implemented. All tasks target US2 (on-demand scoreboard modal), which is the only new work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US2)

---

## Pre-Built: US1 & US3 (No Tasks Required)

The following are already implemented and require no code changes:

- **US1 — Round Summary**: `RoundSummaryOverlay` component + `GameBoardScreen` wiring (shows after each round win, `showRoundSummary` state, all callbacks wired).
- **US3 — Game Over Screen**: Handled by `isGameOver` prop in `RoundSummaryOverlay` (shows Play Again + Game Over buttons instead of Next Round when final round ends).

**Checkpoint**: Run `npm test` to confirm existing tests pass before starting US2 work.

---

## Phase 1: Foundational — i18n Keys

**Purpose**: Add translation keys required by `ScoreboardModal` to both locale files. These must exist before the component can be implemented.

**⚠️ CRITICAL**: US2 cannot begin until both locale files have the scoreboard keys.

- [x] T001 Add `game.scoreboard` key group to `src/i18n/en.json` with keys: `title` ("Scoreboard"), `round` ("R{{number}}"), `total` ("Total"), `pending` ("—"), `close` ("Close"), `leader` ("Leading")
- [x] T002 [P] Add `game.scoreboard` key group to `src/i18n/ar.json` with Arabic translations: `title` ("لوحة النتائج"), `round` ("ج{{number}}"), `total` ("المجموع"), `pending` ("—"), `close` ("إغلاق"), `leader` ("في المقدمة")

**Checkpoint**: Both locale files have `game.scoreboard.*` keys. `npm test` still passes (no regressions).

---

## Phase 2: User Story 2 — On-Demand Scoreboard Modal (Priority: P1)

**Goal**: A player taps a "Scoreboard" button on the game board to open a full per-round score table overlay. The overlay shows all players' scores per round, pending rounds as "—", cumulative totals, and highlights the leader. A Close button dismisses it.

**Independent Test**: Start a game, complete at least one round, tap the Scoreboard button → overlay opens showing R1 penalty values and "—" for remaining rounds. Verify the player with the lowest total is visually distinguished. Tap Close → overlay dismisses.

> **Write tests FIRST — ensure they FAIL before implementing**

### Tests for User Story 2

- [x] T003 [US2] Write failing component tests for `ScoreboardModal` in `src/components/game/__tests__/ScoreboardModal.test.tsx` covering: renders nothing when `visible=false`; renders title and close button when `visible=true`; shows completed round scores and "—" for pending rounds; highlights leader (lowest total); handles tie (two leaders); `onClose` called on close button press
- [x] T004 [P] [US2] Write failing integration test for scoreboard button in `src/screens/__tests__/GameBoardScreen.test.tsx`: renders `btn-scoreboard` button when game is in progress; pressing it shows the scoreboard overlay; scoreboard overlay is not visible initially

### Implementation for User Story 2

- [x] T005 [US2] Implement `ScoreboardModal` in `src/components/game/ScoreboardModal.tsx` per contract in `specs/006-round-end-scoring/contracts/scoreboard-modal-ui.md`: absolute-fill overlay (zIndex 200), per-round score grid (player rows × round columns), "—" for pending rounds, leader highlight via `colors.accent` tint, Close button; all styles via `src/theme/tokens.ts`, all strings via i18next (turn T003 GREEN)
- [x] T006 [US2] Add scoreboard button and `ScoreboardModal` to `src/screens/GameBoardScreen.tsx`: import `ScoreboardModal`, add `const [showScoreboard, setShowScoreboard] = useState(false)`, add `<Pressable testID="btn-scoreboard">` near `ScoreboardRow`, render `<ScoreboardModal visible={showScoreboard} ... onClose={() => setShowScoreboard(false)} />` (turn T004 GREEN)

**Checkpoint**: All `ScoreboardModal` tests and `GameBoardScreen` scoreboard tests pass. Manual test: open scoreboard during game, verify layout, close it. `npm test` passes with no regressions.

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across the full feature.

- [x] T007 Run `npm test` and confirm overall test suite passes with no regressions; verify new component tests are green
- [x] T008 [P] Perform manual acceptance checks per `specs/006-round-end-scoring/quickstart.md` scenarios 3–5 (scoreboard modal scenarios):
  - Scenario 3: Scoreboard button opens modal during active round
  - Scenario 4: Completed round columns filled; pending columns show "—"
  - Scenario 5: Tied leaders both highlighted

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately with T001 + T002 in parallel
- **US2 Tests (T003, T004)**: Depend on Phase 1 completion (T001 + T002) — can run in parallel with each other
- **US2 Implementation (T005)**: Depends on T003 being RED; depends on Phase 1
- **US2 Integration (T006)**: Depends on T005 (needs `ScoreboardModal` to exist); T004 must be RED before T006
- **Polish (Phase 3)**: Depends on Phase 2 completion

### User Story Dependencies

- **US1**: Pre-built — no dependency
- **US2**: Depends on Phase 1 (i18n keys); independent of US1/US3 implementation
- **US3**: Pre-built — no dependency

### Within User Story 2 (TDD order)

Tests → write and confirm RED → Implementation → confirm GREEN → Checkpoint

### Parallel Opportunities

- T001 and T002 (i18n keys) can run in parallel
- T003 and T004 (test stubs) can run in parallel once Phase 1 completes
- T007 and T008 (polish) can run in parallel once Phase 2 completes

---

## Parallel Example: User Story 2

```
# Phase 1 (parallel):
T001: Add en.json game.scoreboard.* keys
T002: Add ar.json game.scoreboard.* keys

# Tests (parallel, once Phase 1 done):
T003: ScoreboardModal component tests
T004: GameBoardScreen scoreboard button test

# Implementation (sequential — T005 before T006):
T005: Implement ScoreboardModal component
T006: Wire button + modal into GameBoardScreen
```

---

## Implementation Strategy

### MVP (US2 Only)

1. Complete Phase 1: i18n keys
2. Write T003 + T004 tests (RED)
3. Implement T005 + T006 (GREEN)
4. **STOP and VALIDATE**: Manual scoreboard test
5. Run T007 full test suite

### Incremental Delivery

1. Phase 1 → i18n keys ready
2. T003–T004 → tests RED
3. T005 → ScoreboardModal component green
4. T006 → Full integration green
5. Phase 3 → Validated

---

## Notes

- [P] tasks operate on different files and have no dependency on each other's completion
- US1 and US3 are pre-built — do not modify `RoundSummaryOverlay` or its existing test suite
- `ScoreboardModal` must use `StyleSheet.absoluteFillObject` + `zIndex: 200` (consistent with `HandOffOverlay` and `RoundSummaryOverlay` patterns)
- All colors/spacing/typography must reference `src/theme/tokens.ts` tokens — no raw values
- Both locale files must be updated in the same commit (constitution §VI)
