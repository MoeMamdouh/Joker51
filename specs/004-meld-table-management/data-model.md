# Data Model: Meld & Table Management

**Feature**: `004-meld-table-management`
**Date**: 2026-04-12

All types live in `src/engine/types.ts` unless noted. Phase 4 extends existing types; no new top-level entities are introduced.

---

## Existing Types (unchanged)

### `Combination`
```ts
interface Combination {
  readonly id: string;              // UUID — stable reference used by lay-off and Joker claim
  readonly cards: readonly Card[];  // Ordered; Jokers at their substituted positions
  readonly type: 'sequence' | 'set';
  readonly ownerId: string;         // Player who placed this combination (never changes)
}
```

### `TableState`
```ts
interface TableState {
  readonly combinations: readonly Combination[];  // Insertion order; Phase 4 sorts at read time
}
```

### `Card`
```ts
interface Card {
  readonly rank: Rank | null;   // null when isJoker
  readonly suit: Suit | null;   // null when isJoker
  readonly isJoker: boolean;
}
```

---

## Existing Types (changed)

### `TurnState` — new field (in `types.ts`)

```ts
interface TurnState {
  readonly activePlayerId: string;
  readonly phase: TurnPhase;
  readonly discardDrawnBeforeMeld: Card | null;  // NEW — the discard-pile card drawn by a non-melded player this turn
}
```

**Lifecycle:**
- Initialized to `null` in `deal.ts` at the start of each turn/round.
- Set to the drawn card in `draw.ts` when a non-melded player draws from the discard pile.
- Kept `null` when drawing from the draw pile, or when the active player is already melded.
- Validated in `meld.ts` (`placeInitialMeld`) — if non-null, the card must appear in at least one submitted combination.
- Reset to `null` in `discard.ts` when building the next player's `TurnState`.

---

## Engine Changes

### `EngineErrorCode` — new variants (in `types.ts`)

```ts
// ADD to EngineErrorCode union:
| 'JOKER_CLAIM_AMBIGUOUS_SET'   // Player provided 1 card for a 2-natural-card set (2 required)
| 'DRAWN_DISCARD_NOT_IN_MELD'   // Non-melded player drew from discard but did not include that card in the meld
```

### New engine action: `placeCombinations` (in `actions/placeCombinations.ts`)

```ts
export function placeCombinations(
  state: GameState,
  params: { playerId: string; combinations: Card[][] }
): ActionResult
```

**Rules:**
- `meldedPlayerIds` must include `params.playerId` — returns `PLAYER_NOT_YET_MELDED` if not.
- Each combination validated with `validateCombination(combo, { isInitialMeld: false })`.
- No 51-point threshold.
- Adds all combinations to `tableState.combinations` (new UUIDs generated per combination).
- Does NOT modify `meldedPlayerIds` (player is already melded).
- Cards removed from the player's hand.

### `claimJoker` params change (in `actions/claimJoker.ts`)

```ts
// BEFORE (Phase 3):
params: { playerId: string; combinationId: string; realCard: Card }

// AFTER (Phase 4):
params: { playerId: string; combinationId: string; realCards: Card[] }
```

**Validation rules for `realCards`:**

| Combination context | Required `realCards` count | Rejection if wrong count |
|---|---|---|
| Sequence (any length) | 1 — the card at the Joker's position | `JOKER_CLAIM_WRONG_CARD` |
| Set with 3 natural cards | 1 — the one missing suit | `JOKER_CLAIM_WRONG_CARD` |
| Set with 2 natural cards | 2 — both missing suits | `JOKER_CLAIM_AMBIGUOUS_SET` |

**Post-claim state:**
- Each card in `realCards` is removed from the player's hand.
- The Joker is added to the player's hand.
- The combination's `cards` array is updated: Joker removed, natural cards inserted at their correct positions.
- `validateCombination(updatedCards, { isInitialMeld: false })` must pass — engine rejects if not.

---

## New Engine Helper (in `validation.ts`)

### `getClaimableJokerCards`

```ts
export function getClaimableJokerCards(
  combination: Combination,
  playerHand: readonly Card[]
): Card[] | null
```

**Returns**: the `Card[]` the player must provide to claim the Joker in `combination`, or `null` if:
- The combination has no Joker, or
- The player's hand does not contain all required replacement cards.

**Logic:**
1. Find Joker in `combination.cards`. If none → return `null`.
2. Determine required replacement cards:
   - **Sequence**: identify gap rank+suit at Joker's position → `[{ rank, suit, isJoker: false }]`.
   - **Set with 3 natural cards**: find the one suit not present → `[{ rank, suit, isJoker: false }]`.
   - **Set with 2 natural cards**: find both missing suits → `[card1, card2]`.
3. Check that the player's hand contains each required card (reference equality by rank+suit). If any is missing → return `null`.
4. Return the array of required cards.

---

## UI State Changes (in `GameBoardScreen.tsx`)

### Meld builder state

```ts
// NEW local state
const [stagedCombinations, setStagedCombinations] = useState<Card[][]>([]);

// Derived — threshold differs by meld status
const stagedPointTotal: number = calculateMeldPoints(stagedCombinations);  // from engine/validation
const meldReady: boolean = hasMelded
  ? stagedCombinations.length > 0          // already melded: any staged combo is enough
  : stagedPointTotal >= 51;                // initial meld: 51-point minimum
```

**Lifecycle:**
- `handleStageCombination()`: validate `selectedCards` form a valid single combination (via engine `validateCombination`); if valid push to `stagedCombinations`, clear selection.
- `handleConfirmMeld()`: call `actions.placeMeld(stagedCombinations)` (updated to accept `Card[][]`); on success clear `stagedCombinations` and selection.
- `handleCancelMeld()`: clear `stagedCombinations` and selection.

### Table order derivation

```ts
// Derive ordered combinations once per render
const orderedCombinations = [...tableState.combinations].sort((a, b) => {
  const ia = config.players.findIndex(p => p.id === a.ownerId);
  const ib = config.players.findIndex(p => p.id === b.ownerId);
  return ia - ib;
});
```

---

## i18n Additions

`src/i18n/en.json` and `src/i18n/ar.json` under `game.errors`:

| Key | EN value | AR value |
|---|---|---|
| `jokerClaimAmbiguousSet` | "Select both missing suit cards to claim this Joker" | (Arabic translation) |
| `drawnDiscardNotInMeld` | "Drawn discard card must be used in this meld" | (Arabic translation) |

Under `game.actions`:

| Key | EN value | AR value |
|---|---|---|
| `stageCombination` | "Stage" | (Arabic translation) |
| `confirmMeld` | "Confirm Meld" | (Arabic translation) |
| `cancelMeld` | "Cancel Meld" | (Arabic translation) |

Under `game` (top level):

| Key | EN value | AR value |
|---|---|---|
| `stagedPoints` | "{{points}} pts staged" | (Arabic translation) |
