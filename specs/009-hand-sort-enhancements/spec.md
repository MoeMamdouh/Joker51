# Feature Specification: Hand Sort Enhancements

**Feature Branch**: `009-hand-sort-enhancements`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "need to enhance the current sort feature — sorted by default, ace after king, high-value order, new-card indicator, two sort modes (by suit then rank / by rank then suit), suit color order (spades → hearts → clubs → diamonds), persist drag order, revert via sort buttons"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Automatic Default Sort on Hand Deal (Priority: P1)

When a player receives cards (start of game or after drawing), their hand is automatically sorted in descending power order: Jokers first, then A → K → Q → J → 10 → … → 3 → 2, grouped by suit (♠ ♥ ♣ ♦). The player sees an organised hand immediately without manual action.

**Why this priority**: The sorted default is the core ergonomic improvement. Everything else builds on top of it.

**Independent Test**: Deal a hand of 7+ cards. Without pressing any button, verify the cards are displayed in descending rank order, grouped by suit, with Jokers at the far left.

**Acceptance Scenarios**:

1. **Given** a player is dealt cards at game start, **When** the hand area renders, **Then** cards appear sorted: Jokers first, then A→K→2 within each suit group (♠ ♥ ♣ ♦).
2. **Given** a player draws a new card, **When** the card is added to the hand, **Then** the existing sorted order is preserved and the new card is visually marked as "new".
3. **Given** an empty hand, **When** no cards exist, **Then** no sort button or indicator is shown.

---

### User Story 2 — New Card Visual Indicator (Priority: P2)

When a player draws a new card it is visually distinguished from the rest of the hand (e.g., a brief animated glow or a small badge/dot) so the player can instantly identify which card just arrived. The indicator fades away after a short period or after the card is tapped/interacted with.

**Why this priority**: Without this, a sorted hand hides where the new card landed. The indicator restores the "I can see my new card" experience.

**Independent Test**: Draw a card. Confirm one card displays the new-card indicator. Tap that card; confirm the indicator disappears. Wait the auto-dismiss period without tapping; confirm indicator also disappears.

**Acceptance Scenarios**:

1. **Given** a player draws a card, **When** the card is inserted into the sorted hand, **Then** it shows a "new" indicator (glow border or dot badge).
2. **Given** the indicator is showing, **When** the player taps the card OR 3 seconds elapse, **Then** the indicator is dismissed.
3. **Given** multiple cards drawn in a single event (e.g., game start), **Then** no "new" indicator is shown — it is reserved for single drawn cards only.

---

### User Story 3 — Two Sort Mode Buttons (Priority: P2)

The hand toolbar exposes two sort buttons:

- **By Suit** (current): groups cards by suit (♠ ♥ ♣ ♦), sorted high → low within each suit. Jokers first.
- **By Rank**: groups cards by rank value regardless of suit — all Kings together, all Queens together, down to all Aces together, Jokers first.

Pressing either button re-sorts the hand and clears any "custom order" flag. The last-used sort mode is remembered within the game session (not persisted across restarts).

**Why this priority**: The "by rank" mode helps players spot sets (same-rank melds) instantly, which is a distinct gameplay strategy from the suit-sequence strategy.

**Independent Test**: With a mixed hand, press "By Suit" and verify suit groupings. Then press "By Rank" and verify rank groupings. Switch back; verify suit groupings reappear.

**Acceptance Scenarios**:

1. **Given** a hand with mixed suits and ranks, **When** user presses "By Suit", **Then** cards are grouped ♠ ♥ ♣ ♦, descending rank within each group, Jokers first.
2. **Given** a hand with multiple cards of the same rank, **When** user presses "By Rank", **Then** all cards of the same rank appear together, groups ordered A → K → Q → … → 3 → 2, Jokers first.
3. **Given** the user has manually dragged a card, **When** they press either sort button, **Then** the hand reverts to the chosen sort order (custom order is cleared).
4. **Given** either sort mode is active, **When** a new card is drawn, **Then** the new card is inserted at the correct position for the current sort mode and shows the "new" indicator.

---

### User Story 4 — Drag-to-Reorder Persists Custom Order (Priority: P3)

