# Data Model: Game Setup Screen

**Branch**: `002-game-setup-screen` | **Date**: 2026-04-12

---

## Entities

### SetupFormState (Zustand store slice — transient, not persisted)

Holds the live state of the setup form while the user is configuring a game.

| Field | Type | Constraints | Default |
|-------|------|-------------|---------|
| `playerCount` | `number` | 2–8 inclusive | `2` |
| `playerNames` | `string[]` | Length = `playerCount`; each max 20 chars | `['', '']` |
| `roundFormat` | `4 \| 8 \| 12` | Must be one of the three valid values | `4` |
| `fieldErrors` | `(string \| null)[]` | Length = `playerCount`; null = no error | `[null, null]` |

**Derived (not stored)**:
- `deckCount`: calculated from `playerCount` using engine rule (≤3→1, 4–6→2, 7–8→3)
- `isStartEnabled`: `playerNames.every(n => n.trim().length > 0)`

**State Transitions**:
```
Initial (blank) → User edits → Start tapped (valid) → GameConfiguration produced → Navigate
                            ↘ Start tapped (invalid) → fieldErrors populated → form stays open
```

---

### GameConfiguration (output of setup — direct input to engine)

Produced when the user taps Start with a valid form. Passed to `initGame()`.

| Field | Type | Source |
|-------|------|--------|
| `players` | `{ id: string; name: string }[]` | `playerNames.map((name, i) => ({ id: uuid(), name: name.trim() }))` |
| `totalRounds` | `4 \| 8 \| 12` | `roundFormat` from form |

**Relationship**: `GameConfiguration` is the input type of `initGame(config: GameConfig): GameState` defined in the engine (`src/engine/types.ts`). No new fields; must match the engine's `GameConfig` interface exactly.

---

### LanguagePreference (persisted to AsyncStorage)

| Field | Type | Constraints | Storage Key |
|-------|------|-------------|-------------|
| `locale` | `'en' \| 'ar'` | Exactly one of the two supported locales | `@joker51/language` |

**Lifecycle**:
1. On app start: read from `@joker51/language`; if absent, use `'en'`
2. When user changes language: write new value to `@joker51/language`; update i18next; update `DirectionContext`
3. On next cold start: read value, apply i18next language and `I18nManager.forceRTL` before first render

---

### SavedSession (persisted to AsyncStorage — read/cleared by setup)

| Field | Type | Storage Key |
|-------|------|-------------|
| `gameState` | `GameState` (engine type) | `@joker51/savedSession` |

**Lifecycle** (setup screen's role only):
1. On app start: read `@joker51/savedSession`; if present and non-null → show `ResumeGamePrompt`
2. On "Resume Game": navigate to game board (session left intact)
3. On "New Game": delete `@joker51/savedSession` → show blank setup form

**Note**: Writing `savedSession` is the responsibility of the game board screen (Phase 3), not this screen.

---

### PlayerSlot (transient UI — not persisted, not passed to engine)

Represents a single name input row in the setup form. Derived from `SetupFormState`.

| Field | Type | Notes |
|-------|------|-------|
| `index` | `number` | 0-based slot index |
| `name` | `string` | Bound to `playerNames[index]` in store |
| `error` | `string \| null` | Bound to `fieldErrors[index]` in store |
| `label` | `string` | e.g., `"Player 1"` — from i18n key `setup.playerLabel` |

---

## Relationships

```
SetupFormState (Zustand)
    │
    ├── produces ──► GameConfiguration ──► initGame() ──► GameState
    │
    └── reads ──► LanguagePreference (AsyncStorage)

App start
    │
    ├── reads ──► LanguagePreference (AsyncStorage) ──► i18next.changeLanguage()
    └── reads ──► SavedSession (AsyncStorage) ──► show ResumeGamePrompt or SetupForm
```

---

## Validation Rules

| Rule | Source FR | Behaviour |
|------|-----------|-----------|
| Player count in [2, 8] | FR-001 | Stepper clamps at boundaries; decrement disabled at 2, increment disabled at 8 |
| Each name non-empty after trim | FR-003, FR-004 | Start button disabled; inline error on tap |
| Each name ≤ 20 characters | FR-005 | `maxLength` prop on TextInput; no inline error needed (input simply stops accepting chars) |
| `totalRounds` in {4, 8, 12} | FR-006 | Enforced by selector UI; no free-form input |
| Language in {'en', 'ar'} | FR-012 | Enforced by selector UI |

---

## i18n Translation Key Index

All keys must exist in both `src/i18n/en.json` and `src/i18n/ar.json`.

| Key | EN value (reference) | Notes |
|-----|----------------------|-------|
| `setup.title` | `"New Game"` | Screen heading |
| `setup.playerCount` | `"Number of Players"` | Section label |
| `setup.playerLabel` | `"Player {{number}}"` | Row label, `{{number}}` = 1-based index |
| `setup.playerNamePlaceholder` | `"Enter name"` | TextInput placeholder |
| `setup.roundFormat` | `"Round Format"` | Section label |
| `setup.roundFormat.short` | `"Short (4 rounds)"` | Selector option |
| `setup.roundFormat.medium` | `"Medium (8 rounds)"` | Selector option |
| `setup.roundFormat.long` | `"Long (12 rounds)"` | Selector option |
| `setup.deckInfo` | `"1 deck"` | Shown for 1-deck config (no notice) |
| `setup.deckNotice` | `"{{count}} decks required"` | Shown for 2+ decks; `{{count}}` = 2 or 3 |
| `setup.startButton` | `"Start Game"` | Primary CTA |
| `setup.resumeTitle` | `"Resume Game?"` | Resume prompt heading |
| `setup.resumeBody` | `"You have an unfinished game. Continue or start a new one?"` | Resume prompt body |
| `setup.resumeButton` | `"Resume Game"` | Resume prompt primary action |
| `setup.newGameButton` | `"New Game"` | Resume prompt secondary action |
| `setup.language` | `"Language"` | Section label |
| `common.language.en` | `"English"` | Language selector option |
| `common.language.ar` | `"Arabic"` | Language selector option |
| `validation.nameRequired` | `"Name is required"` | Field error |
| `validation.nameTooLong` | `"Name must be 20 characters or fewer"` | Field error |
