# Quickstart & Test Scenarios: Game Board Screen

**Branch**: `003-game-board-screen` | **Date**: 2026-04-12

---

## Component Isolation Tests

These tests verify each component independently with mock props.

### CardTile
- Render face-up card (e.g., King of Spades) → shows "K" + spade symbol in black
- Render a Joker → shows wildcard indicator, no rank/suit text
- Render `selected=true` → `translateY(-8)` applied, selected border visible
- Render `faceDown=true` → back pattern shown, no rank/suit
- Render `size="sm"` → width 40, height 56

### HandArea
- Render 5 cards, 2 selected → selected cards elevated, others flat
- Tap a non-selected card → `onCardPress` called with that card
- Tap a selected card → `onCardPress` called (caller toggles)
- Empty hand → renders empty container (no crash)

### DrawPile
- Render with `cardCount=25` → count badge shows "25"
- `onPress` defined → tappable
- `onPress` undefined → not tappable (no interaction affordance)

### DiscardPile
- Render with a top card → face-up card shown
- Render `topCard=null` → empty placeholder shown

### ActionBar (phase=DRAWING)
- All buttons disabled or hidden

### ActionBar (phase=ACTING, hasMelded=false, hasSelectedCards=false)
- Meld button disabled (no cards selected)
- Discard button enabled

### ActionBar (phase=ACTING, hasMelded=false, hasSelectedCards=true)
- Meld button enabled
- Discard button enabled
- No LayOff button visible

### ActionBar (phase=ACTING, hasMelded=true, hasSelectedCards=true, canClaimJoker=true)
- LayOff button enabled
- Discard button enabled
- Claim Joker button enabled

### ScoreboardRow
- 3 players, 1 round completed → each player shows cumulative score
- Active player entry has distinct styling (bold/accent)

### HandOffOverlay
- Renders "Pass to [name]" message
- Tapping confirm button calls `onConfirm`

### RoundSummaryOverlay (not game over)
- Shows round penalties per player
- Winner highlighted (single winner)
- Co-winners both highlighted (tie scenario)
- "Next Round" button visible, calls `onNextRound`

### RoundSummaryOverlay (game over)
- "Game Over" shown
- Final cumulative standings shown
- "New Game" and "Play Again" buttons visible

---

## Integration Scenarios

### Scenario 1: Happy Path — Complete 2-Player Turn
1. Start game with 2 players (via setupStore → gameStore)
2. Player 1 is active, phase is DRAWING
3. Tap draw pile → card added to Player 1's hand, phase → ACTING
4. Select 3 cards worth ≥ 51 points
5. Tap "Meld" → cards appear on table, Player 1 marked as melded
6. Select 1 card, tap "Discard" → card on discard pile, Player 2 becomes active
7. HandOff overlay shown — Player 2 confirms
8. Player 2's hand is now visible, phase is DRAWING

**Expected**: No errors; GameState updated in gameStore; AsyncStorage contains updated session.

### Scenario 2: Invalid Meld (< 51 points)
1. Player in ACTING phase, not yet melded
2. Select 3 cards worth 30 points total
3. Tap "Meld"
4. Error banner appears: translated "Meld Below 51 Points" message
5. No cards moved; hand unchanged

**Expected**: Error banner visible ≤ 300ms; dismisses after 3 seconds; cards remain in hand.

### Scenario 3: Lay Off on Combination
1. Player has melded (in meldedPlayerIds)
2. ACTING phase; player selects 1 card that extends an existing table combination
3. Tap the combination row → card appended to combination, removed from hand

**Expected**: CombinationRow updates; HandArea shrinks by 1 card.

### Scenario 4: Invalid Lay Off
1. Player has melded, ACTING phase
2. Select a card that does not fit any combination
3. Tap a combination → error banner shown; no cards moved

### Scenario 5: Claim Joker
1. A combination on the table contains a Joker
2. Active player's hand contains the natural card the Joker represents
3. "Claim" affordance visible on CombinationRow
4. Tap "Claim Joker" → Joker moves to active player's hand; natural card inserted into combination

### Scenario 6: Discard Wins Round
1. Player has 1 card left in hand, is in ACTING phase
2. Tap "Discard" with that card selected
3. Round ends → RoundSummaryOverlay shown with all player penalties
4. One (or more) co-winner players highlighted

### Scenario 7: Start Next Round
1. RoundSummaryOverlay visible, more rounds remain
2. Tap "Next Round"
3. Overlay dismissed; new hands dealt; board resets to DRAWING phase for first player of new round

### Scenario 8: Game Over
1. Final round ends (currentRound === totalRounds)
2. RoundSummaryOverlay shows "Game Over"
3. Tap "New Game" → navigate to setup screen; gameStore cleared
4. Tap "Play Again" → new game with same players; gameStore reset with new initGame

### Scenario 9: Resume After App Relaunch
1. Mid-game state saved to AsyncStorage
2. Close and reopen app
3. Setup screen detects session → Resume prompt shown
4. Tap "Resume" → navigate to `/game`; GameBoardScreen reads from gameStore (already loaded by useSavedSession flow or restored from AsyncStorage)

### Scenario 10: RTL Layout (Arabic)
1. Language set to Arabic from setup screen
2. Navigate to game board
3. HandArea renders cards right-to-left
4. CombinationRow renders right-to-left
5. All labels right-aligned
6. ActionBar layout mirrored

### Scenario 11: Draw Pile Exhaustion
1. Draw pile reaches 0 cards
2. Player taps draw pile → discard pile shuffled into new draw pile automatically (engine handles)
3. Board shows updated draw pile count; discard pile shows only 1 card (the new top after reshuffle)

---

## Error Code → i18n Key Mapping

| Engine EngineErrorCode | i18n Key |
|---|---|
| NOT_YOUR_TURN | game.errors.notYourTurn |
| WRONG_TURN_PHASE | game.errors.wrongPhase |
| INVALID_COMBINATION | game.errors.invalidCombination |
| COMBINATION_TOO_SHORT | game.errors.combinationTooShort |
| SET_TOO_LONG | game.errors.setTooLong |
| SET_DUPLICATE_SUIT | game.errors.setDuplicateSuit |
| SEQUENCE_MIXED_SUITS | game.errors.sequenceMixedSuits |
| SEQUENCE_NOT_CONSECUTIVE | game.errors.sequenceNotConsecutive |
| ACE_WRAPAROUND | game.errors.aceWraparound |
| JOKER_LIMIT_EXCEEDED | game.errors.jokerLimitExceeded |
| MELD_BELOW_51_POINTS | game.errors.meldBelow51 |
| PLAYER_NOT_YET_MELDED | game.errors.notYetMelded |
| JOKER_CLAIM_NOT_YOUR_TURN | game.errors.jokerClaimNotYourTurn |
| JOKER_CLAIM_WRONG_CARD | game.errors.jokerClaimWrongCard |
| JOKER_CLAIM_BREAKS_COMBINATION | game.errors.jokerClaimBreaks |
| DISCARD_REQUIRED_TO_WIN | game.errors.discardRequiredToWin |
| CARD_NOT_IN_HAND | game.errors.cardNotInHand |
| COMBINATION_NOT_ON_TABLE | game.errors.combinationNotOnTable |
