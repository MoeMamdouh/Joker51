# Implementation Plan: Multilingual Support (EN / AR)

**Branch**: `007-multilingual-support` | **Date**: 2026-04-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-multilingual-support/spec.md`

## Summary

Complete the multilingual foundation already scaffolded in the codebase: update `ar.json` to Egyptian colloquial Arabic, add Eastern Arabic numeral formatting for score display, implement a non-blocking RTL restart banner (required because `I18nManager.forceRTL` only takes effect on cold restart), fix RTL card hand ordering in `HandArea`, and extend `languageStore` with direction-change signalling. The i18n infrastructure (i18next, AsyncStorage persistence, DirectionContext) is already in place and is not rebuilt.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode
**Primary Dependencies**: i18next, react-i18next, React Native `I18nManager`, Zustand, AsyncStorage
**Storage**: AsyncStorage — key `@joker51/language` (already established)
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS + Android (Expo SDK ~54)
**Project Type**: Mobile app (React Native + Expo Router)
**Performance Goals**: Language switch text update < 1 second (SC-002); number formatting is pure and O(digits)
**Constraints**: No app reload/restart forced on user; no new AsyncStorage keys; `formatNumber` must be Hermes-compatible (no `Intl.NumberFormat`)
**Scale/Scope**: 2 translation files, ~90 translation keys total, 4 modified source files, 2 new source files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Game Rule Fidelity | ✅ Pass | No engine logic touched |
| II. Layered Architecture | ✅ Pass | Changes are i18n layer and UI components only; engine untouched |
| III. Test-First Game Logic | ✅ Pass | No engine changes; UI component tests required (RNRTL) |
| IV. Cross-Platform Excellence | ✅ Pass | `formatNumber` and RTL must be tested on iOS + Android |
| V. State Predictability | ✅ Pass | `needsRestart` is a plain boolean, never persisted |
| VI. Multilingual Support | ✅ This IS the feature — completing the requirement |
| VII. Design System | ✅ Pass | `RtlRestartBanner` uses tokens exclusively |
| VIII. Simplicity | ✅ Pass | `formatNumber` is a pure digit-map; no ICU/Intl complexity |

**No violations. No complexity tracking required.**

## Project Structure

### Documentation (this feature)

```text
specs/007-multilingual-support/
├── plan.md              ← This file
├── research.md          ← Infrastructure audit + decision log
├── data-model.md        ← LanguageState extension + formatNumber spec
├── quickstart.md        ← Implementation order + testing checklist
├── contracts/
│   └── i18n-api.md      ← formatNumber, LanguageStore, TranslationFile, RtlRestartBanner contracts
└── tasks.md             ← Phase 2 output (created by /speckit-tasks)
```

### Source Code

```text
src/
├── i18n/
│   ├── en.json                          MODIFY — add common.rtlRestartNotice key
│   ├── ar.json                          MODIFY — replace MSA with Egyptian colloquial
│   ├── index.ts                         no change
│   └── formatNumber.ts                  NEW — pure locale numeral formatter
│   └── __tests__/
│       └── formatNumber.test.ts         NEW
├── store/
│   └── languageStore.ts                 MODIFY — add I18nManager.forceRTL + needsRestart
├── contexts/
│   └── DirectionContext.tsx             no change
├── components/
│   ├── ui/
│   │   ├── RtlRestartBanner.tsx         NEW — dismissible direction-change banner
│   │   └── __tests__/
│   │       └── RtlRestartBanner.test.tsx  NEW
│   └── game/
│       ├── HandArea.tsx                 MODIFY — reverse cards array when isRTL
│       ├── ScoreboardModal.tsx          MODIFY — use formatNumber for scores
│       └── RoundSummaryOverlay.tsx      MODIFY — use formatNumber for penalties
└── screens/
    └── (no screen-level changes needed)

app/
└── _layout.tsx (or root entry)          MODIFY — mount RtlRestartBanner at root
```

**Structure Decision**: Single-project Expo app. All changes are within the existing `src/` tree. No new directories beyond `src/i18n/__tests__/` and `src/components/ui/__tests__/`.
