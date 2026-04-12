# Feature Specification: Round End & Scoring Screen

**Feature Branch**: `006-round-end-scoring`
**Created**: 2026-04-13
**Status**: Draft
**Input**: Phase 5 — Round End & Scoring Screen. Summarize each round and track progress across the full game.

## Clarifications

### Session 2026-04-13

- Q: How is the running scoreboard accessed during an active game round? → A: On-demand modal — a dedicated scoreboard button on the game board opens a modal/overlay; not permanently embedded in the layout.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Round Summary After Each Round (Priority: P1)

After a round ends (a player discards their last card), all players see a summary screen showing: who won the round, each player's penalty score for that round with a breakdown (no-meld flat penalty vs. hand card values), and the running total for each player. A "Start Next Round" action advances the game.

**Why this priority**: Without this screen, players have no way to know their scores between rounds. It is the minimum viable feedback loop for a multi-round game.

**Independent Test**: Simulate a 2-player round where Player 1 wins (empty hand) and Player 2 has cards remaining (e.g., `K♥ 7♦ Joker`). The round summary must show Player 2's penalty as `10 + 7 + 25 = 42` and Player 1's penalty as `0`. Cumulative totals update correctly.

**Acceptance Scenarios**:

1. **Given** a round just ended with a winner, **When** the round summary screen appears, **Then** it shows the round winner's name, each player's round penalty (0 for the winner), and each player's cumulative total score to date.
2. **Given** a player who never melded this round (held all cards), **When** the round summary shows their score, **Then** their penalty is the flat **100-point** penalty regardless of hand contents.
3. **Given** a player who melded but did not win, **When** the round summary shows their score, **Then** their penalty equals the sum of card values in their remaining hand (number cards at face value; J/Q/K = 10; Ace = 11; Joker = 25).
4. **Given** the winner has discarded their last card, **When** the round summary appears, **Then** the winner's round penalty is **0**.
5. **Given** the round summary is displayed, **When** all players tap / confirm "Start Next Round", **Then** a new round begins with a fresh deal.

---

### User Story 2 — Running Scoreboard Across Rounds (Priority: P1)

During any round, a player can tap a scoreboard button on the game board to open a score overlay showing cumulative scores from all completed rounds. Lower score is better.

**Why this priority**: Parallel to US1 — players need to track standings across rounds to make strategic decisions. Shares the same data as the round summary.

**Independent Test**: After 2 completed rounds, the scoreboard shows each player's per-round scores and the correct running total (sum of all rounds played).

**Acceptance Scenarios**:

1. **Given** at least one round has been completed, **When** a player views the scoreboard, **Then** it shows each player's score per round (with completed rounds filled in and future rounds blank) and the current cumulative total.
2. **Given** multiple rounds completed, **When** a player views the scoreboard, **Then** the player with the lowest cumulative total is visually distinguished (leading indicator).
3. **Given** a game with 4 rounds (Short format), **When** the scoreboard is viewed mid-game after 2 rounds, **Then** rounds 3 and 4 columns are empty/pending.

---

### User Story 3 — Final Game Over & Winner Announcement (Priority: P2)

After the last round ends, players see a final results screen showing all round scores, the grand total for each player, and a clear declaration of the game winner (lowest total score).

**Why this priority**: Completes the game loop. Without this, players cannot formally conclude a game or know who won overall. Lower priority than round summary because the game can function round-by-round without a formal game-over screen.

**Independent Test**: In a Short (4-round) game, after round 4 ends, the final screen appears with grand totals and declares the player with the lowest total score as the winner.

**Acceptance Scenarios**:

1. **Given** the final round has ended, **When** the game over screen appears, **Then** it shows every player's score for each individual round, their grand total, and the overall game winner (lowest total).
2. **Given** two players are tied on the lowest score at game end, **When** the game over screen appears, **Then** both players are declared joint winners.
3. **Given** the game over screen is displayed, **When** a player taps "New Game", **Then** the app returns to the setup screen and all game state is cleared.
4. **Given** the game over screen is displayed, **When** a player taps "Play Again" (same players and format), **Then** a new game starts immediately with the same player names and round format.

