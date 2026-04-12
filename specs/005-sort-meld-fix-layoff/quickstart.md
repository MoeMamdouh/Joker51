# Developer Quickstart: Sort Melded Cards & Fix Lay-Off

**Branch**: `005-sort-meld-fix-layoff` | **Date**: 2026-04-12

## What this feature changes

Two isolated engine fixes. No UI work, no new strings, no new screens.

| Area | Change |
|------|--------|
| `src/engine/sort.ts` | NEW — pure utility that sorts a combination's cards |
| `src/engine/actions/meld.ts` | Apply sort to each new combination |
| `src/engine/actions/placeCombinations.ts` | Apply sort to each new combination |
| `src/engine/actions/layOff.ts` | Auto-detect start/end position; apply sort after insertion |
| `src/engine/actions/claimJoker.ts` | Apply sort after card swap |
| `src/engine/index.ts` | Export `sortCombinationCards` |
| `src/hooks/useSavedSession.ts` | Sort all existing combinations when loading a saved session |

## TDD workflow (required by constitution)

Start with the sort utility tests — they drive the sort implementation, which everything else depends on:

```
1. Write src/engine/__tests__/sort.test.ts  (RED)
2. Implement src/engine/sort.ts             (GREEN)
3. Refactor if needed

4. Write layOff.test.ts prepend cases       (RED)
5. Modify src/engine/actions/layOff.ts      (GREEN)

6. Add sort assertions to meld/placeCombinations/claimJoker tests  (RED)
7. Apply sortCombinationCards in each action file                   (GREEN)

8. Write useSavedSession migration test     (RED)
9. Modify useSavedSession.ts                (GREEN)
```

## Run the test suite

```bash
npm test
```

Coverage for modified engine files must remain ≥ 90%.

## Key implementation notes

### sortCombinationCards for sequences

```
- Filter Jokers and natural cards separately
- Detect aceHigh: naturalCards has ACE and KING
- Assign rank indices (Ace = 13 if aceHigh, else 0)
- Sort natural cards by rank index ascending
- Re-insert each Joker at the gap position between natural cards
```

### sortCombinationCards for sets

```
- SUIT_ORDER: [SPADES, HEARTS, DIAMONDS, CLUBS]
- Sort natural cards by SUIT_ORDER index
- Re-insert each Joker at the first SUIT_ORDER position not occupied
```

### layOff auto-detection

```
- Get min/max rank index of natural cards in combination (same aceHigh logic)
- incoming card rankIdx:
    === minIdx - 1  →  prepend (insert at start)
    === maxIdx + 1  →  append (insert at end)
    both valid      →  append (default)
    neither         →  return { success: false, error: 'INVALID_COMBINATION' }
- After insertion, apply sortCombinationCards to the updated cards
```

### useSavedSession retroactive sort

```typescript
// After JSON.parse(raw) as GameState:
import { sortCombinationCards } from '../engine';

const migratedState: GameState = {
  ...parsed,
  tableState: {
    combinations: parsed.tableState.combinations.map(combo => ({
      ...combo,
      cards: sortCombinationCards(combo.cards, combo.type),
    })),
  },
};
```

## Acceptance test checklist (manual)

- [ ] Meld `8♠ 6♠ 7♠` → table shows `6♠ 7♠ 8♠`
- [ ] Lay off `5♠` on `6♠ 7♠ 8♠` → table shows `5♠ 6♠ 7♠ 8♠` (was blocked before fix)
- [ ] Lay off `9♠` on `6♠ 7♠ 8♠` → table shows `6♠ 7♠ 8♠ 9♠`
- [ ] Resume a saved session → existing combinations display sorted
- [ ] Q♠ K♠ A♠ → displays as `Q♠ K♠ A♠` (not `A♠ Q♠ K♠`)
