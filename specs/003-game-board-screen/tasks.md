---
description: "Task list for Game Board Screen implementation"
---

# Tasks: Game Board Screen

**Input**: Design documents from `specs/003-game-board-screen/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/game-board-ui.md ✅ quickstart.md ✅

**Tests**: Included — constitution Principle III mandates integration tests for UI components.
**Note**: Tests are written after component implementation (not strict TDD for UI per constitution).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Expand the design token stub with card-specific tokens required before any game component can be implemented. This is the single blocking gate identified in the Constitution Check.

- [ ] T001 Expand `src/theme/tokens.ts` — add card tokens: `colors.card.face`, `colors.card.back`, `colors.card.selected`, `colors.card.joker`; suit tokens: `colors.suit.red`, `colors.suit.black`; shadow preset: `shadows.card.elevation` (elevation: 6 on Android, shadowColor/offset/radius on iOS)

**Checkpoint**: tokens.ts expanded — Constitution Check Principle VII gate cleared. Component work may begin.

---

## Phase 2: Foundational

**Purpose**: i18n keys, the universal `CardTile` primitive, and the `useGameActions`/`useCardSelection` hooks — shared by all six user stories and MUST be complete before any story phase starts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add 37 new keys to `src/i18n/en.json` under `game.*` namespace — 20 board strings (turnIndicator, phase.drawing/acting, drawPile, discardPile, actions.meld/discard/claimJoker/layOff, handOff.prompt/confirm, roundSummary.title/penalty/nextRound/gameOver/playAgain/winner/coWinners, score.label, deckCount) + 17 engine error keys under `game.errors.*` per the full mapping in `quickstart.md`
- [ ] T003 [P] Add same 37 keys to `src/i18n/ar.json` — mirror structure of en.json exactly; Arabic translations for all 37 keys (both files MUST have identical key sets per constitution Principle VI)
- [ ] T004 [P] Create `src/components/game/CardTile.tsx` per `contracts/game-board-ui.md` — renders Card with rank/suit abbreviation + suit symbol; Joker wildcard indicator; `selected` prop drives `translateY(-8)` + `colors.card.selected` border via Reanimated `withTiming(150ms)`; `faceDown` prop renders `colors.card.back` fill; `size` prop controls dimensions (sm: 40×56, md: 52×72, lg: 64×90); red suits use `colors.suit.red`, black suits use `colors.suit.black`; all values from `src/theme/tokens.ts`
- [ ] T005 [P] Create `src/hooks/useCardSelection.ts` per `contracts/game-board-ui.md` — returns `{ selectedCards: Card[], toggleCard(card: Card): void, clearSelection(): void }`; `toggleCard` uses reference equality; `clearSelection` resets to `[]`
- [ ] T006 Create `src/hooks/useGameActions.ts` per `contracts/game-board-ui.md` — wraps all 7 engine actions: `drawFromPile`, `pickUpDiscardTop`, `placeMeld`, `layOff`, `discardCard`, `claimJoker`, `startNextRound`; on each success: calls `gameStore.setGame(result.state)` + `AsyncStorage.setItem('@joker51/savedSession', JSON.stringify(result.state))`; on failure: returns `{ error: t('game.errors.' + result.error) }`; reads current game from `useGameStore(s => s.currentGame)`

**Checkpoint**: Foundation complete — all six user story phases can now begin.

---

## Phase 3: User Story 1 — View Hand and Draw a Card (Priority: P1) 🎯 MVP

**Goal**: Active player's hand visible face-up; draw from draw pile or pick up discard top; HandOff privacy overlay between turns.

**Independent Test**: Start a 2-player game → Player 1 hand visible → tap draw pile → card added to hand → phase changes to ACTING → discard → HandOffOverlay shown → Player 2 confirms → Player 2 hand visible.

- [ ] T007 [P] [US1] Create `src/components/game/DrawPile.tsx` per `contracts/game-board-ui.md` — renders face-down `CardTile` (size="lg"); badge showing `cardCount`; `onPress` prop (undefined = non-interactive); all values from tokens
- [ ] T008 [P] [US1] Create `src/components/game/DiscardPile.tsx` per `contracts/game-board-ui.md` — renders top card face-up via `CardTile` (size="lg"), or empty placeholder when `topCard` is null; `onPress` prop; tokens
- [ ] T009 [P] [US1] Create `src/components/game/HandArea.tsx` per `contracts/game-board-ui.md` — horizontal `ScrollView` of `CardTile` (size="md"); `selected` prop derived by reference equality against `selectedCards`; calls `onCardPress(card)` on tap; empty hand renders empty container without error
- [ ] T010 [P] [US1] Create `src/components/game/PlayerBadge.tsx` per `contracts/game-board-ui.md` — shows player `name` + `cardCount` (face-down card icon); `isActive` renders accent outline; all tokens
- [ ] T011 [P] [US1] Create `src/components/game/ScoreboardRow.tsx` per `contracts/game-board-ui.md` — horizontal compact row; derives cumulative score per player from `roundResults` (sum of penalty across all RoundResult entries); active player entry bold/accent; renders `t('game.score.label', { name, score })` per player
- [ ] T012 [P] [US1] Create `src/components/game/HandOffOverlay.tsx` per `contracts/game-board-ui.md` — fullscreen overlay with `colors.background` fill; renders `t('game.handOff.prompt', { name: nextPlayerName })`; large primary `Button` with `t('game.handOff.confirm', { name: nextPlayerName })`; calls `onConfirm` on tap
- [ ] T013 [US1] Create `src/screens/GameBoardScreen.tsx` — reads `gameStore.currentGame`; renders: `ScoreboardRow` (top), opponent `PlayerBadge` × (playerCount − 1), `DrawPile` + `DiscardPile` side-by-side, `HandArea` (active player hand); wires `drawFromPile` and `pickUpDiscardTop` from `useGameActions`; manages `pendingHandOff` state (true after discard, cleared when next player confirms via `HandOffOverlay`); shows `HandOffOverlay` when `pendingHandOff`; uses `SafeScrollView`; all strings via `useTranslation()`; RTL from `useDirection()`
- [ ] T014 [P] [US1] Write `src/components/game/__tests__/CardTile.test.tsx` — tests per quickstart.md Component Isolation: face-up King of Spades renders "K" + spade in black; Joker renders wildcard indicator; `selected=true` applies elevation style; `faceDown=true` hides rank/suit; `size="sm"` dimensions correct
- [ ] T015 [P] [US1] Write `src/components/game/__tests__/DrawPile.test.tsx` + `src/components/game/__tests__/DiscardPile.test.tsx` — DrawPile: cardCount badge renders, onPress defined vs undefined; DiscardPile: face-up top card, null placeholder
- [ ] T016 [P] [US1] Write `src/components/game/__tests__/HandArea.test.tsx` + `src/components/game/__tests__/HandOffOverlay.test.tsx` — HandArea: 5 cards 2 selected (elevated), tap non-selected calls onCardPress, empty hand no crash; HandOffOverlay: renders pass message, confirm button calls onConfirm

**Checkpoint**: US1 complete — 2-player game can draw cards, see hands, and pass device between turns.

---

## Phase 4: User Story 2 — Place Initial Meld (Priority: P1)

**Goal**: Selected cards can be melded onto the table; table combinations visible; Meld button gated by selection and 51-point threshold.

**Independent Test**: Player draws → selects 3 cards worth ≥ 51 pts → taps Meld → cards appear on table as CombinationRow; selecting < 51 pts → error banner shown; already-melded player sees no Meld button.

- [ ] T017 [P] [US2] Create `src/components/game/CombinationRow.tsx` per `contracts/game-board-ui.md` — renders `ownerName` label above horizontal row of `CardTile` (size="sm"); `onPress` handler (lay-off trigger); `showClaimJoker` shows "Claim" affordance badge on any Joker card in the row; calls `onClaimJoker` when tapped; all tokens
- [ ] T018 [P] [US2] Create `src/components/game/TableArea.tsx` per `contracts/game-board-ui.md` — `ScrollView` of `CombinationRow`; `canLayOff` gates whether `onCombinationPress` is passed to rows; `activeCombinationId` highlights the targeted row during lay-off; `players` used to look up owner name from `combination.ownerId`
- [ ] T019 [P] [US2] Create `src/components/game/ActionBar.tsx` per `contracts/game-board-ui.md` — DRAWING phase: all buttons disabled; ACTING + not melded: Meld button (enabled if `hasSelectedCards`), Discard button (always enabled); ACTING + melded: Lay Off button (enabled if `hasSelectedCards`), Discard (always enabled), Claim Joker (enabled if `canClaimJoker`); all labels via `useTranslation()`; tokens
- [ ] T020 [US2] Integrate `TableArea` + `ActionBar` into `src/screens/GameBoardScreen.tsx` — import both; add `placeMeld` from `useGameActions`; wire `selectedCards` from `useCardSelection` to `ActionBar.hasSelectedCards`; derive `hasMelded` from `meldedPlayerIds.includes(activePlayerId)`; wire Meld button → `placeMeld(selectedCards)` → `clearSelection()` on success; render `TableArea` above hand area
- [ ] T021 [P] [US2] Write `src/components/game/__tests__/ActionBar.test.tsx` — tests per quickstart.md: DRAWING phase all disabled; ACTING unmelded no-selection (Meld disabled, Discard enabled); ACTING unmelded with-selection (Meld enabled); ACTING melded with canClaimJoker (LayOff + Discard + ClaimJoker all enabled); no LayOff shown when not melded

**Checkpoint**: US2 complete — initial meld functional end-to-end; table shows placed combinations.

---

## Phase 5: User Story 4 — Discard and End Turn (Priority: P1)

**Goal**: Active player discards a card to end their turn; play passes to the next player via HandOff overlay; round ends when hand empties.

**Independent Test**: ACTING phase → select 1 card → tap Discard → card on discard pile → HandOffOverlay shown → next player confirms → their hand revealed + DRAWING phase.

- [ ] T022 [US4] Wire discard action into `src/screens/GameBoardScreen.tsx` — connect Discard button in `ActionBar` to `discardCard(selectedCard)` from `useGameActions`; after successful discard: `clearSelection()`; if `result.state.status === 'round_ended' || 'game_over'` set `showRoundSummary = true`; else set `pendingHandOff = true` with next player's name derived from `config.players` + new `turnState.activePlayerId`
- [ ] T023 [P] [US4] Write `src/screens/__tests__/GameBoardScreen.test.tsx` — integration tests per quickstart.md Scenarios 1, 2, 6: happy path draw + discard advances turn; invalid meld shows error; HandOffOverlay shown after discard

**Checkpoint**: US4 complete — full turn cycle (draw → optional meld → discard → hand off) works end-to-end.

---

## Phase 6: User Story 6 — Round End and Score Summary (Priority: P1)

**Goal**: Round summary displayed after winning discard; co-winner ties handled; next round starts or game over screen shown.

**Independent Test**: Player discards last card → `RoundSummaryOverlay` shows all penalties; tied players both highlighted; tap Next Round → new deal; tap New Game → setup screen.

- [ ] T024 [P] [US6] Create `src/components/game/RoundSummaryOverlay.tsx` per `contracts/game-board-ui.md` — fullscreen overlay; shows `t('game.roundSummary.title', { round: currentRound })`; lists each player's penalty for the round; highlights all players in `roundWinnerIds` (co-winner support); shows cumulative scores from `cumulativeScores`; shows Next Round button (if `!isGameOver`) calling `onNextRound`; shows "Game Over" + New Game + Play Again buttons (if `isGameOver`) calling `onNewGame`/`onPlayAgain`; all tokens
- [ ] T025 [US6] Wire round-end detection into `src/screens/GameBoardScreen.tsx` — when `showRoundSummary` is true, render `RoundSummaryOverlay`; derive `cumulativeScores` by summing penalties per player across `roundResults`; derive `roundWinnerIds` as all players sharing the minimum penalty in the latest `roundResults` entry (co-winner logic); wire `onNextRound` → `useGameActions.startNextRound()` + dismiss overlay; wire `onNewGame` → `gameStore.clearGame()` + `router.replace('/')` ; wire `onPlayAgain` → `initGame` with same `config.players` + `config.totalRounds` via `setupStore.startGame()` equivalent
- [ ] T026 [P] [US6] Write `src/components/game/__tests__/RoundSummaryOverlay.test.tsx` — tests: renders round penalties, single winner highlighted, two co-winners both highlighted, Next Round button visible when not game over, New Game + Play Again shown when game over

**Checkpoint**: US6 complete — game is fully playable from setup → turns → round summary → next round → game over.

---

## Phase 7: User Story 3 — Lay Off Cards (Priority: P2)

**Goal**: Melded player can extend existing table combinations by laying off matching cards.

**Independent Test**: Melded player in ACTING phase → selects card → taps valid CombinationRow → card appended to combination; tapping invalid combination → error banner.

- [ ] T027 [US3] Wire lay-off action into `src/screens/GameBoardScreen.tsx` — when melded player taps a `CombinationRow` (via `TableArea.onCombinationPress`) with ≥ 1 card selected, call `useGameActions.layOff(selectedCards[0], combination.id)`; on success `clearSelection()`; on error show error banner
- [ ] T028 [P] [US3] Write `src/components/game/__tests__/CombinationRow.test.tsx` — tests: renders all cards + owner name; onPress called when tapped with canLayOff; Joker claim affordance visible when showClaimJoker; onClaimJoker called on Claim tap

**Checkpoint**: US3 complete — lay-off fully functional; table combinations grow as players shed cards.

---

## Phase 8: User Story 5 — Claim a Joker (Priority: P2)

**Goal**: Active melded player can reclaim a Joker from a table combination when holding the replacement card.

**Independent Test**: Joker in combination, active player holds replacement card → "Claim" badge visible on CombinationRow → tap → Joker in player's hand, natural card in combination.

- [ ] T029 [US5] Wire claimJoker action into `src/screens/GameBoardScreen.tsx` — derive `canClaimJokerForCombination(combination)` by checking if active player's hand contains the card the Joker represents; pass `showClaimJoker` + `onClaimJoker` to `CombinationRow` via `TableArea`; wire to `useGameActions.claimJoker(combination.id)`
- [ ] T030 [P] [US5] Write `src/components/game/__tests__/TableArea.test.tsx` — tests: all combinations rendered; onCombinationPress called when canLayOff; no press when !canLayOff; claim joker affordance visible on correct combination

**Checkpoint**: US5 complete — all six user stories fully implemented.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Error feedback, route wiring, type safety, translation parity, and platform verification.

- [ ] T031 [P] Add `ErrorBanner` to `src/screens/GameBoardScreen.tsx` — local `useState<string | null>` for `errorMessage`; renders a styled `View` + `Text` below `ActionBar` when non-null; auto-clears via `setTimeout(3000)` after each error; called by all `useGameActions` error returns
- [ ] T032 [P] Wire `app/game.tsx` to real screen — replace placeholder "Coming Soon" content with `import { GameBoardScreen } from '@/src/screens/GameBoardScreen'; export default GameBoardScreen`
- [ ] T033 [P] Run `tsc --noEmit` and resolve all TypeScript errors — verify `GameState`, `Card`, `Combination`, `TurnState` types flow correctly from engine through `useGameActions` into all components
- [ ] T034 [P] Audit translation key completeness — verify `en.json` and `ar.json` have identical key sets (all 37 `game.*` keys per `quickstart.md` error code map); add any missing keys
- [ ] T035 Manual smoke test on iOS Simulator — run all 11 `quickstart.md` scenarios; verify 300ms action response; 500ms round summary; RTL layout at 320pt and 430pt widths
- [ ] T036 Manual smoke test on Android Emulator — repeat all 11 scenarios; verify `shadows.card.elevation` renders correctly; RTL layout; score history scrollable

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (token expansion must exist) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — first story, no story prerequisites
- **US2 (Phase 4)**: Depends on Foundational + US1 (ActionBar + TableArea integrate into GameBoardScreen built in US1)
- **US4 (Phase 5)**: Depends on US2 complete (discard wires into ActionBar integrated in US2)
- **US6 (Phase 6)**: Depends on US4 complete (round-end triggered by discard)
- **US3 (Phase 7)**: Depends on US2 complete (lay-off uses TableArea from US2)
- **US5 (Phase 8)**: Depends on US2 complete (Joker claim uses CombinationRow from US2)
- **Polish (Phase 9)**: Depends on all story phases complete

### User Story Dependencies

```
US1 (P1) → US2 (P1) → US4 (P1) → US6 (P1)   ← P1 spine (sequential)
                    ↘ US3 (P2)                  ← can start after US2
                    ↘ US5 (P2)                  ← can start after US2; US3 and US5 parallel
