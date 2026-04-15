# Feature Specification: Design System, Theme & Game UX

**Feature Branch**: `008-phase-7-game`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: Design system tokens + realistic card visuals + card style selection in settings + staged-card feedback + drag-to-reorder hand + Joker placement selection in sequences

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Token-Based Visual System (Priority: P1)

A developer building or reviewing any screen in the app relies on the centralized token file for all visual values. No matter which screen or component they open, the visual language is consistent — same spacing rhythm, same color meanings, same type scale.

**Why this priority**: Without a token system in place, every subsequent screen feature (Phases 2–6) risks visual inconsistency, raw-value proliferation, and costly design debt. This is the foundation all UI work depends on.

**Independent Test**: Can be fully tested by auditing any rendered screen for the presence of zero raw color, spacing, or typography values outside the token file, confirming all visual decisions trace back to named tokens.

**Acceptance Scenarios**:

1. **Given** a developer opens any component or screen file, **When** they search for raw hex color values or numeric spacing values, **Then** none are found — all values reference token constants.
2. **Given** a designer changes a color token value, **When** the app is rebuilt, **Then** every surface consuming that token updates uniformly with no additional code changes.
3. **Given** a new token is needed, **When** a developer adds it to the token file, **Then** it becomes immediately available to all components without modifying any existing file structure.

---

### User Story 2 - Realistic Playing Card Visuals (Priority: P1)

A player looking at their hand or the table sees cards that closely resemble physical playing cards: correct suit symbols in the top-left and bottom-right corners, rank labels in the corners, red and black suit color-coding, a distinct face-card style for J/Q/K, and a clearly unique Joker design.

**Why this priority**: Cards are the primary game element. If cards do not look like real cards, players make mistakes — wrong card selection, misread suits, confusion between Joker and number cards. Visual fidelity directly reduces gameplay errors.

**Independent Test**: Can be fully tested by rendering a full hand of mixed cards (number cards of all four suits, a face card, a Joker) and verifying that a new player — without instructions — can correctly identify every card's rank and suit under any available card style.

**Acceptance Scenarios**:

1. **Given** a number card (e.g., 7 of Hearts) is displayed, **When** a player views it, **Then** the card shows the rank ("7") in the top-left and bottom-right corners, the suit symbol (♥) adjacent to the rank in those corners, and the suit accent color (red for Hearts) on a white or light card background.
2. **Given** a face card (Jack, Queen, or King) is displayed, **When** a player views it, **Then** the card shows the rank letter ("J", "Q", "K") with the suit symbol in corners, retaining suit color, with a visual style that clearly distinguishes it from number cards according to the active card style.
3. **Given** an Ace is displayed, **When** a player views it, **Then** the card shows "A" in the corners with a large centered suit symbol, retaining suit color coding.
4. **Given** a Joker is displayed, **When** a player views it, **Then** it shows a "JOKER" label (or equivalent indicator), has no suit symbol, and uses a visually distinct color treatment that cannot be mistaken for any suit card.
5. **Given** the card back (face-down) is displayed, **When** a player views it, **Then** it shows a consistent decorative pattern that reveals no rank or suit information.

---

### User Story 3 - Card Style Selection in Settings (Priority: P1)

A player opens the settings screen and selects their preferred card style from a set of predefined visual themes. The chosen style is applied immediately to all cards in the game and persists across sessions.

**Why this priority**: Different players have strong visual preferences — some prefer minimal/modern layouts, others want a style closer to a physical deck. Offering a style choice increases comfort and reduces misreads for different audiences without changing game rules.

**Independent Test**: Can be fully tested by navigating to the settings screen, selecting each available card style, and verifying: (a) cards on the game board update to the selected style immediately, (b) the preference is still active after closing and reopening the app.

**Acceptance Scenarios**:

1. **Given** a player opens the settings screen, **When** they view the card style section, **Then** they see all available style options displayed as small card preview thumbnails so they can evaluate the styles before selecting.
2. **Given** a player taps a card style option, **When** the style is selected, **Then** it is immediately marked as active (highlighted selection state) and all cards rendered anywhere in the app update to the new style without requiring a restart.
3. **Given** a player selects a card style and then closes the app, **When** they reopen the app, **Then** their chosen card style is still active — the preference persists across sessions.
4. **Given** a player is mid-game and opens settings to change card style, **When** they return to the game board, **Then** the cards display in the newly selected style with no data loss or state corruption.

---

### User Story 4 - Staged Card Dimming Feedback (Priority: P1)

