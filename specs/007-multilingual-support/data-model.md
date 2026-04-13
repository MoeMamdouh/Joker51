# Data Model: Multilingual Support (EN / AR)

## Overview

This feature has no new persistent data entities. It extends the existing `LanguageState` in `src/store/languageStore.ts` with direction-change signalling, and adds a pure utility for number formatting. All translation data lives in the two JSON locale files.

---

## Extended: LanguageState (Zustand store)

**File**: `src/store/languageStore.ts`

No new persisted fields. The `setLocale` action gains a side-effect: calling `I18nManager.forceRTL` and setting a transient `needsRestartForDirection` flag.

```
LanguageState
  locale            : 'en' | 'ar'          — currently active locale (persisted)
  isRTL             : boolean               — derived from locale === 'ar'
  needsRestart      : boolean               — transient; true when forceRTL was called but
                                              native direction has not been reloaded yet
  setLocale(locale) : void                  — persists preference, calls i18next.changeLanguage,
                                              calls I18nManager.forceRTL, sets needsRestart
  loadPersistedLocale(): Promise<void>      — reads AsyncStorage, restores state on cold start
```

**Validation rules**:
- `locale` accepts only `'en'` or `'ar'`; any other value defaults to `'en'`
- `needsRestart` is reset to `false` when the user dismisses the banner (the dismissal is user-driven)
- `needsRestart` is NOT persisted — it is ephemeral to the current app session

---

## New Utility: formatNumber

**File**: `src/i18n/formatNumber.ts`

Pure function — no state, no side effects.

```
formatNumber(value: number, locale: 'en' | 'ar') → string

  value   : integer to format (scores, counts, round numbers)
  locale  : active locale code
  returns : string with Western digits (locale='en') or Eastern Arabic digits (locale='ar')

Eastern Arabic digit map:
  0 → ٠   1 → ١   2 → ٢   3 → ٣   4 → ٤
  5 → ٥   6 → ٦   7 → ٧   8 → ٨   9 → ٩

Scope: UI chrome values only.
Card face values (rank labels on CardTile) are excluded — they remain standard symbols.
```

---

## Translation Files

### `src/i18n/en.json` — no structural changes

All existing keys are preserved. No new keys required for this feature.

### `src/i18n/ar.json` — dialect update only

All existing keys are preserved. Values are updated from Modern Standard Arabic (فصحى) to Egyptian colloquial Arabic (عامية مصرية).

**Confirmed Egyptian terms** (from product owner):

| Key path | Current (MSA) | Egyptian (confirmed) |
|----------|--------------|----------------------|
| `game.actions.meld` | ضع مجموعة | انزل |
| `game.actions.discard` | ارمِ | ارمي |
| `game.actions.claimJoker` | استرد الجوكر | اسحب الجوكر |
| `game.actions.stageCombination` | تجهيز | جمز |
| `game.actions.confirmMeld` | تأكيد المجموعة | انزل |
| `game.actions.cancelMeld` | إلغاء المجموعة | كنسل |
| `game.handOff.prompt` | مرر الجهاز إلى {{name}} | باسي الجهاز لـ{{name}} |

**Pending confirmation from product owner** (marked ⚠️ — must be resolved before implementation):

| Key path | Current (MSA) | Proposed Egyptian | Status |
|----------|--------------|-------------------|--------|
| `game.actions.layOff` | أضف للمجموعة | ضيف على المجموعة | ⚠️ Confirm |
| `game.handOff.confirm` | أنا {{name}}، أرِني يدي | أنا {{name}}، وريني إيدي | ⚠️ Confirm |
| `game.roundSummary.nextRound` | الجولة التالية | الدور الجاي | ⚠️ Confirm |
| `game.roundSummary.gameOver` | انتهت اللعبة | اللعبة خلصت | ⚠️ Confirm |
| `game.roundSummary.playAgain` | العب مجدداً | العب تاني | ⚠️ Confirm |
| `game.scoreboard.leader` | في المقدمة | في الأول | ⚠️ Confirm |
| Error messages (`يمكنك` → `تقدر`) | various | various | ⚠️ Confirm grammar pattern |

---

## New Component: RtlRestartBanner

**File**: `src/components/ui/RtlRestartBanner.tsx`

Stateless display component. Shown when `needsRestart === true` in language store. Dismissed by user tap.

```
Props:
  visible   : boolean     — controlled by languageStore.needsRestart
  onDismiss : () => void  — clears needsRestart in store

Renders: dismissible banner at top of screen with a localised message explaining
         that the layout direction will apply on next app launch.
         Uses tokens exclusively (no raw style values).
```

---

## Modified Component: HandArea

**File**: `src/components/game/HandArea.tsx`

Adds `useDirection()` hook. When `isRTL` is true, the rendered `cards` array is reversed before mapping to `CardTile` items. No prop changes.

---

## Modified Components: Score Display

**Files**:
- `src/components/game/ScoreboardModal.tsx`
- `src/components/game/RoundSummaryOverlay.tsx`

Replace `String(n)` calls for score/penalty/total values with `formatNumber(n, locale)` where `locale` is read from `useLanguageStore`.