```

### Parallel Opportunities

```
Phase 1 (T001)
  └─► Phase 2:
        T002 [en.json] ──┐
        T003 [ar.json] ──┤ parallel
        T004 [CardTile] ─┤ parallel
        T005 [useCardSelection] ──┘
        T006 [useGameActions] ← after T002/T003 (uses i18n error keys)
          └─► Phase 3 (US1):
                T007 [DrawPile] ──────┐
                T008 [DiscardPile] ───┤
                T009 [HandArea] ──────┤ parallel
                T010 [PlayerBadge] ───┤
                T011 [ScoreboardRow] ─┤
                T012 [HandOffOverlay] ─┘
                T013 [GameBoardScreen] ← sequential, after T007-T012
                T014 [CardTile tests] ──┐
                T015 [DrawPile/DiscardPile tests] ──┤ parallel after T013
                T016 [HandArea/HandOff tests] ───────┘
                  └─► Phase 4 (US2):
                        T017 [CombinationRow] ──┐
                        T018 [TableArea] ────────┤ parallel
                        T019 [ActionBar] ────────┘
                        T020 [integrate] ← after T017-T019
                        T021 [ActionBar tests] ← parallel after T020
                          └─► Phase 5 + Phase 7 + Phase 8 can start in parallel:
                                US4: T022, T023
                                US3: T027, T028 ─┐ parallel
                                US5: T029, T030 ─┘
                                  └─► Phase 6 (US6): T024, T025, T026
                                        └─► Phase 9: T031-T036
