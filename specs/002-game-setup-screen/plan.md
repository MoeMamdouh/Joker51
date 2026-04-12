# Implementation Plan: Game Setup Screen

**Branch**: `002-game-setup-screen` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/002-game-setup-screen/spec.md`

## Summary

A single React Native screen that collects game configuration (player count 2–8, player names, round format, language) and produces a valid `GameConfig` to feed into `initGame()`. The screen also handles app-launch resume detection (reads `@joker51/savedSession`) and persists language preference (`@joker51/language`). All UI strings are externalized via i18next (EN/AR); layout direction switches instantly via a `DirectionContext` without an app reload.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) — React Native + Expo SDK ~54
**Primary Dependencies**: Expo Router (navigation), Zustand (state), i18next + react-i18next (i18n), expo-localization (locale detection), @react-native-async-storage/async-storage (persistence), React Native Reanimated 3+ (animations)
**Storage**: AsyncStorage — `@joker51/language` (locale), `@joker51/savedSession` (in-progress game)
**Testing**: Jest + React Native Testing Library (component integration tests + snapshot tests)
**Target Platform**: iOS 15+ and Android API 31+ (React Native via Expo managed workflow)
**Project Type**: Mobile app screen (Expo managed)
**Performance Goals**: Language switch < 300ms (SC-004); setup flow completion < 60s (SC-001)
**Constraints**: All strings externalized (constitution Principle VI); all style values via theme tokens (constitution Principle VII); no direct engine imports in UI (constitution Principle II)
**Scale/Scope**: Single screen, 2–8 player name inputs, 2 language options

## Constitution Check

| Principle | Gate | Status |
|-----------|------|--------|
| I. Game Rule Fidelity | `initGame()` receives `{ players, totalRounds }` matching engine `GameConfig` exactly | ✅ PASS |
| II. Layered Architecture | SetupScreen → store action → `initGame()`; no direct `src/engine/` imports in UI | ✅ PASS |
| III. Test-First | UI uses integration/snapshot tests (TDD not required for presentational code) | ✅ PASS |
| IV. Cross-Platform | All components verified on iOS Simulator + Android Emulator | ✅ PASS |
| V. State Predictability | Language persisted to AsyncStorage; saved session readable on relaunch | ✅ PASS |
| VI. Multilingual EN/AR | Language selector on setup screen; all strings in en.json + ar.json; RTL via DirectionContext | ✅ PASS |
| VII. Design System | All components consume tokens from `src/theme/tokens.ts`; no raw values | ⚠️ PRE-CONDITION — `src/theme/tokens.ts` stub must exist before implementation (see research.md Decision 6) |
| VIII. Simplicity | Manual Zustand state, stepper UI, tap-to-validate | ✅ PASS |

**Result: PASS with one pre-condition** — `src/theme/tokens.ts` must be created (stub or full Phase 7 output) before any component implementation begins.

## Project Structure

### Documentation (this feature)

```text
specs/002-game-setup-screen/
├── plan.md              ← this file
├── research.md          ← Phase 0: technical decisions
├── data-model.md        ← Phase 1: entities, state shape, i18n key index
├── quickstart.md        ← Phase 1: integration scenarios
├── contracts/
│   └── setup-ui.md      ← Phase 1: component + store interfaces
└── tasks.md             ← not yet created (/speckit.tasks)
```

### Source Code

```text
src/
├── screens/
│   └── SetupScreen.tsx
├── components/
│   ├── setup/
│   │   ├── PlayerCountStepper.tsx
│   │   ├── PlayerNameInput.tsx
│   │   ├── RoundFormatSelector.tsx
│   │   ├── DeckCountNotice.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── ResumeGamePrompt.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   └── TextInput.tsx
│   └── layout/
│       └── SafeScrollView.tsx
├── store/
│   ├── setupStore.ts
│   └── languageStore.ts
├── contexts/
│   └── DirectionContext.tsx
├── hooks/
│   └── useSavedSession.ts
├── i18n/
│   ├── index.ts
│   ├── en.json
│   └── ar.json
└── theme/
    └── tokens.ts          ← stub required before components

src/engine/                ← Phase 1 complete — do not modify
```

### Test Structure

```text
src/
├── screens/__tests__/
│   └── SetupScreen.test.tsx
└── components/setup/__tests__/
    ├── PlayerCountStepper.test.tsx
    ├── PlayerNameInput.test.tsx
    ├── RoundFormatSelector.test.tsx
    ├── DeckCountNotice.test.tsx
    ├── LanguageSelector.test.tsx
    └── ResumeGamePrompt.test.tsx
```

**Structure Decision**: Single Expo managed project. All Phase 2 code lives under `src/` following the layered architecture (engine → store → components → screens). Phase 7 (Design System) token file is the only external pre-condition.

## Complexity Tracking

> No constitution violations. Token stub pre-condition is a dependency management concern only.

| Item | Why Needed | Notes |
|------|------------|-------|
| `src/theme/tokens.ts` stub | All components require token references; Phase 7 not yet executed | Define minimum tokens listed in research.md Decision 6; Phase 7 will expand the file |
