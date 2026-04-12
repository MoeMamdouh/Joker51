# Research: Meld & Table Management

**Feature**: `004-meld-table-management`
**Date**: 2026-04-12

---

## Decision 1: Multi-Combination Initial Meld UI Model

**Decision**: Staged meld builder — user stages each combination separately, then submits all at once.

**Rationale**: The engine's `placeInitialMeld` already accepts `combinations: Card[][]` (multiple groups). The Phase 3 hook wraps everything as a single combination `[selectedCards]`. To support multi-combination melds (e.g., `6♠ 7♠ 8♠` + `10♦ 10♣ 10♥`), the UI needs a staging area where the user builds each combination independently before submitting the complete set.

**Interaction flow**:
1. User selects cards from hand → taps **"Stage"** → selected cards move to a `StagedMeldPreview` strip showing running total (e.g., "21 pts").
2. User selects more cards → taps **"Stage"** again → second combination added (e.g., "21 + 30 = 51 pts ✓").
3. User taps **"Meld"** (enabled when total ≥ 51 pts and all staged combos are valid) → entire staged set submitted via `placeMeldCombinations`.
4. On success: staged area clears, combinations appear on table under player's name.
5. On engine rejection: staged area is preserved, error banner shown.

**Alternatives considered**:
- *Auto-detect groupings from flat selection*: Computationally expensive and ambiguous when cards could form different valid groupings. Rejected.
- *Submit flat selection and have engine try all groupings*: Same ambiguity problem; violates the principle that the user explicitly chooses their meld. Rejected.
- *Keep single-combination only*: Would silently allow 51-pt melds from two partial combos to fail; poor UX for the core mechanic. Rejected.

---

## Decision 2: Joker Claim API — Multi-Card Support for Sets

**Decision**: Change `claimJoker` engine signature to accept `realCards: Card[]` (plural).

**Rationale**: The clarified game rule requires that to claim a Joker from a set:
- **3-natural-card set** (`9♠ 9♥ 9♦ [Joker]`): exactly **1** replacement card needed (the missing 4th suit).
- **2-natural-card set** (`9♠ 9♥ [Joker]`): exactly **2** replacement cards needed (both missing suits), making the set fully natural.

The current engine signature `{ realCard: Card }` (singular) cannot represent the 2-card case. Changing to `realCards: Card[]` handles both cases, with the engine validating card count against the combination structure.

**New error code**: `JOKER_CLAIM_AMBIGUOUS_SET` — returned when player provides only 1 card for a 2-natural-card set.

**Sequence Joker claim** (unchanged behaviour): Position in sequence fully determines identity → 1 card always sufficient → passes through as `realCards[0]`.

**Alternatives considered**:
- *Keep `realCard: Card`, reject 2-natural-card set claims entirely*: Would make a legitimate game move impossible. Rejected.
- *Separate engine function for set claims*: Unnecessary split; the distinction is internal to `claimJoker`. Rejected.

---

## Decision 3: Table Combination Display Order

**Decision**: Group combinations by player, ordered by player turn sequence from game setup. Sorting applied in `GameBoardScreen` before passing `combinations` to `TableArea`.

**Rationale**: Turn order is the most stable, predictable ordering — it never changes mid-game and matches how player badges and scores are ordered. Sorting in the screen (not inside `TableArea`) keeps `TableArea` a pure display component.

**Implementation**: Derive `orderedCombinations` from `tableState.combinations` sorted by `config.players.findIndex(p => p.id === combo.ownerId)`.

**Alternatives considered**:
- *Chronological insertion order* (current Phase 3 behaviour): First-meld player's combinations always appear first, but new combinations from later-melding players append at end, causing layout instability. Rejected.
- *Active player combinations on top*: Changes every turn, causing jarring table re-layout during play. Rejected.

---

## Decision 4: `canClaimJokerForCombination` Logic

**Decision**: Move Joker claim eligibility computation to a pure engine helper function `getClaimableJokerCards(combination, hand)` that returns the exact replacement cards needed, or `null` if not claimable.

**Rationale**: The current `GameBoardScreen` implementation (`combination.cards.some(c => c.isJoker)`) is incorrect — it shows the claim affordance even when the player doesn't hold the replacement cards. Correct logic requires inspecting both the combination structure and the player's hand. Encapsulating this in the engine keeps the UI dumb and the logic testable.

**Function contract**:
```ts
// Returns the Card[] the player must provide to claim the Joker,
// or null if: no Joker in combo, player doesn't hold required cards, combo not claimable.
export function getClaimableJokerCards(
  combination: Combination,
  playerHand: readonly Card[]
): Card[] | null
```

- For sequences: find Joker position, determine represented card, check if hand contains it.
- For sets: count missing suits, check if hand contains all of them.

**Alternatives considered**:
- *Keep logic in GameBoardScreen*: Duplicates validation logic between UI and engine; hard to test. Rejected.
- *New validation module*: One helper function doesn't warrant a new file; add to `src/engine/validation.ts`. Chosen.

---

## Decision 5: `placeMeld` Hook Method Split

**Decision**: Add `placeMeldCombinations(combinations: Card[][])` to `useGameActions` alongside the existing `placeMeld(cards: Card[])`. Existing `placeMeld` is preserved for single-combination backwards compatibility during the transition.

**Rationale**: Phase 3's `placeMeld` passes `[selectedCards]` as a single-element array. Changing the signature in-place would break the existing `GameBoardScreen` call. Adding a new method allows the meld builder to use the full `Card[][]` API while the old call site is updated cleanly.

**Alternatives considered**:
- *Change `placeMeld` in place to accept `Card[][]`*: Cleaner long-term but requires updating all call sites simultaneously. Acceptable — will update the one call site in `GameBoardScreen.handleMeld` and remove the old `placeMeld`. Chosen (simpler — one method, one call site).
