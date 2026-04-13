# Feature Specification: Multilingual Support (EN / AR)

**Feature Branch**: `007-multilingual-support`
**Created**: 2026-04-13
**Status**: Draft
**Input**: Phase 6 — Full English and Egyptian Arabic UI with RTL layout for Arabic.

## Clarifications

### Session 2026-04-13

- Q: Where is the language toggle available — setup screen only, mid-game accessible, or in-between? → A: Setup screen only; language cannot be changed mid-round.
- Q: When a language switch requires an app restart for RTL/LTR direction change, is the restart prompt blocking or non-blocking? → A: Non-blocking — dismissible banner/toast; native direction applies on next cold launch.
- Q: Do Eastern Arabic numerals apply to card face values or UI chrome only? → A: UI chrome only (scores, counts, round numbers); card faces keep standard internationally recognised symbols.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Language Selection and Persistence (Priority: P1)

A player opens the app, switches from English to Arabic using the language toggle on the setup screen, and all UI text immediately displays in Egyptian Arabic. On the next launch, Arabic is still active — the preference was persisted across sessions.

**Why this priority**: Language selection is the entry point for the entire Arabic experience. Without it, none of the other multilingual work is accessible. It is also the lowest-risk story to test independently.

**Independent Test**: Launch the app in English, toggle to Arabic, close and reopen the app — all text must appear in Arabic with no manual re-selection.

**Acceptance Scenarios**:

1. **Given** the app is in English, **When** the player selects Arabic from the language toggle, **Then** all visible UI text immediately switches to Egyptian Arabic without restarting the app.
2. **Given** Arabic was the last selected language, **When** the player closes and reopens the app, **Then** the app launches in Arabic without requiring re-selection.
3. **Given** no language has been saved (first launch), **When** the app opens, **Then** English is the default language.
4. **Given** the player is mid-game, **When** they want to change language, **Then** they must return to the setup screen to do so; the language toggle is not available during an active round.

---

### User Story 2 — Right-to-Left Layout for Arabic (Priority: P1)

When Arabic is the active language, the entire app layout mirrors to right-to-left: text aligns right, navigation flows right-to-left, the player's card hand displays from right to left, and interactive controls (buttons, piles) are positioned for RTL reading order.

**Why this priority**: An Arabic UI with LTR layout is unusable for Arabic speakers. RTL is not cosmetic — it is a functional requirement for the language. Tied in priority with US1 because neither alone delivers a complete Arabic experience.

**Independent Test**: With Arabic active, verify a single screen (e.g., game board) — all text right-aligned, card hand ordered right-to-left, back/forward navigation reversed compared to English mode.

**Acceptance Scenarios**:

1. **Given** Arabic is active, **When** any screen is displayed, **Then** the layout direction is right-to-left: text reads from right, UI elements mirror their English positions.
2. **Given** Arabic is active on the game board, **When** the player's hand is shown, **Then** cards are ordered right-to-left (first card on the right).
3. **Given** Arabic is active, **When** the player navigates between screens, **Then** transitions animate in the RTL direction (e.g., new screens slide in from the left, not the right).
4. **Given** English is active, **When** the player switches to Arabic, **Then** the layout direction updates; if a full app restart is needed to apply the native direction change, a dismissible non-blocking banner/toast is shown informing the player that the direction will apply on the next app launch — no action is forced.
5. **Given** the player switches back to English from Arabic, **Then** the layout returns to left-to-right on the next cold launch; a dismissible banner/toast informs them if a restart is needed.

---

### User Story 3 — Complete Egyptian Arabic Translation of All UI Strings (Priority: P1)

Every visible text string in the app — button labels, error messages, prompts, placeholders, score labels — has an Egyptian Arabic translation. No English text is visible when Arabic is active.

**Why this priority**: A partially translated UI (e.g., some error messages still in English) is confusing for Arabic speakers and undermines trust. Complete coverage is required for the Arabic experience to be coherent.

**Independent Test**: Switch to Arabic, then trigger every major screen and at least one error message — no English string should appear anywhere in the UI.

**Acceptance Scenarios**:

1. **Given** Arabic is active, **When** any screen in the app is visited (setup, game board, meld table, round summary, scoreboard, game over), **Then** all static and dynamic text appears in Egyptian Arabic.
2. **Given** Arabic is active, **When** a validation error occurs (e.g., name too long, invalid meld), **Then** the error message displays in Egyptian Arabic.
3. **Given** Arabic is active, **When** game action prompts appear (e.g., "Draw a card", "Pass device to Player"), **Then** they display in Egyptian Arabic using natural, informal phrasing appropriate for the Egyptian dialect.
4. **Given** Arabic is active, **When** dynamic strings with variables appear (e.g., "{{name}}'s turn", "Penalty: {{points}} pts"), **Then** the variable is substituted correctly and the surrounding text is in Egyptian Arabic.

---

### User Story 4 — Locale-Aware Number Formatting (Priority: P2)

Scores and card values display in the numeral system appropriate to the active language: Western Arabic numerals (0–9) for English, and Eastern Arabic numerals (٠–٩) for Arabic.

