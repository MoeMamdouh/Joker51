# Data Model: Round End & Scoring Screen

**Feature**: `006-round-end-scoring`
**Date**: 2026-04-13

---

## Existing Types (No Changes)

### RoundResult (src/engine/types.ts — already defined)

```
RoundResult {
  roundNumber: number          // 1-based round index
  scores: { playerId: string; penalty: number }[]  // one entry per player
  winnerId: string             // player who discarded last card
}
```

**Rules**:
- Winner's penalty is always 0
- No-meld player's penalty is always 100
- Melded-but-lost player's penalty = sum of remaining hand card values
- Stored in `GameState.roundResults` (append-only, one entry per completed round)

### GameStatus (src/engine/types.ts — already defined)

```
GameStatus.IN_PROGRESS   → active gameplay
GameStatus.ROUND_ENDED   → round complete, not last round
GameStatus.GAME_OVER     → final round complete
```

**Transition**: `discard()` computes `RoundResult`, appends to `roundResults`, sets status to `ROUND_ENDED` or `GAME_OVER` when winner discards last card.

---

## Derived Data (Computed in UI — Not Stored)

### CumulativeScore (computed in GameBoardScreen, passed to components)

```
CumulativeScore {
  playerId: string
  name: string
  score: number    // sum of all RoundResult.scores[playerId].penalty across roundResults
}
```

**Computation**: Already implemented in `GameBoardScreen.getCumulativeScore()`. Reused as-is.

### ScoreboardRow (per-player, per-round view for ScoreboardModal)

```
ScoreboardEntry {
  playerId: string
  name: string
  roundPenalties: (number | null)[]   // index = round index (0-based); null = round not yet played
  total: number                        // sum of non-null entries
  isLeader: boolean                    // has lowest total among all players
}
```

**Computation**: Built from `GameState.roundResults` + `GameConfig.totalRounds` at render time. Not stored.

---

## New Component Props (UI Contracts)

### ScoreboardModal

```
ScoreboardModalProps {
  visible: boolean
  totalRounds: 4 | 8 | 12
  players: { playerId: string; name: string }[]
  roundResults: readonly RoundResult[]
  onClose(): void
}
```

**Derived inside component**:
- Build `ScoreboardEntry[]` from `players` × `roundResults` × `totalRounds`
- `isLeader`: player with lowest `total` (ties: all tied players are leaders)

---

## No New Storage Keys

`GameState` (and its `roundResults` array) is already persisted under `@joker51/savedSession` via `useGameStore`. No new AsyncStorage keys are needed.
