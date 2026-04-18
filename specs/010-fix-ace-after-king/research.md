# Research: Fix Ace-After-King Sequence Validation

**Feature**: 010-fix-ace-after-king  
**Date**: 2026-04-18

---

## 1. Game Rule Confirmation

**Decision**: Ace is a dual-position card: low (before 2) or high (after King). No wrap-around.  
**Source**: `joker51_game_rules.md` §6 — *"High (14): `Q♠ K♠ A♠` ✅ | Wrap-around `K♠ A♠ 2♠` ❌ NOT allowed"*  
**Alternatives considered**: Ace-only-low (rejected — contradicts game rules); wrap-around (rejected by §6 explicitly).

---

## 2. Bug Root Cause Analysis

### Primary site: `validateAsSequence` (`src/engine/validation.ts:234`)

```typescript
const aceHigh = hasAce && hasKing;  // BUG: hasKing only checks natural (non-Joker) cards
```

When Joker represents King, `hasKing = false`, so `aceHigh = false`, and Ace is mapped to rank index **0** (low).  

For `[J♥, Q♥, Joker, A♥]`:
- With `aceHigh=false`: indices=[0,10,11], span=11, gaps=9, jokerCount=1 → **INVALID** ❌
- With `aceHigh=true`: indices=[10,11,13], span=3, gaps=1, jokerCount=1 → **VALID** ✓

### Secondary site: `detectLayOffPosition` (`src/engine/actions/layOff.ts:32`)

Same `aceHigh = hasAce && hasKing` pattern. But worse: `hasAce` checks the *existing* combination, and when the user lays off Ace onto a table run, Ace is NOT in the combination yet — so `hasAce=false` and `aceHigh=false` always.

Ace is mapped to rank index 0. For `[10♥, Joker, Q♥, K♥]` + Ace:
- `maxIdx=12` (King), `cardIdx(ACE)=0`. `fitsEnd: 0 === 13`? No. `fitsStart: 0 === 8`? No → returns `null` → **INVALID COMBINATION** error before validation even runs.

For `[J♥, Q♥, Joker]` + Ace:
- `maxIdx=11` (Queen), Joker is trailing. `fitsEnd: 0 === 12`? No → **INVALID** ❌

### Tertiary site: `jokerSubstitutedValue` (`src/engine/validation.ts:287`)

Always uses `RANK_ORDER.indexOf` (no aceHigh awareness). For `[J, Q, Joker, A]` scoring:
- Without aceHigh: indices=[0(ACE),10(J),11(Q)], gaps=[1..9], Joker assigned rank=TWO(1) → **2 pts** (wrong)
- With aceHigh: indices=[10(J),11(Q),13(ACE)], gap=[12(K)], Joker assigned KING → **10 pts** ✓

This bug causes incorrect initial meld threshold calculation (51 points) for Ace-high runs.

### Quaternary site: `computeJokerSequenceOptions` (`src/components/game/jokerPlacement.ts:57`)

Same `aceHigh = hasAce && hasKing` pattern — affects Joker Placement UI when staging a new Ace-high combination. Without fix, returns `[]` (no valid options) for `[J, Q, Joker, A]`.

### Notes on `getClaimableJokerCards` / `getClaimableJokerIndex`

These functions compute Joker rank **positionally** (from neighboring cards), so they mostly work correctly even with wrong `aceHigh`. Edge cases exist but are lower priority than the validation and layoff bugs.

---

## 3. Fix Strategy

**Decision**: Extract `isAceHigh(nonJokers, jokerCount)` helper; use it in all affected sites.  
**Rationale**: Same logic appears in 4+ locations → abstraction warranted per constitution §VIII ("introduced only when logic appears in three or more places").

### `isAceHigh` logic

Ace is high when:
1. Natural King is present (existing check — preserved for clarity), OR
2. The highest non-Ace non-Joker rank + available Jokers can reach King (rank index 12)

```
isAceHigh = hasAce && (
  hasKing ||
  (maxNonAceRankIndex >= 0 && maxNonAceRankIndex + jokerCount >= RANK_ORDER.indexOf(KING))
)
```

**Verified scenarios**:

| Combination | maxNonAce | jokerCount | maxNonAce+J | >=12 | aceHigh |
|-------------|-----------|------------|-------------|------|---------|
| J(10), Q(11), Joker, A | 11 | 1 | 12 | ✓ | true |
| J(10), Joker, Joker, A | 10 | 2 | 12 | ✓ | true |
| 10(9), J(10), Q(11), Joker, A | 11 | 1 | 12 | ✓ | true |
| A, 2, 3 (no Joker) | 2 | 0 | 2 | ✗ | false |
| A, Joker, 3 | 2 | 1 | 3 | ✗ | false |
| Q, K, A (natural) | — | 0 | hasKing=true | — | true |

### `detectLayOffPosition` fix

Two changes:
1. Compute `effectiveMax = maxIdx + trailingJokers` (trailing Jokers extend the sequence boundary)
2. When `card.rank === ACE && effectiveMax === 12 (King)`: return `'end'` (Ace fits as high card)

```
trailingJokers = count of consecutive Jokers from end of combination
effectiveMax   = maxNaturalRankIndex + trailingJokers
if (card is ACE && effectiveMax === 12) → 'end'
fitsEnd = cardIdx === effectiveMax + 1  (also updated for non-Ace correctness)
```

---

## 4. Scope Decision

**In scope**:
- `validateAsSequence` — primary validation fix
- `detectLayOffPosition` — layoff gating fix
- `jokerSubstitutedValue` — scoring correctness (FR-006)
- `computeJokerSequenceOptions` — Joker Placement UI fix
- `getClaimableJokerCards` / `getClaimableJokerIndex` — apply consistent aceHigh helper

**Out of scope** (pre-existing, separate issue):
- `K, Joker, A` currently passes validation (`gaps=0 ≤ jokerCount=1`) even though the Joker has no valid rank between K(12) and A-high(13). This requires a separate "no-gap Joker" fix.
- Leading Jokers not accounted for in `fitsStart` of `detectLayOffPosition` (separate issue).

---

## 5. RANK_ORDER Reference

```
Index 0=ACE, 1=TWO, ..., 9=TEN, 10=JACK, 11=QUEEN, 12=KING
Virtual 13=ACE (high)
```

---

## 6. Test Files to Modify

- `src/engine/__tests__/validation.test.ts` — add Ace-after-Joker-King cases (TDD first)
- `src/engine/__tests__/layOff.test.ts` — create new; test detectLayOffPosition edge cases
- `src/components/game/__tests__/jokerPlacement.test.ts` — create new; test computeJokerSequenceOptions
