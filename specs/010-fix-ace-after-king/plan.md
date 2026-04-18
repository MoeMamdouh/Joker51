# Implementation Plan: Fix Ace-After-King Sequence Validation

**Branch**: `009-hand-sort-enhancements` | **Date**: 2026-04-18 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/010-fix-ace-after-king/spec.md`

## Summary

Two related engine bugs prevent players from placing an Ace after a King-terminated run:

1. `validateAsSequence` and `jokerSubstitutedValue` in `validation.ts` use `aceHigh = hasAce && hasKing`, which only detects Ace-high when a **natural** King is present. When the King position is occupied by a Joker, `aceHigh` stays `false` and Ace is treated as low (rank index 0), causing correct K-A endings to fail validation.

2. `detectLayOffPosition` in `layOff.ts` has the same flaw — and is worse, because it checks the *existing* combination for Ace, but when laying off Ace the card isn't there yet, so `aceHigh` is always `false` for layoffs. The function returns `null` (invalid position) before validation is even reached.

The fix introduces an `isAceHigh(nonJokers, jokerCount)` helper that correctly detects Ace-high when Jokers could represent King, and applies it consistently across all four affected sites. `detectLayOffPosition` also gains trailing-Joker awareness for boundary detection.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)  
**Primary Dependencies**: Pure engine logic — no React, no Expo, no new packages  
**Storage**: N/A  
**Testing**: Jest + ts-jest (`npm test`)  
**Target Platform**: Engine is platform-agnostic; UI fix in React Native component helper  
**Project Type**: Mobile app (Expo SDK ~54) with pure-TypeScript engine layer  
**Performance Goals**: Pure function computation — no performance concerns  
**Constraints**: No `any` without eslint-disable; strict TypeScript throughout  
**Scale/Scope**: 6 files changed, ~50 lines net diff

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game Rule Fidelity | ✅ PASS | Fix aligns with §6 of `joker51_game_rules.md` (Ace dual-position) |
| II. Layered Architecture | ✅ PASS | Engine fix in `src/engine/`; component fix in `src/components/game/`; no cross-layer violation |
| III. Test-First Game Logic | ⚠️ REQUIRED | TDD mandatory — failing tests must be written before implementation |
| IV. Cross-Platform | ✅ N/A | Engine logic; no platform-specific code |
| V. State Predictability | ✅ PASS | All changed functions are pure (no side effects) |
| VI. Multilingual Support | ✅ N/A | No user-facing strings changed |
| VII. Design System | ✅ N/A | No visual changes |
| VIII. Simplicity | ✅ PASS | `isAceHigh` helper justified (logic appears in 4 locations); minimal targeted change |

**Post-design re-check**: ✅ All pass. No complexity violations.

## Project Structure

### Documentation (this feature)

```text
specs/010-fix-ace-after-king/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (files changed)

```text
src/
├── engine/
│   ├── validation.ts                    ← Fix: isAceHigh helper + 4 functions
│   ├── actions/
│   │   └── layOff.ts                    ← Fix: detectLayOffPosition
│   └── __tests__/
│       ├── validation.test.ts           ← Tests: add ace-after-joker-king cases (TDD first)
│       └── layOff.test.ts               ← Tests: new file (TDD first)
└── components/
    └── game/
        ├── jokerPlacement.ts            ← Fix: computeJokerSequenceOptions
        └── __tests__/
            └── jokerPlacement.test.ts   ← Tests: new file (TDD first)
```

**Structure Decision**: Single project layout — all changes within existing `src/` tree. No new directories, no new packages.

---

## Phase 0: Research

**Status**: Complete — see `research.md`

### Key Findings

1. **Root cause confirmed**: `aceHigh = hasAce && hasKing` ignores Joker-as-King in all four affected functions.

2. **`detectLayOffPosition` is the first failure point** (layoff flow): `fitsEnd` check uses `cardIdx(ACE)=0` (low), which never matches `maxIdx+1` for any sequence ending above rank index 0. The fix requires:
   - Computing `effectiveMax = maxNaturalRankIndex + trailingJokers`
   - Special-casing Ace: if `effectiveMax === 12` (King rank index), Ace-high(13) fits at 'end'

3. **`jokerSubstitutedValue` secondary bug** (scoring): Without aceHigh awareness, Joker representing King in a K-A ending run is assigned ~2 points instead of 10. Affects 51-point initial meld threshold calculation.

4. **`computeJokerSequenceOptions` in jokerPlacement.ts** (UI): Returns `[]` for staged `[J, Q, Joker, A]` — no Joker placement options shown.

