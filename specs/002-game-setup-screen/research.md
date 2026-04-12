# Research: Game Setup Screen

**Branch**: `002-game-setup-screen` | **Date**: 2026-04-12
**Phase 0 output for**: `specs/002-game-setup-screen/plan.md`

---

## Decision 1: RTL Layout Switching Strategy

**Decision**: Drive RTL layout through a `DirectionContext` React context (not solely via `I18nManager.forceRTL`) so the layout switches instantly without an app reload.

**Rationale**:
- `I18nManager.forceRTL(true)` requires an app restart to propagate through the native layer (a known React Native constraint). Calling it and reloading with `expo-updates` `reloadAsync()` would violate SC-004 (< 300ms, no reload required).
- A `DirectionContext` that wraps the root app provides an `isRTL: boolean` flag. All layout-sensitive components (`flexDirection`, `textAlign`, `writingDirection`) read from this context and update synchronously when the language changes.
- i18next language switch is synchronous — string re-rendering is instant.
- `I18nManager.forceRTL` is still called (for system-level inputs, keyboard, native date pickers) and the preference persisted, so on the next cold start native RTL is fully active.

**Alternatives Considered**:
- `I18nManager.forceRTL + reloadAsync()` — rejected because visible reload violates SC-004.
- CSS-in-JS `direction: rtl` on a root container — acceptable but less explicit; `DirectionContext` is more testable and explicit.

---

## Decision 2: State Management for Setup Form

**Decision**: Zustand store (`src/store/setupStore.ts`) for setup form state.

**Rationale**:
- Constitution prefers Zustand for lightweight state.
- The setup form has simple shape: `{ playerCount, playerNames[], roundFormat, language }`. A Zustand slice handles this with minimal boilerplate.
- No server state, no async fetching — just local form state and AsyncStorage reads/writes. Zustand + `persist` middleware handles both cleanly.
- Redux Toolkit would be over-engineering for a single setup form (Principle VIII: simplicity).

**Alternatives Considered**:
- `useState` in the screen component — rejected because language preference must be accessible app-wide (not just in the setup screen).
- React Context for form state — rejected because Zustand is already the chosen state layer; adding a second context system is inconsistent.

---

## Decision 3: Player Count Selector UI Pattern

**Decision**: Stepper component (decrement `−` / count label / increment `+` buttons).

**Rationale**:
- The range is narrow (2–8, only 7 values). A stepper is universally understood on mobile.
- A segmented control for 7 values would be too dense on 320 pt screens (SC-006).
- A scroll picker (UIPickerView style) adds unnecessary animation complexity (Principle VIII).
- Stepper is trivially accessible: two labelled buttons with clear `accessibilityLabel` props.

---

## Decision 4: Form Validation Strategy

**Decision**: Validate on Start button tap (not on keystroke), with inline error messages shown per field.

**Rationale**:
- SC-003 requires 100% of errors shown inline before submission. Tap-to-validate satisfies this.
- Per-keystroke validation on name fields would trigger error states while the user is still typing (poor UX).
- The Start button is disabled until all fields are non-empty (FR-003), providing live feedback without inline errors during typing.
- Only when Start is tapped (with whitespace-only names surviving the button-enable check) are inline errors shown.

**Implementation note**: The Start button enable logic checks `name.trim().length > 0` for each slot. On tap, a secondary validation pass checks each name again and sets per-field error state.

---

## Decision 5: AsyncStorage Key Design

**Decision**: Two keys, both prefixed with `@joker51/`:

| Key | Type | Value |
|-----|------|-------|
| `@joker51/language` | `'en' \| 'ar'` | User's selected locale |
| `@joker51/savedSession` | `GameState \| null` | Serialized game state from last in-progress session |

**Rationale**:
- Namespace prefix avoids collisions with other apps on the device (AsyncStorage is shared in Expo Go).
- Keeping language and session as separate keys allows each to be read/written independently — no need to parse a combined object.
- `savedSession` is written after every turn (constitution Principle V) by the game board screen; the setup screen only reads it (to check for resume prompt) and deletes it (on "New Game").

---

## Decision 6: Dependency on Phase 7 (Design System)

**Decision**: Implement a minimal token stub (`src/theme/tokens.ts`) for the values needed by this screen's components. Defer full design system to Phase 7; the stub must be compatible with Phase 7's full token set.

**Rationale**:
- The recommended execution order is Phase 7 → Phase 2, but Phase 2 can proceed if a minimal token file is established first.
- The stub defines only the tokens actively consumed by setup screen components: background color, surface color, text primary/secondary, accent (button fill), error color, spacing units, border radius, and font sizes.
- Phase 7 will expand this file; all Phase 2 components reference token names (not raw values), so no component changes are needed when Phase 7 adds full tokens.

**Token stub scope for Phase 2** (to be defined in `src/theme/tokens.ts`):
```
colors.background, colors.surface, colors.text.primary, colors.text.secondary,
colors.text.placeholder, colors.accent, colors.error, colors.border,
spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl,
radii.sm, radii.md, radii.lg,
typography.body, typography.label, typography.heading, typography.caption
```

---

## Decision 7: i18n Setup

**Decision**: Initialize i18next in `src/i18n/index.ts` with `initReactI18next`. Language is loaded from AsyncStorage on app start; i18next `lng` is set to the stored preference or `'en'` as fallback.

**Key translation namespaces** (for setup screen):
- `setup.title`, `setup.playerCount`, `setup.playerName`, `setup.roundFormat`
- `setup.roundFormat.short`, `setup.roundFormat.medium`, `setup.roundFormat.long`
- `setup.deckNotice` (with interpolation: `{{count}} decks required`)
- `setup.startButton`, `setup.resumeGame`, `setup.newGame`
- `validation.nameRequired`, `validation.nameWhitespace`, `validation.nameTooLong`
- `common.language.en`, `common.language.ar`

**RTL keys** that must be present in both `en.json` and `ar.json`: all of the above.
