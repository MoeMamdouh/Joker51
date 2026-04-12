# Feature Specification: Core Game Engine

**Feature Branch**: `001-core-game-engine`
**Created**: 2026-04-12
**Status**: Draft
**Input**: Phase 1 from `game_phases.md` + rules from `joker51_game_rules.md`

## Clarifications

### Session 2026-04-12

- Q: What does the engine return when an action is rejected (invalid meld, wrong turn, etc.)? → A: A typed result object `{ success: boolean, error?: string }` for every action — never throws exceptions for game-rule violations.
- Q: Who is responsible for advancing the turn to the next player? → A: The engine — it automatically advances turn order after a valid discard, keeping all game-rule logic self-contained.
- Q: How is randomness handled for shuffling? → A: Engine accepts an optional random function parameter; defaults to the platform's built-in random, enabling fully deterministic test scenarios via injection.
- Q: Does the engine mutate state in place or return a new state on each action? → A: Immutable — every action returns a new `GameState` snapshot; the previous state is never modified.
- Q: How does the engine signal round and game transitions in a multi-round game? → A: `GameState` includes a `status` field (`in_progress` / `round_ended` / `game_over`) — the caller reads it after each action to know when to start a new round or end the game.

## User Scenarios & Testing

### User Story 1 — Start a New Game Session (Priority: P1)

A host configures a game with 2–8 players. The engine creates the correct number of decks,
shuffles all cards together, deals exactly 14 cards to each player, and places the remaining
cards face-down as the draw pile with the top card flipped to start the discard pile.

**Why this priority**: Every other game action depends on a correctly initialized game state.
Without a valid deal, no other story can be tested.

**Independent Test**: Configure a 4-player game, trigger initialization, verify each player
has exactly 14 cards, draw pile has the correct remaining count, and discard pile has 1 card.

**Acceptance Scenarios**:

1. **Given** 4 players, **When** a game is initialized, **Then** each player holds exactly 14 cards,
   the draw pile has 54 − (4×14) − 1 = 1 card, and the discard pile has exactly 1 face-up card.
2. **Given** 6 players (requires 2 decks), **When** a game is initialized, **Then** all 108 cards
   are distributed correctly and players are notified that 2 decks are in use.
3. **Given** 2 players, **When** a game is initialized, **Then** 1 deck is used and deal succeeds.
4. **Given** a shuffled deck, **When** two consecutive initializations occur, **Then** card order
   differs between them (shuffle is non-deterministic).

---

### User Story 2 — Validate a Card Combination (Priority: P1)

Before placing cards on the table, the engine determines whether a group of cards forms a
valid sequence (run) or a valid set (group) according to the game rules.

**Why this priority**: Meld validation is the core rule-enforcement mechanism. Incorrect
validation breaks the game's integrity entirely.

**Independent Test**: Submit known valid and invalid combinations and verify correct
pass/fail results for each case listed in the acceptance scenarios.

**Acceptance Scenarios**:

1. **Given** `5♣ 6♣ 7♣`, **When** validated as a sequence, **Then** result is valid.
2. **Given** `5♣ 6♣ 7♦`, **When** validated as a sequence, **Then** result is invalid (mixed suits).
3. **Given** `9♠ 9♥ 9♦`, **When** validated as a set, **Then** result is valid.
4. **Given** `9♠ 9♠ 9♦`, **When** validated as a set, **Then** result is invalid (duplicate suit).
5. **Given** `A♠ 2♠ 3♠`, **When** validated as a sequence, **Then** result is valid (Ace low).
6. **Given** `Q♠ K♠ A♠`, **When** validated as a sequence, **Then** result is valid (Ace high).
7. **Given** `K♠ A♠ 2♠`, **When** validated as a sequence, **Then** result is invalid (no wrap-around).
8. **Given** `5♣ [Joker] 7♣`, **When** validated as a sequence, **Then** result is valid (Joker as 6♣).
9. **Given** `[Joker] [Joker] 7♣`, **When** validated as a sequence during initial meld,
   **Then** result is invalid (max 1 Joker per combination in opening meld).
