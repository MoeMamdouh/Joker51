# Research: Core Game Engine

**Feature**: `specs/001-core-game-engine/`
**Date**: 2026-04-12

---

## Decision 1: Error Communication — Codes, Not Strings

**Decision**: `ActionResult.error` MUST be a typed string literal (error code), not a
human-readable sentence. Example: `"MELD_BELOW_51_POINTS"` not `"Your meld must total at
least 51 points."`.

**Rationale**: The constitution (Principle VI) requires all user-facing strings to be
externalized in `src/i18n/{en,ar}.json`. If the engine returns raw English strings, those
bypass the translation system entirely. The UI layer maps error codes to translated messages.

**Alternatives considered**:
- Raw English strings — rejected (breaks i18n, hard-codes language in engine)
- Numeric error codes — rejected (opaque, hard to debug)
- Structured error objects `{ code, context }` — deferred to planning; start with string
  literals and extend later if context values (e.g., actual point total) are needed for
  message interpolation.

**Impact**: FR-015 and `ActionResult` entity updated to use `error` as a string literal
union type. A canonical list of error codes is defined in `data-model.md`.

---

## Decision 2: Shuffle Algorithm

**Decision**: Fisher-Yates (Knuth) shuffle — iterate from the last element to the first,
swapping each with a randomly chosen element at or before it.

**Rationale**: O(n) time, O(1) space, produces a uniformly random permutation. It is the
standard algorithm for card game implementations. The injected `random()` function replaces
`Math.random()` directly in the swap index calculation, making it trivially testable with a
seeded source.

**Alternatives considered**:
- `Array.sort(() => Math.random() - 0.5)` — rejected (non-uniform distribution, unreliable)
- Crypto random — unnecessary; cryptographic strength is not required for a card game

---

## Decision 3: Joker Substituted Value Calculation

**Decision**: In a sequence, a Joker's substituted value equals the rank that fills the gap
between its neighbors. In a set, a Joker's substituted value equals the rank of the other
cards in the set.

**Rationale**: The game rules state the Joker substitutes "any card". For the 51-point meld
threshold, using the positional value (what the Joker *represents*) is consistent with how
the game is played in practice and documented in the spec assumptions.

**Algorithm for sequences**:
- Sort non-Joker cards by rank.
- Infer the Joker's position from the gap (e.g., `5♣ _ 7♣` → Joker = 6, value = 6).
- If multiple gaps exist (more than one Joker is only possible after the initial meld), each
  Joker fills the next sequential gap.

**Algorithm for sets**:
- The Joker represents the same rank as the other cards → value equals the rank's point value.

---

## Decision 4: Engine Module Boundary

**Decision**: The engine exposes a single public API surface via `src/engine/index.ts`.
Internal modules (`deck.ts`, `validation.ts`, `actions/`, etc.) are not imported directly
by the state layer or UI.

**Rationale**: A single entry point makes it easy to audit the engine's public contract,
prevents internal implementation details from leaking upward, and allows internal refactoring
without breaking callers. Aligns with Principle II (Layered Architecture).

---

## Decision 5: Jest as Testing Framework

**Decision**: Jest with `ts-jest` (or `@swc/jest`) for the engine unit tests.

**Rationale**: Jest is the standard testing framework in the React Native/Expo ecosystem.
The engine is pure TypeScript with no React dependencies, so standard Jest with a TypeScript
transformer runs it without any Expo/RN mocking overhead. Jest is not yet in `package.json`
and must be added as a dev dependency.

**Alternatives considered**:
- Vitest — valid alternative but adds another toolchain; Jest is already expected by Expo
  projects and has better RN integration for future UI tests.
