# Quickstart & Integration Scenarios: Meld & Table Management

**Feature**: `004-meld-table-management`
**Date**: 2026-04-12

---

## Prerequisites

- Phase 1 (engine): `src/engine/` — complete and tested.
- Phase 3 (board): `src/screens/GameBoardScreen.tsx`, `src/components/game/`, `src/hooks/useGameActions.ts` — all complete.
- Phase 4 modifies existing engine action (`claimJoker`), adds an engine helper (`getClaimableJokerCards`), updates the hook and screen, adds one new component (`StagedMeldPreview`), and modifies `ActionBar`.

---

## Engine Error Code Map (Phase 4 additions)

| Engine error | i18n key | EN string |
|---|---|---|
| `JOKER_CLAIM_AMBIGUOUS_SET` | `game.errors.jokerClaimAmbiguousSet` | "Select both missing suit cards to claim this Joker" |

Full error map (inherited from Phase 3) is in `src/hooks/useGameActions.ts` → `ERROR_CODE_MAP`.

---

## Integration Scenarios

### Scenario 1 — Single-combination initial meld (≥ 51 pts)

```
State: ACTING phase, player not yet melded
Action: player selects [5♠ 6♠ 7♠ 8♠ 9♠ 10♠] (6 cards, 45 pts)
        → taps "Stage" → staged strip shows [5♠ 6♠ 7♠ 8♠ 9♠ 10♠] / 45 pts
        → "Meld" disabled (< 51)
Action: player selects [J♠ Q♠] (2 more cards) → taps "Stage"
        → staged strip shows 2 combinations / 65 pts
        → "Meld" enabled
Action: taps "Meld"
Expected: both combinations appear on table under player's name; player marked as melded;
          stagedCombinations cleared; selection cleared
```

### Scenario 2 — Multi-combination initial meld (two separate combos, total ≥ 51)

```
State: ACTING phase, player not yet melded
Action: select [6♠ 7♠ 8♠] (21 pts) → "Stage" → select [10♦ 10♣ 10♥] (30 pts) → "Stage"
        → staged total = 51 pts; "Meld" enabled
Action: taps "Meld"
Expected: two CombinationRows appear on table; engine returns success
```

### Scenario 3 — Invalid staged combination (< 3 cards)

```
State: ACTING phase, player not yet melded
Action: select [5♠ 6♠] (2 cards) → taps "Stage"
Expected: error banner "Combination is too short"; nothing added to staged strip
```

### Scenario 4 — Meld rejected by engine (below 51 pts across all staged)

```
State: ACTING phase, player not yet melded, staged = [[5♠ 6♠ 7♠]] (18 pts)
Action: select [8♦ 8♣ 8♥] (24 pts) → "Stage" → total = 42 pts
        → "Meld" disabled (< 51); player cannot submit
```

### Scenario 5 — Lay off card on own combination (sequence extension)

```
State: ACTING phase, player melded, table has [5♣ 6♣ 7♣] (player's own combo)
Action: player selects [4♣] → taps CombinationRow for [5♣ 6♣ 7♣]
Expected: combo becomes [4♣ 5♣ 6♣ 7♣]; card removed from hand
```

### Scenario 6 — Lay off card on another player's combination (set)

```
State: ACTING phase, player melded, table has [9♠ 9♥ 9♦] (Player 2's combo)
Action: player selects [9♣] → taps CombinationRow for [9♠ 9♥ 9♦]
Expected: combo becomes [9♠ 9♥ 9♦ 9♣] (full set); card removed from hand
```

### Scenario 7 — Lay off rejected (wrong suit in sequence)

```
State: ACTING phase, player melded, table has [5♣ 6♣ 7♣]
Action: player selects [8♦] → taps CombinationRow
Expected: error "A sequence must be all the same suit"; combo unchanged
```

### Scenario 8 — Lay off rejected (duplicate suit in set)

```
State: ACTING phase, player melded, table has [9♠ 9♥ 9♦]
Action: player selects [9♠] → taps CombinationRow
Expected: error "A set cannot have duplicate suits"; combo unchanged
```

### Scenario 9 — Joker claim from 3-natural-card set (unambiguous)

```
State: ACTING phase, player melded, table has [9♠ 9♥ 9♦ [Joker]]
       Player hand contains [9♣]
Action: player taps "Claim" badge on that CombinationRow
Expected (automatic — no card selection needed):
        getClaimableJokerCards returns [9♣]
        engine swaps [Joker] → [9♣]; Joker moves to player's hand
        combo = [9♠ 9♥ 9♦ 9♣]; player hand gains Joker
```

