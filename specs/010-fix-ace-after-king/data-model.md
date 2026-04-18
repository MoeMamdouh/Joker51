# Data Model: Fix Ace-After-King Sequence Validation

**Feature**: 010-fix-ace-after-king  
**Date**: 2026-04-18

---

## No New Entities

This fix introduces no new data types, state shape, or storage keys. All changes are confined to pure functions in the engine and UI helper layers.

---

## Affected Logic Model

### `isAceHigh` Determination Rule (new helper)

**Inputs**:
- `nonJokers: Card[]` — non-Joker cards in the combination
- `jokerCount: number` — number of Joker cards in the combination

**Output**: `boolean` — whether Ace should be treated as rank index 13 (high)

**Rule**:
```
Ace is HIGH when:
  - Ace is present in nonJokers
  - AND (King is present in nonJokers
      OR maxNonAceRankIndex + jokerCount >= 12)  // 12 = KING rank index
```

**Examples**:

| Non-Jokers | Jokers | Result | Reason |
|------------|--------|--------|--------|
| J, Q, A | 1 | HIGH | Q(11)+1=12 ≥ 12 |
| J, A | 2 | HIGH | J(10)+2=12 ≥ 12 |
| Q, K, A | 0 | HIGH | hasKing=true |
| A, 2, 3 | 0 | LOW | max non-ace=THREE(2), 2+0=2 < 12 |
| A, 2 | 0 | LOW | max non-ace=TWO(1), 1+0=1 < 12 |

---

### Sequence Validation — Rank Index Mapping (updated)

**Before fix**:
- `ACE` always maps to index `0`; `aceHigh` only triggered by `hasAce && hasKing` (natural King required)

**After fix**:
- `ACE` maps to index `0` by default
- When `isAceHigh(nonJokers, jokerCount) === true`: `ACE` maps to virtual index `13`

---

### LayOff Position Detection — Boundary Rule (updated)

**Effective sequence boundary** (accounts for boundary Jokers):
```
trailingJokers = count of contiguous Jokers from the END of the combination array
effectiveMax   = maxNaturalRankIndex + trailingJokers
```

**Ace layoff rule (new)**:
```
if (card.rank === ACE && effectiveMax === 12):
  position = 'end'   // Ace-high follows a King-terminated sequence
```

**Existing rules** (unchanged):
```
fitsEnd   = cardIdx === effectiveMax + 1  (updated to use effectiveMax)
fitsStart = cardIdx === minNaturalRankIndex - 1
```

---

### Joker Substituted Value — Scoring (updated)

For a combination containing Joker(s) and Ace:
- **Before**: Ace always at index 0; gap range spans from 0 (ACE-low) to max non-Joker rank; Joker incorrectly assigned lowest gap rank
- **After**: When `isAceHigh` → Ace at index 13; gaps are correctly identified in the K(12) range; Joker correctly assigned King's point value (10 pts)

---

## Existing Data Types (unchanged)

| Type | Location | Notes |
|------|----------|-------|
| `Card` | `src/engine/types.ts` | No change |
| `Combination` | `src/engine/types.ts` | No change |
| `RANK_ORDER` | `src/engine/types.ts` | No change — indices 0-12, ACE-high is virtual 13 |
| `RANK_POINTS` | `src/engine/types.ts` | No change — KING=10, ACE=11 |
| `GameState` | `src/engine/types.ts` | No change |
