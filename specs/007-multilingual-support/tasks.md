# Tasks: Multilingual Support (EN / AR)

**Input**: Design documents from `/specs/007-multilingual-support/`
**Branch**: `007-multilingual-support`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Audit Baseline)

**Purpose**: Verify the existing i18n baseline before any changes are made.

- [ ] T001 Audit `src/i18n/en.json` vs `src/i18n/ar.json` for key parity — list any keys present in one file but missing from the other; fix any gaps before proceeding

**Checkpoint**: Both translation files have identical key structure. Proceed to Phase 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the one new translation key required by the RTL restart banner (US2). Must land in both files before banner implementation can begin.

**⚠️ CRITICAL**: Phase 4 (US2) cannot start until this phase is complete.

- [ ] T002 Add `common.rtlRestartNotice` key to `src/i18n/en.json` with value `"Restart the app to apply the new layout direction."`
- [ ] T003 [P] Add `common.rtlRestartNotice` key to `src/i18n/ar.json` with Egyptian colloquial value (confirm exact phrasing with product owner; placeholder: `"أعد تشغيل التطبيق عشان التخطيط الجديد يتطبق."`)

**Checkpoint**: Both JSON files contain `common.rtlRestartNotice`. Phase 4 can now start.

---

## Phase 3: User Story 3 — Egyptian Arabic Translations (Priority: P1) 🎯 MVP

**Goal**: Replace all Modern Standard Arabic strings in `ar.json` with Egyptian colloquial equivalents. Zero English strings visible when Arabic is active.

**Independent Test**: Switch to Arabic, navigate every major screen — no English text, no MSA phrases. Action buttons read: انزل / ارمي / اسحب الجوكر / جمز / كنسل.

### Implementation for User Story 3

- [ ] T004 [US3] Update `game.actions.*` keys in `src/i18n/ar.json` to Egyptian colloquial: `meld` → `انزل`, `discard` → `ارمي`, `claimJoker` → `اسحب الجوكر`, `stageCombination` → `جمز`, `confirmMeld` → `انزل`, `cancelMeld` → `كنسل`, `layOff` → `كمل`
- [ ] T005 [P] [US3] Update `game.handOff.*` keys in `src/i18n/ar.json`: `prompt` → `باسي الجهاز لـ{{name}}`; `confirm` → `أنا {{name}}، وريني إيدي`
- [ ] T006 [P] [US3] Update `game.roundSummary.*` and `game.scoreboard.*` keys in `src/i18n/ar.json`: `nextRound` → `الدور الجاي`, `gameOver` → `اللعبة خلصت`, `playAgain` → `العب تاني`, `scoreboard.leader` → `في الأول`
- [ ] T007 [US3] Update all `game.errors.*` keys in `src/i18n/ar.json` to Egyptian grammar — replace `يمكنك` → `تقدر`, `يجب` → `لازم`, `الآن` → `دلوقتي` throughout
- [ ] T008 [US3] Update remaining `setup.*`, `common.*`, `validation.*` keys in `src/i18n/ar.json` to Egyptian colloquial where MSA phrasing remains (e.g., `setup.resumeButton` → `رجع للعبة`, `validation.nameRequired` → `لازم تكتب اسمك`, `validation.nameTooLong` → `الاسم ميعداش 20 حرف`)

**Checkpoint**: All ar.json values are Egyptian colloquial. Switch to Arabic in the app — every string across every screen reads naturally in Egyptian dialect.

---

## Phase 4: User Story 2 — RTL Layout for Arabic (Priority: P1)

**Goal**: When Arabic is active, the layout mirrors to RTL, the card hand reverses, and a non-blocking banner notifies the player that a restart is needed for the native direction to apply.

**Independent Test**: Switch to Arabic on setup screen — a dismissible banner appears. Navigate to game board — the active player's cards are rendered right-to-left. Dismiss banner — it disappears and does not reappear unless language is toggled again.

**Prerequisite**: Phase 2 complete (T002, T003).

### Implementation for User Story 2