When a player taps one or more cards in their hand to stage them for a meld or lay-off action, the selected cards visually lift or highlight to confirm selection, and the remaining unselected cards in the hand become visually dimmed and non-tappable — so the player clearly understands which cards are "in play" and cannot accidentally re-tap an already-staged card.

**Why this priority**: Without clear staged-vs-hand feedback, players frequently mis-tap, lose track of which cards they've committed, and cannot tell whether the system has registered their selection. This is a core usability requirement for every meld interaction.

**Independent Test**: Can be fully tested by staging two cards from a hand of seven, then attempting to tap the remaining five — the five must not respond to taps, and the two staged cards must be visually distinct (e.g., elevated, full opacity) while the rest are visibly dimmed.

**Acceptance Scenarios**:

1. **Given** a player taps a card in their hand to stage it, **When** the card is selected, **Then** the card visually elevates or changes appearance to indicate it is staged (e.g., slight upward shift, highlighted border) and the remaining hand cards become dimmed (reduced opacity).
2. **Given** one or more cards are staged, **When** the player taps a non-staged hand card, **Then** the tap does not register — the card does not become staged and provides no interaction feedback.
3. **Given** a player taps a staged card again to un-stage it, **When** the card is de-selected, **Then** it returns to the normal hand appearance and the remaining hand cards restore full opacity and become interactive again.
4. **Given** all staged cards are committed (meld action confirmed), **When** the meld is processed, **Then** all remaining hand cards restore full opacity and full interactivity immediately.

---

### User Story 5 - Drag-to-Reorder Hand (Priority: P2)

A player can press and hold any card in their hand, then drag it left or right to reorder their hand. Cards shift to make room as the dragged card moves, and releasing the card places it in the new position. The reordered arrangement persists for the remainder of the player's turn.

**Why this priority**: Players in card games naturally sort their hands for strategic play (group by suit, build sequences visually). Without reordering, players must mentally track card positions, increasing cognitive load and slowing turns.

**Independent Test**: Can be fully tested by dragging a card from position 1 to position 5 in a hand of seven cards, releasing it, and confirming the hand order updates correctly and the moved card stays in its new position on subsequent renders.

**Acceptance Scenarios**:

1. **Given** a player long-presses a card in their hand, **When** the drag begins (after 200ms), **Then** the dragged card visually lifts (scale up, shadow) to indicate it is being moved, and the remaining cards slide apart to show the potential drop position.
2. **Given** the player is mid-drag, **When** the dragged card passes over a gap between two cards, **Then** the surrounding cards animate to create a visible insertion slot at that position.
3. **Given** the player releases the dragged card, **When** it is dropped at a valid position, **Then** the card settles into that position with a smooth animation and the hand reorders accordingly.
4. **Given** the player releases the card outside the hand area (invalid drop zone), **When** the drop is detected, **Then** the card snaps back to its original position with an animation.
5. **Given** the player is currently dragging a card, **When** they attempt to tap another card (staging), **Then** the drag takes priority and staging is not triggered during an active drag gesture.

---

### User Story 6 - Joker Placement Selection in Sequences (Priority: P2)

When a player attempts to place a Joker as part of a sequence meld or lay-off, the app presents a bottom sheet picker showing the possible positions the Joker can occupy in that sequence. The player selects the desired position, then confirms the meld.

**Why this priority**: A Joker in a sequence is ambiguous — it can represent the card below or above the known cards. Without an explicit selection step, the system must guess, leading to incorrect sequences that cannot be corrected. This also enables smarter strategic play.

**Independent Test**: Can be fully tested by staging a 7, an 8, and a Joker, initiating a meld, and verifying that a bottom sheet picker appears showing at least two valid positions for the Joker (6 or 9), selecting one, and confirming the sequence is built correctly.

**Acceptance Scenarios**:

1. **Given** a player stages a Joker alongside known sequence cards (e.g., 7♠ and 8♠), **When** they initiate the meld action, **Then** a bottom sheet picker slides up showing all valid sequence options with the Joker represented as a highlighted placeholder at each candidate position.
2. **Given** the bottom sheet picker is displayed, **When** the player selects a position option, **Then** the selected option is highlighted and a "Confirm" action becomes available.
3. **Given** the player confirms the selected position, **When** the meld is submitted, **Then** the sequence is created with the Joker occupying the chosen position, and the sequence displayed on the table reflects the player's choice.
4. **Given** the bottom sheet picker is displayed, **When** the player dismisses it (taps backdrop or swipes down), **Then** the staged cards return to the hand in their original state with no meld submitted.
5. **Given** a Joker is staged alongside cards that have only one valid sequence position (no ambiguity), **When** the meld is initiated, **Then** the placement picker is skipped and the single valid sequence is built directly.