**Why this priority**: Lower priority than text and layout — the app is functional without locale-aware numerals, but proper numeral display completes the Arabic language experience for users who expect Eastern Arabic numerals.

**Independent Test**: In Arabic mode, view the scoreboard — all scores must display using Eastern Arabic numerals (١، ٢، ٣ …).

**Acceptance Scenarios**:

1. **Given** Arabic is active, **When** any score, card value, or count is displayed, **Then** the number uses Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩).
2. **Given** English is active, **When** any score, card value, or count is displayed, **Then** the number uses Western Arabic numerals (0123456789).
3. **Given** a player has accumulated a triple-digit score (e.g., 142), **When** viewed in Arabic mode, **Then** the full number renders correctly as ١٤٢ without truncation.

---

### Edge Cases

- What happens if the device locale is Arabic but the user previously selected English in-app? The in-app preference overrides device locale — the saved preference wins.
- What if a player name contains both Arabic and Latin characters? The name is displayed as-entered; no transliteration occurs.
- What happens when the app needs a restart to apply the RTL/LTR direction change? A clear, non-blocking prompt informs the player that a restart is needed; the game state is preserved across the restart.
- What if the translation file for Arabic is missing a key? The English fallback string is shown — no blank/missing text.
- What happens to existing saved sessions when language switches? Game state is language-independent; only the display language changes, the session is preserved.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide an in-app language toggle on the setup screen only, offering English and Arabic options. The toggle MUST NOT be accessible during an active game round.
- **FR-002**: The selected language MUST be persisted between app sessions (stored locally on the device).
- **FR-003**: On first launch with no saved preference, the app MUST default to English.
- **FR-004**: All user-facing strings MUST be externalized into separate translation files — one per language (en.json, ar.json) — and MUST NOT be hardcoded in UI components.
- **FR-005**: The Arabic translation file MUST use Egyptian colloquial Arabic (عامية مصرية) for all strings, not Modern Standard Arabic (فصحى).
- **FR-006**: When Arabic is the active language, the app layout MUST display in right-to-left (RTL) direction: text alignment, element positioning, and navigation direction must all mirror the LTR layout.
- **FR-007**: When Arabic is active on the game board, the player's card hand MUST be displayed in right-to-left order.
- **FR-008**: All translation strings that include dynamic variables (e.g., player names, point values) MUST correctly interpolate those variables in both languages.
- **FR-009**: When Arabic is active, UI chrome numeric values (scores, card counts, round numbers, player counts) MUST render using Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩). Card face values (e.g., 7, K, A) MUST remain as standard internationally recognised symbols regardless of active language.
- **FR-010**: If switching language requires an app restart to apply the native RTL/LTR direction change, the app MUST display a dismissible non-blocking banner or toast informing the player that the direction change will take effect on the next cold launch. The player MUST be able to dismiss it and continue without restarting. No in-progress game state MUST be lost.
- **FR-011**: When a translation key is missing from the Arabic file, the system MUST fall back to the English string rather than displaying a blank or an error token.
- **FR-012**: The language toggle MUST reflect the currently active language visually (e.g., active option is highlighted).

### Key Entities

- **LanguagePreference**: The stored user preference for display language — value is one of the supported locale codes (`en`, `ar`); persisted across sessions.
- **TranslationFile**: A structured set of key-value string pairs for one locale, grouped by feature area (setup, game, validation, common, etc.).
- **LocaleConfig**: The active locale configuration driving layout direction (LTR vs RTL), numeral set, and which translation file is loaded.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user-visible strings have a corresponding key in both en.json and ar.json — no string is hardcoded in any UI component.
- **SC-002**: Language switch completes and all visible text updates within 1 second of the player selecting the new language (excluding any OS-level restart required for direction change).
- **SC-003**: Arabic-speaking players can complete a full game session (setup → play → round end → game over) without encountering any English text when Arabic is selected.
- **SC-004**: All UI chrome numeric values (scores, counts, round numbers) in Arabic mode correctly display Eastern Arabic numerals with no truncation for values up to 999. Card face values are unaffected and remain as standard symbols.
- **SC-005**: The selected language preference survives app close, device restart, and OS-level memory clearance — it is always restored on the next launch.
- **SC-006**: RTL layout is pixel-accurate in Arabic mode: no element overlaps, no clipped text, and no broken alignment on screens with up to 8 players listed.

---

## Assumptions

- The i18n infrastructure (i18next, react-i18next, AsyncStorage key `@joker51/language`) is already bootstrapped in the project and working — this feature extends and completes it, not rebuilds it.
- RTL layout may require a full app restart on some devices/platforms to apply the native direction change; this is a known platform constraint, not a bug.
- The Arabic translation file targets Egyptian colloquial Arabic (عامية مصرية) — formal / Modern Standard Arabic (فصحى) is explicitly out of scope.
- Eastern Arabic numerals are the target numeral set for Arabic locale; no support is needed for Farsi/Persian numerals.
- Device locale is not used to auto-detect language — the user's explicit in-app selection is the sole source of truth.
- Player names are stored as-entered and displayed as-entered in both languages — no translation or transliteration of names occurs.
- Only English and Arabic are in scope for this phase; adding further languages is out of scope.
