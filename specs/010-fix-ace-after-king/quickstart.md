# Quickstart: Fix Ace-After-King Sequence Validation

**Feature**: 010-fix-ace-after-king  
**Date**: 2026-04-18

---

## Prerequisites

Node.js and npm installed. All existing dependencies present (`node_modules/`).

---

## Run the Tests

```bash
# Run the full test suite (required before and after changes)
npm test

# Run only engine validation tests (fastest feedback loop)
npx jest src/engine/__tests__/validation.test.ts --watch

# Run only layOff tests (new file)
npx jest src/engine/__tests__/layOff.test.ts --watch

# Run only jokerPlacement logic tests (new file)
npx jest src/components/game/__tests__/jokerPlacement.test.ts --watch
```

---

## TDD Workflow (Constitution §III)

1. **Write failing tests first** — add the new test cases to validation.test.ts; confirm they fail (`npm test`)
2. **Create the new test files** — `layOff.test.ts` and `jokerPlacement.test.ts` with failing cases
3. **Implement `isAceHigh` helper** in `src/engine/validation.ts`
4. **Fix `validateAsSequence`** — use `isAceHigh`
5. **Fix `detectLayOffPosition`** in `src/engine/actions/layOff.ts`
6. **Fix `jokerSubstitutedValue`** in `src/engine/validation.ts`
7. **Fix `computeJokerSequenceOptions`** in `src/components/game/jokerPlacement.ts`
8. **Update `getClaimableJokerCards` / `getClaimableJokerIndex`** for consistency
9. **Run full suite** — `npm test && npm run lint`

---

## Key Files

| File | Change Type |
|------|-------------|
| `src/engine/validation.ts` | Fix — aceHigh helper + 4 function fixes |
| `src/engine/actions/layOff.ts` | Fix — detectLayOffPosition |
| `src/components/game/jokerPlacement.ts` | Fix — computeJokerSequenceOptions |
| `src/engine/__tests__/validation.test.ts` | Tests — add ace-after-joker-king cases |
| `src/engine/__tests__/layOff.test.ts` | Tests — new file |
| `src/components/game/__tests__/jokerPlacement.test.ts` | Tests — new file |

---

## Reproducing the Bug (before fix)

```typescript
import { validateCombination } from './src/engine/validation';
import { Rank, Suit } from './src/engine/types';

const c = (rank, suit) => ({ rank, suit, isJoker: false });
const joker = () => ({ rank: null, suit: null, isJoker: true });

// BUG: Should be valid, currently INVALID
validateCombination(
  [c(Rank.JACK, Suit.HEARTS), c(Rank.QUEEN, Suit.HEARTS), joker(), c(Rank.ACE, Suit.HEARTS)],
  { isInitialMeld: false }
);
// → { valid: false, error: 'SEQUENCE_NOT_CONSECUTIVE' }

// BUG: Should be valid, currently INVALID
validateCombination(
  [c(Rank.TEN, Suit.HEARTS), joker(), c(Rank.QUEEN, Suit.HEARTS), c(Rank.KING, Suit.HEARTS), c(Rank.ACE, Suit.HEARTS)],
  { isInitialMeld: false }
);
// → { valid: false, error: 'SEQUENCE_NOT_CONSECUTIVE' }
// (detectLayOffPosition returns null before validation is reached)
```

---

## Lint & Type Check

```bash
npm run lint
npx tsc --noEmit
```