When a player drags a card to a new position, that custom order is maintained for the remainder of their turn (and beyond, as long as they don't press a sort button). The hand is no longer automatically re-sorted after a drag.

**Why this priority**: Custom ordering is already functional (Phase 8). This story formalises the contract: drag = intentional; sort button = reset.

**Independent Test**: Sort the hand via "By Suit". Drag one card to a new position. Draw another card. Verify the dragged card remains in its user-chosen position (not reverted) and only the new card triggers the indicator.

**Acceptance Scenarios**:

1. **Given** a hand in sorted order, **When** the player drags a card, **Then** the custom position is preserved on subsequent draws and renders.
2. **Given** a hand in custom (drag) order, **When** the player presses "By Suit" or "By Rank", **Then** the hand returns to the selected sort and custom order is discarded.
3. **Given** a hand in custom order, **When** a new card is drawn, **Then** the new card is appended to the end of the hand (not inserted by sort logic) and shows the "new" indicator.

---

### Edge Cases

- What happens when all cards in hand are Jokers? → All shown, no suit groups rendered.
- What happens when two cards share the exact same rank and suit (two decks in play)? → Both shown; stable sort (order between duplicates is not guaranteed but no crash).
- What happens when the hand has only one card? → Displayed normally, sort buttons still work but produce the same single-card view.
- What happens when the player is in the middle of staging a meld while a sort is triggered? → Sort is disabled while any cards are staged (sort buttons are greyed out / non-interactive).
- What happens if a newly drawn card still has the "new" indicator when the player stages it? → The indicator is suppressed immediately on staging; dimmed and "new" states must never appear together.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The hand MUST be sorted automatically using the "By Suit" mode whenever new cards are dealt at game start or a round reset. At round start, both the active sort mode and any custom drag order are always reset to "By Suit" regardless of prior state.
- **FR-002**: When a single card is drawn, the hand MUST insert the card at the correct sorted position for the active sort mode and display a "new card" indicator on that card.
- **FR-003**: The "new card" indicator MUST auto-dismiss after 3 seconds and also dismiss immediately when the player taps the card or stages the card for a meld. A staged card must never show the indicator simultaneously with the staged/dimmed state.
- **FR-004**: Initial deal (multiple cards at once) MUST NOT trigger the "new card" indicator on any card.
- **FR-005**: The hand toolbar MUST display a segmented control with two tabs — "By Suit" and "By Rank" — placed side by side. The active tab MUST have a filled/highlighted background; the inactive tab MUST be outlined. The control MUST be greyed out and non-interactive while any cards are staged for a meld or while an active card drag is in progress.
- **FR-006**: "By Suit" sort MUST order cards: Jokers → ♠ (A→K→Q→…→3→2) → ♥ (A→K→…→2) → ♣ (A→K→…→2) → ♦ (A→K→…→2). Ace is the highest value card, positioned immediately after Jokers and above King.
- **FR-007**: "By Rank" sort MUST order cards: Jokers → all A (♠♥♣♦) → all K → all Q → … → all 3 → all 2. Within each rank group, suit order is ♠ ♥ ♣ ♦.
- **FR-008**: Both sort modes MUST start with the highest-value cards on the left (or right in RTL layout), descending to the lowest.
- **FR-009**: When a player drags a card to a new position, that custom position MUST be preserved on subsequent renders until a sort button is pressed.
- **FR-010**: When a sort button is pressed, any custom drag order MUST be discarded and the hand re-sorted according to the selected mode.
- **FR-011**: The last-used sort mode MUST be remembered within the current game session. It need not persist across app restarts. (Note: implemented as component state; session-scope is guaranteed because the game screen remains mounted throughout a game session.)
- **FR-012**: In RTL layout, the sort control alignment and card display direction MUST mirror the LTR layout appropriately.

### Key Entities

- **Hand Order State**: Tracks the current sequence of cards in the player's hand, whether the order is "auto-sorted" or "custom (drag)", and the active sort mode.
- **Sort Mode**: Enumeration of two modes — `bySuit` and `byRank`.
- **New Card Indicator**: Transient UI state attached to a single card object, tracking whether it should show the "new" indicator and its dismiss timer.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A freshly dealt hand of 7 cards is visually sorted within one render cycle — no manual action required by the player.
- **SC-002**: Players can identify a newly drawn card within 1 second of it appearing due to the visual indicator.
- **SC-003**: Switching between "By Suit" and "By Rank" takes one tap and re-sorts visibly within 200 ms (one animation frame).
- **SC-004**: A custom drag order is preserved across at least 3 subsequent draws without reverting.
- **SC-005**: 100% of existing hand-related tests continue to pass; no regression in drag-to-reorder or staged-card dimming behaviour.
- **SC-006**: Sort buttons are unreachable (disabled) while staging is active — verified by automated test.

---

## Clarifications

### Session 2026-04-14

- Q: When a new round starts, should sort mode and custom drag order reset to default or carry over? → A: Reset to "By Suit" default on every new round start; custom drag order also cleared.
- Q: What UI shape should the sort toolbar use — two separate buttons, segmented control, or single toggle? → A: Segmented control (two pill tabs side by side, active tab filled).
- Q: Should the "new card" indicator show on a card that is staged before the 3 s auto-dismiss? → A: Suppress indicator immediately on staging; dimmed and "new" states must never coexist.

## Assumptions

- Ace is intentionally the **highest** value card in this game, ranked above King (descending order: A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2). This is a display-sort concern only — it does not change the engine's scoring or meld validation logic.
- Suit colour order for both sort modes follows the specified UX preference: ♠ Spades → ♥ Hearts → ♣ Clubs → ♦ Diamonds.
- "New card indicator" is a UI-only concern — it does not affect game state or engine logic.
- The feature applies only to the active player's hand area; opponent face-down hand areas are unaffected.
- The sort mode preference is session-scoped (not persisted to AsyncStorage) — resetting the app returns to "By Suit" default. At the start of every new round, both the sort mode and any custom drag order are reset to "By Suit" default, since the hand is entirely new cards.
- Jokers have no suit; they always occupy the first (leftmost in LTR) position in every sort mode.
- When two identical cards exist (multi-deck game), sort order between them is stable but unspecified.
