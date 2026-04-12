# Feature Specification: Meld & Table Management

**Feature Branch**: `004-meld-table-management`
**Created**: 2026-04-12
**Status**: Draft

## User Scenarios & Testing

### User Story 1 — Place Initial Meld (Priority: P1)

A player who has drawn a card selects one or more valid combinations from their hand and places them on the table as their opening meld. The total point value across all combinations must be at least 51 points. Each combination must contain at least 3 cards, and at most one Joker per combination is allowed during this opening placement.

**Why this priority**: The initial meld is the gate to all further table interaction. No lay-off, no Joker claim, and no contribution to table combinations is possible until a player has successfully melded. It is the single most critical action in the game.

**Independent Test**: Start a 2-player game → Player 1 draws → selects `6♠ 7♠ 8♠` (21 pts) + `10♦ 10♣ 10♥` (30 pts) = 51 pts → confirms meld → combinations appear on table under Player 1's name → Player 1 is marked as melded.

**Acceptance Scenarios**:

1. **Given** I have drawn and phase is ACTING, **When** I select valid combinations worth ≥ 51 pts and confirm meld, **Then** the combinations appear on the table grouped under my name and I am marked as melded.
2. **Given** I select combinations totalling < 51 pts, **When** I attempt to meld, **Then** an error message is shown stating the point shortfall and no cards are moved.
3. **Given** I select cards that do not form a valid sequence or set (e.g., mismatched suits in a sequence, duplicate suit in a set), **When** I attempt to meld, **Then** an error describes the invalid combination and no cards are moved.
4. **Given** I include two Jokers in a single combination during my opening meld, **When** I attempt to meld, **Then** an error states that only one Joker is allowed per combination in an opening meld.
5. **Given** I include a combination with fewer than 3 cards, **When** I attempt to meld, **Then** an error states the minimum size requirement.
6. **Given** I have already melded in this game, **When** I stage a new combination and confirm, **Then** the combination is placed on the table without any 51-point requirement (additional melds have no threshold).
7. **Given** I select combinations totalling exactly 51 pts with valid structure, **When** I confirm meld, **Then** the meld succeeds.
8. **Given** I drew from the discard pile before making my initial meld, **When** I attempt to confirm an initial meld that does not include the drawn card, **Then** the meld is rejected with an error stating the drawn card must be used in this meld.
9. **Given** I drew from the discard pile before making my initial meld and I include the drawn card in my combinations, **When** I confirm meld, **Then** the meld succeeds normally.

---

### User Story 2 — Lay Off Cards on Table Combinations (Priority: P1)

After completing their initial meld, a player may extend any combination already on the table — their own or another player's — by adding matching cards from their hand. Sequences are extended at either end; sets are completed by adding the missing suit (up to 4 cards).

**Why this priority**: Laying off is the primary way melded players shed cards each turn. It depends on US1 (must be melded first) and is required for a complete turn loop.

