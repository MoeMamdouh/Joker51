<!--
SYNC IMPACT REPORT
==================
Version change: 1.1.0 → 1.2.1
Modified principles: N/A
Added sections:
  - Core Principles (I–VIII): added VIII. Design System & Component Architecture
  - Technology Stack: added design system/token tooling entry
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (compatible, no changes needed)
  - .specify/templates/spec-template.md ✅ (compatible, no changes needed)
  - .specify/templates/tasks-template.md ✅ (compatible, no changes needed)
Follow-up TODOs: None — all fields resolved
-->

# Joker 51 Constitution

## Core Principles

### I. Game Rule Fidelity (NON-NEGOTIABLE)

Every game mechanic MUST precisely implement the rules defined in `joker51_game_rules.md`.
Any deviation from the specification requires an explicit rule change in that document first —
the document is the source of truth, not intuition or convention.

- Card values, combination validation, Joker rules, scoring, and turn flow MUST match the spec exactly.
- Edge cases listed in Section 15 of the spec MUST be handled explicitly, not silently defaulted.
- Game logic MUST be pure (no side effects): given the same state + action, the result is always identical.
- Rule changes MUST be reflected in both `joker51_game_rules.md` and in tests before implementation.

### II. Layered Architecture (Game Engine vs. UI)

The codebase MUST maintain a strict separation between game logic and presentation.

- **Game Engine** (`src/engine/`): Pure TypeScript — zero React, zero Expo, zero UI imports.
  Responsible for: deck management, deal, draw, meld validation, turn transitions, scoring.
- **State Layer** (`src/store/`): Connects engine to React via a state manager (e.g., Zustand or Redux Toolkit).
  No game logic here — only state shape, selectors, and dispatch.
- **UI Layer** (`src/components/`, `src/screens/`): React Native components consume state; they do not
  compute game outcomes.
- Cross-layer imports MUST flow downward only: UI → State → Engine. Engine MUST never import from UI or State.

### III. Test-First Game Logic

All game engine functions MUST have unit tests written before implementation (TDD).

- Red-Green-Refactor cycle is mandatory for engine code.
- Tests MUST cover: valid/invalid combinations, Joker substitution, initial meld threshold (51 pts),
  Ace dual-position sequences, reshuffle trigger, scoring (meld vs. no-meld penalty), win condition.
- UI components use integration/snapshot tests — unit tests are not required for purely presentational code.
- A pull request that adds or changes engine logic without corresponding tests MUST NOT be merged.

### IV. Cross-Platform Excellence

The app MUST deliver feature and visual parity across iOS and Android.

- All components MUST be tested on both platforms before a feature is considered complete.
- Platform-specific code (`Platform.select`, `.ios.ts`, `.android.ts`) is allowed only when
  a genuine platform difference exists and MUST be documented with a comment explaining why.
- Animations MUST use the React Native Reanimated library (Worklets) to ensure 60 fps on both platforms.
- Haptic feedback and sound effects MUST be gated on device capability checks — never assume availability.

### V. State Predictability & Immutability

All game state MUST be immutable and transitions MUST be explicit.

- State MUST be serializable at all times (no class instances, no circular refs, no functions in state).
- Every state transition MUST be a pure function: `(state, action) => newState`.
- Game session state MUST be persisted to AsyncStorage on each turn so the game survives app backgrounding.
- State shape changes MUST include a migration strategy before merging.

### VI. Multilingual Support (EN + AR)

The app MUST support English and Arabic with full UI parity between both languages.

- All user-facing strings MUST be externalized into translation files (`src/i18n/en.json`,
  `src/i18n/ar.json`). Hard-coded display strings in components are forbidden.
- Arabic MUST render right-to-left (RTL): layout direction, text alignment, card hand order,
  and navigation transitions MUST all respect RTL when `ar` is active.
- The i18n library MUST be `i18next` + `react-i18next`; locale detection via
  `expo-localization` on app start, with an in-app language toggle persisted to AsyncStorage.
- New UI copy MUST be added to both locale files in the same commit — a PR with a missing
  translation key in either file MUST NOT be merged.
- Number formatting (scores, card values) MUST use locale-aware formatting; Arabic-Indic
  numerals are acceptable but not required.

### VII. Design System & Component Architecture (NON-NEGOTIABLE)

