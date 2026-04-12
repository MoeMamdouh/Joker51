---
description: "Task list for Game Setup Screen implementation"
---

# Tasks: Game Setup Screen

**Input**: Design documents from `specs/002-game-setup-screen/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/setup-ui.md ✅ quickstart.md ✅

**Tests**: Included — constitution Principle III mandates integration/snapshot tests for UI components.
**Note**: Tests are written after component implementation (not strict TDD for UI per constitution).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in all descriptions

---

## Phase 1: Setup

**Purpose**: Install dependencies, create directory structure, and create the theme token stub required before any component work.

- [ ] T001 Install required packages: `expo-localization`, `i18next`, `react-i18next`, `@react-native-async-storage/async-storage`, `zustand` — update `package.json` with justification comments per constitution Principle VIII
- [ ] T002 [P] Create directory structure: `src/screens/`, `src/components/setup/`, `src/components/ui/`, `src/components/layout/`, `src/store/`, `src/contexts/`, `src/hooks/`, `src/i18n/`, `src/theme/`, and their `__tests__/` subdirectories
- [ ] T003 Create `src/theme/tokens.ts` — define minimum token stub: `colors.background`, `colors.surface`, `colors.text.primary`, `colors.text.secondary`, `colors.text.placeholder`, `colors.accent`, `colors.error`, `colors.border`; `spacing.xs/sm/md/lg/xl`; `radii.sm/md/lg`; `typography.body/label/heading/caption` (all as named constants, no raw values in components)

**Checkpoint**: `src/theme/tokens.ts` exists — component implementation may now begin (constitution Principle VII pre-condition cleared).

---

## Phase 2: Foundational

**Purpose**: i18n, direction context, Zustand stores, and AsyncStorage hook — these are shared by ALL four user stories and MUST be complete before any story phase starts.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Create `src/i18n/en.json` — add all 18 translation keys from `data-model.md` i18n key index with English values: `setup.title`, `setup.playerCount`, `setup.playerLabel`, `setup.playerNamePlaceholder`, `setup.roundFormat`, `setup.roundFormat.short/medium/long`, `setup.deckInfo`, `setup.deckNotice`, `setup.startButton`, `setup.resumeTitle`, `setup.resumeBody`, `setup.resumeButton`, `setup.newGameButton`, `setup.language`, `common.language.en/ar`, `validation.nameRequired`, `validation.nameTooLong`
- [ ] T005 [P] Create `src/i18n/ar.json` — add all 18 same keys with Arabic translations (mirror structure of `en.json` exactly; both files MUST have identical key sets per constitution Principle VI)
- [ ] T006 Create `src/i18n/index.ts` — initialize i18next with `initReactI18next`; read `@joker51/language` from AsyncStorage before init; fall back to `'en'` if absent; call `I18nManager.forceRTL(true/false)` based on stored locale
- [ ] T007 Create `src/contexts/DirectionContext.tsx` — define `DirectionContextValue { isRTL: boolean; direction: 'ltr' | 'rtl' }`, export `DirectionContext`, `DirectionProvider` component (wraps children, reads from `languageStore.isRTL`), and `useDirection()` hook
- [ ] T008 [P] Create `src/store/setupStore.ts` — Zustand slice per `contracts/setup-ui.md`: fields `playerCount` (default 2), `playerNames` (default `['','']`), `roundFormat` (default 4), `fieldErrors` (default `[null,null]`); actions `setPlayerCount` (clamps 2–8, resizes arrays), `setPlayerName`, `setRoundFormat`, `validateAndStart` (trims + checks each name, populates `fieldErrors`), `resetForm`
- [ ] T009 [P] Create `src/store/languageStore.ts` — Zustand slice per `contracts/setup-ui.md`: fields `locale` (default `'en'`), `isRTL` (derived as `locale === 'ar'`); action `setLocale` (calls `i18next.changeLanguage`, writes `@joker51/language` to AsyncStorage, updates `isRTL`)
- [ ] T010 Create `src/hooks/useSavedSession.ts` — reads `@joker51/savedSession` from AsyncStorage on mount; returns `{ session: GameState | null; clearSession(): Promise<void> }` where `clearSession` calls `AsyncStorage.removeItem('@joker51/savedSession')`

**Checkpoint**: Foundation complete — all four user story phases can now begin.

---

## Phase 3: User Story 1 — Configure Players and Start Game (Priority: P1) 🎯 MVP

**Goal**: Player count stepper + name inputs + resume prompt + Start button wired to `initGame()` and navigation.

**Independent Test**: Complete setup form with 2 players and tap Start → valid GameState created, navigation to `/game` triggered. Resume prompt appears when `savedSession` exists.

- [ ] T011 [P] [US1] Create `src/components/ui/Button.tsx` — generic pressable button consuming `colors.accent`, `colors.text.primary`, `radii.md`, `spacing.md` tokens; accepts `label: string`, `onPress`, `disabled?: boolean`, `variant?: 'primary' | 'secondary'`, `testID?`
- [ ] T012 [P] [US1] Create `src/components/ui/TextInput.tsx` — generic text input consuming `colors.surface`, `colors.border`, `colors.text.primary`, `colors.text.placeholder`, `radii.sm`, `spacing.sm` tokens; accepts `value`, `onChangeText`, `placeholder?`, `maxLength?`, `error?` (string | null shows error text in `colors.error`), `testID?`
- [ ] T013 [P] [US1] Create `src/components/layout/SafeScrollView.tsx` — wraps `SafeAreaView` + `ScrollView` with `KeyboardAvoidingView`; accepts `children`, uses `colors.background` token for background
- [ ] T014 [US1] Create `src/components/setup/PlayerCountStepper.tsx` per `contracts/setup-ui.md` — decrement `−` and increment `+` buttons using `ui/Button`; decrement disabled at `value === 2`, increment disabled at `value === 8`; displays current count; includes `accessibilityLabel` on both buttons
- [ ] T015 [US1] Create `src/components/setup/PlayerNameInput.tsx` per `contracts/setup-ui.md` — uses `ui/TextInput` with `maxLength={20}`; renders row label `t('setup.playerLabel', { number: index + 1 })`; shows `error` text below field when non-null; respects `isRTL` from `useDirection()`
- [ ] T016 [US1] Create `src/components/setup/ResumeGamePrompt.tsx` per `contracts/setup-ui.md` — modal-style overlay with `t('setup.resumeTitle')`, `t('setup.resumeBody')`, "Resume Game" primary button (calls `onResume`), "New Game" secondary button (calls `onNewGame`)
- [ ] T017 [US1] Create `src/screens/SetupScreen.tsx` — mount: call `useSavedSession`; if session exists render `ResumeGamePrompt` (onResume → navigate `/game`; onNewGame → `clearSession()` then show form); form: `PlayerCountStepper` + `PlayerNameInput` × count + `Button` for Start; Start calls `setupStore.validateAndStart()` → on valid: call `initGame(config)` from engine via store action → navigate to `/game` with serialized GameState; use `SafeScrollView`; all strings via `useTranslation()`; layout direction from `useDirection()`
- [ ] T018 [P] [US1] Write `src/components/setup/__tests__/PlayerCountStepper.test.tsx` — tests per quickstart.md Component Isolation: render at value=2 (decrement disabled), render at value=8 (increment disabled), tap increment calls onChange(3), tap decrement at value=3 calls onChange(2)
- [ ] T019 [P] [US1] Write `src/components/setup/__tests__/PlayerNameInput.test.tsx` — tests: `error=null` renders no error text; `error="Name is required"` renders error below field; input with 20 chars rejects additional input via maxLength
- [ ] T020 [P] [US1] Write `src/components/setup/__tests__/ResumeGamePrompt.test.tsx` — tests: renders resume title and body text; tapping "Resume Game" calls `onResume`; tapping "New Game" calls `onNewGame`
- [ ] T021 [US1] Write `src/screens/__tests__/SetupScreen.test.tsx` — integration tests per quickstart.md Scenarios 1, 3, 5, 6: happy path (2 players → Start enabled → navigation called); whitespace name (Start disabled); resume prompt shown when savedSession exists; "New Game" clears session and shows blank form

**Checkpoint**: US1 fully functional — game session can be created and started from setup screen.

---

## Phase 4: User Story 2 — Deck Count Notice (Priority: P1)

**Goal**: Reactive deck count display — notice appears, updates, and disappears based on player count.

**Independent Test**: Set `playerCount` to 2 → no notice; to 5 → "2 decks required"; to 7 → "3 decks required"; back to 3 → notice gone.

- [ ] T022 [US2] Create `src/components/setup/DeckCountNotice.tsx` per `contracts/setup-ui.md` — returns `null` when `deckCount === 1`; renders info banner using `colors.surface`, `colors.accent` tokens with `t('setup.deckNotice', { count: deckCount })` when `deckCount >= 2`; accepts `deckCount: number` and `testID?`
- [ ] T023 [US2] Integrate `DeckCountNotice` into `src/screens/SetupScreen.tsx` — import component; pass `deckCount={deckCountForPlayers(playerCount)}` (imported from engine via store, not direct import); render between PlayerCountStepper and name fields
- [ ] T024 [P] [US2] Write `src/components/setup/__tests__/DeckCountNotice.test.tsx` — tests per quickstart.md Scenario 2 and Component Isolation: `deckCount=1` renders null; `deckCount=2` renders "2 decks required"; `deckCount=3` renders "3 decks required"

**Checkpoint**: Deck notice reacts to all player count changes with no extra tap.

---

## Phase 5: User Story 3 — Round Format Selection (Priority: P2)

**Goal**: Three-option round format selector with Short (4) pre-selected as default.

**Independent Test**: Render selector → Short highlighted; tap Medium → `onChange(8)` fired, Medium highlighted; tap Long then Start → game configured for 12 rounds.

- [ ] T025 [US3] Create `src/components/setup/RoundFormatSelector.tsx` per `contracts/setup-ui.md` — renders three tappable options: `t('setup.roundFormat.short')`, `t('setup.roundFormat.medium')`, `t('setup.roundFormat.long')`; selected option styled with `colors.accent` token; calls `onChange(4 | 8 | 12)` on tap; accepts `value: 4 | 8 | 12`, `onChange`, `testID?`
- [ ] T026 [US3] Integrate `RoundFormatSelector` into `src/screens/SetupScreen.tsx` — import; bind to `setupStore.roundFormat` and `setupStore.setRoundFormat`; render below deck notice; default value 4 (already in store default)
- [ ] T027 [P] [US3] Write `src/components/setup/__tests__/RoundFormatSelector.test.tsx` — tests per quickstart.md Component Isolation: default render shows Short (4) highlighted; tap Medium calls `onChange(8)`; selected option has distinct style

**Checkpoint**: Round format selection fully functional; correct totalRounds flows into GameConfig.

---

## Phase 6: User Story 4 — Language Selection (Priority: P2)

**Goal**: Language toggle (EN/AR) with instant full-screen RTL switch, persisted across sessions.

**Independent Test**: Tap AR → all labels re-render in Arabic + RTL layout within 300ms; relaunch → Arabic still active (quickstart.md Scenarios 4 and 7).

- [ ] T028 [US4] Create `src/components/setup/LanguageSelector.tsx` per `contracts/setup-ui.md` — two-option toggle (EN / AR) using `t('common.language.en')` and `t('common.language.ar')`; selected option styled with `colors.accent`; calls `onChange('en' | 'ar')` on tap; accepts `value: 'en' | 'ar'`, `onChange`, `testID?`
- [ ] T029 [US4] Wire `LanguageSelector` into `src/screens/SetupScreen.tsx` — import; read `locale` from `languageStore`; call `languageStore.setLocale(locale)` on change; render in setup form header area; label with `t('setup.language')`
- [ ] T030 [US4] Wire `DirectionProvider` and i18n initialization into app root `app/_layout.tsx` — wrap root with `<DirectionProvider>`; call `i18n/index.ts` init (reads AsyncStorage for language) in root layout before render; ensure `I18nManager.forceRTL` is applied on cold start
- [ ] T031 [P] [US4] Write `src/components/setup/__tests__/LanguageSelector.test.tsx` — tests: `value='en'` shows EN selected; tap AR calls `onChange('ar')`; both options render with correct translated labels

**Checkpoint**: Language switch instant (< 300ms), RTL layout active, preference persisted.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Type safety, translation completeness, and platform verification across all four stories.

- [ ] T032 [P] Run `tsc --noEmit` and resolve all TypeScript type errors — verify `GameConfig` passed to `initGame()` exactly matches engine type from `src/engine/types.ts`
- [ ] T033 [P] Audit translation key completeness — verify `en.json` and `ar.json` have identical key sets (all 18 keys from `data-model.md` i18n key index); add any missing keys
- [ ] T034 Manual smoke test on iOS Simulator — run all 7 quickstart.md scenarios; verify no visual defects at 320 pt and 430 pt widths (SC-006)
- [ ] T035 Manual smoke test on Android Emulator — repeat all 7 quickstart.md scenarios; verify RTL layout and deck notice on Android specifically

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (tokens stub must exist) — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational — first story, no story dependencies
- **US2 (Phase 4)**: Depends on Foundational + US1 (integrates into SetupScreen already built in US1)
- **US3 (Phase 5)**: Depends on Foundational + US1 (same reason)
- **US4 (Phase 6)**: Depends on Foundational + US1 (LanguageSelector integrates into SetupScreen; languageStore used in foundation)
- **Polish (Phase 7)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — core screen structure, no story prerequisites
- **US2 (P1)**: Requires US1 complete (`SetupScreen.tsx` must exist to integrate `DeckCountNotice`)
- **US3 (P2)**: Requires US1 complete (same reason)
- **US4 (P2)**: Requires US1 complete; US2 and US3 can run in parallel with US4 after US1 done

### Within Each Phase

- `[P]` tasks within a phase can be started simultaneously
- Non-`[P]` tasks within a phase must run after their predecessors complete
- Test tasks within US1 (T018–T020) can run in parallel after their implementation tasks

### Parallel Opportunities

```
Phase 1 complete
  └─► Phase 2:
        T004 [en.json] ──┐
        T005 [ar.json] ──┤ parallel
        T008 [setupStore] ──┤ parallel
        T009 [languageStore] ──┘
        T006 [i18n index] ← after T004/T005
        T007 [DirectionContext] ← after T009
        T010 [useSavedSession] ← independent
          └─► Phase 3 (US1):
                T011 [Button] ──┐
                T012 [TextInput] ──┤ parallel
                T013 [SafeScrollView] ──┘
                T014 → T015 → T016 → T017
                T018 ──┐
                T019 ──┤ parallel (after T014–T016)
                T020 ──┘
                  └─► US2, US3, US4 can now proceed in parallel
```

---

## Implementation Strategy

### MVP (US1 + US2 only — 23 tasks)

1. Complete Phase 1 (Setup) → Phase 2 (Foundational)
2. Complete Phase 3 (US1) — game can be configured and started
3. Complete Phase 4 (US2) — deck notice shown for multi-deck games
4. **STOP and VALIDATE**: Full happy path + deck notice working on both platforms
5. App is playable (pending game board from Phase 3)

### Full Delivery (all 35 tasks)

1. Setup + Foundational → US1 → US2 + US3 + US4 (US2/3/4 can run in parallel after US1) → Polish

---

## Notes

- `[P]` tasks = different files, no shared state — safe to parallelize
- All components MUST reference `src/theme/tokens.ts` values — zero raw style values (constitution Principle VII)
- All display strings MUST use `useTranslation()` — zero hard-coded strings (constitution Principle VI)
- `SetupScreen.tsx` MUST NOT import from `src/engine/` directly — use store action (constitution Principle II)
- Both `en.json` and `ar.json` MUST stay in sync on every commit (constitution Principle VI)
- Verify each checkpoint on both iOS and Android before calling a story complete (constitution Principle IV)
