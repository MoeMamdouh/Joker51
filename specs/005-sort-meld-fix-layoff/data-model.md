# Data Model: Sort Melded Cards & Fix Lay-Off

**Branch**: `005-sort-meld-fix-layoff` | **Date**: 2026-04-12

No new entities or stored fields are introduced. This feature adds a **sort invariant** to the existing `Combination` entity and a **derived computation** for lay-off position.

---

## Modified Entity: Combination

**Existing definition** (`src/engine/types.ts`):
```
Combination {
  id: string          (unchanged)
  cards: Card[]       (unchanged — now carries a sort invariant)
  type: 'sequence' | 'set'  (unchanged)
  ownerId: string     (unchanged)
}
```

**New invariant on `cards`**:

> After any mutation that creates or modifies a `Combination`, the `cards` array MUST be sorted according to the rules below before being stored in `GameState.tableState.combinations`.

### Sort rules for sequences

1. Identify whether Ace is high: `aceHigh = cards contains Ace AND cards contains King`.
2. Assign a logical rank index to each natural card:
   - `Ace` → 13 if `aceHigh`, else 0
   - All other ranks → `RANK_ORDER.indexOf(rank)` (TWO=1 … KING=12)
3. Sort natural cards ascending by logical rank index.
4. Re-insert each Joker at the index where the missing rank would fall between its adjacent natural cards.

### Sort rules for sets

1. Fixed suit order: SPADES (0) → HEARTS (1) → DIAMONDS (2) → CLUBS (3).
2. Sort natural cards ascending by suit index.
3. Re-insert each Joker at the first suit-order position not occupied by a natural card.

### Mutation sites where sort MUST be applied

| File | Function | When to sort |
|------|----------|-------------|
| `src/engine/actions/meld.ts` | `placeInitialMeld` | Each new `Combination` before adding to `tableState` |
| `src/engine/actions/placeCombinations.ts` | `placeCombinations` | Each new `Combination` before adding to `tableState` |
| `src/engine/actions/layOff.ts` | `layOff` | Updated combination's `cards` after card insertion |
| `src/engine/actions/claimJoker.ts` | `claimJoker` | Updated combination's `cards` after swap (both sequence and set paths) |
| `src/hooks/useSavedSession.ts` | `useSavedSession` (load path) | All combinations after JSON.parse, before returning `GameState` |

---

## Derived Value: LayOffPosition

**Not stored** — computed at action time inside `layOff`.

```
LayOffPosition = 'start' | 'end'

Detection algorithm:
  naturalCards  = combination.cards.filter(not Joker)
  rankIndex(r)  = aceHigh ? (r === ACE ? 13 : RANK_ORDER[r]) : RANK_ORDER[r]
  minIdx        = min(rankIndex(c.rank) for c in naturalCards)
  maxIdx        = max(rankIndex(c.rank) for c in naturalCards)
  incomingIdx   = rankIndex(incoming.rank)

  if incomingIdx === minIdx - 1  →  position = 'start'
  if incomingIdx === maxIdx + 1  →  position = 'end'
  if both valid                  →  position = 'end'  (default)
  if neither valid               →  reject with INVALID_COMBINATION
```

**Edge cases**:
- Combination has only 1 card: minIdx === maxIdx; incoming -1 → start, incoming +1 → end.
- Combination contains only Jokers (minIdx undefined): treat as no natural boundary, reject.
- Ace boundaries in A-2-3: minIdx = 0 (Ace low), incoming TWO → end (idx 1 = 0 + 1).
- Ace boundaries in Q-K-A: maxIdx = 13 (Ace high), no card above it → only prepend (Q) is valid from the low side.

---

## New Utility: `sortCombinationCards`

**Location**: `src/engine/sort.ts`  
**Signature**: `sortCombinationCards(cards: readonly Card[], type: 'sequence' | 'set'): Card[]`  
**Pure function**: no side effects, no imports from React/UI layers.  
**Exported from**: `src/engine/index.ts` (for use in tests and future features).
