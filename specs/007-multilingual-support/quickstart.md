# Quickstart: Multilingual Support (EN / AR)

## What this feature adds

1. **Egyptian Arabic dialect** — `ar.json` updated from Modern Standard Arabic to Egyptian colloquial
2. **formatNumber utility** — Eastern Arabic numeral rendering for all score/count UI chrome
3. **RTL hand order** — `HandArea` reverses card array when Arabic is active
4. **RTL restart banner** — non-blocking dismissible banner when direction change requires a cold restart
5. **languageStore direction signal** — `needsRestart` flag + `dismissRestartBanner` action

---

## Files to create

| File | Purpose |
|------|---------|
| `src/i18n/formatNumber.ts` | Pure number → locale string formatter |
| `src/components/ui/RtlRestartBanner.tsx` | Dismissible banner shown after direction switch |
| `src/components/ui/__tests__/RtlRestartBanner.test.tsx` | Component tests |
| `src/i18n/__tests__/formatNumber.test.ts` | Unit tests for formatter |

## Files to modify

| File | Change |
|------|--------|
| `src/i18n/ar.json` | Replace all MSA strings with Egyptian colloquial |
| `src/i18n/en.json` | Add `common.rtlRestartNotice` key |
| `src/store/languageStore.ts` | Add `I18nManager.forceRTL` call + `needsRestart` state |
| `src/components/game/HandArea.tsx` | Reverse card array when `isRTL` is true |
| `src/components/game/ScoreboardModal.tsx` | Use `formatNumber` for penalty/total values |
| `src/components/game/RoundSummaryOverlay.tsx` | Use `formatNumber` for penalty/score values |
| `app/_layout.tsx` (or root entry) | Mount `RtlRestartBanner` at app root level |

---

## Implementation order

```
Step 1  formatNumber.ts             — pure utility, no dependencies, easy to test first
Step 2  ar.json Egyptian update     — no code changes, verify with all translation keys
Step 3  languageStore + needsRestart — extend existing store, add dismissRestartBanner
Step 4  RtlRestartBanner component  — depends on languageStore and en.json new key
Step 5  HandArea RTL reversal       — depends on DirectionContext (already exists)
Step 6  ScoreboardModal numerals    — depends on formatNumber + languageStore locale
Step 7  RoundSummaryOverlay nums    — depends on formatNumber + languageStore locale
Step 8  Wire banner at app root     — depends on RtlRestartBanner + languageStore
```

---

## Testing checklist

- [ ] `formatNumber(42, 'ar')` returns `'٤٢'`
- [ ] `formatNumber(42, 'en')` returns `'42'`
- [ ] Language toggle in LanguageSelector persists and survives app re-launch
- [ ] Switching EN→AR: text updates immediately, banner appears, banner dismisses
- [ ] Switching AR→EN: text updates immediately, banner appears, banner dismisses
- [ ] No banner appears if language is set to same value already active
- [ ] `HandArea` in RTL: last card in `cards` array is rendered leftmost
- [ ] `ScoreboardModal` in AR: all score cells show Eastern numerals
- [ ] `RoundSummaryOverlay` in AR: penalty and total show Eastern numerals
- [ ] `ar.json` has no missing keys vs `en.json` (key parity check)
- [ ] All game screens visited in AR mode: zero English strings visible

---

## New i18n key

Add to both `en.json` and `ar.json` under `common`:

```json
// en.json
"common": {
  "rtlRestartNotice": "Restart the app to apply the new layout direction.",
  ...
}

// ar.json  
"common": {
  "rtlRestartNotice": "أعد تشغيل التطبيق عشان التخطيط الجديد يتطبق.",
  ...
}
```

> **Note**: The Arabic for `rtlRestartNotice` above is a placeholder using a reasonable Egyptian dialect phrase. Confirm with product owner before implementation if a specific phrasing is preferred.

---

## Key constraints

- **No new Zustand stores** — extend `languageStore` only
- **No new i18n namespaces** — all new keys go under existing `common.*`
- **formatNumber is pure** — no imports from stores or React; safe to unit-test with plain Jest
- **Card face labels are exempt** from Eastern numeral formatting (FR-009)
- **`needsRestart` is ephemeral** — never persisted to AsyncStorage
