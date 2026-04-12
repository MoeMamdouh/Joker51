# Feature Specification: Game Board Screen

**Feature Branch**: `003-game-board-screen`
**Created**: 2026-04-12
**Status**: Draft

## User Scenarios & Testing

### User Story 1 — View Hand and Draw a Card (Priority: P1)

The active player sees their hand of cards and the game state (draw pile, discard pile top card, table combinations). They draw a card from the draw pile or pick up the discard pile's top card to begin their turn.

**Why this priority**: Drawing is the first action of every turn — nothing else is playable until a card has been drawn. This is the entry point to all gameplay.

**Independent Test**: Launch a game with 2 players → active player's hand is visible → player taps draw pile → a card is added to their hand → turn phase advances to ACTING.

**Acceptance Scenarios**:

1. **Given** it is my turn and phase is DRAWING, **When** I tap the draw pile, **Then** one card is added to my hand and the phase changes to ACTING.
2. **Given** it is my turn and phase is DRAWING, **When** I tap the top card of the discard pile, **Then** that card moves to my hand and the phase changes to ACTING.
3. **Given** it is NOT my turn, **When** I view the board, **Then** draw/discard actions are disabled and an indicator shows whose turn it is.
4. **Given** the draw pile is empty, **When** I would draw, **Then** the discard pile is reshuffled into a new draw pile automatically.

---

### User Story 2 — Place Initial Meld (Priority: P1)

After drawing, the active player selects cards from their hand to place as their first meld on the table (must total ≥ 51 points). Once melded, they join the table and can lay off on future turns.

**Why this priority**: The meld is the core scoring mechanic — a player cannot lay off or win without first melding. P1 alongside drawing.

**Independent Test**: Active player draws → selects 3+ cards worth ≥ 51 points → taps "Meld" → cards move from hand to table → player is marked as melded.

**Acceptance Scenarios**:

1. **Given** I have not yet melded and phase is ACTING, **When** I select valid cards (≥ 51 pts) and tap Meld, **Then** the cards appear on the table under my name and I am marked as melded.
2. **Given** I select cards worth < 51 points, **When** I tap Meld, **Then** an error message is shown and no cards are moved.
3. **Given** I select cards that do not form a valid sequence or set, **When** I tap Meld, **Then** an error is shown describing the invalid combination.
4. **Given** I have already melded this game, **When** I view the board, **Then** the Meld button is not shown for my turn.

---

### User Story 3 — Lay Off Cards (Priority: P2)

After placing an initial meld, the active player may extend existing combinations on the table by laying off matching cards from their hand.

**Why this priority**: Lay-off is the primary way to shed cards after the initial meld. P2 because it requires US2 (initial meld) to be useful.

**Independent Test**: Player who has melded draws → selects a card → taps a combination on the table → card is added to that combination and removed from hand.

**Acceptance Scenarios**:

1. **Given** I have melded and phase is ACTING, **When** I select a card from my hand and tap a valid combination on the table, **Then** the card is appended to that combination and removed from my hand.
2. **Given** I try to lay off a card that does not fit a combination, **Then** an error is shown and no cards are moved.
3. **Given** I have not yet melded, **When** I view the table, **Then** existing combinations are visible but tapping them does not trigger lay-off.

---

### User Story 4 — Discard and End Turn (Priority: P1)

The active player selects one card from their hand to discard, ending their turn and passing play to the next player. If their hand is now empty, they win the round.

**Why this priority**: Every turn must end with a discard (except when winning by emptying hand). P1 — required to advance the game.

**Independent Test**: Active player in ACTING phase selects a card → taps Discard → card moves to discard pile top → next player becomes active.

**Acceptance Scenarios**:

1. **Given** phase is ACTING, **When** I select a card and tap Discard, **Then** the card moves to the discard pile, the next player becomes active, and phase resets to DRAWING.
2. **Given** discarding empties my hand, **Then** the round ends, round scores are calculated, and the round summary is displayed.
3. **Given** phase is DRAWING (I have not drawn yet), **When** I try to discard, **Then** the Discard button is disabled.

---

### User Story 5 — Claim a Joker (Priority: P2)

If a Joker in a table combination can be replaced by the natural card it represents, the active player may claim that Joker into their hand — provided they supply the replacement card.

**Why this priority**: An advanced but frequent play. P2 because it requires US2 (combinations on table).

**Independent Test**: A Joker sits in a combination on the table → active player has the natural card it stands in for → player taps "Claim Joker" on that combination → Joker moves to player's hand, natural card takes its place.

**Acceptance Scenarios**:

1. **Given** a Joker is in a table combination and I hold the card it represents, **When** I tap "Claim Joker" on that combination, **Then** the Joker moves to my hand and the natural card fills its slot.
2. **Given** claiming the Joker would break the combination's validity, **Then** the claim is rejected with an error.
3. **Given** it is not my turn, **Then** claim Joker is not available.

---

### User Story 6 — Round End and Score Summary (Priority: P1)

When a round ends (a player empties their hand), all players' remaining cards are scored as penalties. A round summary screen shows each player's penalty points and the cumulative score. Play continues to the next round or the game ends.

**Why this priority**: Required to make the game complete — without scores the game has no outcome.

**Independent Test**: Player discards their last card → round-end summary appears showing all player penalties → "Next Round" button starts a new round deal OR "Game Over" shows final standings.

**Acceptance Scenarios**:

