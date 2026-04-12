# Implementation Plan: Sort Melded Cards & Fix Lay-Off

**Branch**: `005-sort-meld-fix-layoff` | **Date**: 2026-04-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-sort-meld-fix-layoff/spec.md`

## Summary

Adds a pure sorting invariant to all table combinations (sequences sorted low→high with contextual Ace, sets sorted by fixed suit order) and fixes the lay-off action so it auto-detects whether a card belongs at the start or end of a sequence, eliminating the silent failure that blocked prepend lay-offs.

Two engine changes, no UI changes, no new i18n strings required:
1. A new `sortCombinationCards` utility applied at every combination mutation site (meld, placeCombinations, layOff, claimJoker).
2. Auto-position detection in `layOff` replacing the always-`'end'` default.
3. Retroactive sort applied when a saved session is restored from storage.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode  
**Primary Dependencies**: React Native + Expo SDK ~54; Zustand (state); @react-native-async-storage/async-storage (persistence)  
**Storage**: AsyncStorage — key `@joker51/savedSession`  
**Testing**: Jest + ts-jest (engine unit tests); React Native Testing Library (UI integration tests)  
**Target Platform**: iOS + Android (React Native / Expo)  
**Project Type**: Mobile app (game)  
**Performance Goals**: Sort is O(n) on ≤ 13 cards — effectively free  
**Constraints**: Engine must remain pure TypeScript with no UI/React imports; state must be serializable  
**Scale/Scope**: 2–4 players, ≤ 13 cards per combination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game Rule Fidelity | ✅ PASS | Sorting is display/storage ordering, not a rule change. Lay-off fix matches spec §5 (extend at either end). |
| II. Layered Architecture | ✅ PASS | All changes are in `src/engine/`; no React/Expo imports introduced. |
| III. Test-First Game Logic | ✅ PASS | Tests for sort utility and lay-off auto-detection must be written before implementation (TDD). |
| IV. Cross-Platform Excellence | ✅ PASS | Pure engine change; no platform-specific code. |
| V. State Predictability & Immutability | ✅ PASS | `sortCombinationCards` is a pure function; sorted state is persisted on every turn as before. |
| VI. Multilingual Support | ✅ PASS | No new user-facing strings. |
| VII. Design System & Component Architecture | ✅ PASS | No new UI components or tokens. |
| VIII. Simplicity Over Cleverness | ✅ PASS | Sorting is a single utility; auto-detection is ≤ 10 lines of logic. |

No complexity violations. Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/005-sort-meld-fix-layoff/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/engine/
├── sort.ts                          # NEW: sortCombinationCards utility
├── __tests__/
│   └── sort.test.ts                 # NEW: unit tests for sort utility (TDD)
├── actions/
│   ├── layOff.ts                    # MODIFIED: auto-detect position; apply sort
│   ├── meld.ts                      # MODIFIED: apply sort to new combinations
│   ├── placeCombinations.ts         # MODIFIED: apply sort to new combinations
│   └── claimJoker.ts                # MODIFIED: apply sort after card swap
├── __tests__/actions/
│   └── layOff.test.ts               # MODIFIED: add prepend test cases
└── index.ts                         # MODIFIED: export sortCombinationCards

src/hooks/
└── useSavedSession.ts               # MODIFIED: sort all combinations on load
```

**Structure Decision**: Single project layout (Option 1). All changes are within the existing `src/engine/` tree plus one hook. No new directories needed beyond the new `sort.ts` file.
