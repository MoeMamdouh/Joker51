# Feature Specification: Game Setup Screen

**Feature Branch**: `002-game-setup-screen`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "game setup screen — configure player count (2–8), enter player names, select round format (short/medium/long), display auto-calculated deck count with a notice when 2 or more decks are needed, and navigate to the game board on start"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Players and Start Game (Priority: P1)

A user opens the app and reaches the setup screen. They specify how many players will participate (2–8), enter a name for each player, choose a round format, and tap Start to begin the game.

**Why this priority**: This is the mandatory entry point — no game session can begin without it. Every other feature depends on a valid, configured game state.

**Independent Test**: Can be fully tested by completing the setup form with valid data and tapping Start; the system produces a valid game session and navigates to the game board, delivering a playable game.

**Acceptance Scenarios**:

1. **Given** the setup screen is open, **When** the user selects 2 players, enters names for both, and chooses any round format, **Then** the Start button becomes active and tapping it begins a game session.
2. **Given** the setup screen is open, **When** the user selects 4 players, enters names for all four, and taps Start, **Then** the game begins with a 2-deck configuration.
3. **Given** the setup screen is open, **When** the user selects 8 players and completes all fields, **Then** the game begins with a 3-deck configuration.
4. **Given** the setup screen is open, **When** the user taps Start without entering all required player names, **Then** the form shows a validation error and does not proceed.
5. **Given** the setup screen is open, **When** the user changes the player count from 4 to 2, **Then** the name entry fields update to show only 2 fields and the deck notice clears if it was showing.
6. **Given** the app is launched and a saved in-progress session exists, **When** the launch screen appears, **Then** a prompt offers "Resume Game" and "New Game" before the setup form is shown.
7. **Given** the resume prompt is showing, **When** the user taps "New Game", **Then** the saved session is discarded and the setup form is displayed blank.

---

### User Story 2 - Deck Count Notice (Priority: P1)

When the selected player count requires more than one deck, the screen prominently displays a notice informing players to prepare the correct number of physical decks before starting.

**Why this priority**: Players using physical cards need to know how many decks to gather before the game starts. Showing this notice prevents mid-game interruptions and is tied directly to the P1 flow.

**Independent Test**: Can be tested independently by selecting different player counts (2–3 vs. 4–6 vs. 7–8) and verifying the notice appears, updates, and disappears correctly.

**Acceptance Scenarios**:

1. **Given** player count is 2 or 3, **When** the user views the deck count area, **Then** no multi-deck notice is shown (1 deck is sufficient).
2. **Given** player count is 4, 5, or 6, **When** the user views the deck count area, **Then** a notice reads "2 decks required" (or equivalent).
3. **Given** player count is 7 or 8, **When** the user views the deck count area, **Then** a notice reads "3 decks required" (or equivalent).
4. **Given** a notice is showing for 4+ players, **When** the user reduces the count to 3, **Then** the notice is removed.

---

### User Story 3 - Round Format Selection (Priority: P2)

The user selects how long the game will be: Short (4 rounds), Medium (8 rounds), or Long (12 rounds). The selection is clearly labelled and the default is Short.

**Why this priority**: Round format determines the length of the session. While essential, it has a safe default (Short/4 rounds), making it P2 — the screen is functional without making it the primary interaction.

**Independent Test**: Can be tested independently by verifying that all three options are selectable, that the default is Short, and that the selected format is reflected in the game state when Start is tapped.

**Acceptance Scenarios**:

1. **Given** the setup screen first loads, **When** the user views the round format selector, **Then** "Short (4 rounds)" is pre-selected.
2. **Given** the round format selector is visible, **When** the user selects "Medium (8 rounds)", **Then** that option is highlighted and the previous selection is cleared.
3. **Given** the round format selector is visible, **When** the user selects "Long (12 rounds)" and taps Start, **Then** the game session is configured for 12 rounds.

---

### User Story 4 - Language Selection (Priority: P2)

The user can choose their preferred language (English or Arabic) directly on the setup screen. The entire app UI — including the setup screen itself — switches to the chosen language immediately. Arabic triggers right-to-left layout.

**Why this priority**: Multilingual support is a core constitution requirement (Principle VI). Placing language selection on the setup screen ensures the game experience matches the player's preference from the first interaction.

**Independent Test**: Can be tested independently by toggling between EN and AR and verifying that all visible labels, buttons, and text on the setup screen reflect the correct language and layout direction.

**Acceptance Scenarios**:

1. **Given** the app opens in English (default), **When** the user switches to Arabic, **Then** all labels on the setup screen render in Arabic and the layout switches to right-to-left.
2. **Given** Arabic is selected, **When** the user views the setup screen, **Then** the player name input fields, round selector, and Start button are all aligned right-to-left.
3. **Given** the user selects Arabic and taps Start, **When** the game board loads, **Then** the game board also renders in Arabic with RTL layout.
4. **Given** the user selected Arabic in a previous session, **When** the app is reopened, **Then** Arabic is pre-selected and the screen renders in RTL immediately.

