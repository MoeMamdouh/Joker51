# Feature Specification: Sort Melded Cards & Fix Lay-Off

**Feature Branch**: `005-sort-meld-fix-layoff`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "i have a comment in the current behaviour the melded card in the table shuld be sorted by default also recheck the lay off feature becuase i tried it and its not working"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sorted Combinations on Table (Priority: P1)

When any player places cards on the table (initial meld, additional melds, or lay-offs), the cards within each combination are automatically displayed in a consistent sorted order: lowest rank to highest for sequences, and by a fixed suit order for sets. The player never needs to arrange cards manually before or after placing them.

**Why this priority**: Readability of the table directly affects every player's ability to assess valid moves for lay-off, Joker claims, and planning. Unsorted combinations cause misreads and slower play. This is a display-correctness fix that underpins all table-interaction features.

**Independent Test**: Player melts `8♠ 6♠ 7♠` (submitted out of order) → combination appears on table as `6♠ 7♠ 8♠` → lay-off candidate `5♠` is immediately recognisable as a valid prepend.

**Acceptance Scenarios**:

1. **Given** a player places a sequence whose cards were selected in a random order, **When** the combination appears on the table, **Then** the cards are displayed in ascending rank order (low → high), e.g., `5♣ 6♣ 7♣`.
2. **Given** a player places a set (same rank, multiple suits), **When** the combination appears on the table, **Then** the suits are displayed in a fixed, consistent order (e.g., ♠ ♥ ♦ ♣).
3. **Given** a card is laid off onto an existing sequence at either end, **When** the updated combination is displayed, **Then** the full combination remains sorted (the laid-off card appears at the correct end).
4. **Given** a Joker is present in a sequence, **When** the combination is displayed, **Then** the Joker is shown in the position determined by its surrounding natural cards (Joker is treated as occupying the rank that makes the sequence contiguous).
5. **Given** a Joker is present in a set, **When** the combination is displayed, **Then** the Joker is shown in the position corresponding to its substituted suit within the fixed suit order.

---

### User Story 2 — Lay-Off Position Auto-Detection (Priority: P1)

A player who has melded selects a card from their hand and taps any table combination to lay the card off. The system automatically determines whether the card belongs at the start or end of a sequence — the player does not need to choose or specify a position. If the card is valid at either end, the system places it at the end by default.

**Why this priority**: Lay-off is the primary card-shedding action for melded players. If the action silently fails when a card is valid only as a prepend (e.g., placing `4♣` on `5♣ 6♣ 7♣`), players cannot progress their turns. This is a blocking gameplay bug.

**Independent Test**: Table shows `5♣ 6♣ 7♣` → Player selects `4♣` → taps the combination → `4♣` is prepended and combination shows `4♣ 5♣ 6♣ 7♣`. Separately: table shows `5♣ 6♣ 7♣` → Player selects `8♣` → taps the combination → `8♣` is appended and combination shows `5♣ 6♣ 7♣ 8♣`.

**Acceptance Scenarios**:

1. **Given** I have melded and a table sequence has a gap at the lower end, **When** I select the card that fills that gap and tap the combination, **Then** the card is prepended to the sequence and removed from my hand, with no position selection required.
2. **Given** I have melded and a table sequence has a gap at the upper end, **When** I select the card that fills that gap and tap the combination, **Then** the card is appended to the sequence and removed from my hand.
3. **Given** I have melded and a card is valid at both ends of a sequence (e.g., a 1-card sequence or a 2-card sequence where ranks allow), **When** I tap the combination, **Then** the card is appended (end position is the default).
4. **Given** I have melded and the selected card does not extend the sequence at either end, **When** I tap the combination, **Then** a specific error is shown and no cards are moved.
5. **Given** I have melded and I select a card that matches a set's rank and a suit not already in the set, **When** I tap the combination, **Then** the card is added to the set (sets have no positional ambiguity) and removed from my hand.
6. **Given** I have melded and I select a card whose suit already exists in a target set, **When** I tap the combination, **Then** an error is shown indicating the duplicate suit constraint.

---

### Edge Cases