---

### User Story 7 - Reusable UI Component Library (Priority: P2)

A developer building any game screen (Setup, Board, Scoring, etc.) uses pre-built components — Button, Badge, Modal, and layout wrappers — without writing any new inline styles or raw visual values.

**Why this priority**: Without a component library, each screen author recreates the same visual patterns inconsistently. The library enforces the token system at the component level.

**Independent Test**: Can be fully tested by building a sample screen using only the component library and token system — no inline StyleSheet values — and confirming the screen renders correctly on both platforms.

**Acceptance Scenarios**:

1. **Given** a Button component is used, **When** rendered in default, pressed, and disabled states, **Then** each state is visually distinct using token-defined colors with no raw values in the component's style definitions.
2. **Given** a Badge component is used to display a score or label, **When** rendered, **Then** it respects the typography scale and color tokens for both LTR (English) and RTL (Arabic) layouts.
3. **Given** a Modal component is opened, **When** rendered, **Then** it displays a backdrop overlay and a content container using token-defined radii, shadows, and colors.
4. **Given** a layout wrapper component is used on a screen, **When** rendered on both iOS and Android, **Then** safe area insets, scroll behavior, and keyboard avoidance are handled correctly with no platform-specific raw values.

---

### User Story 8 - RTL Layout Compatibility (Priority: P3)

All components and layout wrappers render correctly in right-to-left mode when Arabic is the active language, maintaining the same visual hierarchy and spacing rhythm.

**Why this priority**: RTL compatibility is a constitutional requirement (Principle VI). Components built without RTL awareness force costly rewrites when Arabic support is exercised.

**Independent Test**: Can be fully tested by switching the app to Arabic and verifying every component from the library renders without layout breaks, text overflow, or reversed-icon issues.

**Acceptance Scenarios**:

1. **Given** the app is in Arabic (RTL) mode, **When** any component from the library is rendered, **Then** layout direction, text alignment, and icon placement mirror correctly for RTL.
2. **Given** the app switches from English to Arabic, **When** screens are re-rendered, **Then** no component from the library shows clipped text, overlapping elements, or broken padding.

---

### Edge Cases

