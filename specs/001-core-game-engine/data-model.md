# Data Model: Core Game Engine

**Feature**: `specs/001-core-game-engine/`
**Date**: 2026-04-12

---

## Enumerations

### Suit
```
SPADES | HEARTS | DIAMONDS | CLUBS
```

### Rank
```
TWO | THREE | FOUR | FIVE | SIX | SEVEN | EIGHT | NINE | TEN
JACK | QUEEN | KING | ACE
```
Point values: TWO=2, THREE=3, ..., TEN=10, JACK=10, QUEEN=10, KING=10, ACE=11

### GameStatus
```
in_progress   — round is ongoing
round_ended   — a player won; RoundResult populated; caller may start next round
game_over     — all rounds complete; cumulative scores final
```

### TurnPhase
```
drawing   — player must draw (hasn't drawn yet)
acting    — player has drawn; may meld, lay off, claim Jokers (optional)
discarding — player must discard to end turn
```

### EngineErrorCode
All possible rejection codes returned in `ActionResult.error`:

| Code | Trigger |
|---|---|
| `NOT_YOUR_TURN` | Action attempted by a player who is not the active player |
| `WRONG_TURN_PHASE` | Action not allowed in the current `TurnPhase` (e.g., discard before drawing) |
| `INVALID_COMBINATION` | Cards do not form a valid sequence or set |
| `COMBINATION_TOO_SHORT` | Fewer than 3 cards submitted |
| `SET_TOO_LONG` | Set has more than 4 cards |
| `SET_DUPLICATE_SUIT` | Two cards of the same suit in a set |
| `SEQUENCE_MIXED_SUITS` | Cards in sequence are not all the same suit |
| `SEQUENCE_NOT_CONSECUTIVE` | Cards in sequence are not consecutive in rank |
| `ACE_WRAPAROUND` | Sequence attempts K-A-2 wrap-around |
| `JOKER_LIMIT_EXCEEDED` | More than 1 Joker in a combination during initial meld |
| `MELD_BELOW_51_POINTS` | Initial meld combinations total fewer than 51 points |
| `PLAYER_NOT_YET_MELDED` | Player attempts lay-off before completing initial meld |
| `JOKER_CLAIM_NOT_YOUR_TURN` | Joker claim attempted out of turn |
| `JOKER_CLAIM_WRONG_CARD` | Player does not hold the real card the Joker substitutes |
| `JOKER_CLAIM_BREAKS_COMBINATION` | Swap would leave combination with fewer than 3 cards |
| `DISCARD_REQUIRED_TO_WIN` | Player tries to win by melding all cards without discarding |
| `CARD_NOT_IN_HAND` | Player references a card they do not hold |
| `COMBINATION_NOT_ON_TABLE` | Lay-off or Joker claim targets a combination that doesn't exist |

---

## Entities

### Card
```
{
  rank: Rank
  suit: Suit | null   // null = Joker
  isJoker: boolean
}
```
- Identity: `(rank, suit)` pair, or `isJoker: true` (Jokers have no rank/suit)
- Point value: derived from `rank` per the scoring table; Joker = 25 when scoring hand remainder

### Combination
```
{
  id: string              // UUID, assigned at placement time
  cards: Card[]           // ordered; Joker may appear at any position
  type: "sequence" | "set"
  ownerId: string         // player who placed the initial meld containing this combination
}
```
- Validation rules enforced at placement time (see EngineErrorCode)
- A combination may be extended by any player after the owner has melded
- Joker position within `cards` determines its substituted rank for scoring

### Hand
```
{
  playerId: string
  cards: Card[]
}
```
- Cards are unordered within a hand (order is a UI concern)
- Size decreases on meld/lay-off/discard; increases on draw/Joker claim

### DrawPile
```
{
  cards: Card[]   // cards[0] is the top (next card to be drawn)
}
```

### DiscardPile
```
{
  cards: Card[]   // cards[0] is the top (most recently discarded / visible)
}
```
- Only `cards[0]` may be drawn by a player

