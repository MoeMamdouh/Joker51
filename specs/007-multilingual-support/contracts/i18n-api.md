# Contract: i18n Public API

## formatNumber

**File**: `src/i18n/formatNumber.ts`

```typescript
export function formatNumber(value: number, locale: 'en' | 'ar'): string
```

**Contract**:
- `value` must be a non-negative integer (scores and counts are never negative in this app)
- Returns a string representation of `value` using the numeral set for `locale`:
  - `'en'` → Western Arabic digits (`0`–`9`)
  - `'ar'` → Eastern Arabic digits (`٠`–`٩`)
- Does NOT apply thousands separators or any other formatting
- Card face rank values are NOT formatted by this function — they are raw string labels

**Examples**:
```
formatNumber(0,   'en') → "0"
formatNumber(42,  'en') → "42"
formatNumber(0,   'ar') → "٠"
formatNumber(42,  'ar') → "٤٢"
formatNumber(100, 'ar') → "١٠٠"
formatNumber(999, 'ar') → "٩٩٩"
```

---

## LanguageStore public interface

**File**: `src/store/languageStore.ts`

```typescript
interface LanguageState {
  locale: 'en' | 'ar';
  isRTL: boolean;
  needsRestart: boolean;
  setLocale(locale: 'en' | 'ar'): void;
  dismissRestartBanner(): void;
  loadPersistedLocale(): Promise<void>;
}
```

**setLocale contract**:
1. Updates `locale` and `isRTL` in store
2. Calls `i18next.changeLanguage(locale)` — text updates immediately
3. Calls `I18nManager.forceRTL(locale === 'ar')` — queued for native layer; takes effect on cold restart
4. If direction changed (isRTL toggled), sets `needsRestart: true`
5. Persists `locale` to AsyncStorage (fire-and-forget; errors are swallowed)

**dismissRestartBanner contract**:
- Sets `needsRestart: false`
- Does NOT re-set `I18nManager`; the stored preference remains

---

## Translation file schema

**Files**: `src/i18n/en.json`, `src/i18n/ar.json`

Both files MUST contain identical top-level key structure. A key present in `en.json` MUST also be present in `ar.json` and vice versa. Missing keys cause fallback to `en` at runtime (i18next behaviour), but any missing key in either file is a merge-blocking error per the constitution (§VI).

**Top-level namespaces** (existing, no additions in this phase):
```
setup.*
common.*
validation.*
game.*
  game.phase.*
  game.actions.*
  game.handOff.*
  game.roundSummary.*
  game.score.*
  game.scoreboard.*
  game.errors.*
```

---

## RtlRestartBanner component interface

**File**: `src/components/ui/RtlRestartBanner.tsx`

```typescript
interface RtlRestartBannerProps {
  visible: boolean;
  onDismiss(): void;
}

export function RtlRestartBanner(props: RtlRestartBannerProps): React.ReactElement | null
```

**Contract**:
- Returns `null` when `visible` is `false`
- Renders a non-modal, non-blocking banner (does not prevent interaction with underlying UI)
- Displays a localised message from the active i18next locale
- Contains a single dismiss control; calling `onDismiss` is the only user action
- Uses design tokens exclusively — no raw style values
- Requires a new i18n key: `common.rtlRestartNotice` in both `en.json` and `ar.json`