10. **Given** a set of 5 cards of the same rank, **When** validated, **Then** result is invalid
    (sets are capped at 4 cards, one per suit).
11. **Given** a combination of only 2 cards, **When** validated, **Then** result is invalid
    (minimum 3 cards required).

---

### User Story 3 — Execute a Player Turn (Priority: P1)

A player takes their turn by drawing one card, optionally melding and/or adding cards to
existing table combinations, then discarding exactly one card to end the turn.

**Why this priority**: The turn is the atomic unit of gameplay. All game progression flows
through correctly enforced turns.

**Independent Test**: Simulate a full turn sequence for a player and verify state transitions
at each step (hand size changes correctly, draw pile shrinks, discard pile grows).

**Acceptance Scenarios**:

1. **Given** it is Player A's turn, **When** they draw from the draw pile, **Then** their hand
   increases by 1 card and the draw pile decreases by 1.
2. **Given** it is Player A's turn, **When** they draw the top card of the discard pile,
   **Then** their hand increases by 1 and the discard pile top card changes.
3. **Given** a player has not yet melded, **When** they attempt to add a card to a table
   combination, **Then** the action is rejected.
4. **Given** a player's first meld totals exactly 51 points across valid combinations,
   **When** they place it, **Then** the meld is accepted and the player is marked as having melded.
5. **Given** a player's first meld totals 50 points, **When** they attempt to place it,
   **Then** the meld is rejected (below 51-point threshold).
6. **Given** a player has already melded, **When** they add a card to an existing table
   sequence or set, **Then** the table combination updates and the card leaves the player's hand.
7. **Given** a player has drawn and optionally melded, **When** they discard one card,
   **Then** the card moves to the top of the discard pile and the turn passes to the next player.
8. **Given** a player attempts to end their turn without discarding, **Then** the action
   is rejected.

---

### User Story 4 — Claim a Joker from the Table (Priority: P2)

On their turn, a player who holds the real card that a Joker on the table is substituting
can claim that Joker by replacing it, provided the combination remains valid after the swap.

**Why this priority**: Joker claiming is a key strategic mechanic that changes hand composition
mid-game.

**Independent Test**: Place a Joker-containing combination on the table, then simulate a
player holding the real card attempting the claim; verify the Joker moves to the player's hand
and the table combination remains valid.

**Acceptance Scenarios**:

1. **Given** the table has `5♣ [Joker] 7♣` and a player holds `6♣`, **When** they claim the
   Joker, **Then** the table shows `5♣ 6♣ 7♣`, the Joker moves to the player's hand, and
   the combination remains valid (3 cards).
2. **Given** a player attempts to claim a Joker out of their turn, **Then** the action is rejected.
3. **Given** the table has `5♣ [Joker] 7♣` and the player holds `8♣` (not the substituted card),
   **When** they attempt to claim, **Then** the action is rejected (wrong real card).
4. **Given** a Joker claim would leave a combination with fewer than 3 cards, **Then** the
   claim is rejected.
5. **Given** a player claims a Joker, **When** they continue their turn, **Then** the claimed
   Joker can be used in a meld or lay-off in the same turn.

---

### User Story 5 — Handle Draw Pile Exhaustion (Priority: P2)

When a player needs to draw but the draw pile is empty, the discard pile is reshuffled into
a new draw pile. Any completed full sets (all 4 suits) and full sequences (A–K same suit)
currently on the table are cleared and added to the reshuffled pile.

**Why this priority**: Long games will hit this condition; failing to handle it correctly
causes the game to get stuck.

**Independent Test**: Exhaust the draw pile artificially, trigger a draw attempt, verify
the discard pile becomes the new draw pile and the table is cleared of qualifying combinations.

**Acceptance Scenarios**:

1. **Given** the draw pile is empty, **When** a player attempts to draw, **Then** the discard
   pile (minus its top card) is reshuffled into a new draw pile and the top card restarts
   the discard pile.
2. **Given** the table has a full set (`9♠ 9♥ 9♦ 9♣`) at reshuffle time, **Then** those 4
   cards are removed from the table and added to the reshuffled draw pile.