5. **`isAceHigh` abstraction warranted** — same logic appears in 4+ files (constitution §VIII threshold: "three or more places").

6. **Out of scope**: `K, Joker, A` is currently accepted (pre-existing; gaps=0 ≤ jokerCount=1 passes the gap check). Fixing requires a separate "no surplus Joker" validation pass.

### `isAceHigh` Logic

```typescript
function isAceHigh(nonJokers: Card[], jokerCount: number): boolean {
  if (!nonJokers.some(c => c.rank === Rank.ACE)) return false;
  if (nonJokers.some(c => c.rank === Rank.KING)) return true;
  const nonAceRankIndices = nonJokers
    .filter(c => c.rank !== Rank.ACE)
    .map(c => RANK_ORDER.indexOf(c.rank as Rank));
  const maxNonAce = nonAceRankIndices.length > 0 ? Math.max(...nonAceRankIndices) : -1;
  return maxNonAce >= 0 && maxNonAce + jokerCount >= RANK_ORDER.indexOf(Rank.KING);
}
```

---

## Phase 1: Design & Contracts

### Change 1: `src/engine/validation.ts`

**Add helper** (before the public API section):
```typescript
function isAceHigh(nonJokers: Card[], jokerCount: number): boolean {
  // ... as above
}
```

**Fix `validateAsSequence`** — replace:
```typescript
const aceHigh = hasAce && hasKing;
```
with:
```typescript
const aceHigh = isAceHigh(nonJokers, jokerCount);
```

**Fix `jokerSubstitutedValue`** — add aceHigh-aware rank indexing:
```typescript
const nonJokers = cards.filter(c => !c.isJoker);
const jokerCount = cards.filter(c => c.isJoker).length;
const aceHigh = isAceHigh(nonJokers, jokerCount);
const rankIdx = (rank: Rank): number =>
  rank === Rank.ACE && aceHigh ? 13 : RANK_ORDER.indexOf(rank);
const rankIndices = nonJokers.map(c => rankIdx(c.rank as Rank)).sort((a, b) => a - b);
// ... rest of function uses rankIndices
```

**Fix `getClaimableJokerCards` and `getClaimableJokerIndex`** — same one-line swap:
```typescript
const aceHigh = isAceHigh(nonJokers, combination.cards.filter(c => c.isJoker).length);
```

### Change 2: `src/engine/actions/layOff.ts`

**Fix `detectLayOffPosition`**:
```typescript
// After computing naturals, indices, minIdx, maxIdx:

// Compute effective max including trailing Jokers
let trailingJokers = 0;
for (let i = combination.length - 1; i >= 0; i--) {
  if (combination[i].isJoker) trailingJokers++;
  else break;
}
const effectiveMax = maxIdx + trailingJokers;

// Ace-high layoff: Ace fits at end when sequence ends at King (rank 12)
if (card.rank === Rank.ACE && effectiveMax === RANK_ORDER.indexOf(Rank.KING)) {
  return 'end';
}

const cardIdx = rankIdx(card.rank as Rank);
const fitsEnd = cardIdx === effectiveMax + 1;  // updated: use effectiveMax
const fitsStart = cardIdx === minIdx - 1;
```

### Change 3: `src/components/game/jokerPlacement.ts`

**Fix `computeJokerSequenceOptions`** — replace inline aceHigh computation:

Option A: Import `isAceHigh` from engine (recommended — single source of truth):
```typescript
import { isAceHigh } from '../../engine/validation';
// ...
const aceHigh = isAceHigh(naturals, jokerCount);
```

Option B: Inline equivalent logic (avoids import but duplicates):
```typescript
const aceHigh = (() => {
  if (!naturals.some(c => c.rank === Rank.ACE)) return false;
  if (naturals.some(c => c.rank === Rank.KING)) return true;
  const maxNonAce = Math.max(-1, ...naturals
    .filter(c => c.rank !== Rank.ACE)
    .map(c => RANK_ORDER.indexOf(c.rank!)));
  return maxNonAce >= 0 && maxNonAce + jokerCount >= RANK_ORDER.indexOf(Rank.KING);
})();
```

**Recommendation**: Option A — import from engine. The helper is exported; `jokerPlacement.ts` (component layer) importing from engine is allowed per layered architecture.

### No New Contracts

This is a pure logic fix. No new public API surfaces, no new endpoints, no new state keys. The existing `validateCombination` signature is unchanged.

### Agent Context Update

```bash
bash .specify/scripts/bash/update-agent-context.sh claude
```

No new technology introduced — nothing to add to agent context beyond what exists.