A single design system is the exclusive source of all visual values; no screen or component
may define raw colors, spacing, typography, or radius values inline.

**Design Tokens** (`src/theme/tokens.ts`):
- All colors, typography scales, spacing units, border radii, shadow presets, and z-index
  levels MUST be declared here as named constants.
- Magic numbers (e.g., `padding: 12`, `color: '#1A1A2E'`) in component or screen files are
  forbidden — every value MUST reference a token.
- Token names MUST be semantic, not literal (e.g., `colors.surface.card` not `colors.darkBlue`).

**Component Library** (`src/components/`):
- Components are organized by domain: `src/components/ui/` (generic), `src/components/game/`
  (game-specific), `src/components/layout/` (structural).
- Every reusable visual element (Button, Card, Badge, Modal, etc.) MUST live in the library
  and MUST consume tokens exclusively — no local style overrides.
- Components MUST accept only the props they need; no "god props" that pass raw style objects.
- A component MUST NOT fetch data or dispatch actions — that belongs in screens or hooks.

**Screens** (`src/screens/`):
- Screens compose predefined components; they do not define new visual primitives.
- A screen that needs a new visual pattern MUST first add that pattern to the component
  library — inline one-off styles in screens are forbidden.
- Screen-level layout (safe area, scroll, keyboard avoidance) uses dedicated layout
  components from `src/components/layout/`.

**Enforcement**:
- PR reviews MUST flag any raw value not referencing a design token.
- Adding a new token is always preferred over using a raw value.

### VIII. Simplicity Over Cleverness

The simplest implementation that correctly satisfies the game rules MUST be chosen.

- Abstractions are introduced only when the same logic appears in three or more places.
- No premature optimization — profile first, optimize second.
- Dependencies MUST be justified: each new package requires a comment in `package.json` explaining purpose.
- UI animations MUST enhance gameplay feedback; decorative-only animations that impact performance are prohibited.

## Technology Stack

- **Runtime**: Expo SDK (latest stable) with Expo Router for navigation.
- **Language**: TypeScript — strict mode enabled, `any` is forbidden without an explicit `// eslint-disable` justification.
- **State Management**: Zustand (preferred for lightweight game state) or Redux Toolkit if complexity warrants.
- **Animation**: React Native Reanimated 3+ with Gesture Handler.
- **Testing**: Jest + React Native Testing Library for UI; pure Jest for engine unit tests.
- **Styling**: StyleSheet API or NativeWind (Tailwind for RN); no inline style objects in render paths.
- **Design Tokens**: `src/theme/tokens.ts` — single source for all colors, spacing,
  typography, radii, and shadows. No raw values anywhere else.
- **i18n**: `i18next` + `react-i18next`; locale files at `src/i18n/{en,ar}.json`; locale
  detection via `expo-localization`; RTL layout via `I18nManager.forceRTL` on language switch.
- **Deck Count**: Auto-calculated from player count per spec Section 2; UI MUST notify players when 2+ decks are used.

## Development Workflow

- Feature branches follow `###-feature-name` convention (e.g., `001-game-engine`).
- Every merge to `main` MUST pass: TypeScript compilation, ESLint, and the full test suite.
- Game engine changes MUST include a test coverage report showing ≥ 90% line coverage for modified files.
- UI changes MUST be manually verified on both iOS Simulator and Android Emulator before PR review.
- Commit messages MUST reference the relevant spec section when changing game logic
  (e.g., `feat(engine): implement Joker claim rule (spec §8.2)`).

## Governance

This constitution supersedes all informal agreements, comments, and ad-hoc decisions.
Amendments require:

1. A written rationale explaining why the principle must change.
2. Update to this file with a version bump following semantic versioning:
   - **MAJOR**: Removal or redefinition of a principle (backward-incompatible governance change).
   - **MINOR**: New principle or materially expanded guidance added.
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements.
3. All existing specs and plans reviewed for compliance after an amendment.

All pull requests MUST include a Constitution Check confirming no principles are violated.
Complexity violations (e.g., adding a fourth project layer) MUST be justified in the plan's
Complexity Tracking table before implementation begins.

**Version**: 1.2.1 | **Ratified**: 2026-04-12 | **Last Amended**: 2026-04-12