- What happens when a token is referenced in a component but has not been defined in the token file? (Build-time type error expected.)
- How does the card component render when rank or suit is undefined/invalid? (Fallback rendering without crash.)
- How do shadow tokens render on Android, where elevation behaves differently than iOS box-shadow? (Elevation-based approximation.)
- What happens if the player tries to drag a card while one or more cards are already staged? (Dragging and staging are independent — dragging a staged card moves it; dragging an unstaged card is allowed but does not stage it.)
- What if there is only one card in the hand — can it be dragged? (Yes, but there is no valid reorder destination; the card snaps back.)
- What if the Joker placement picker shows more than two valid positions (e.g., a Joker alongside a single known card)? (All valid positions are presented; bottom sheet scrolls if needed.)
- What if a player changes card style while the Joker placement picker bottom sheet is open? (The picker updates to render the new style without closing or losing the player's selection.)
- What if the selected card style is deleted or unavailable in a future app version? (Fall back to the default style silently; do not crash.)

## Requirements *(mandatory)*

### Functional Requirements

**Design Token System**

- **FR-001**: The system MUST provide a single centralized token file that declares all named constants for: background colors, surface colors, suit accent colors, typography sizes and weights, spacing units, border radii, shadow presets, and z-index levels.
- **FR-002**: All component and screen files MUST reference design tokens exclusively; raw hex values, numeric spacing literals, and inline font sizes in render paths are forbidden.
- **FR-003**: Token names MUST be semantic and domain-appropriate (e.g., `colors.surface.card`, `spacing.md`, `radius.button`) rather than literal (e.g., `colors.darkBlue`, `spacing.12`).
- **FR-004**: A single dark-themed color palette is the only mode required; light mode support is deferred to a future phase.

**Card Visuals**

- **FR-005**: The Card component MUST display the rank label in the top-left and bottom-right corners and the suit symbol adjacent to the rank label in those corners, regardless of which card style is active.
- **FR-006**: The Card component MUST use a white or light-colored card face background so rank and suit labels have high contrast in all card styles.
- **FR-007**: Red suits (Hearts ♥, Diamonds ♦) MUST render with a red accent color; black suits (Clubs ♣, Spades ♠) MUST render with a black or near-black accent color; both MUST use token-defined colors across all card styles.
- **FR-008**: Face cards (J, Q, K) visual treatment is determined by the active card style (see FR-030–FR-033). In all styles, suit rank and symbol MUST still appear in the card corners, retaining suit color coding.
- **FR-009**: Aces MUST display "A" in the corners and a large centered suit symbol, retaining suit color, in all card styles.
- **FR-010**: Joker cards MUST display a "JOKER" label (or equivalent), have no suit symbol, and use a visually unique color treatment that cannot be mistaken for any suited card, in all card styles.
- **FR-011**: The card back (face-down state) MUST display a consistent decorative pattern that reveals no rank or suit information.

**Card Style Selection**

- **FR-030**: The system MUST provide a minimum of 2 predefined card styles that players can choose from in the settings screen.
- **FR-031**: Each card style MUST be visually distinct in how it renders face cards (J, Q, K); number cards and Aces share a common layout across styles (rank + suit in corners). Example styles include: *Classic* (large centered rank letter on a colored background fill) and *Minimal* (rank only, no background fill distinction).
- **FR-032**: The settings screen MUST display each available card style as a small preview thumbnail (showing at least one face card and one number card) so players can evaluate options before selecting.
- **FR-033**: The selected card style MUST be applied immediately and globally — all cards rendered anywhere in the app (hand, table, discard pile) update without requiring a restart or navigation change.
- **FR-034**: The selected card style MUST be persisted across sessions; the player's choice is restored on app launch.
- **FR-035**: If no card style has been explicitly chosen by the player, the system MUST fall back to the default style silently.

**Staged Card Feedback**

- **FR-012**: When a card in the player's hand is tapped to stage it, the card MUST visually indicate selection (e.g., upward shift, highlighted border, or glow) while all non-staged hand cards become dimmed (reduced opacity). There is no upper limit on how many cards the player may stage; the game engine validates the meld when submitted.
- **FR-013**: Non-staged hand cards MUST be non-interactive (taps ignored) while at least one card is staged.
- **FR-014**: Tapping a staged card MUST de-stage it, returning it and the remaining hand cards to their normal interactive state.
- **FR-015**: Completing or cancelling a meld action MUST restore all hand cards to full opacity and full interactivity immediately.

**Drag-to-Reorder Hand**

- **FR-016**: A player MUST be able to long-press any card in their hand to initiate a drag-reorder gesture. The long-press activation threshold MUST be 200ms — short enough to feel responsive, long enough to avoid triggering on normal taps.
- **FR-017**: While dragging, the dragged card MUST visually lift (increased scale and shadow) and other hand cards MUST shift to show the current insertion position.
- **FR-018**: Releasing the dragged card at a valid position MUST reorder the hand array and animate the card settling into the new position.
- **FR-019**: Releasing the dragged card outside the hand area MUST snap the card back to its original position.
- **FR-020**: The reordered hand arrangement MUST persist for the remainder of the session (not reset on re-render); the order is cosmetic and does not affect game logic.

**Joker Placement Selection**

- **FR-021**: When a player initiates a sequence meld that includes a Joker and two or more known cards, OR lays off a Joker onto an existing sequence on the table where the position is ambiguous (open end exists on both sides), the system MUST present a placement picker showing all valid positions the Joker can occupy in the resulting sequence.
- **FR-022**: The placement picker MUST be presented as a bottom sheet modal that slides up from the bottom of the screen, keeping the game board partially visible behind it. It MUST display each valid sequence option clearly (e.g., listing the full sequence with the Joker represented as a highlighted placeholder at its position). The sheet MUST be dismissible by tapping the backdrop or swiping down.
- **FR-023**: The player MUST be able to select one option from the picker, after which a confirm action becomes available.
- **FR-024**: Confirming a selection MUST submit the sequence meld with the Joker in the chosen position.
- **FR-025**: Dismissing the picker (cancel) MUST return all staged cards to the hand with no meld submitted.
- **FR-026**: If a sequence containing a Joker has only one valid position (no ambiguity), the placement picker MUST be skipped and the meld submitted directly.

**General Component Library**

- **FR-027**: The system MUST provide Button, Badge, Modal, and layout wrapper components — all consuming tokens exclusively with no raw values.
- **FR-028**: Components MUST accept only the props required for display and interaction; they MUST NOT fetch data, dispatch game actions, or embed game logic.
- **FR-029**: All layout components MUST support RTL rendering when Arabic is the active locale, with no additional props required from the screen author.

### Key Entities

- **Design Token**: A named constant representing a single visual decision (color, size, spacing, radius, shadow). Lives in `src/theme/tokens.ts`. Semantic name tied to purpose, not literal value.
- **Card Style**: A named visual theme that controls how cards are rendered — specifically the treatment of face cards (J, Q, K) and any per-style accent choices. The active card style is a user preference persisted across sessions. All styles share the same core card layout (rank + suit in corners).
- **Card**: A visual component representing one playing card. States: normal, staged (selected), dimmed (not staged while another is), face-down (back). Has rank (A, 2–10, J, Q, K, Joker) and suit (Hearts, Diamonds, Clubs, Spades, or none for Joker). Rendered according to the active Card Style.
- **Hand**: The ordered list of cards a player currently holds. Order is player-controlled (drag-to-reorder) and cosmetic — game logic treats the hand as an unordered set.
- **Staged Card**: A card the player has tapped to mark for a meld or lay-off action. Visually elevated; remaining hand cards are dimmed and non-interactive.
- **Joker Placement Picker**: A bottom sheet modal shown when a sequence meld with a Joker has more than one valid position. Displays the full candidate sequences and allows the player to choose one.
- **UI Component**: A reusable presentational component (Button, Badge, Modal, layout wrapper) that composes tokens into interactive or structural building blocks. No game state access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All screen and component files contain zero raw hex color values, zero numeric spacing literals, and zero inline font sizes outside the token file — verified by code review.
- **SC-002**: All four suits, all face cards, Aces, and both Jokers are visually distinguishable from one another at a standard phone screen card size (no magnification required) by a first-time player, under every available card style.
- **SC-003**: When one or more hand cards are staged, a player cannot accidentally interact with non-staged cards — tap attempts on dimmed cards produce no response 100% of the time.
- **SC-004**: A player can drag a card from any position in their hand to any other position and release it correctly — the hand reorders and the moved card does not snap back (for valid drop zones).
- **SC-005**: When a Joker placement picker is shown, the player can select any offered position and the resulting sequence on the table reflects exactly the chosen arrangement.
- **SC-006**: A player can select a card style in settings, close the app, reopen it, and find their chosen style still active — preference survives app restarts 100% of the time.
- **SC-007**: Every component in the library renders correctly in both LTR (English) and RTL (Arabic) layouts with no layout breaks, text overflow, or misaligned elements.
- **SC-008**: Developers building Phase 2–6 screens introduce no new inline styles in screen files — all visual patterns come from the component library and token system.

## Clarifications

### Session 2026-04-13

- Q: Does the Joker placement picker apply only to new sequence melds, or also to laying off a Joker onto an existing sequence on the table when position is ambiguous? → A: Both — picker applies to new melds and lay-offs whenever the Joker position is ambiguous (open end exists on both sides of the sequence).
- Q: What is the visual form of the Joker placement picker? → A: Bottom sheet modal — slides up from the bottom, game board partially visible behind it, dismissible by tapping backdrop or swiping down.
- Q: Is there a maximum number of cards a player can stage simultaneously? → A: No cap — player may stage any number of cards freely; the game engine validates the meld on submission.
- Q: What visual treatment distinguishes face cards (J/Q/K) from number cards? → A: Revised — face card visual treatment is determined by the active card style chosen by the player in settings. Multiple predefined styles are available; the default style uses a large centered rank letter on a distinct background fill color.
- Q: What long-press duration should activate the drag-reorder gesture? → A: 200ms — responsive but avoids accidental drags on normal taps.

## Assumptions

- A single dark-themed color palette is used for the initial release; light mode is out of scope for this phase.
- Card face artwork (illustrated/photographic face cards) is out of scope; typographic and symbolic representations (rank letter + suit symbol) are sufficient for all card styles in the initial release.
- A minimum of 2 card styles ship with the initial release; additional styles can be added in future phases without requiring spec changes.
- Animation tokens (durations, easing curves for non-drag animations) are not part of this phase; drag animation parameters are defined locally within the drag-reorder component and may be tokenized in a later phase.
- The Joker placement picker applies to sequence melds only; set melds (three or four of a kind) have no ambiguous Joker position and do not require a picker.
- Drag-to-reorder is a cosmetic hand management feature; the game engine always receives the full hand contents regardless of display order, and the engine does not depend on hand order.
- Shadow rendering on Android uses elevation-based approximations; pixel-perfect shadow parity with iOS is not required.
- RTL support in components assumes the app-level RTL direction is already set by the i18n layer; individual components do not perform locale detection.
- The staged-card dimming feature applies to the current player's hand only; opponent hands (face-down) are not interactive and do not need this behavior.
- Card style preference is stored in AsyncStorage under an existing or new app-scoped key; no new storage mechanism is introduced.