---

### Edge Cases

- What happens when the user enters only whitespace as a player name? (Should be treated as empty and fail validation.)
- What happens when the user enters a player name longer than the display can accommodate? (Name should be trimmed or truncated in the UI, but stored as-entered up to a reasonable max length.)
- What happens when the player count drops and previously entered names are removed? (Names for removed player slots should be cleared so re-adding a slot starts with an empty field.)
- What happens when the device language is Arabic but the in-app language selector is English? (In-app selection takes precedence over device locale.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The setup screen MUST allow the user to select player count in the range 2–8 inclusive.
- **FR-002**: The setup screen MUST display one name entry field per selected player.
- **FR-003**: All player name fields MUST be filled before the Start button is enabled.
- **FR-004**: Player names consisting solely of whitespace MUST be treated as empty and fail validation.
- **FR-005**: Player names MUST be limited to a maximum of 20 characters.
- **FR-006**: The setup screen MUST offer three round format options: Short (4 rounds), Medium (8 rounds), Long (12 rounds).
- **FR-007**: "Short (4 rounds)" MUST be pre-selected as the default round format.
- **FR-008**: The setup screen MUST display the automatically calculated deck count based on the selected player count (1 deck for 2–3 players, 2 decks for 4–6 players, 3 decks for 7–8 players).
- **FR-009**: When 2 or more decks are required (4+ players), the screen MUST display a visible notice informing players of the deck count needed.
- **FR-010**: The deck count display and notice MUST update immediately when the player count changes.
- **FR-011**: Tapping Start with a valid configuration MUST create a new game session and navigate to the game board screen.
- **FR-012**: The setup screen MUST provide a language selector with English and Arabic options.
- **FR-013**: Selecting a language MUST immediately re-render the entire setup screen in the chosen language and layout direction (LTR for English, RTL for Arabic).
- **FR-014**: The selected language preference MUST be persisted across app sessions.
- **FR-015**: When the app reopens, the previously selected language MUST be applied before the setup screen renders.
- **FR-016**: When the app launches and a saved in-progress game session exists, the screen MUST display a "Resume Game / New Game" prompt before showing the setup form. Choosing "Resume Game" navigates directly to the game board. Choosing "New Game" discards the saved session and shows the setup form.
- **FR-017**: The setup form MUST always open in its default blank state: player count = 2, all name fields empty, round format = Short (4 rounds). No previous session data is pre-filled.

### Key Entities

- **GameConfiguration**: The structured output of the setup screen — holds `players` (array of `{id, name}`), `totalRounds` (4 | 8 | 12), and is the direct input to `initGame()` from the engine.
- **PlayerSlot**: A single player entry on the setup screen — holds the entered name and its index (1–8). Transient UI state; not persisted.
- **LanguagePreference**: The user's selected locale (`en` | `ar`), persisted to device storage.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full setup flow (select players, enter names, choose format, tap Start) in under 60 seconds.
- **SC-002**: The deck count notice appears or disappears within one interaction (no extra tap required) when the player count changes.
- **SC-003**: 100% of player name validation errors are shown inline before the user taps Start, preventing form submission with invalid data.
- **SC-004**: Switching language on the setup screen re-renders all visible strings and layout direction in under 300 milliseconds with no navigation or reload required.
- **SC-005**: The language preference is correctly restored on app relaunch in 100% of tested scenarios.
- **SC-006**: The setup screen renders without visual defects on iOS and Android at standard phone screen sizes (320–430 pt wide).

## Assumptions

- On launch, if an in-progress session exists, a "Resume / New Game" prompt is shown before the setup form (see FR-016). Fresh launches with no saved session go directly to the setup form.
- Player names are not unique — two players may share the same name without error.
- The app uses English as the default language on first launch (before any preference is saved).
- Device locale is ignored for the in-app language: the in-app selector is the authoritative source.
- The game board screen (destination after tapping Start) is out of scope for this feature — the spec ends at navigation to it.
- No authentication or player profiles are involved — names are ephemeral session data, never persisted between sessions.
- The setup form never pre-fills from previous sessions; only language preference is persisted.
- The deck count calculation is defined by the engine: ≤3 players → 1 deck, 4–6 → 2 decks, 7–8 → 3 decks.

## Clarifications

### Session 2026-04-12

- Q: What is the maximum player name length? → A: 20 characters maximum.
- Q: Should previously entered names be preserved when player count decreases then increases? → A: No — slots removed when count decreases are cleared; re-adding a slot starts blank.
- Q: Does the language switch apply only to the setup screen or the entire app immediately? → A: Entire app switches immediately, including any subsequent screens.
- Q: What is the default language on first launch? → A: English.
- Q: If an in-progress game session exists on app launch, should setup offer to resume it? → A: Yes — show a "Resume Game / New Game" prompt before the setup form; Resume navigates to the board, New Game discards the saved session.
- Q: Should the setup form pre-fill from the last session or always start blank? → A: Always blank — player count resets to 2, names empty, round format defaults to Short.
