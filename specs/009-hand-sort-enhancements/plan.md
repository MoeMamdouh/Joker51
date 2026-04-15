# Implementation Plan: Hand Sort Enhancements

**Branch**: `009-hand-sort-enhancements` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/009-hand-sort-enhancements/spec.md`

## Summary

Overhaul the hand-card sorting system: replace the single "Sort" button with a segmented "By Suit / By Rank" control, make sorting automatic on deal/round-start, establish Ace as the highest display card (above King), update suit order to ♠♥♣♦, add a "new card" pulsing indicator for single draws, suppress indicator on staging, persist drag order until a sort button is pressed, and reset everything on round start.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: React Native + Expo SDK ~54, Expo Router, Zustand, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, i18next + react-i18next
**Storage**: N/A — sort mode is session-scoped only; no new AsyncStorage keys
**Testing**: Jest + React Native Testing Library
**Target Platform**: iOS + Android (via Expo)
**Project Type**: Mobile app
**Performance Goals**: Sort operation completes within one JS frame (<16 ms); indicator animation runs at 60 fps via Reanimated worklet
**Constraints**: No engine changes; no new npm packages; all visual values via `src/theme/tokens.ts`
**Scale/Scope**: Affects `src/hooks/useHandOrder.ts`, `src/components/game/HandArea.tsx`, `src/components/game/CardTile.tsx`, `src/i18n/*.json`

## Constitution Check

| Principle | Status | Notes |
|---|---|---|
| I. Game Rule Fidelity | ✅ Pass | No engine changes; Ace-high is display-only |
| II. Layered Architecture | ✅ Pass | Changes in hooks + components only; engine untouched |
| III. Test-First Game Logic | ✅ Pass | `useHandOrder` hook has existing tests; new sort logic requires test updates before implementation |
| IV. Cross-Platform | ✅ Pass | RTL handling included (FR-013); Reanimated for animations |
| V. State Predictability | ✅ Pass | Sort state is local React state (not serialized game state) |
| VI. Multilingual | ✅ Pass | New i18n keys added to both `en.json` and `ar.json` in same task |
| VII. Design System | ✅ Pass | All new visual values reference tokens |
| VIII. Simplicity | ✅ Pass | Custom segmented control (~30 lines); no new dependencies |

## Project Structure

### Documentation (this feature)

```text
specs/009-hand-sort-enhancements/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (via /speckit.tasks)
```

### Source Code Changes

```text
src/
├── hooks/
│   ├── useHandOrder.ts                          ← major refactor
│   └── __tests__/
│       └── useHandOrder.test.ts                 ← update
├── components/
│   ├── game/
│   │   ├── HandArea.tsx                         ← segmented control + new card indicator
│   │   ├── CardTile.tsx                         ← add isNew prop + pulse animation
│   │   └── __tests__/
│   │       ├── HandArea.test.tsx                ← update
│   │       └── CardTile.test.tsx                ← update
│   └── ui/
│       └── SegmentedControl.tsx                 ← new reusable component
└── i18n/
    ├── en.json                                  ← replace sortHand with sortBySuit/sortByRank
    └── ar.json                                  ← same
```

## Phase 0: Research

Complete. See [research.md](./research.md). No external unknowns. All design decisions resolved.

Key decisions:
- **New card detection**: diff in `useHandOrder` — `added.length === 1` → indicator; `>= 2` → batch/round-reset
- **Ace power**: dedicated `RANK_POWER` map in hook (Ace = 13); engine `RANK_ORDER` unchanged
- **Round reset**: `added.length >= 2` triggers sort mode + custom order reset to By Suit
- **Segmented control**: custom `SegmentedControl` component, tokens only, no new library
- **New card animation**: Reanimated `withRepeat` pulse on border colour, managed by `HandArea`

## Phase 1: Design & Contracts

Complete. See [data-model.md](./data-model.md).

No external API contracts. All interfaces are internal component props.

### Critical Implementation Details

#### `useHandOrder.ts` refactor

```
Exported API:
  orderedCards: Card[]
  sortMode: SortMode          ← NEW
  isCustomOrder: boolean      ← NEW
  newCard: Card | null        ← NEW (detected from diff)
  moveCard(from, to)          ← EXISTING (now sets isCustomOrder=true)
  sortBySuit()                ← REPLACES sortByPower()
  sortByRank()                ← NEW
  clearNewCard()              ← NEW

Sort key for By Suit:   [Joker=∞, suitPower DESC, rankPower DESC]
Sort key for By Rank:   [Joker=∞, rankPower DESC, suitPower DESC]

RANK_POWER: { ACE:13, KING:12, QUEEN:11, JACK:10, TEN:9, NINE:8,
              EIGHT:7, SEVEN:6, SIX:5, FIVE:4, FOUR:3, THREE:2, TWO:1 }
SUIT_POWER: { SPADES:3, HEARTS:2, CLUBS:1, DIAMONDS:0 }

Batch detection (>= 2 new cards): reset sortMode='bySuit', isCustomOrder=false, newCard=null
Single draw (1 new card):         insert at correct sorted position (if !isCustomOrder)
                                  OR append to end (if isCustomOrder)
                                  set newCard = the added card
```

#### `SegmentedControl.tsx` (new)

```
Props:
  options: Array<{ label: string; value: string }>
  value: string                  ← active option
  onChange(value: string): void
  disabled?: boolean
  testID?: string

Visual: two pill tabs sharing one border-radius container.
Active tab: colors.accent background + white text.
Inactive tab: colors.surface background + colors.text.secondary text.
Disabled: opacity 0.4, no press feedback.
```

#### `CardTile.tsx` additions

```
New prop:  isNew?: boolean  (default false)

Behaviour:
- isNew=true AND dimmed=false: show pulsing accent border
  (withRepeat(withTiming(1, {duration:600}), -1, true) on borderColor opacity)
- isNew=true AND dimmed=true: no pulse (suppress)
- isNew=false: existing behaviour unchanged
```

#### `HandArea.tsx` changes

```
- Replace "Sort ↕" Pressable with <SegmentedControl>
  options: [{ label: t('game.actions.sortBySuit'), value: 'bySuit' },
            { label: t('game.actions.sortByRank'), value: 'byRank' }]
  value: sortMode
  onChange: (v) => v === 'bySuit' ? sortBySuit() : sortByRank()
  disabled: stagedCards.length > 0

- Track new card timer:
  useEffect on newCard:
    if (newCard) {
      timer = setTimeout(clearNewCard, 3000)
      return () => clearTimeout(timer)
    }

- Pass isNew={card === newCard && !isDimmed} to each DraggableCard → CardTile
- When card with isNew is pressed (onPress), call clearNewCard() first
```

#### i18n changes

```
Remove:  game.actions.sortHand       (en + ar)
Add:     game.actions.sortBySuit     en: "By Suit"    ar: "بالشكل"
Add:     game.actions.sortByRank     en: "By Rank"    ar: "بالرتبة"
```

## Complexity Tracking

No constitution violations.
