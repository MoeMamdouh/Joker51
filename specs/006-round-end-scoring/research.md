# Research: Round End & Scoring Screen

**Feature**: `006-round-end-scoring`
**Date**: 2026-04-13

---

## Decision 1: Scoring Engine Already Complete

**Decision**: No new engine code required. All scoring logic is already implemented.

**Rationale**: `src/engine/scoring.ts` exports `calculateRoundScores()` which correctly implements game rules §13 (winner = 0 penalty, no-meld = 100 flat, melded-lost = sum of hand card values). `discard.ts` already calls this on win detection and sets `GameStatus.ROUND_ENDED` or `GameStatus.GAME_OVER`. `startNextRound()` is also implemented and exported.

**Alternatives considered**: Rewriting or extending `calculateRoundScores()`. Rejected — current implementation covers all spec FRs (FR-003, FR-004, FR-005).

---

## Decision 2: US1 and US3 Already Fully Implemented

**Decision**: Round summary (US1) and game over screen (US3) are already built and wired up. No new screens or components needed for these stories.

**Rationale**:
- `RoundSummaryOverlay` (`src/components/game/RoundSummaryOverlay.tsx`) shows round title, winner, per-player penalty, cumulative totals, and the three action buttons (Next Round / Play Again / Game Over).
- `GameBoardScreen` already imports and conditionally renders `RoundSummaryOverlay` when `showRoundSummary === true`, passes all required props, handles all three callbacks.
- The `isGameOver` prop controls which buttons are shown (Next Round vs Play Again + Game Over).

**Alternatives considered**: Building a separate `GameOverScreen`. Rejected — the overlay pattern handles both cases cleanly with a single component.

---

## Decision 3: US2 Requires a New ScoreboardModal Component

**Decision**: Add `ScoreboardModal` — an on-demand overlay that shows the full per-round score table — and a trigger button on the game board.

**Rationale**: The existing `ScoreboardRow` is a compact strip showing only cumulative totals. It does not show per-round breakdown, does not highlight the leader, and has no round columns for pending rounds. The clarification (Session 2026-04-13) confirmed the modal/overlay pattern, not permanent embedding.

**Alternatives considered**:
- Expanding `ScoreboardRow` in-place: Rejected — would break the compact header layout and consume too much screen space.
- A full navigation screen: Rejected — a modal overlay is consistent with `RoundSummaryOverlay` and `HandOffOverlay` patterns already in use.

---

## Decision 4: Data Model — No Changes to RoundResult

**Decision**: The existing `RoundResult` type (`{ roundNumber, scores: { playerId, penalty }[], winnerId }`) is sufficient. The `ScoreBreakdown` entity described in the spec (no-meld flag vs card list) is not needed for the display requirements.

**Rationale**: No FR requires displaying a card-by-card breakdown in the UI. FR-002 requires showing the penalty score, which is already in `RoundResult.scores`. Adding per-card breakdown would require storing card state at round-end time (the winning player's last discard has already been removed from hand at that point), which would require a scoring architecture change. Out of scope.

**Alternatives considered**: Extending `RoundResult` with `breakdown` field. Deferred — not required by any FR. Can be added in a future iteration if desired.

---

## Decision 5: Overlay Pattern for ScoreboardModal

**Decision**: `ScoreboardModal` uses `StyleSheet.absoluteFillObject` + `zIndex: 200` overlay pattern, consistent with `RoundSummaryOverlay` and `HandOffOverlay`.

**Rationale**: Both existing overlays use this pattern. It avoids React Native `Modal` API (which has known Android back-button edge cases with Expo Router) and is visually consistent.

---

## Decision 6: i18n — New Keys Required

**Decision**: Add `game.scoreboard.*` key group to both `en.json` and `ar.json`.

**Required keys**:
- `game.scoreboard.title` — "Scoreboard"
- `game.scoreboard.round` — "R{{number}}" (compact round column header)
- `game.scoreboard.total` — "Total"
- `game.scoreboard.pending` — "—" (placeholder for incomplete rounds)
- `game.scoreboard.close` — "Close"
- `game.scoreboard.leader` — "Leading" (badge for lowest-score player)

**Rationale**: All user-facing strings must be in locale files per constitution §VI.

---

## Decision 7: No New Tests for Already-Implemented US1/US3

**Decision**: Existing `RoundSummaryOverlay` tests and `GameBoardScreen` tests cover US1 and US3. New tests are only needed for `ScoreboardModal` (new component) and the scoreboard button wiring in `GameBoardScreen`.

**Rationale**: Constitution §III requires TDD for engine code and integration tests for new UI components. No new engine code means no new engine tests. New component = new component test required.
