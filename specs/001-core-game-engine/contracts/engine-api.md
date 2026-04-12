# Engine API Contract

**Module**: `src/engine/index.ts`
**Feature**: `specs/001-core-game-engine/`
**Date**: 2026-04-12

All functions are pure — given the same inputs, they always produce the same outputs.
None have side effects. All return `ActionResult` (see data-model.md).

---

## Initialization

### `initGame(config: GameConfig): GameState`
Creates a new game state. Deals 14 cards to each player, builds the draw pile, flips the
top card to the discard pile. Uses `config.random` for shuffling if provided.

- Throws (programming error) if `config.players.length < 2` or `> 8`
- Throws (programming error) if `config.totalRounds` is not 4, 8, or 12
- Returns `GameState` with `status: "in_progress"`, `currentRound: 1`

---

## Turn Actions

All turn actions accept the current `GameState` and return `ActionResult`.
On success, `ActionResult.state` is the next immutable snapshot.

### `draw(state: GameState, params: { playerId: string; source: "draw_pile" | "discard_pile" }): ActionResult`
Player draws one card. Triggers reshuffle if draw pile is empty.

**Rejects with**:
- `NOT_YOUR_TURN` — `playerId` is not the active player
- `WRONG_TURN_PHASE` — current phase is not `"drawing"`

**On success**: `TurnPhase` advances to `"acting"`.

---

### `placeInitialMeld(state: GameState, params: { playerId: string; combinations: Card[][] }): ActionResult`
Player places their opening meld. Each inner array is one combination.

**Rejects with**:
- `NOT_YOUR_TURN`
- `WRONG_TURN_PHASE` — phase is not `"acting"`
- `INVALID_COMBINATION` — any submitted combination is not a valid sequence or set
- `COMBINATION_TOO_SHORT` — any combination has fewer than 3 cards
- `JOKER_LIMIT_EXCEEDED` — any combination contains more than 1 Joker
- `MELD_BELOW_51_POINTS` — total point value across all combinations < 51
- `CARD_NOT_IN_HAND` — any submitted card is not in the player's hand

**On success**: Cards move from hand to table; player added to `meldedPlayerIds`.

---

### `layOff(state: GameState, params: { playerId: string; combinationId: string; card: Card; position?: "start" | "end" }): ActionResult`
Player adds one card from hand to an existing table combination.

**Rejects with**:
- `NOT_YOUR_TURN`
- `WRONG_TURN_PHASE`
- `PLAYER_NOT_YET_MELDED`
- `CARD_NOT_IN_HAND`
- `COMBINATION_NOT_ON_TABLE`
- `INVALID_COMBINATION` — adding the card would make the combination invalid

**On success**: Card moves from hand to the specified combination.

---

### `claimJoker(state: GameState, params: { playerId: string; combinationId: string; realCard: Card }): ActionResult`
Player replaces a Joker in a table combination with the real card they hold.

**Rejects with**:
- `NOT_YOUR_TURN`
- `WRONG_TURN_PHASE`
- `PLAYER_NOT_YET_MELDED`
- `JOKER_CLAIM_NOT_YOUR_TURN`
- `COMBINATION_NOT_ON_TABLE`
- `JOKER_CLAIM_WRONG_CARD` — `realCard` does not match the Joker's substituted position
- `JOKER_CLAIM_BREAKS_COMBINATION` — combination would have fewer than 3 cards after swap
- `CARD_NOT_IN_HAND`

**On success**: Joker moves from table to player's hand; `realCard` moves from hand to table.

---

### `discard(state: GameState, params: { playerId: string; card: Card }): ActionResult`
Player discards one card to end their turn.

**Rejects with**:
- `NOT_YOUR_TURN`
- `WRONG_TURN_PHASE` — phase is not `"acting"`
- `CARD_NOT_IN_HAND`
- `DISCARD_REQUIRED_TO_WIN` — player has no cards left in hand after discarding this card
  but has not yet melded (cannot win without having melded)

**On success**:
- Card moves to top of discard pile
- If player's hand is now empty → `status: "round_ended"`, `RoundResult` appended
- If `currentRound === config.totalRounds` → `status: "game_over"`
- Otherwise → `TurnPhase` resets to `"drawing"`, `activePlayerId` advances to next player

---

## Round Progression

### `startNextRound(state: GameState): GameState`
Starts the next round. Redeals from a fresh shuffled deck.

- Throws (programming error) if `state.status !== "round_ended"`
- Throws (programming error) if `state.currentRound >= state.config.totalRounds`
- Returns new `GameState` with `status: "in_progress"`, `currentRound: N+1`,
  empty `tableState`, cleared `meldedPlayerIds`, fresh deal

---

## Validation Utilities (exported for UI pre-validation)

### `validateCombination(cards: Card[], context: { isInitialMeld: boolean }): { valid: boolean; error?: EngineErrorCode }`
Validates a combination without modifying state. Useful for real-time UI feedback
(e.g., highlighting invalid card selections before the player submits).

### `calculateMeldPoints(combinations: Card[][]): number`
Returns the total point value of a set of combinations. Joker value is its substituted
rank value. Used by the UI to show the running point total as the player selects cards.
