# Feature Specification: Fix Ace-After-King Sequence Validation

**Feature Branch**: `010-fix-ace-after-king`  
**Created**: 2026-04-18  
**Status**: Draft  
**Input**: User description: "there is a bug when user try to put Ace to the board in the after K position. First scenario: trying to put Ace of Hearts to 10, joker, Q, K series but returns an error. Second scenario: trying to put Ace of Clubs to J, Q, joker."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Extend Run with Ace After Natural King (Priority: P1)

A player holds an Ace and wants to extend a run on the table that ends with a natural King card. The run currently ends at King, and the player wants to add their Ace as the high-end card to form a valid K-A ending.

**Why this priority**: This is the core bug scenario — a valid game move is blocked by an incorrect validation. Fixing it unblocks correct gameplay for any sequence that includes a real King card at the end.

**Independent Test**: Start a game, place a run ending with a natural King on the table, then attempt to extend it with an Ace. The move should succeed.

**Acceptance Scenarios**:

1. **Given** a run "10, Joker, Q, K" is on the table, **When** the player places Ace of the same suit at the end of that run, **Then** the combination "10, Joker, Q, K, A" is accepted as valid.
2. **Given** a run "J, Q, K" is on the table, **When** the player attempts to add Ace of the same suit after K, **Then** the resulting "J, Q, K, A" combination is accepted.
3. **Given** a run ending with K is on the table, **When** the player tries to add a 2 after K (not an Ace), **Then** the move is correctly rejected as invalid (no wraparound past Ace).

---

### User Story 2 - Extend Run with Ace When King Is Represented by Joker (Priority: P1)

A player holds an Ace and wants to extend a run where the King position is filled by a Joker card. The run ends at King (via Joker), and the Ace should be accepted as the next card in the sequence.

**Why this priority**: This is the second confirmed bug scenario from the screenshots — the game rejects Ace placement even when the King-position is occupied by a Joker acting as King.

**Independent Test**: Start a game, build a run where the Joker substitutes for King (e.g., J, Q, Joker), then attempt to add Ace. The move should succeed.

**Acceptance Scenarios**:

1. **Given** a run "J, Q, Joker" (Joker represents K) is on the table, **When** the player places Ace of the same suit at the end, **Then** the combination "J, Q, Joker, A" is accepted as valid.
2. **Given** a run "10, J, Q, Joker" (Joker represents K) is on the table, **When** the player places Ace of the same suit at the end, **Then** the combination "10, J, Q, Joker, A" is accepted as valid.
3. **Given** a run "Joker, Q, K" (Joker represents J) is on the table, **When** the player places Ace of the same suit at the end, **Then** "Joker, Q, K, A" is accepted as valid (King is natural, Ace-high applies).
4. **Given** a run "J, Joker, K" (Joker represents Q) is on the table, **When** the player places Ace after K, **Then** "J, Joker, K, A" is accepted as valid.

---

### User Story 3 - Ace Remains Valid as Low Card (Priority: P2)

Fixing Ace-high placement must not break the existing behaviour where Ace acts as a low card (before 2) in a run.

**Why this priority**: Regression prevention — Ace-low sequences must continue to work correctly after the fix is applied.

**Independent Test**: Build a run starting with Ace (A-2-3 or similar), verify it still passes validation.

**Acceptance Scenarios**:

1. **Given** the player holds Ace, 2, 3 of the same suit, **When** they place these as a new combination, **Then** "A, 2, 3" is accepted as valid (Ace-low).
2. **Given** a run "A, 2, Joker" is on the table, **When** validation runs, **Then** the combination remains valid with Joker representing 3.
3. **Given** a run "A, Joker, 3" is on the table, **When** validation runs, **Then** the combination remains valid with Joker representing 2.

---

### Edge Cases

- What happens when both a natural King and a Joker are present near the Ace in the same run (e.g., K, Joker, A where Joker represents something after King)? This should remain invalid since there is no rank after Ace.
- What happens if a player tries to place Ace in the middle of a sequence (not at the high or low end)? This should be rejected.
- What happens with a run containing multiple Jokers where one Joker represents King and Ace follows? (e.g., J, Joker, Joker, A where the two Jokers represent Q and K) — should be accepted.
- What happens when the run would create a wrap-around sequence (K, A, 2)? This should be rejected; only K-A as a terminator is valid.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST accept an Ace card placed at the end of any run whose last card is a natural King of the same suit.
- **FR-002**: The game MUST accept an Ace card placed at the end of a run where the King position is occupied by a Joker (i.e., the Joker is in the position logically representing King rank).
- **FR-003**: The game MUST continue to accept Ace as the lowest card in a run (before the 2), with no change to current Ace-low behaviour.
- **FR-004**: The game MUST reject an Ace placed after King when adding any other card beyond Ace (i.e., no rank exists after Ace; the run cannot continue past Ace).
- **FR-005**: The game MUST reject wrap-around sequences (e.g., Q, K, A, 2), accepting K-A only as a terminal run ending.
- **FR-006**: Joker substitution value calculation (points) MUST remain correct when a Joker in a run is followed by an Ace (Joker still represents King and scores accordingly).

### Key Entities

- **Run / Sequence**: An ordered set of 3+ cards of the same suit in consecutive rank order, optionally with one or more Joker wildcards filling gap positions.
- **Ace-High Run**: A run whose highest card is an Ace positioned after a King (e.g., J-Q-K-A or 10-J-Q-K-A).
- **Ace-Low Run**: A run whose lowest card is an Ace positioned before a 2 (e.g., A-2-3).
- **Joker-as-King**: A Joker occupying the King rank position within a sequence, enabling an Ace-high run even when no natural King card is present.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of previously failing Ace-after-King placement attempts succeed — zero false "Invalid combination" errors for valid K-A endings.
- **SC-002**: All existing valid Ace-low runs continue to pass validation with no regressions.
- **SC-003**: All existing run and set validation test cases continue to pass after the fix.
- **SC-004**: The fix covers both natural-King and Joker-as-King variants, verified by dedicated test cases for each scenario.
- **SC-005**: Invalid moves (wrap-around, Ace in wrong position) continue to be correctly rejected.

## Assumptions

- Ace can appear as either the lowest card (before 2) or the highest card (after King) in a run, but not in a wrap-around (K-A-2 is invalid).
- Joker cards are wild and can represent any rank in a run; a Joker immediately before an Ace in a run is interpreted as representing King.
- The fix applies to both placing a new combination (melding) and extending an existing combination on the table (layoff).
- A run can end with K-A regardless of whether the K is natural or Joker-represented.
- Scoring for a Joker representing King in a K-A run is unchanged — the Joker is worth King's point value.