3. **Given** the table has a full A–K sequence of one suit at reshuffle time, **Then** those
   13 cards are removed from the table and added to the reshuffled draw pile.
4. **Given** a full set exists on the table but reshuffle has not yet occurred, **Then** the
   combination is NOT cleared (clearing only happens at reshuffle).

---

### User Story 6 — End a Round and Calculate Scores (Priority: P1)

A round ends when a player discards their last card. The engine calculates each player's
penalty score: 0 for the winner, a flat 100 for players who never melded, and the point
sum of remaining hand cards for players who melded but did not win.

**Why this priority**: Scoring is the ultimate measure of game progress. Incorrect scoring
undermines the entire game format.

**Independent Test**: Simulate a round end with known player hands and meld states; verify
each player receives the exact penalty described by the rules.

**Acceptance Scenarios**:

1. **Given** Player A discards their last card, **When** the round ends, **Then** Player A's
   round score is 0.
2. **Given** Player B melded but holds `K♥ 7♦ A♠` at round end, **When** scored, **Then**
   Player B's penalty is 10 + 7 + 11 = 28 points.
3. **Given** Player C never melded and holds any cards, **When** scored, **Then** Player C's
   penalty is a flat 100 points regardless of hand content.
4. **Given** a Joker remains in a player's hand, **When** scored, **Then** it counts as
   25 points.
5. **Given** a player attempts to win by melding all cards with nothing left to discard,
   **Then** the win condition is NOT triggered (must discard last card).

---

### Edge Cases

- What happens when only 1 card remains in the draw pile and a player draws it?
  → Draw pile becomes empty; next draw triggers reshuffle.
- What happens if the discard pile also has only 1 card when reshuffle is needed?
  → The single card remains as the new discard pile top; draw pile starts empty and the
  next reshuffle will be triggered again immediately.
- Can a player place an initial meld using a combination that includes a Joker and meets 51 pts
  only because of the Joker's positional value?
  → Yes — the Joker contributes the value of the card it substitutes, not its penalty value (25).
- What if all combinations on the table are full sets/sequences at reshuffle time?
  → All are cleared; the new draw pile may be large.
- Can a set contain a Joker?
  → Yes — a Joker can substitute a missing suit in a set, subject to the 1-Joker-per-combination
  rule during the initial meld.

---

## Requirements

### Functional Requirements

- **FR-001**: The engine MUST create a deck of exactly 54 cards (52 standard + 2 Jokers) per deck
  unit, scaling to 2 or 3 decks based on player count (≤4 players: 1 deck, ≤6: 2 decks, ≤8: 3 decks).
- **FR-002**: The engine MUST shuffle the combined deck randomly before each game.
- **FR-003**: The engine MUST deal exactly 14 cards to each player from the shuffled deck.
- **FR-004**: The engine MUST place the remaining cards face-down as the draw pile and flip
  the top card to start the discard pile.
- **FR-005**: The engine MUST validate sequences: same suit, consecutive ranks, minimum 3 cards,
  no maximum length, with Ace valid only at low (A-2-3) or high (Q-K-A) positions.
- **FR-006**: The engine MUST validate sets: same rank, no duplicate suits, minimum 3 cards,
  maximum 4 cards.
- **FR-007**: The engine MUST allow a Joker to substitute any single card in a combination,
  with a maximum of 1 Joker per combination during the initial meld.
- **FR-008**: The engine MUST enforce the initial meld threshold: the sum of card values across
  all combinations placed in a single opening turn MUST be ≥ 51 points. A Joker's value in
  this calculation is the value of the card it substitutes.
- **FR-009**: The engine MUST enforce turn order: draw → (optional meld/add/Joker-claim) → discard.
  A turn MUST NOT end without a discard.
- **FR-010**: The engine MUST prevent a player who has not yet melded from adding cards to
  table combinations.
- **FR-011**: The engine MUST enforce Joker claim rules: on own turn only, player must hold
  the real card, the combination must remain valid (≥ 3 cards) after the swap.
- **FR-012**: The engine MUST handle draw pile exhaustion by reshuffling the discard pile
  (minus the current top card) into a new draw pile, clearing full sets and full A–K sequences
  from the table into the shuffle.