### Scenario 10 — Joker claim from 2-natural-card set (both missing suits required)

```
State: ACTING phase, player melded, table has [9♠ 9♥ [Joker]]
       Player hand contains [9♦, 9♣]
Action: player taps "Claim" badge
Expected (automatic):
        getClaimableJokerCards returns [9♦, 9♣]
        engine adds [9♦, 9♣] to combo; Joker moves to player's hand
        combo = [9♠ 9♥ 9♦ 9♣]; player hand gains Joker, loses 9♦ and 9♣
```

### Scenario 11 — Joker claim from 2-natural-card set (player holds only 1 of 2 missing suits)

```
State: ACTING phase, player melded, table has [9♠ 9♥ [Joker]]
       Player hand contains [9♦] but NOT [9♣]
Expected: getClaimableJokerCards returns null; "Claim" badge not shown; no action possible
```

### Scenario 12 — Joker claim from sequence (unambiguous position)

```
State: ACTING phase, player melded, table has [5♣ [Joker] 7♣] (Joker = 6♣)
       Player hand contains [6♣]
Action: player taps "Claim" badge
Expected: combo becomes [5♣ 6♣ 7♣]; Joker moves to player's hand
```

### Scenario 13 — Table displayed in player turn order

```
State: 3 players — P1, P2, P3 (turn order: P1→P2→P3)
       P3 melds first (inserts first in tableState.combinations)
       P1 melds second; P2 melds third
Expected table display order: P1's combinations → P2's → P3's
(turn order, not insertion order)
```

### Scenario 14 — Cancel staged meld

```
State: ACTING phase, player not melded, stagedCombinations = [[5♠ 6♠ 7♠]]
Action: player taps "Cancel Meld"
Expected: stagedCombinations cleared; selection cleared; "Stage" button reappears;
          no engine call made; hand unchanged
```

---

## Testing Checklist

### Engine unit tests (`src/engine/__tests__/actions/claimJoker.test.ts`)

- [x] Existing: successful claim from 3-card sequence
- [x] Existing: `NOT_YOUR_TURN`, `JOKER_CLAIM_WRONG_CARD`, `JOKER_CLAIM_BREAKS_COMBINATION`
- [ ] New: claim from 4-card set (3 naturals + Joker) with 1 replacement card → success
- [ ] New: claim from 3-card set (2 naturals + Joker) with both missing suits → success
- [ ] New: claim from 3-card set with only 1 of 2 missing suits → `JOKER_CLAIM_AMBIGUOUS_SET`

### Engine unit tests (`src/engine/__tests__/validation.test.ts`)

- [ ] New: `getClaimableJokerCards` — combo with no Joker → null
- [ ] New: `getClaimableJokerCards` — sequence, player holds required card → [card]
- [ ] New: `getClaimableJokerCards` — sequence, player missing required card → null
- [ ] New: `getClaimableJokerCards` — 4-card set, player holds 1 missing suit → [card]
- [ ] New: `getClaimableJokerCards` — 3-card set, player holds both missing suits → [card1, card2]
- [ ] New: `getClaimableJokerCards` — 3-card set, player holds only 1 missing suit → null

### Component tests (`src/components/game/__tests__/ActionBar.test.tsx`)

- [x] Existing: DRAWING phase all disabled; ACTING unmelded; ACTING melded
- [ ] New: ACTING + not melded + no staged: "Stage" enabled (if hasSelectedCards), no Meld button
- [ ] New: ACTING + not melded + staged (< 51 pts): "Stage" + "Cancel" visible; "Meld" disabled
- [ ] New: ACTING + not melded + staged (≥ 51 pts): "Meld" enabled
- [ ] New: ACTING + melded: original ActionBar unchanged (LayOff, Discard, ClaimJoker)

### Component tests (`src/components/game/__tests__/StagedMeldPreview.test.tsx`)

- [ ] New: renders each staged combination as a card row
- [ ] New: shows running point total
- [ ] New: "Cancel" button calls onCancel
- [ ] New: hidden when stagedCombinations is empty

### Screen integration tests (`src/screens/__tests__/GameBoardScreen.test.tsx`)

- [x] Existing: happy path draw + discard; invalid meld; HandOffOverlay
- [ ] New: multi-combination meld (Scenario 2 above)
- [ ] New: Joker claim from 3-card set with both suits (Scenario 10)
- [ ] New: claim badge absent when player holds only 1 of 2 missing suits (Scenario 11)
- [ ] New: table combinations rendered in turn order, not insertion order (Scenario 13)
- [ ] New: cancel staged meld (Scenario 14)