- [ ] T009 [US2] Extend `src/store/languageStore.ts`: in `setLocale`, call `I18nManager.forceRTL(locale === 'ar')` and set `needsRestart: true` when direction changes (i.e., previous `isRTL` !== new `isRTL`); add `needsRestart: boolean` field (default `false`) and `dismissRestartBanner(): void` action that sets `needsRestart` to `false`
- [ ] T010 [P] [US2] Create `src/components/ui/RtlRestartBanner.tsx` — dismissible non-blocking banner component; accepts `visible: boolean` and `onDismiss(): void` props; renders `null` when `visible` is `false`; displays `t('common.rtlRestartNotice')` with a dismiss button; uses design tokens exclusively (no raw style values); positioned as a non-modal overlay at the top of the screen
- [ ] T011 [P] [US2] Update `src/components/game/HandArea.tsx` — import `useDirection` from `src/contexts/DirectionContext`; when `isRTL` is `true`, reverse the `cards` array before mapping to `CardTile` components (use `[...cards].reverse()` — do not mutate the prop)
- [ ] T012 [US2] Wire `RtlRestartBanner` into the app root layout: import `useLanguageStore` and `RtlRestartBanner` in `app/_layout.tsx`; pass `visible={needsRestart}` and `onDismiss={dismissRestartBanner}`; banner must be mounted above the navigator so it appears on all screens
- [ ] T013 [P] [US2] Write tests for `RtlRestartBanner` in `src/components/ui/__tests__/RtlRestartBanner.test.tsx`: (a) renders `null` when `visible` is `false`, (b) renders banner text when `visible` is `true`, (c) calls `onDismiss` when dismiss control is pressed
- [ ] T014 [P] [US2] Write tests for RTL card order in `src/components/game/__tests__/HandArea.test.tsx`: (a) renders cards in original order when LTR, (b) renders cards in reversed order when RTL (first card in prop array is the last `CardTile` rendered)
- [ ] T015 [P] [US2] Write tests for `languageStore` direction signalling in `src/store/__tests__/languageStore.test.ts`: (a) `setLocale('ar')` sets `needsRestart: true` when starting from `'en'`, (b) `setLocale('en')` from `'en'` does NOT set `needsRestart`, (c) `dismissRestartBanner()` sets `needsRestart: false`

**Checkpoint**: Switch EN→AR on setup screen — text updates immediately, dismissible banner appears at top. Navigate to game board — cards render right-to-left. Dismiss banner — it clears. Restart app — Arabic is still active, no banner on cold start.

---

## Phase 5: User Story 1 — Language Selection and Persistence (Priority: P1)

**Goal**: Verify the already-implemented language toggle persists correctly and remains setup-screen-only.

**Independent Test**: Select Arabic, force-quit the app, reopen — Arabic is still active. Navigate to game board — no language toggle is present.

*Note: The core implementation (LanguageSelector, languageStore persistence, initI18n) was built in earlier phases. This phase is verification and test coverage only.*

### Implementation for User Story 1

- [ ] T016 [P] [US1] Add tests for `languageStore` persistence in `src/store/__tests__/languageStore.test.ts`: (a) `loadPersistedLocale` restores `'ar'` when `'ar'` is stored in AsyncStorage, (b) first-launch with no stored value defaults to `'en'`, (c) `setLocale` writes the new locale to AsyncStorage
- [ ] T017 [P] [US1] Add a test in `src/screens/__tests__/SetupScreen.test.tsx` confirming the `language-selector` testID is present on the setup screen; add a complementary test in `src/screens/__tests__/GameBoardScreen.test.tsx` confirming no element with `testID="language-selector"` is rendered on the game board

**Checkpoint**: All US1 acceptance criteria verified by tests. Language persists across simulated cold starts.

---

## Phase 6: User Story 4 — Locale-Aware Number Formatting (Priority: P2)

**Goal**: All score, count, and round number values in the UI chrome display Eastern Arabic numerals (٠–٩) when Arabic is active. Card face values are unaffected.

**Independent Test**: Start a game, complete a round with scores, open Scoreboard in Arabic mode — all numeric values show Eastern Arabic numerals. Switch to English — Western digits appear.

### Implementation for User Story 4

- [ ] T018 [US4] Create `src/i18n/formatNumber.ts` — export `function formatNumber(value: number, locale: 'en' | 'ar'): string`; for `'ar'` replace each digit `0–9` with the corresponding Eastern Arabic digit `٠١٢٣٤٥٦٧٨٩`; for `'en'` return `String(value)`; pure function, no imports from stores or React
- [ ] T019 [P] [US4] Write unit tests for `formatNumber` in `src/i18n/__tests__/formatNumber.test.ts`: test `0`, `42`, `100`, `999` for both locales; verify `formatNumber(42, 'ar')` returns `'٤٢'`; verify `formatNumber(42, 'en')` returns `'42'`; verify triple-digit values render without truncation
- [ ] T020 [P] [US4] Update `src/components/game/ScoreboardModal.tsx` — import `formatNumber` and `useLanguageStore`; replace `String(penalty)` with `formatNumber(penalty, locale)` and `String(entry.total)` with `formatNumber(entry.total, locale)` where `locale` is read from `useLanguageStore(s => s.locale)`
- [ ] T021 [P] [US4] Update `src/components/game/RoundSummaryOverlay.tsx` — import `formatNumber` and `useLanguageStore`; replace raw numeric interpolations for penalty and cumulative score values with `formatNumber(value, locale)` calls
- [ ] T022 [US4] Update tests in `src/components/game/__tests__/ScoreboardModal.test.tsx` to verify that when rendered with Arabic locale active, score cells display Eastern Arabic numerals (e.g., `٤٢`) not Western digits

