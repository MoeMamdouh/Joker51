# Implementation Plan: Round End & Scoring Screen

**Branch**: `006-round-end-scoring` | **Date**: 2026-04-13 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/006-round-end-scoring/spec.md`

## Summary

Add the on-demand scoreboard modal (US2) to the game board screen. US1 (round summary) and US3 (game over) are already fully implemented via `RoundSummaryOverlay`. The only new work is: `ScoreboardModal` component, a trigger button on `GameBoardScreen`, new i18n keys in both locale files, and accompanying tests.

## Technical Context

**Language/Version**: TypeScript 5.x strict mode
**Primary Dependencies**: React Native + Expo SDK ~54, Expo Router, Zustand, i18next + react-i18next
**Storage**: AsyncStorage — `@joker51/savedSession` (no new keys)
**Testing**: jest-expo (component/screen tests); ts-jest (engine — no new engine tests needed)
**Target Platform**: iOS + Android (Expo managed workflow)
**Project Type**: Mobile card game app
**Performance Goals**: Scoreboard modal opens within 1 render cycle (< 16ms, no async)
**Constraints**: All styles via `src/theme/tokens.ts`; all strings via i18n locale files; RTL support for Arabic
**Scale/Scope**: 2–8 players; 4/8/12 rounds; score values up to 3 digits

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| §I Game Rule Fidelity | ✅ PASS | Scoring rules §13 already implemented in `scoring.ts`; no changes |
| §II Layered Architecture | ✅ PASS | No new engine code; `ScoreboardModal` is pure UI, reads props only |
| §III Test-First Game Logic | ✅ PASS | No new engine functions; component tests written before implementation |
| §IV Cross-Platform | ✅ PASS | Overlay pattern already works on iOS + Android |
| §V State Predictability | ✅ PASS | No new state shape; `roundResults` already in `GameState` |
| §VI Multilingual Support | ✅ PASS | New i18n keys added to both `en.json` and `ar.json` in same commit |
| §VII Design System | ✅ PASS | All tokens from `src/theme/tokens.ts`; no inline values |
| §VIII Simplicity | ✅ PASS | Single new component; no new abstractions |

## Project Structure

### Documentation (this feature)

```text
specs/006-round-end-scoring/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── scoreboard-modal-ui.md
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
src/
├── components/
│   └── game/
│       ├── ScoreboardModal.tsx          NEW — on-demand per-round score table overlay
│       └── __tests__/
│           └── ScoreboardModal.test.tsx NEW — component tests
├── screens/
│   ├── GameBoardScreen.tsx              MODIFIED — add scoreboard button + showScoreboard state
│   └── __tests__/
│       └── GameBoardScreen.test.tsx     MODIFIED — add scoreboard button tests
└── i18n/
    ├── en.json                          MODIFIED — add game.scoreboard.* keys
    └── ar.json                          MODIFIED — add game.scoreboard.* Arabic keys
```

**No changes to**:
- `src/engine/` — all engine work is complete
- `src/store/` — GameState shape is unchanged
- `src/hooks/` — no new hooks needed
- Any other existing component

## Implementation Notes

### ScoreboardModal Layout

```
┌─────────────────────────────────┐
│         Scoreboard              │ ← game.scoreboard.title
├──────┬────┬────┬────┬────┬──────┤
│ Name │ R1 │ R2 │ R3 │ R4 │Total │ ← header row
├──────┼────┼────┼────┼────┼──────┤
│ Ali  │  0 │ 42 │ —  │ —  │ 42  │ ← leader row (highlighted)
│ Sara │ 30 │  0 │ —  │ —  │ 30  │
└──────┴────┴────┴────┴────┴──────┘
        [      Close       ]        ← game.scoreboard.close
```

- Pending rounds show `game.scoreboard.pending` ("—")
- Leader row uses `colors.accent` border/background tint
- Works for 4/8/12 round columns with compact `R{n}` headers

### i18n Keys to Add

```json
"scoreboard": {
  "title": "Scoreboard",
  "round": "R{{number}}",
  "total": "Total",
  "pending": "—",
  "close": "Close",
  "leader": "Leading"
}
```

Arabic equivalents in `ar.json`:
```json
"scoreboard": {
  "title": "لوحة النتائج",
  "round": "ج{{number}}",
  "total": "المجموع",
  "pending": "—",
  "close": "إغلاق",
  "leader": "في المقدمة"
}
```

### Scoreboard Button Placement

Add to `GameBoardScreen` alongside the existing `ScoreboardRow` (top of screen):
- Button labeled `game.scoreboard.title`
- `testID="btn-scoreboard"`
- Visible when `status === IN_PROGRESS` or `status === ROUND_ENDED` (hidden during game over screen)
- Opens `ScoreboardModal` via `const [showScoreboard, setShowScoreboard] = useState(false)`

## Complexity Tracking

No constitution violations. No complexity justification required.