- **FR-013**: The engine MUST detect the win condition: a player discards their last card.
  Melding all cards without a final discard MUST NOT trigger a win.
- **FR-014**: The engine MUST calculate end-of-round scores: 0 for the winner, flat 100 for
  players who never melded, sum of remaining hand values for all others (number cards at face
  value, J/Q/K at 10, Ace at 11, Joker at 25).
- **FR-017**: `GameState` MUST include a `status` field with three possible values:
  `in_progress` (round ongoing), `round_ended` (a player has won the round — scores computed),
  and `game_over` (all rounds complete — final winner determinable from cumulative scores).
  The caller uses this field to drive round and game transitions; the engine does not call
  back or emit events.
- **FR-016**: After a valid discard, the engine MUST automatically advance the active player
  to the next player in deal order (circular). The updated `GameState` MUST reflect the new
  active player so the caller needs no knowledge of turn-order logic.
- **FR-015**: Every engine action function MUST return a typed result object
  `{ success: boolean, error?: string }`. Game-rule violations MUST be communicated via
  `success: false` with a human-readable `error` string — the engine MUST NOT throw exceptions
  for invalid game actions. Exceptions are reserved for programming errors (e.g., null input).

### Key Entities

- **Card**: Identified by rank (2–10, J, Q, K, A) and suit (♠ ♥ ♦ ♣), or as a Joker.
  Has a point value used for scoring and meld threshold calculation.
- **Deck**: An ordered collection of cards. Multiple decks combine into one shuffled pool.
- **Hand**: The private set of cards held by a single player.
- **Combination**: An ordered group of 3+ cards forming a valid sequence or set.
  May contain at most one Joker.
- **TableState**: All combinations currently melded and visible on the table, grouped by player.
- **TurnState**: The current phase of the active player's turn (drawing, acting, discarding).
  The engine advances the active player automatically after each completed turn.
- **RoundResult**: Per-player penalty scores computed at the end of a round.
- **GameState**: An immutable snapshot of a game at any point: all hands, draw pile, discard
  pile, table state, turn state, meld flags, round results, and a `status` field
  (`in_progress` | `round_ended` | `game_over`). The engine never mutates an existing
  `GameState`; every action produces a new snapshot. The caller uses `status` to orchestrate
  round progression and game termination.
- **ActionResult**: The return type of every engine action —
  `{ success: boolean, state?: GameState, error?: string }`.
  On success, `state` contains the new immutable `GameState` snapshot. On failure, `state` is
  absent and `error` contains a human-readable reason suitable for display.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: All 14 edge cases listed in `joker51_game_rules.md` Section 15 produce the
  correct outcome when tested against the engine — 100% pass rate.
- **SC-002**: Every acceptance scenario in this spec produces the correct result — 100% pass rate.
- **SC-003**: Game state remains internally consistent (no cards duplicated or lost) across
  1,000 simulated random turns without a single integrity violation.
- **SC-004**: A complete 4-player round can be simulated from deal to win condition in
  under 50 milliseconds on a mid-range mobile device.
- **SC-005**: Combination validation produces a result (valid or invalid) in under 5 milliseconds
  regardless of the number of cards submitted.

---

## Assumptions

- The engine is a self-contained logic module with no user interface or network dependency;
  it will be consumed by the UI layer via a defined state interface.
- The engine accepts an optional random function `() => number` (returning a value in [0, 1))
  as a parameter to its initialization function. When provided, this function is used for all
  shuffling operations, enabling fully deterministic test scenarios. When omitted, the engine
  defaults to the platform's built-in random source.
- Multi-deck games use identical card sets; the engine distinguishes cards by suit and rank only,
  not by which physical deck they originated from — duplicate cards across decks are intentional.
- The engine does not handle player AI or network synchronization; it operates on local state
  only. Multiplayer networking is a separate concern.
- A "Joker's substituted value" for the 51-point meld threshold calculation is determined by
  the position the Joker occupies in the combination (e.g., Joker as 6♣ in `5♣ [J] 7♣` = 6 pts).
