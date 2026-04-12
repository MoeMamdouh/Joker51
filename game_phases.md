# Joker 51 — Development Phases

> Speckit workflow: for each phase run `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`

---

## Phase 1 — Core Game Engine

**Goal**: Pure TypeScript game logic — zero UI. All other phases depend on this.

**Covers**: Deck creation, shuffling, dealing (14 cards/player), card values, sequence validation,
set validation, Joker substitution, 51-point initial meld threshold, Ace dual-position (low/high),
draw pile exhaustion + reshuffle, full-set/full-sequence clearing trigger, win condition, scoring.

```
/speckit-specify core game engine — deck creation, shuffling, dealing 14 cards per player, card value definitions, sequence and set validation, Joker substitution rules, initial 51-point meld threshold, Ace dual-position logic, draw pile exhaustion and reshuffle, full-set and full-sequence clearing on reshuffle, win condition requiring a final discard, and end-of-round scoring with flat 100 penalty for no meld
```

---

## Phase 2 — Game Setup Screen

**Goal**: Entry point of the app — configure a new game session before play begins.

**Covers**: Player count selection (2–8), player name entry, round format selection
(Short 4 / Medium 8 / Long 12), auto-calculated deck count with notification when 2+ decks
are used, language selection (EN / AR), and game start.

```
/speckit-specify game setup screen — configure player count (2–8), enter player names, select round format (short/medium/long), display auto-calculated deck count with a notice when 2 or more decks are needed, and navigate to the game board on start
```

---

## Phase 3 — Main Game Board & Turn Flow

**Goal**: The primary game screen where each round is played.

**Covers**: Player hand display, draw pile and discard pile, turn indicator, enforcing the
draw → meld → add → discard sequence, drawing from either pile, discarding to end a turn,
and handling draw pile exhaustion mid-game.

```
/speckit-specify main game board — display each player's hand, draw pile, and discard pile, show whose turn it is, enforce the draw then optional meld and add then mandatory discard turn sequence, allow drawing from either the draw pile or top of the discard pile, and handle draw pile exhaustion by reshuffling the discard pile
```

---

## Phase 4 — Meld & Table Management

**Goal**: All interactions with cards on the table.

**Covers**: Placing the initial meld (51-point gate), laying off cards to existing combinations
(sequences and sets), claiming Jokers from the table (replace with real card, combination stays
valid), displaying all melded combinations grouped by player, and enforcing the one-Joker-per-
combination limit during the opening meld.

```
/speckit-specify meld and table management — place initial meld meeting the 51-point threshold, lay off cards onto existing table sequences and sets, claim a Joker from any table combination by replacing it with the real card while keeping the combination valid, enforce one Joker per combination during the opening meld, and display all melded combinations on the table grouped by player
```

---

## Phase 5 — Round End & Scoring Screen

**Goal**: Summarize each round and track progress across the full game.

**Covers**: Detecting the winning condition (final discard), calculating penalties per player
(flat 100 for no meld / hand sum for partial meld), displaying per-round scores, accumulating
totals across all rounds, advancing to the next round or declaring the game winner.

```
/speckit-specify round scoring and game progression — detect the winning discard to end a round, calculate per-player penalties (flat 100 for players who never melded, sum of remaining hand for others), display a round summary screen with scores, accumulate totals across all rounds, advance to the next round or show the final winner when all rounds are complete
```

---

## Phase 6 — Multilingual Support (EN / AR)

**Goal**: Full English and Arabic UI with RTL layout for Arabic.

**Covers**: Externalized string translations (en.json / ar.json), in-app language toggle,
RTL layout switch for Arabic (layout direction, text alignment, card hand order, navigation),
locale-aware number formatting for scores and card values, persisting language preference.

```
/speckit-specify multilingual support — full English and Arabic translations for all UI strings, in-app language toggle with preference persisted across sessions, right-to-left layout for Arabic including card hand order and navigation direction, and locale-aware number formatting for scores and card values
```

---

## Phase 7 — Design System & Theme

**Goal**: Establish the visual foundation all screens and components are built on.

**Covers**: Color tokens (backgrounds, surfaces, suits, accents), typography scale,
spacing units, border radii, shadow presets, card visual design (suits, face cards, Joker),
light/dark mode support if required.

```
/speckit-specify design system and theme — define all color tokens, typography scale, spacing units, border radii, and shadow presets used across the app, establish card visual design for number cards, face cards, and Jokers, and organize reusable UI components (Button, Badge, Modal, layout wrappers) that consume theme tokens exclusively
```

---

## Execution Order

```
Phase 1 (Engine)  →  Phase 7 (Design System)  →  Phase 2 (Setup)
                                                →  Phase 3 (Board)  →  Phase 4 (Meld)
                                                                    →  Phase 5 (Scoring)
                                                                    →  Phase 6 (i18n)
```

- **Phase 1** unblocks all game logic work.
- **Phase 7** unblocks all UI work.
- **Phases 2–5** can proceed in parallel once Phase 1 and 7 are done.
- **Phase 6** can be layered in at any point after Phase 7.

---

*Reference: `joker51_game_rules.md` — game rules source of truth*
*Reference: `.specify/memory/constitution.md` — project principles and constraints*