---

### Edge Cases

- What happens when all players tie the same score in a round? All receive the same penalty; no winner distinction is needed for scoring purposes.
- What happens if the draw pile is exhausted and no player can win? The round continues under existing reshuffle rules; the round end screen only appears when a player discards their last card.
- How are scores displayed when a player has accumulated over 100 points? Scores have no cap; display must handle triple-digit values without truncation.
- What if a player has a 0-card hand but has melded — do they win automatically? No — per game rules §12, a player must discard their last card to win; they cannot meld out entirely.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a round summary screen immediately after a round winner discards their last card, before the next round begins.
- **FR-002**: The round summary MUST show each player's name, their round penalty score, and their cumulative total after this round.
- **FR-003**: The round penalty for a player who never melded MUST be exactly 100 points, regardless of cards held.
- **FR-004**: The round penalty for a player who melded but did not win MUST equal the sum of their remaining hand cards using the values: number cards = face value (2–10), J/Q/K = 10, Ace = 11, Joker = 25.
- **FR-005**: The round winner's penalty MUST be 0.
- **FR-006**: The round summary MUST display a "Start Next Round" control that advances the game when activated.
- **FR-007**: System MUST maintain a cumulative score per player across all rounds of a game.
- **FR-008**: The cumulative scoreboard MUST be accessible during gameplay via a dedicated scoreboard button on the game board that opens an on-demand modal/overlay view; it is not permanently embedded in the game board layout.
- **FR-009**: After the final round (as determined by the selected game format: 4, 8, or 12 rounds), the system MUST display a game over screen instead of starting a new round.
- **FR-010**: The game over screen MUST display each player's per-round scores, their grand total, and declare the player with the lowest grand total as the winner.
- **FR-011**: In the event of a tie for the lowest grand total, all tied players MUST be declared joint winners.
- **FR-012**: The game over screen MUST offer a "New Game" action that returns to the setup screen with all state cleared.
- **FR-013**: The game over screen MUST offer a "Play Again" action that starts a new game with the same player names and round format.
- **FR-014**: All score displays MUST correctly render values up to at least 999 without truncation.

### Key Entities

- **RoundResult**: Represents one player's outcome for one round — player ID, round number, penalty score, breakdown (no-meld flag OR list of remaining card values), cumulative total at that point.
- **GameResult**: Aggregate across all rounds — per-player grand total, winner(s) identified.
- **ScoreBreakdown**: Detail within a RoundResult — flag for no-meld flat penalty vs. itemised card list for melded-but-lost players.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The round summary screen appears within 1 second of the winning discard being confirmed, with no manual navigation required.
- **SC-002**: 100% of penalty calculations match the rules in §13 of the game specification across all tested scenarios (no-meld, melded-lost, winner).
- **SC-003**: Players can identify the current leader (lowest cumulative score) at a glance without counting or arithmetic — the scoreboard must make standings immediately readable.
- **SC-004**: The full round summary (all players' scores + cumulative totals) is visible on a single screen without scrolling for games with up to 8 players.
- **SC-005**: After the final round, the game over screen correctly identifies the winner in 100% of tested cases, including tie scenarios.
- **SC-006**: "New Game" and "Play Again" actions complete the transition to the next state (setup screen or new game start) within 2 seconds.

---

## Assumptions

- Round end is already detected by the engine (when a player discards their last card); this feature consumes that event — it does not reimplement win detection.
- The game format (4 / 8 / 12 rounds) is set at game start and does not change mid-game.
- The cumulative scoreboard shown during play is the same data model as the round summary — no separate data structure is needed.
- Player names are fixed for the duration of a game (set at setup, not editable mid-game).
- The "Start Next Round" action requires all players to confirm on a shared device (pass-and-play) — a single tap from whoever is holding the device is sufficient to advance.
- Saved session (AsyncStorage) already persists `roundResults` in `GameState`; this feature reads from that existing structure.
