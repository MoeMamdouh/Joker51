# Quickstart: Game Setup Screen

**Branch**: `002-game-setup-screen` | **Date**: 2026-04-12
**Purpose**: Integration scenarios for testing the setup screen end-to-end.

---

## Scenario 1: Happy Path — 2 Players, Short Format

```
1. Launch app (no savedSession in AsyncStorage)
2. SetupScreen renders:
   - playerCount = 2
   - Two empty name fields
   - "Short (4 rounds)" selected
   - No deck notice (1 deck)
   - Start button DISABLED
3. Enter "Alice" in field 1, "Bob" in field 2
4. Start button becomes ENABLED
5. Tap Start
6. initGame({ players: [{id, name:'Alice'},{id, name:'Bob'}], totalRounds: 4 }) called
7. Navigate to /game with GameState
```

**Expected result**: Game starts with 1 deck, 4 rounds, 2 players.

---

## Scenario 2: 4 Players — Deck Notice Appears

```
1. SetupScreen open (playerCount = 2, no notice)
2. Tap + three times → playerCount = 5
3. Deck notice renders: "3 decks required" (wait — 5 players → 2 decks)
   Correction: 5 players → 2 decks. Notice shows "2 decks required"
4. Tap + once more → playerCount = 6 → still "2 decks required"
5. Tap + once more → playerCount = 7 → notice updates to "3 decks required"
6. Tap − four times → playerCount = 3 → notice disappears
```

**Expected result**: Notice appears/updates/disappears reactively on every count change.

---

## Scenario 3: Validation — Whitespace-Only Name

```
1. SetupScreen open (playerCount = 2)
2. Enter "   " (spaces) in field 1, "Bob" in field 2
3. Start button is DISABLED (trim check: field 1 is empty)
4. (Edge case) If user bypasses the button somehow and triggers validate:
   - fieldErrors[0] = t('validation.nameRequired')
   - inline error renders below field 1
5. User types "Alice" → button re-enables, error clears
```

**Expected result**: Whitespace-only fields block submission and show inline error.

---

## Scenario 4: Language Switch — English to Arabic

```
1. SetupScreen open in English (LTR)
2. Language selector shows "EN | AR" with EN highlighted
3. Tap AR
4. i18next.changeLanguage('ar') called
5. isRTL = true in DirectionContext
6. All labels re-render in Arabic
7. Layout switches to RTL (flex row-reverse, text right-aligned)
8. AsyncStorage writes @joker51/language = 'ar'
9. (< 300ms total — no reload)
```

**Expected result**: Instant Arabic RTL layout with no navigation or app restart.

---

## Scenario 5: Resume Prompt — In-Progress Session Exists

```
1. AsyncStorage contains @joker51/savedSession (a serialized GameState)
2. App launches → SetupScreen mounts
3. useEffect reads AsyncStorage → savedSession found
4. ResumeGamePrompt renders (setup form hidden behind prompt)
5. User taps "Resume Game"
6. Navigate to /game (game board reads savedSession itself)
7. savedSession NOT deleted
```

**Expected result**: In-progress session is offered for resume; board screen handles the state.

---

## Scenario 6: Resume Prompt — User Chooses New Game

```
1. (Same start as Scenario 5)
2. ResumeGamePrompt shown
3. User taps "New Game"
4. AsyncStorage.removeItem('@joker51/savedSession') called
5. Prompt dismissed, blank setup form shown
6. playerCount = 2, names = [], format = Short (4 rounds)
```

**Expected result**: Old session discarded, fresh blank form ready.

---

## Scenario 7: Language Persists Across Restart

```
1. User selects Arabic on setup screen → @joker51/language = 'ar' saved
2. User force-closes app
3. App relaunches
4. i18n/index.ts reads @joker51/language = 'ar' before React renders
5. i18next initialized with lng: 'ar'
6. I18nManager.forceRTL(true) called
7. SetupScreen renders in Arabic RTL from the very first frame
```

**Expected result**: No flash of English; Arabic is active immediately on relaunch.

---

## Component Isolation Tests

### PlayerCountStepper
- Render with `value=2` → decrement button disabled, increment enabled
- Render with `value=8` → decrement enabled, increment button disabled
- Tap increment → `onChange(3)` called
- Tap decrement (at value=3) → `onChange(2)` called

### DeckCountNotice
- `deckCount=1` → renders `null` (no notice)
- `deckCount=2` → renders "2 decks required" text
- `deckCount=3` → renders "3 decks required" text

### PlayerNameInput
- `error=null` → no error text rendered
- `error="Name is required"` → error text rendered below field
- Input with 20 chars → additional chars rejected by `maxLength`

### RoundFormatSelector
- Default render → Short (4) option highlighted
- Tap Medium → `onChange(8)` called, Medium highlighted

### LanguageSelector
- `value='en'` → EN option highlighted
- Tap AR → `onChange('ar')` called
