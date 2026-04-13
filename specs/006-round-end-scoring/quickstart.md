# Quickstart: Round End & Scoring Screen

**Feature**: `006-round-end-scoring`
**Date**: 2026-04-13

---

## Manual Acceptance Checklist

Run these scenarios after implementation to validate the feature end-to-end.

### Scenario 1 — Round Summary Appears After Win (US1 — already implemented)

1. Start a 2-player Short (4-round) game.
2. Play through a round until one player discards their last card.
3. **Expected**: Round summary overlay appears immediately with:
   - Round title (e.g., "Round 1 Complete")
   - Winner's row showing 0 penalty, highlighted
   - Loser's row showing their penalty (sum of remaining hand cards)
   - Both players' cumulative totals (after 1 round, cumulative = round penalty)
   - "Next Round" button visible

### Scenario 2 — No-Meld Flat Penalty (US1 — already implemented)

1. Start a game. On Player 2's turn, do NOT meld (just draw and discard each turn).
2. When Player 1 wins the round, check Player 2's penalty.
3. **Expected**: Player 2 shows exactly 100 pts regardless of what cards they hold.

### Scenario 3 — Scoreboard Button Opens Modal (US2 — new)

1. During an active round (not at round end), tap the "Scoreboard" button on the game board.
2. **Expected**: Scoreboard overlay opens showing:
   - Columns: Player name | R1 | R2 | R3 | R4 | Total
   - Completed rounds filled in with penalty values
   - Pending rounds showing "—"
   - Player with lowest total visually distinguished
3. Tap "Close". **Expected**: Overlay dismisses, game resumes normally.

### Scenario 4 — Scoreboard After Multiple Rounds (US2 — new)

1. Complete 2 rounds of a Short game.
2. Open the scoreboard.
3. **Expected**: R1 and R2 columns have values; R3 and R4 show "—".
4. **Expected**: "Total" column shows correct cumulative sum for each player.

### Scenario 5 — Tied Leader (US2 — new)

1. Engineer a scenario where both players have the same cumulative score.
2. Open the scoreboard.
3. **Expected**: Both players are highlighted as leaders (not just one).

### Scenario 6 — Final Game Over Screen (US3 — already implemented)

1. Play all 4 rounds of a Short game.
2. When the last round ends, **Expected**: Round summary overlay shows:
   - "Play Again" button (same players, same format)
   - "Game Over" / "New Game" button
   - NO "Next Round" button
3. Tap "Play Again". **Expected**: New game starts immediately with same player names.
4. Tap "Game Over". **Expected**: Returns to setup screen, all state cleared.

### Scenario 7 — Score Values Are Correct (US1 — already implemented)

1. End a round with Player 2 holding: `K♥ 7♦ Joker`
2. **Expected**: Player 2's penalty = 10 + 7 + 25 = **42 pts**

### Scenario 8 — Triple-Digit Score Without Truncation (FR-014)

1. Play multiple rounds until a player accumulates 100+ points total.
2. **Expected**: The score displays correctly (e.g., "142") without being cut off.

---

## Engine Unit Test Scenarios (already covered in existing tests)

- `calculateRoundScores`: winner = 0, no-meld = 100, melded-lost = card sum ✅
- `startNextRound`: resets table, hands, meldedPlayerIds, increments round ✅
- `discard` with empty resulting hand: sets `ROUND_ENDED` or `GAME_OVER` correctly ✅