**Checkpoint**: Open Scoreboard and Round Summary in Arabic mode — all scores and totals display in Eastern Arabic numerals. Card tiles are unaffected.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation sweep across all user stories.

- [ ] T023 [P] Run grep audit for hardcoded Arabic/English display strings in all `src/components/**/*.tsx` and `src/screens/**/*.tsx` files — confirm zero raw string literals used for UI text (all go through `t()`)
- [ ] T024 Run the full quickstart.md testing checklist manually on iOS Simulator and Android Emulator: language switch, persistence, RTL card order, restart banner, Eastern numerals, zero English strings in Arabic mode
- [ ] T025 [P] Confirm `src/i18n/ar.json` and `src/i18n/en.json` have identical key sets — run a parity check (e.g., compare top-level and nested keys); any missing key is a merge-blocking error per the constitution

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Audit)         → no dependencies
Phase 2 (Foundational)  → depends on Phase 1
Phase 3 (US3 - AR text) → depends on Phase 1 (baseline clean)
Phase 4 (US2 - RTL)     → depends on Phase 2 (rtlRestartNotice keys must exist)
Phase 5 (US1 - verify)  → depends on Phase 4 (languageStore extended)
Phase 6 (US4 - numerals)→ independent from Phase 3/4/5; only depends on Phase 1
Phase 7 (Polish)        → depends on all phases complete
```

### User Story Dependencies

- **US3 (P1)**: Starts after Phase 1 — no code dependencies, only confirmed Egyptian terms
- **US2 (P1)**: Starts after Phase 2 — needs `rtlRestartNotice` key in both JSON files
- **US1 (P1)**: Starts after Phase 4 — tests reference the extended `languageStore`
- **US4 (P2)**: Starts after Phase 1 — `formatNumber` is fully independent

### Within Each Phase

- T004 → T005, T006 are NOT parallel (all modify `ar.json`)
- T009 → T010, T011 are parallel (different files)
- T010 → T012 (banner component must exist before wiring at root)
- T018 → T020, T021 (formatNumber must exist before consuming components)
- T019, T020, T021 — T020 and T021 are parallel after T018

### Parallel Opportunities

- Phase 3 and Phase 6 (US3 and US4) can run in parallel — entirely different files
- T010, T011, T013, T014, T015 within Phase 4 are all parallel once T009 is done
- T019, T020, T021 within Phase 6 are parallel once T018 is done
- T016, T017 within Phase 5 are parallel
- T023, T025 in Phase 7 are parallel

---

## Parallel Example: Phase 4 (US2)

```
# After T009 (languageStore extended) — launch these in parallel:
T010  Create RtlRestartBanner component  →  src/components/ui/RtlRestartBanner.tsx
T011  HandArea RTL card reversal         →  src/components/game/HandArea.tsx
T013  Test RtlRestartBanner              →  src/components/ui/__tests__/RtlRestartBanner.test.tsx
T014  Test HandArea RTL order            →  src/components/game/__tests__/HandArea.test.tsx
T015  Test languageStore direction flag  →  src/store/__tests__/languageStore.test.ts

# Then wire everything together:
T012  Mount RtlRestartBanner at app root  →  app/_layout.tsx
```

## Parallel Example: Phase 6 (US4)

```
# Start T018 first:
T018  Create formatNumber utility  →  src/i18n/formatNumber.ts

# Then launch in parallel:
T019  Unit tests for formatNumber    →  src/i18n/__tests__/formatNumber.test.ts
T020  ScoreboardModal numerals       →  src/components/game/ScoreboardModal.tsx
T021  RoundSummaryOverlay numerals   →  src/components/game/RoundSummaryOverlay.tsx
```

---

## Implementation Strategy

### MVP First (Egyptian Arabic + Language Persistence — US3 + US1)

1. Complete Phase 1: Audit baseline
2. Complete Phase 3: US3 Egyptian Arabic translations
3. Complete Phase 5: US1 persistence verification
4. **STOP and VALIDATE**: Arabic mode shows correct dialect on all screens, preference persists
5. Demo: playable game fully in Egyptian Arabic

### Incremental Delivery

1. Phase 1 + Phase 3 → Egyptian Arabic text complete (US3 ✅)
2. Phase 2 + Phase 4 → RTL layout + restart banner (US2 ✅)
3. Phase 5 → Language persistence verified (US1 ✅)
4. Phase 6 → Eastern numerals in scores (US4 ✅)
5. Phase 7 → Full validation sweep

---

## Notes

- **All Egyptian Arabic terms confirmed** (2026-04-13) — T004–T008 are ready to implement immediately
- `formatNumber` MUST NOT use `Intl.NumberFormat` — Hermes compatibility is not guaranteed
- `needsRestart` is ephemeral — never written to AsyncStorage
- Card face labels on `CardTile` are excluded from `formatNumber` scope (FR-009)
- Constitution §VI mandates key parity across both locale files — any missing key is merge-blocking
