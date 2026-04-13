# Research: Multilingual Support (EN / AR)

## Existing Infrastructure Audit

### What is already built

| Area | Status | File |
|------|--------|------|
| i18next + react-i18next init | ✅ Complete | `src/i18n/index.ts` |
| AsyncStorage persistence (`@joker51/language`) | ✅ Complete | `src/i18n/index.ts`, `src/store/languageStore.ts` |
| Language Zustand store (`setLocale`, `loadPersistedLocale`) | ✅ Complete | `src/store/languageStore.ts` |
| RTL context provider (`DirectionContext`) | ✅ Complete | `src/contexts/DirectionContext.tsx` |
| Language selector on setup screen | ✅ Complete | `src/components/setup/LanguageSelector.tsx` |
| `en.json` translation file | ✅ Complete | `src/i18n/en.json` |
| `ar.json` translation file | ⚠️ MSA dialect — needs Egyptian colloquial | `src/i18n/ar.json` |
| `I18nManager.forceRTL` on cold start | ✅ Complete | `src/i18n/index.ts` |
| RTL awareness in `SetupScreen` | ✅ Partial (title alignment only) | `src/screens/SetupScreen.tsx` |

### What is missing / incomplete

| Gap | Impact | Location |
|-----|--------|----------|
| `languageStore.setLocale` does NOT call `I18nManager.forceRTL` at runtime | RTL layout only applies after cold restart, with no user notification | `src/store/languageStore.ts` |
| No non-blocking restart banner after direction switch | User unaware that direction change requires restart | New component needed |
| `HandArea` renders cards in fixed LTR order | In Arabic mode, card hand order is wrong | `src/components/game/HandArea.tsx` |
| `ScoreboardModal` uses `String(penalty)` / `String(total)` | Scores always display as Western numerals | `src/components/game/ScoreboardModal.tsx` |
| `RoundSummaryOverlay` interpolates raw numbers | Scores always display as Western numerals | `src/components/game/RoundSummaryOverlay.tsx` |
| No locale-aware number formatter utility | Scores/counts can't be locale-formatted from one place | New utility needed |
| `ar.json` uses Modern Standard Arabic (فصحى) | All Arabic strings must use Egyptian colloquial (عامية مصرية) | `src/i18n/ar.json` |

---

## Decision Log

### D-001: RTL Direction Change — Restart Banner Approach

**Decision**: When `setLocale` causes a direction change (EN→AR or AR→EN), call `I18nManager.forceRTL` and display a dismissible non-blocking banner/toast informing the player that the layout direction update will take full effect on the next app launch.

**Rationale**: `I18nManager.forceRTL` + a reload (via `Updates.reloadAsync` or `RCTDevSettings`) is the only reliable way to apply native RTL on React Native. Forcing a reload is disruptive mid-session. The non-blocking banner informs without disrupting. Text direction and i18next language switch (which are React-driven) update immediately; only the native flex-direction mirroring is deferred.

**Alternatives considered**:
- `expo-updates` `reloadAsync()` — disruptive, could lose in-progress game state
- Blocking modal — rejected per spec clarification (non-blocking confirmed)
- No notification — leaves user confused about partial layout change

### D-002: Eastern Arabic Numeral Formatter

**Decision**: Create `src/i18n/formatNumber.ts` — a pure function `formatNumber(value: number, locale: 'en' | 'ar'): string` that maps Western digits to Eastern Arabic equivalents (`٠١٢٣٤٥٦٧٨٩`) when locale is `ar`.

**Rationale**: Simpler than `Intl.NumberFormat` (which is not fully reliable across all React Native / Hermes versions) and is pure — easily unit-tested and zero-dependency.

**Alternatives considered**:
- `Intl.NumberFormat('ar-EG')` — inconsistent across Hermes versions; some RN builds lack full ICU data
- Inline replacement in each component — duplication, harder to test

**Scope**: Applies to UI chrome values (scores, counts, round numbers). Card face values (`7`, `K`, `A`) are excluded per spec FR-009.

### D-003: RTL Card Hand Order

**Decision**: In `HandArea`, pass `direction` from `useDirection()` and reverse the `cards` array before rendering when `isRTL` is true.

**Rationale**: React Native's `I18nManager.forceRTL` mirrors flex containers automatically after a cold restart, but `HandArea` uses a `ScrollView` with `horizontal`. Reversing the array at the React level ensures the visual order is correct regardless of whether the native direction has been applied yet (i.e., before the first cold restart post-switch).

**Alternatives considered**:
- `transform: [{ scaleX: -1 }]` on the ScrollView — mirrors the entire scroll including touch targets, causing inverted tap zones
- Relying solely on `I18nManager` auto-mirroring — unreliable before cold restart

### D-004: Egyptian Arabic Translation Strategy

**Decision**: Update `ar.json` in-place, replacing all MSA strings with Egyptian colloquial equivalents. No new file or namespace is added.

**Rationale**: The constitution mandates a single `ar.json` locale file. Dialect variants are not a supported pattern in the existing i18n setup. Egyptian Arabic is the target per FR-005 and confirmed by the product owner.

**Key Egyptian terms confirmed by product owner**:
- `actions.meld` → `انزل`
- `actions.discard` → `ارمي`
- `actions.claimJoker` → `اسحب الجوكر`
- `actions.stageCombination` → `جمز`
- `actions.confirmMeld` → `انزل`
- `actions.cancelMeld` → `كنسل`
- `handOff.prompt` → `باسي الجهاز لـ{{name}}`

**Remaining terms to confirm with product owner before implementation** (marked in data-model.md):
- `actions.layOff`
- `handOff.confirm`
- `roundSummary.nextRound`, `roundSummary.gameOver`, `roundSummary.playAgain`
- `scoreboard.leader`
- Error message grammar: `يمكنك` → `تقدر`, `يجب` → `لازم`, `الآن` → `دلوقتي`