**Independent Test**: Player 1 has melded, table shows `5♣ 6♣ 7♣` (Player 2's combination) → Player 1 draws → selects `4♣` → taps the sequence → `4♣` is prepended to the combination → card removed from Player 1's hand.

**Acceptance Scenarios**:

1. **Given** I have melded and phase is ACTING, **When** I select a card that extends a table sequence at either end and confirm lay-off, **Then** the card is added to that sequence and removed from my hand.
2. **Given** I have melded and phase is ACTING, **When** I select a card of the correct rank that fills a missing suit in a table set, **Then** the card is added to that set and removed from my hand.
3. **Given** I try to add a card that does not extend a sequence (wrong rank or suit), **Then** an error is shown and no cards are moved.
4. **Given** I try to add a card to a set that already contains a card of that suit, **Then** an error states the duplicate suit constraint and no cards are moved.
5. **Given** I try to add a fifth card to a 4-card set, **Then** an error states sets are limited to 4 cards.
6. **Given** I have NOT yet melded, **When** I attempt to lay off a card onto a table combination, **Then** the action is blocked with a message indicating I must meld first.
7. **Given** I have melded, **When** I select a card and target a combination from another player, **Then** the lay-off succeeds if the card is valid for that combination.

---

### User Story 3 — View Table Combinations (Priority: P1)

All melded combinations from every player are displayed on the table at all times during a game, grouped by the player who placed them. Any player can read the table regardless of whose turn it is.

**Why this priority**: The table is the shared game state — every decision (lay-off target, Joker claim, meld planning) depends on seeing it clearly. Must be complete before US2 and US4 are useful.

**Independent Test**: Two players each meld combinations → both players' combinations are visible on the table → when one player adds to the other's combination, the combination updates immediately.

**Acceptance Scenarios**:

1. **Given** one or more players have melded, **When** any player views the board, **Then** all combinations are visible, each labelled with the owning player's name.
2. **Given** a combination is updated (card added via lay-off or Joker claim), **When** the board renders, **Then** the updated combination is shown without requiring any manual refresh.
3. **Given** no player has melded yet, **When** any player views the board, **Then** the table area is empty and no combinations are shown.
4. **Given** a player has placed multiple combinations in their initial meld, **When** the table is displayed, **Then** all of their combinations are grouped together under their name.

---

### User Story 4 — Claim a Joker from the Table (Priority: P2)

During their turn, a melded player may reclaim a Joker from any table combination by supplying the natural card the Joker is substituting. The Joker moves to the player's hand and the natural card fills its slot; the combination must remain valid (at least 3 cards) after the swap.

**Why this priority**: An advanced but frequent play that significantly impacts strategy. P2 because it requires an existing table with at least one Joker (depends on US1 and US3 having occurred).

**Independent Test**: `J♠ [Joker] K♠` is on the table (Joker substitutes `Q♠`) → active melded player holds `Q♠` → player initiates Joker claim on that combination → `Q♠` replaces the Joker in the combination → Joker appears in the player's hand.

**Acceptance Scenarios**:

1. **Given** a Joker is in a table sequence and I hold the natural card that fills its position, **When** I claim it, **Then** the Joker moves to my hand and the natural card fills its slot; the sequence retains the same number of cards.
2. **Given** a Joker is in a 3-natural-card set (all 4 suits filled, one by the Joker — e.g., `9♠ 9♥ 9♦ [Joker]`) and I hold the one missing suit card, **When** I claim it, **Then** the Joker moves to my hand and the natural card completes the set.
3. **Given** a Joker is in a 2-natural-card set (2 suits missing, one filled by the Joker — e.g., `9♠ 9♥ [Joker]`) and I hold both missing suit cards, **When** I claim it, **Then** both natural cards are added to the set, the Joker moves to my hand, and the set becomes a full 4-card natural set.
4. **Given** a Joker is in a 2-natural-card set and I hold only one of the two missing suit cards, **Then** the claim is rejected because the Joker's identity is ambiguous and the set cannot be completed with a single card.
5. **Given** I do not hold all the natural card(s) required to replace the Joker, **Then** the claim affordance is not active for that combination.
6. **Given** it is not my turn, **Then** the Joker claim action is unavailable.
7. **Given** I have not yet melded, **Then** the Joker claim action is unavailable.
8. **Given** I successfully claim a Joker, **When** I then use the Joker in a lay-off on the same turn, **Then** the Joker is removed from my hand and the lay-off combination is valid.

---

### Edge Cases

- What if a player selects 51+ points across three combinations but one combination has only 2 cards? → Rejected — every combination in the opening meld must independently satisfy the minimum 3-card rule.
- What if a Joker is claimed from a 3-card sequence? → Allowed — the player provides the 1 natural card the Joker represents; the sequence count stays at 3 (1-for-1 swap).
- What if the same rank card appears in multiple table sets (multi-deck game)? → Each set is independent; a card can be added to any set where it fills a missing suit in that specific set.
- Can a player meld and lay off in the same turn? → Yes — sequential: the player submits their initial meld first (one confirmation; cards leave hand and table updates immediately), then may select further cards from their remaining hand and lay off as a separate action within the same turn. The two steps are not bundled into a single submission.
- Can a player who has already made their initial meld place new combinations on the table? → Yes — after the initial meld, a player may stage and confirm additional valid combinations in the same or any subsequent turn. No point threshold applies to these additional placements.
- What if a player's opening meld includes a combination whose Joker they could claim from the table? → Claiming must be resolved before or after the meld action, not during; the claimed Joker may be incorporated into the opening meld if claimed first.
- How is a Joker's identity resolved in a set at claim time? → The player must supply all remaining missing suit cards for the set. In a 3-natural-card set (`9♠ 9♥ 9♦ [Joker]`), exactly 1 suit is missing — the player provides that card and the Joker is freed. In a 2-natural-card set (`9♠ 9♥ [Joker]`), 2 suits are missing — the player must provide both; providing only one is rejected. In sequences the Joker's identity is always unambiguous (determined by its position), so 1 card is always sufficient.
- What is the Ace's position in a sequence for lay-off? → Ace may only be at the low end (`A-2-3`) or the high end (`Q-K-A`); adding to a `K-A` sequence from the high end is not allowed (no wraparound).
- What happens if a non-melded player draws from the discard pile and then fails to use that card in their initial meld? → The meld is rejected with error `DRAWN_DISCARD_NOT_IN_MELD`. The player must either include the drawn card in their meld or cancel staging and play differently.
- Can a player who is already melded freely draw from the discard pile without restriction? → Yes — the discard draw restriction applies only before the player's initial meld. Once a player is melded, they may draw from the discard pile freely.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST reject an initial meld whose total point value is less than 51 points across all combinations placed; no cards leave the player's hand.
- **FR-002**: The system MUST reject the entire initial meld submission if any single combination contains fewer than 3 cards; no cards leave the player's hand.
- **FR-003**: The system MUST reject the entire initial meld submission if any single combination contains more than one Joker; no cards leave the player's hand.
- **FR-004**: The system MUST prevent a player from laying off cards on any table combination until that player has completed their initial meld.
- **FR-005**: The system MUST allow a card to be laid off at either end of a valid table sequence when the card is the correct suit and the adjacent rank.
- **FR-006**: The system MUST allow a card to be laid off onto a table set when the card matches the set's rank and its suit is not already present in that set.
- **FR-007**: The system MUST reject lay-offs that would add a fifth card to a set (sets are limited to 4 cards, one per suit).
- **FR-008**: The system MUST reject lay-offs that duplicate an existing suit in a table set.
- **FR-009**: The system MUST allow a player to lay off cards on any player's table combinations (not only their own).
- **FR-010**: The system MUST allow a player to place their initial meld and, after that meld is confirmed and the table updated, lay off additional cards from their remaining hand as a separate sequential action within the same turn.
- **FR-011**: The system MUST allow a player to claim a Joker from a table combination only when they hold all natural cards needed to fully replace it: one card for sequences (the card at the Joker's position) and one card for sets where only 1 suit is missing; two cards for sets where 2 suits are missing.
- **FR-012**: The system MUST reject a Joker claim from a set when the player holds only one of the two missing suit cards, returning a descriptive error that the set cannot be completed with a single card.
- **FR-013**: The system MUST, upon a successful Joker claim, move the Joker to the claiming player's hand and place all provided natural cards into the combination, leaving the combination valid (3+ cards, correct structure).
- **FR-014**: The system MUST restrict Joker claims to the active player's turn only.
- **FR-015**: The system MUST restrict Joker claims to players who have completed their initial meld.
- **FR-016**: The system MUST display all table combinations grouped by the player who placed them, with each group labelled by player name, ordered by player turn order as established at game setup.
- **FR-017**: The system MUST update the table display immediately after any meld, lay-off, or Joker claim.
- **FR-018**: The system MUST present descriptive, player-readable error messages for all rejected meld, lay-off, and claim attempts, identifying the specific rule violated.
- **FR-019**: The system MUST enforce the Ace no-wraparound rule in sequence validation for both initial melds and lay-offs.
- **FR-020**: The system MUST allow a player who has already completed their initial meld to stage and confirm additional combinations on the table in the same or any subsequent turn, with no minimum point threshold.
- **FR-021**: The system MUST track whether a player drew from the discard pile before making their initial meld. If so, the initial meld submission MUST include that drawn card in at least one of the staged combinations; if not, the entire meld is rejected with a `DRAWN_DISCARD_NOT_IN_MELD` error and no cards leave the player's hand. This restriction does NOT apply to players who have already completed their initial meld.

### Key Entities

- **Combination**: A valid set or sequence of cards placed on the table by a player. Has an owner (player), a type (sequence or set), and an ordered list of cards (including Jokers at their substituted positions).
- **TableState**: The complete collection of all combinations currently on the table from all players.
- **MeldAttempt**: A proposed initial meld consisting of one or more combinations drawn from the active player's hand.
- **LayOffAttempt**: A proposed addition of one card from the active player's hand to an existing table combination.
- **JokerClaim**: A proposed swap of a Joker in a table combination with the natural card from the active player's hand.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A player can complete a valid initial meld in a single confirmation action — selecting cards and confirming takes no more than one tap per card plus one confirm tap.
- **SC-002**: The 51-point boundary is enforced exactly — a 51-point meld always succeeds; a 50-point meld is always rejected, with an error stating the shortfall.
- **SC-003**: The table updates within 300 ms of any successful meld, lay-off, or Joker claim.
- **SC-004**: Every invalid action (wrong point total, bad combination structure, duplicate suit, set overflow, invalid Joker claim) produces a specific, readable error message — zero generic "invalid action" messages.
- **SC-005**: A player can meld and then lay off cards in the same turn with no screen navigation between the two steps — the meld confirms, the table updates, and lay-off selection is immediately available.
- **SC-006**: After a Joker claim the claimed Joker is immediately available in the player's hand for use within the same turn.
- **SC-007**: All table combination rules (sequence direction, set suit uniqueness, Ace position, Joker limit in opening meld) are correctly enforced across all test scenarios with zero rule violations passing undetected.
- **SC-008**: A player who has completed their initial meld can immediately stage and place additional combinations in the same turn — the "Stage" affordance remains available and no 51-point check is applied.
- **SC-009**: If a player drew from the discard pile before their initial meld, an attempt to confirm a meld that omits the drawn card produces a specific, readable error; the player's hand and the table are unchanged.

## Assumptions

- The turn flow (draw → act → discard) is managed by Phase 3 (Game Board Screen); this feature defines the validation and state rules for the meld and table interaction mechanics that occur within the ACTING phase.
- Card selection UI is provided by the game board screen; this feature's scope is the business rules governing what is and is not a valid meld, lay-off, or Joker claim.
- The 51-point threshold applies exclusively to the initial meld; additional combinations placed after the initial meld and lay-offs have no point threshold.
- After their initial meld, a player may place additional new combinations on the table (with any valid structure, no minimum points) in addition to laying off individual cards on existing combinations.
- If a player draws from the discard pile before making their initial meld, they must include that drawn card in their initial meld on the same turn; this restriction does not apply to already-melded players.
- A player may meld and lay off in the same turn via sequential steps: meld is submitted and confirmed first, then lay-off actions follow using the remaining hand (Steps 2 and 3 of the turn flow are combinable but sequential, not bundled).
- The Joker's substituted card identity within a combination is determined by the combination's structure; if ambiguous (e.g., a set missing two suits), the player selects which suit the Joker represents at claim time.
- Reorganising existing table combinations (splitting, merging, rearranging cards between combinations) is out of scope — only adding cards to existing combinations is supported.
- All table combinations are visible to all players at all times; there is no hidden table state.
- The claimed Joker may be used in the same turn it is claimed (melded, laid off, or held for discard).
- Phase 3 (Game Board Screen) established the visual framework; Phase 4 may extend or refine table display but does not replace it.

## Clarifications

### Session 2026-04-12

- Q: When a player places their initial meld and also wants to lay off cards in the same turn, what is the interaction model? → A: Sequential — the player submits and confirms the meld first (table updates immediately), then selects additional cards from their remaining hand and lays them off as a separate action within the same turn. The two steps are not bundled into a single submission.
- Q: How is a Joker's identity in a set resolved at claim time, and how many cards must the player supply? → A: The player must supply ALL remaining missing suit cards for the set to complete it. In a 3-natural-card set (1 suit missing), 1 card is required. In a 2-natural-card set (2 suits missing), both missing suit cards are required — providing only one is rejected. In sequences the Joker's position determines its identity, so exactly 1 card is always sufficient.
- Q: In what order are players' combination groups displayed on the table when multiple players have melded? → A: Turn order — groups are displayed in the same sequence as the player list established at game setup, from first to last player, regardless of which player melded first.
- Q: If a player submits an initial meld with multiple combinations and one is invalid, does the entire meld fail or only the invalid combination? → A: All-or-nothing — the entire submission is rejected if any combination is invalid; no cards leave the player's hand. The error message identifies the specific invalid combination.
- Q: After a player completes their initial meld, can they place entirely new combinations (not just lay off individual cards)? → A: Yes — after the initial meld, a player may stage and confirm any number of new valid combinations with no point minimum. The same "Stage" affordance is used; this is treated as a separate engine action (`placeCombinations`) distinct from the initial meld.
- Q: What happens when a non-melded player draws from the discard pile? → A: The drawn card is tracked in turn state (`discardDrawnBeforeMeld`). When the player submits their initial meld, the engine verifies the drawn card appears in at least one combination; if not, the entire meld is rejected with `DRAWN_DISCARD_NOT_IN_MELD`. The restriction clears automatically when the turn ends.