```

---

## Implementation Strategy

### MVP (US1 + US2 + US4 + US6 — the complete turn loop)

1. Complete Phase 1 (Setup) → Phase 2 (Foundational)
2. Complete Phase 3 (US1) — draw, view hand, hand-off
3. Complete Phase 4 (US2) — initial meld, table visible
4. Complete Phase 5 (US4) — discard, end turn
5. Complete Phase 6 (US6) — round summary, game over
6. **STOP and VALIDATE**: A full game can be played start to finish
7. App is playable (US3 lay-off and US5 Joker claim are additive enhancements)

### Full Delivery (all 36 tasks)

Setup → Foundational → US1 → US2 → (US4 + US3 + US5 in parallel) → US6 → Polish

---

## Notes

- `[P]` tasks = different files, no shared state — safe to parallelize
- All components MUST reference `src/theme/tokens.ts` — zero raw style values (constitution Principle VII)
- All display strings MUST use `useTranslation()` — zero hard-coded strings (constitution Principle VI)
- `GameBoardScreen` MUST NOT import from `src/engine/` directly — all engine calls via `useGameActions` (constitution Principle II)
- `en.json` and `ar.json` MUST stay in sync on every commit (constitution Principle VI)
- Reanimated `withTiming`/`withSpring` MUST be used for all card animations (constitution Principle IV)
- Verify each P1 checkpoint on both iOS and Android before calling a story complete (constitution Principle IV)