1. **Given** a player empties their hand by discarding, **Then** a round summary is shown with each player's penalty for remaining cards.
2. **Given** more rounds remain (currentRound < totalRounds), **When** I tap "Next Round", **Then** a new round is dealt and play resumes.
3. **Given** the final round just ended, **Then** the summary shows final cumulative standings and a "Play Again" / "New Game" option.
4. **Given** a round ends, **Then** the player(s) with the fewest penalty points in that round are highlighted as round winner(s); when multiple players tie, all tied players are highlighted equally as co-winners.

---

### Edge Cases

- What happens when a player's draw pile is exhausted mid-game? → Discard pile is reshuffled automatically (engine handles this).
- How are Jokers displayed in the hand vs on the table? → Distinct visual (wildcard indicator).
- What if a player has only one card left and it is a Joker? → They must discard the Joker; penalty is 25 pts.
- How are multi-deck duplicate cards distinguished visually? → Cards are identical in appearance; no distinction needed for gameplay.
- What happens if the network drops during a turn? → Out of scope for Phase 3 (offline single-device game only).
- What if two or more players tie for fewest penalties in a round? → All tied players are highlighted equally as co-winners; no tiebreaker logic is applied.

## Requirements

### Functional Requirements

- **FR-001**: The board MUST show the active player's full hand of cards at all times during their turn.
- **FR-002**: The board MUST indicate whose turn it is with the active player's name prominently displayed.
- **FR-003**: During the DRAWING phase, players MUST be able to draw from the draw pile (shows card count).
- **FR-004**: During the DRAWING phase, players MUST be able to pick up the top card of the discard pile (top card visible).
- **FR-005**: During the ACTING phase, players MUST be able to select one or more cards from their hand.
- **FR-006**: During the ACTING phase, unmelded players MUST be able to place selected cards as an initial meld.
- **FR-007**: The board MUST validate meld attempts and display a descriptive error when invalid (< 51 pts, invalid combination type).
- **FR-008**: During the ACTING phase, melded players MUST be able to lay off selected cards onto existing table combinations.
- **FR-009**: During the ACTING phase, players MUST be able to select one card and discard it to end their turn.
- **FR-010**: The board MUST display all table combinations visible to all players at all times.
- **FR-011**: The board MUST show the top card of the discard pile face-up.
- **FR-012**: The board MUST show the draw pile as a face-down stack with a card count badge.
- **FR-013**: Players MUST be able to claim a Joker from a table combination when holding the replacement card.
- **FR-014**: When a round ends, the board MUST transition to a round summary showing each player's penalty points.
- **FR-015**: The round summary MUST show cumulative scores across all completed rounds.
- **FR-016**: From the round summary, players MUST be able to start the next round (if rounds remain) or return to setup (if game over).
- **FR-017**: All engine error codes MUST be mapped to human-readable, translated error messages.
- **FR-018**: Non-active players' hand sizes (card count only, not card faces) MUST be visible to the active player.
- **FR-021**: The board MUST display a compact scoreboard row showing every player's current cumulative score at all times during play (not only in the round summary).
- **FR-019**: The board MUST persist the current game state to storage after every action so resuming is possible.
- **FR-020**: The board layout MUST support RTL display when Arabic language is active.

### Key Entities

- **GameState**: The full game snapshot — hands, draw pile, discard pile, table combinations, turn state, round results, meld status.
- **Card**: A playing card with rank, suit, and isJoker flag. Displayed as a visual tile.
- **Combination**: A set or sequence of cards on the table, owned by a player. Expandable via lay-off.
- **TurnState**: Tracks the active player ID and current phase (DRAWING / ACTING).
- **RoundResult**: Penalty scores per player for one completed round.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A complete 2-player game round (deal → draw → meld → discard until winner) can be played end-to-end without errors.
- **SC-002**: All engine error codes surface as readable messages — zero untranslated error strings visible to players.
- **SC-003**: Board re-renders after every action within 300 ms on a mid-range device.
- **SC-004**: Round summary appears within 500 ms of the winning discard.
- **SC-005**: Game state is persisted after every action — relaunching the app resumes the exact game state.
- **SC-006**: All board text and layout correctly mirrors in RTL when Arabic is selected.

## Assumptions

- This is a single-device, pass-and-play game — no network multiplayer in Phase 3.
- Card graphics use text-based representations (rank + suit symbol) styled with tokens; a dedicated card art phase is out of scope.
- The engine is already complete and tested (Phase 1); the board is purely a UI layer over engine actions.
- Only the active player's own hand is shown face-up; other players' cards are shown as a count only (face-down).
- The game board route is `/game`; the setup screen route is `/`  (via `(tabs)/index`).
- Persisting game state to AsyncStorage key `@joker51/savedSession` is already defined in Phase 2.

## Clarifications

### Session 2026-04-12

- Q: Should non-active players see their own cards while waiting? → A: No — only the active player sees their hand face-up; others see card counts only (pass-and-play model).
- Q: How is card selection communicated to the player? → A: Tap to toggle card selection; selected cards visually elevate (translateY) to indicate selection.
- Q: Should the board show a full score history or just the current round summary? → A: Both — round summary after each round + a scrollable score history accessible via a button.
- Q: Should cumulative scores be visible on the board during active play? → A: Yes — a compact scoreboard row showing each player's cumulative total is always visible on the board (FR-021).
- Q: When multiple players tie for fewest penalties in a round, how should the round winner highlight behave? → A: All tied players are highlighted equally as co-winners of that round.
