# Research: Sort Melded Cards & Fix Lay-Off

**Branch**: `005-sort-meld-fix-layoff` | **Date**: 2026-04-12

No external research was required — all decisions are resolvable from the existing codebase.

---

## Decision 1: Where to implement the sort utility

**Decision**: New file `src/engine/sort.ts`  
**Rationale**: Keeps the engine modular (validation.ts stays focused on validation; sort.ts is its own pure concern). Each action file imports only what it needs. Mirrors the existing pattern of `validation.ts` as a shared engine utility.  
**Alternatives considered**:
- Inline sorting in each action file: rejected — duplicates logic across 4 files.
- Sorting inside `validateCombination`: rejected — validation is a read-only check; mutating card order there would violate single-responsibility and surprise callers.
- Sorting in the display layer only: rejected — spec and constitution require sorted state to be persisted (SC-005, Constitution §V).

---

## Decision 2: Lay-off position auto-detection strategy

**Decision**: Remove the optional `position` parameter from `layOff`; determine position by comparing the card's rank against the combination's natural boundary ranks.  
**Rationale**: The parameter was always optional and never passed by any caller (`useGameActions.ts` omits it, existing tests omit it). Removing it simplifies the API and prevents accidental misuse. Auto-detection logic: find the lowest and highest natural (non-Joker) rank in the combination; if the incoming card's rank is immediately below the lowest, it's a prepend; if immediately above the highest, it's an append; if neither, reject.  
**Alternatives considered**:
- Keep `position` and default it to auto-detect: adds unnecessary complexity and preserves a now-unused parameter.
- Auto-detect at the UI layer instead: rejected — Constitution §II requires game logic in the engine; the UI must not compute game outcomes.

---

## Decision 3: Ace position in sort

**Decision**: Contextual sort — Ace is placed at the high end (after King, logical index 13) when the combination contains a King; otherwise Ace is placed at the low end (logical index 0).  
**Rationale**: Agreed in clarification session 2026-04-12. The engine's `validateAsSequence` already uses `aceHigh = hasAce && hasKing` with remapping to index 13, so sort uses the same detection logic for consistency.  
**Alternatives considered**:
- Always sort Ace low (index 0): would rewrite Q-K-A as A-Q-K, making valid combinations unreadable.

---

## Decision 4: Joker position in sorted combinations

**Decision**: For sequences — Joker occupies the index of the missing rank between the sorted natural cards. For sets — Joker occupies the first position in the fixed suit order (SPADES → HEARTS → DIAMONDS → CLUBS) that is not filled by a natural card.  
**Rationale**: The Joker's structural identity is already established by the combination; sorting must preserve it. No new metadata is required.  
**Alternatives considered**:
- Always push Joker to the end: breaks visual identity (Q♠ J♥ [Joker] K♠ should read Q♠ [Joker] K♠, not Q♠ K♠ [Joker]).

---

## Decision 5: Session load retroactive sort

**Decision**: Apply sort in `useSavedSession.ts` after parsing the JSON, before returning the `GameState`.  
**Rationale**: `useSavedSession` is the single place where the persisted state enters the app. Sorting there covers all resume paths without touching the store or action files. The sort is a one-time pass over at most ~13 × ~8 cards.  
**Alternatives considered**:
- Sort in `gameStore.setGame`: affects all calls to `setGame`, including new games and in-turn state updates — over-broad and wasteful.
- Sort in `SetupScreen` when calling `setGame`: spreads game-logic into the UI layer (violates Constitution §II).
