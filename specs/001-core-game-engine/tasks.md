---
description: "Task list for Core Game Engine implementation"
---

# Tasks: Core Game Engine

**Input**: Design documents from `specs/001-core-game-engine/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/engine-api.md ✅

**Tests**: Included — constitution Principle III mandates TDD for all engine code.
**TDD Rule**: Test tasks MUST be completed and confirmed failing BEFORE implementation tasks begin.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Install tooling and create the engine module skeleton.

- [X] T001 Install Jest and ts-jest as dev dependencies (`npm install --save-dev jest ts-jest @types/jest`)
- [X] T002 Create `jest.config.ts` at project root configured to run tests in `src/engine/__tests__/` using `ts-jest` preset
- [X] T003 Add `"test": "jest"` and `"test:engine": "jest src/engine"` scripts to `package.json`
- [X] T004 [P] Create directory structure: `src/engine/`, `src/engine/actions/`, `src/engine/__tests__/`, `src/engine/__tests__/actions/`

**Checkpoint**: `npm run test:engine` runs (zero tests, zero failures).

---

## Phase 2: Foundational

**Purpose**: Type definitions and core deck/deal logic that ALL user stories depend on.
**No user story work can begin until this phase is complete.**

- [X] T005 Create `src/engine/types.ts` — define `Suit`, `Rank`, `GameStatus`, `TurnPhase` enums and `EngineErrorCode` union type with all 18 codes from `data-model.md`
- [X] T006 Extend `src/engine/types.ts` — define `Card`, `Combination`, `Hand`, `DrawPile`, `DiscardPile`, `TableState`, `TurnState`, `RoundResult`, `PlayerConfig`, `GameConfig` interfaces
- [X] T007 Extend `src/engine/types.ts` — define `GameState` and `ActionResult` interfaces; export all types via `src/engine/index.ts`
- [X] T008 [P] Write tests for deck creation in `src/engine/__tests__/deck.test.ts` — cover: 1-deck has 54 cards, 2-deck has 108, correct suit/rank distribution, Joker count, deck scaling by player count (2–3→1, 4–6→2, 7–8→3)
- [X] T009 [P] Write tests for Fisher-Yates shuffle in `src/engine/__tests__/deck.test.ts` — cover: output length unchanged, seeded RNG produces deterministic order, unseeded produces different orders across calls
- [X] T010 Implement `createDeck(deckCount: number): Card[]` and `shuffle(cards: Card[], random?: () => number): Card[]` in `src/engine/deck.ts` — confirm T008 and T009 pass
- [X] T011 [P] Write tests for `dealCards` in `src/engine/__tests__/deal.test.ts` — cover: each player gets exactly 14 cards, draw pile count matches formula for all player counts (2–8), discard pile has exactly 1 card, total card count preserved
- [X] T012 Implement `dealCards(deck: Card[], playerCount: number): { hands: Hand[]; drawPile: DrawPile; discardPile: DiscardPile }` in `src/engine/deal.ts` — confirm T011 passes

**Checkpoint**: All T008–T012 tests pass. Foundation ready — user story phases can begin.

---

## Phase 3: User Story 1 — Start a New Game Session (Priority: P1)

**Goal**: `initGame(config)` produces a valid, ready-to-play `GameState`.
**Independent Test**: Call `initGame` with 2, 3, 4, and 8 players; assert all acceptance scenarios from spec.md US1.

- [X] T013 [P] [US1] Write tests for `initGame` in `src/engine/__tests__/deal.test.ts` — cover: all 4 acceptance scenarios from spec US1, correct `status: "in_progress"`, `currentRound: 1`, correct `deckCount` per player count, active player set
- [X] T014 [US1] Implement `initGame(config: GameConfig): GameState` in `src/engine/deal.ts` — validates player count (2–8) and totalRounds (4|8|12), calls `createDeck`, `shuffle`, `dealCards`, sets `turnState`, `status`, `currentRound: 1` — confirm T013 passes
- [X] T015 [US1] Re-export `initGame` from `src/engine/index.ts`

**Checkpoint**: `initGame` produces valid game state for all supported player counts.

---

## Phase 4: User Story 2 — Validate a Card Combination (Priority: P1)

**Goal**: `validateCombination` and `calculateMeldPoints` correctly classify all valid and invalid combinations.
**Independent Test**: Run all 11 acceptance scenarios from spec US2 plus edge cases — confirm 100% pass.

- [X] T016 [P] [US2] Write tests for sequence validation in `src/engine/__tests__/validation.test.ts` — cover: valid same-suit consecutive, invalid mixed suits, invalid non-consecutive, Ace-low (A-2-3), Ace-high (Q-K-A), Ace-wraparound rejected (K-A-2), minimum 3 cards, no maximum length
- [X] T017 [P] [US2] Write tests for set validation in `src/engine/__tests__/validation.test.ts` — cover: valid 3-card set, valid 4-card set, duplicate suit rejected, 5-card set rejected, minimum 3 cards
- [X] T018 [P] [US2] Write tests for Joker substitution in `src/engine/__tests__/validation.test.ts` — cover: Joker as middle card in sequence, Joker as first/last in sequence, Joker in set, 2-Joker combination rejected during initial meld, 2-Joker accepted post-initial-meld
- [X] T019 [P] [US2] Write tests for `calculateMeldPoints` in `src/engine/__tests__/validation.test.ts` — cover: number card values (2–10 = face value), J/Q/K = 10, Ace = 11, Joker = substituted rank value (not 25), multi-combination sum
- [X] T020 [US2] Implement `validateCombination(cards: Card[], context: { isInitialMeld: boolean }): { valid: boolean; error?: EngineErrorCode }` in `src/engine/validation.ts` — confirm T016–T018 pass
- [X] T021 [US2] Implement `calculateMeldPoints(combinations: Card[][]): number` and helper `getJokerSubstitutedValue(joker: Card, combination: Card[]): number` in `src/engine/validation.ts` — confirm T019 passes
- [X] T022 [US2] Add helpers `isFullSet(combination: Combination): boolean` and `isFullSequence(combination: Combination): boolean` in `src/engine/validation.ts` (needed by reshuffle in US5)
- [X] T023 [US2] Re-export `validateCombination` and `calculateMeldPoints` from `src/engine/index.ts`

**Checkpoint**: All 11 spec US2 acceptance scenarios pass. Validation is independently usable.

---

## Phase 5: User Story 3 — Execute a Player Turn (Priority: P1)

**Goal**: `draw`, `placeInitialMeld`, `layOff`, and `discard` correctly enforce turn flow and update `GameState`.
**Independent Test**: Simulate a complete turn sequence (draw → meld → discard) and verify all 8 acceptance scenarios from spec US3.

- [X] T024 [P] [US3] Write tests for `draw` in `src/engine/__tests__/actions/draw.test.ts` — cover: draw from draw pile decreases pile by 1 and increases hand by 1, draw from discard pile takes top card, `NOT_YOUR_TURN` rejection, `WRONG_TURN_PHASE` rejection, phase advances to `"acting"` on success
- [X] T025 [US3] Implement `draw(state: GameState, params): ActionResult` in `src/engine/actions/draw.ts` — confirm T024 passes
- [X] T026 [P] [US3] Write tests for `placeInitialMeld` in `src/engine/__tests__/actions/meld.test.ts` — cover: valid 51-point meld accepted, 50-point meld rejected with `MELD_BELOW_51_POINTS`, invalid combination rejected, `CARD_NOT_IN_HAND` rejection, player added to `meldedPlayerIds`, cards leave hand and appear on table, `JOKER_LIMIT_EXCEEDED` for 2 Jokers in one combination during initial meld
- [X] T027 [US3] Implement `placeInitialMeld(state: GameState, params): ActionResult` in `src/engine/actions/meld.ts` — confirm T026 passes
- [X] T028 [P] [US3] Write tests for `layOff` in `src/engine/__tests__/actions/layOff.test.ts` — cover: valid card added to sequence at start/end, valid card added to set (completing 4th suit), `PLAYER_NOT_YET_MELDED` rejection, `INVALID_COMBINATION` when card breaks combination, `CARD_NOT_IN_HAND` rejection, `COMBINATION_NOT_ON_TABLE` rejection
- [X] T029 [US3] Implement `layOff(state: GameState, params): ActionResult` in `src/engine/actions/layOff.ts` — confirm T028 passes
- [X] T030 [P] [US3] Write tests for `discard` in `src/engine/__tests__/actions/discard.test.ts` — cover: card moves to top of discard pile, hand decreases by 1, turn advances to next player, `TurnPhase` resets to `"drawing"`, `WRONG_TURN_PHASE` rejection when in drawing phase, `CARD_NOT_IN_HAND` rejection, turn cannot end without discard
- [X] T031 [US3] Implement `discard(state: GameState, params): ActionResult` in `src/engine/actions/discard.ts` — confirm T030 passes
- [X] T032 [US3] Re-export `draw`, `placeInitialMeld`, `layOff`, `discard` from `src/engine/index.ts`

**Checkpoint**: Full turn cycle works end-to-end. All 8 spec US3 acceptance scenarios pass.

---

## Phase 6: User Story 6 — End a Round and Calculate Scores (Priority: P1)

**Goal**: `discard` detects win condition; `calculateRoundScores` produces correct penalties; `startNextRound` and `game_over` status work correctly.
**Independent Test**: Simulate a round end with known hands and meld states; assert all 5 acceptance scenarios from spec US6.

- [X] T033 [P] [US6] Write tests for scoring in `src/engine/__tests__/scoring.test.ts` — cover: winner penalty = 0, melded-but-lost penalty = hand sum (J/Q/K=10, Ace=11, Joker=25), never-melded penalty = flat 100, Joker in hand = 25, mixed scenario with all three player types
- [X] T034 [US6] Implement `calculateRoundScores(state: GameState, winnerId: string): RoundResult` in `src/engine/scoring.ts` — confirm T033 passes
- [X] T035 [P] [US6] Write tests for win detection in `src/engine/__tests__/actions/discard.test.ts` — cover: discard last card → `status: "round_ended"`, melding all cards without discarding does NOT trigger win (`DISCARD_REQUIRED_TO_WIN`), `status: "game_over"` after final round, `RoundResult` appended on round end
- [X] T036 [US6] Update `discard` in `src/engine/actions/discard.ts` to call `calculateRoundScores` on win and set `status` correctly — confirm T035 passes
- [X] T037 [P] [US6] Write tests for `startNextRound` in `src/engine/__tests__/actions/discard.test.ts` — cover: resets `tableState`, clears `meldedPlayerIds`, increments `currentRound`, fresh deal with 14 cards each, throws on invalid state
- [X] T038 [US6] Implement `startNextRound(state: GameState): GameState` in `src/engine/actions/discard.ts` — confirm T037 passes
- [X] T039 [US6] Re-export `startNextRound` from `src/engine/index.ts`

**Checkpoint**: Round ends correctly, scores calculated, next round starts cleanly. All 5 spec US6 scenarios pass.

---

## Phase 7: User Story 4 — Claim a Joker from the Table (Priority: P2)

**Goal**: `claimJoker` correctly swaps the Joker with the real card while enforcing all claim rules.
**Independent Test**: Set up a known table state with Joker combinations; run all 5 acceptance scenarios from spec US4.

- [X] T040 [P] [US4] Write tests for `claimJoker` in `src/engine/__tests__/actions/claimJoker.test.ts` — cover all 5 spec US4 acceptance scenarios: successful claim (Joker to hand, real card to table), out-of-turn rejection, wrong real card rejection, claim that breaks combination rejected, claimed Joker usable in same turn
- [X] T041 [US4] Implement `claimJoker(state: GameState, params): ActionResult` in `src/engine/actions/claimJoker.ts` — confirm T040 passes
- [X] T042 [US4] Re-export `claimJoker` from `src/engine/index.ts`

**Checkpoint**: All 5 spec US4 acceptance scenarios pass.

---

## Phase 8: User Story 5 — Handle Draw Pile Exhaustion (Priority: P2)

**Goal**: Drawing when the pile is empty triggers a correct reshuffle with full-set/sequence clearing.
**Independent Test**: Exhaust draw pile artificially; verify all 4 spec US5 acceptance scenarios.

- [X] T043 [P] [US5] Write tests for reshuffle in `src/engine/__tests__/reshuffle.test.ts` — cover all 4 spec US5 acceptance scenarios: discard pile becomes new draw pile (minus top card), full set cleared at reshuffle, full A–K sequence cleared at reshuffle, full set NOT cleared before reshuffle
- [X] T044 [US5] Implement `handleDrawPileExhaustion(state: GameState): GameState` in `src/engine/reshuffle.ts` — uses `isFullSet` and `isFullSequence` from validation.ts — confirm T043 passes
- [X] T045 [US5] Update `draw` in `src/engine/actions/draw.ts` to call `handleDrawPileExhaustion` when `drawPile.cards.length === 0` before executing the draw — confirm T043 and T024 still pass

**Checkpoint**: All 4 spec US5 acceptance scenarios pass. Draw action handles exhaustion transparently.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Integrity checks, coverage gate, and public API audit.

- [X] T046 [P] Write integrity-check test in `src/engine/__tests__/integrity.test.ts` — simulate 1,000 random turns using seeded RNG; assert no cards are duplicated or lost across any state transition (SC-003 from spec)
- [X] T047 [P] Write performance smoke test in `src/engine/__tests__/performance.test.ts` — simulate a complete 4-player round with seeded RNG; assert completion in < 50ms (SC-004); assert single `validateCombination` call completes in < 5ms (SC-005)
- [X] T048 Run `jest --coverage` and confirm ≥ 90% line coverage for all files in `src/engine/` (constitution Principle III gate)
- [X] T049 [P] Audit `src/engine/index.ts` — confirm only public API functions are exported (no internal helpers leak); confirm all functions from `contracts/engine-api.md` are present and exported
- [X] T050 [P] Verify all 14 edge cases in `joker51_game_rules.md` Section 15 have corresponding test coverage — add missing tests if any found (SC-001)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 (deck + deal foundation)
- **US2 (Phase 4)**: Depends on Phase 2 (types only) — can run in parallel with US1
- **US3 (Phase 5)**: Depends on US1 (GameState) AND US2 (validateCombination)
- **US6 (Phase 6)**: Depends on US3 (discard action)
- **US4 (Phase 7)**: Depends on US3 (table state exists) — independent of US6
- **US5 (Phase 8)**: Depends on US3 (draw action) — can run in parallel with US4 and US6
- **Polish (Phase 9)**: Depends on all user story phases

### Within Each Phase

- All `[P]` test tasks in a phase can be written in parallel
- Each implementation task must follow its test task (TDD: red first)
- Tests MUST fail before implementation begins

### Parallel Opportunities

```
Phase 1 complete
  └─► Phase 2 (T005–T012 sequential by dependency)
        └─► T010 complete (deck/shuffle)
              └─► T013 [US1] tests   ──┐
        └─► T007 complete (types)    ──┤ can start in parallel
              └─► T016 [US2] tests   ──┘
                    └─► US2 complete (T016–T023)
                          └─► US3 depends on US1 + US2 both complete
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 only)

1. Complete Phases 1–2 (Setup + Foundation)
2. Complete Phase 3 (US1 — `initGame`)
3. Complete Phase 4 (US2 — `validateCombination`, `calculateMeldPoints`)
4. **STOP and VALIDATE**: The engine can initialize a game and validate any combination
5. UI team can build the setup screen and combination-selection UI using these two functions

### Full Engine Delivery

1. Setup + Foundation → US1 → US2 → US3 → US6 → US4 + US5 (parallel) → Polish
2. Each phase checkpoint validates independence before moving forward

---

## Notes

- `[P]` tasks = different files, no shared state
- All test tasks MUST be written and confirmed **failing** before implementation
- TDD: Red → Green → Refactor on every implementation task
- Commit after each checkpoint, not after each individual task
- No task should touch more than 2 files