### TableState
```
{
  combinations: Combination[]
}
```
- Combinations are never removed mid-round (except at reshuffle for full sets/sequences)

### TurnState
```
{
  activePlayerId: string
  phase: TurnPhase
}
```
- `phase` transitions: `drawing` → `acting` (after draw) → `drawing` (after discard)
- Engine advances `activePlayerId` automatically after a valid discard

### RoundResult
```
{
  roundNumber: number
  scores: { playerId: string; penalty: number }[]
  winnerId: string
}
```
- `penalty` = 0 for winner, 100 for players who never melded, hand sum for others

### PlayerConfig
```
{
  id: string
  name: string
}
```
- Supplied by the caller at `initGame()`; engine does not generate player IDs

### GameConfig
```
{
  players: PlayerConfig[]       // 2–8 players
  totalRounds: number           // 4 | 8 | 12
  random?: () => number         // optional injected RNG; defaults to Math.random
}
```

### GameState *(immutable snapshot)*
```
{
  config: GameConfig
  status: GameStatus
  currentRound: number
  hands: Hand[]
  drawPile: DrawPile
  discardPile: DiscardPile
  tableState: TableState
  turnState: TurnState
  meldedPlayerIds: string[]     // players who have completed initial meld
  roundResults: RoundResult[]   // one entry per completed round
  deckCount: number             // 1 | 2 | 3 — shown to players when > 1
}
```
- Never mutated; every action returns a new `GameState`
- `status: "round_ended"` means `roundResults` has a new entry for `currentRound`
- `status: "game_over"` means all `totalRounds` are complete

### ActionResult
```
{
  success: boolean
  state?: GameState         // present on success; absent on failure
  error?: EngineErrorCode   // present on failure; absent on success
}
```

---

## State Transitions

### Game Lifecycle
```
initGame(config) → GameState { status: "in_progress", currentRound: 1 }

[play turns until a player discards their last card]
→ GameState { status: "round_ended", roundResults: [...] }

startNextRound(state) → GameState { status: "in_progress", currentRound: N+1 }
  (called by caller when status === "round_ended" AND currentRound < totalRounds)

[final round ends]
→ GameState { status: "game_over", roundResults: [all rounds] }
```

### Turn Lifecycle
```
TurnPhase: drawing
  → draw(state, { source: "draw_pile" | "discard_pile" })
  → ActionResult { state: { turnPhase: "acting" } }

TurnPhase: acting (all optional, any order)
  → placeInitialMeld(state, { combinations })  // only if not yet melded
  → layOff(state, { combinationId, card })
  → claimJoker(state, { combinationId, realCard })

TurnPhase: acting
  → discard(state, { card })
  → ActionResult { state: { turnPhase: "drawing", activePlayerId: nextPlayer } }
    OR { state: { status: "round_ended" } }  // if last card discarded
```

### Reshuffle Trigger
```
draw() called when drawPile.cards.length === 0
  → engine scans tableState for full sets (4 suits same rank)
     and full sequences (A→K same suit, 13 cards)
  → removes qualifying combinations from tableState
  → combines discard pile (minus top card) + cleared combination cards
  → Fisher-Yates shuffle
  → new drawPile; discardPile retains only the preserved top card
  → then executes the draw
```

---

## Deck Scaling

| Players | Decks | Total Cards | Draw pile (after deal + 1 discard) |
|---------|-------|-------------|-------------------------------------|
| 2       | 1     | 54          | 54 − 28 − 1 = 25                    |
| 3       | 1     | 54          | 54 − 42 − 1 = 11                    |
| 4       | 2     | 108         | 108 − 56 − 1 = 51                   |
| 5       | 2     | 108         | 108 − 70 − 1 = 37                   |
| 6       | 2     | 108         | 108 − 84 − 1 = 23                   |
| 7       | 3     | 162         | 162 − 98 − 1 = 63                   |
| 8       | 3     | 162         | 162 − 112 − 1 = 49                  |

Minimum cards required: (players × 14) + 10. All deck counts satisfy this formula.
When `deckCount > 1`, `GameState.deckCount` signals the UI to notify players.
