# UI Contract: ScoreboardModal

**Component**: `src/components/game/ScoreboardModal.tsx`
**Feature**: `006-round-end-scoring`

---

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `visible` | `boolean` | Yes | Whether the modal is shown |
| `totalRounds` | `4 \| 8 \| 12` | Yes | Total rounds in the game (determines column count) |
| `players` | `{ playerId: string; name: string }[]` | Yes | Player list in display order |
| `roundResults` | `readonly RoundResult[]` | Yes | All completed round results |
| `onClose` | `() => void` | Yes | Called when user taps Close or backdrop |

---

## Rendering Rules

### When `visible = false`
- Component renders nothing (`null`).

### When `visible = true`
- Renders a full-screen overlay (`StyleSheet.absoluteFillObject`, `zIndex: 200`).
- Title: i18n key `game.scoreboard.title` ("Scoreboard").
- Renders a grid table:
  - **Header row**: player name column + one column per round (`R1`, `R2`, … `RN`) + Total column.
  - **Column headers**: `game.scoreboard.round` with `{{number}}` interpolation; `game.scoreboard.total` for last column.
  - **One data row per player**:
    - Player name (truncated if necessary).
    - Round penalty for each completed round (numeric value, e.g., `42`).
    - Pending rounds show `game.scoreboard.pending` ("—").
    - Total column: sum of completed rounds.
  - **Leader badge**: Player with lowest total gets a visual indicator (e.g., accent color row or "Leading" label from `game.scoreboard.leader`). In case of tie, all tied players are highlighted.
- Close button: labeled `game.scoreboard.close` ("Close"), calls `onClose`.

---

## Accessibility

- Each row identified by `testID="scoreboard-row-{playerId}"`.
- Close button: `testID="btn-scoreboard-close"`.
- Title: `testID="scoreboard-title"`.

---

## Design Constraints

- All colors from `colors.*` tokens (no inline hex).
- All spacing from `spacing.*` tokens.
- All typography from `typography.*` tokens.
- Round columns scale down for 12-round games; use compact `R1`–`R12` headers.
- For 8+ players, the player name column may truncate with ellipsis (`numberOfLines={1}`).

---

## Trigger

A "Scoreboard" button (`testID="btn-scoreboard"`) is added to `GameBoardScreen` (always visible during `IN_PROGRESS` and `ROUND_ENDED` states). It opens `ScoreboardModal` by setting local state `showScoreboard = true`.

**i18n key**: `game.scoreboard.title` used as button label.