- What happens when a Joker is at the boundary of a sequence (start or end) and a natural card is laid off adjacent to it? → The Joker's position is fixed; the laid-off natural card extends the sequence further, and the resulting combination is sorted/validated correctly.
- What if a sequence contains only 2 natural cards and the Joker is in the middle? → The sequence has unambiguous endpoints; lay-off auto-detection checks the natural rank boundaries (lowest and highest natural cards) to determine valid end positions.
- What if a sequence contains only 1 card? → Both prepend and append are structurally valid; the system defaults to append.
- What happens when a combination is a set and the player selects a card of the wrong rank? → The lay-off is rejected with a specific error; no position detection is attempted for sets (rank must match exactly).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST sort the cards within a combination before storing or displaying it, using ascending rank order (TWO → ACE) for sequences and a fixed suit order (SPADES → HEARTS → DIAMONDS → CLUBS) for sets; Jokers are placed in their substituted position relative to adjacent natural cards.
- **FR-002**: The system MUST apply card sorting whenever a combination is created (initial meld, additional meld) or modified (lay-off, Joker claim), so the sorted state is always persisted in game state. Additionally, when a previously saved session is restored from storage, the system MUST sort all existing combinations in that session before placing them into active game state.
- **FR-003**: The system MUST automatically detect the correct position (start or end) for a lay-off card on a sequence, without requiring the player to specify a position.
- **FR-004**: The system MUST attempt to place the lay-off card at the start of a sequence first if the card's rank equals the lowest natural rank minus one, and at the end if the card's rank equals the highest natural rank plus one; if both are valid, it MUST default to the end.
- **FR-005**: The system MUST reject a lay-off on a sequence if the selected card does not extend it at either end, returning a specific error code distinguishable from generic invalid-combination errors.
- **FR-006**: The system MUST accept a lay-off on a set when the card matches the set's rank and its suit is not already present; position detection does not apply to sets.
- **FR-007**: The sorting logic MUST account for the Ace no-wraparound rule: Ace is sorted contextually — placed at the high end (after King) when it follows a King in the combination, and at the low end (before Two) when it precedes a Two; sorting must not reorder a valid Q-K-A sequence to A-Q-K.
- **FR-008**: The system MUST preserve the Joker's logical position within a sorted combination — the Joker is placed at the index where it substitutes the missing rank (sequence) or suit (set).

### Key Entities

- **Combination**: Existing entity; gains a sorting invariant — cards are always stored and returned in sorted order after any mutation.
- **LayOffPosition**: Implicit derived value (start or end) computed from the lay-off card's rank relative to the combination's boundary ranks; not stored, computed at action time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every combination on the table, regardless of the order cards were played, displays cards in the defined sorted order 100% of the time.
- **SC-002**: A player can successfully lay off a card that extends a sequence at the lower end (prepend) without any additional interaction — one card selection plus one combination tap is sufficient.
- **SC-003**: Lay-off failures produce error messages that identify the specific constraint violated (wrong rank, wrong suit, set full) — zero generic "invalid action" messages for lay-off attempts.
- **SC-004**: All existing meld, lay-off, and Joker claim tests pass without regression after the sorting and position-detection changes are applied.
- **SC-005**: The sorted order is consistent across game save/resume cycles — a combination sorted before persistence is displayed in the same order after the session is restored.

## Assumptions

- Card sorting is applied at the engine level (state mutation), not only at the display layer, ensuring consistency between game state and any future views or exports.
- The fixed suit order for sets is: SPADES → HEARTS → DIAMONDS → CLUBS (matching the existing `Suit` enum declaration order).
- Rank order for sorting follows the existing `RANK_ORDER` constant in the engine (ACE low, TWO through KING) as a baseline; however, Ace position is resolved contextually at sort time — Ace is placed at the high end (after King) when adjacent to King in the combination, and at the low end (before Two) otherwise. This ensures Q-K-A sequences are not rewritten as A-Q-K.
- Position auto-detection is implemented in the lay-off action (engine layer), not the UI layer, so all callers benefit without UI changes.
- This spec does not change how the player selects a card or taps a combination — only what happens inside the engine when the lay-off action is executed.
- Joker position within a sorted combination is determined by the Joker's substituted rank/suit, which is already tracked by the combination's structure; no new Joker metadata is required.

## Clarifications

### Session 2026-04-12

- Q: How should Ace be positioned when sorting a sequence — always low (index 0) or contextually based on adjacent cards? → A: Ace is sorted contextually — placed at the high end (after King) when it follows a King in the combination, and at the low end (before Two) when it precedes a Two; a Q-K-A sequence must remain Q-K-A, not be rewritten as A-Q-K.
- Q: When a previously saved session is restored, should existing unsorted combinations be sorted retroactively? → A: Yes — all combinations in a restored session are sorted in-place (one-time pass) before being placed into active game state, ensuring consistent display from the moment the fix ships.
