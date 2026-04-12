# UI Contracts: Game Setup Screen

**Branch**: `002-game-setup-screen` | **Date**: 2026-04-12

These contracts define the component interfaces and store API for the setup screen.
They govern what the implementation must expose and how components interact.

---

## SetupStore (Zustand)

**File**: `src/store/setupStore.ts`

```typescript
interface SetupState {
  // Form fields
  playerCount: number;           // 2–8
  playerNames: string[];         // length === playerCount
  roundFormat: 4 | 8 | 12;
  fieldErrors: (string | null)[]; // length === playerCount

  // Derived (computed, not stored)
  // deckCount: computed from playerCount via deckCountForPlayers()
  // isStartEnabled: playerNames.every(n => n.trim().length > 0)

  // Actions
  setPlayerCount(count: number): void;
  setPlayerName(index: number, name: string): void;
  setRoundFormat(format: 4 | 8 | 12): void;
  validateAndStart(): { valid: boolean };  // sets fieldErrors; returns whether all pass
  resetForm(): void;                       // resets to defaults (count=2, names=[], format=4)
}
```

**Invariants**:
- `setPlayerCount` clamps to [2, 8]
- `setPlayerCount` truncates `playerNames` when count decreases; pads with `''` when count increases
- `setPlayerCount` resets corresponding `fieldErrors` entries for removed/added slots
- `validateAndStart` populates `fieldErrors` with error keys (translated by component) before returning

---

## LanguageStore (Zustand)

**File**: `src/store/languageStore.ts`

```typescript
interface LanguageState {
  locale: 'en' | 'ar';
  isRTL: boolean;               // true when locale === 'ar'
  setLocale(locale: 'en' | 'ar'): void;  // persists to AsyncStorage, updates i18next
}
```

**Invariants**:
- `setLocale` calls `i18next.changeLanguage(locale)` synchronously
- `setLocale` persists to `@joker51/language` via AsyncStorage (async, fire-and-forget)
- `isRTL` is always `locale === 'ar'`

---

## DirectionContext

**File**: `src/contexts/DirectionContext.ts`

```typescript
interface DirectionContextValue {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';    // convenience string for style props
}

const DirectionContext: React.Context<DirectionContextValue>;
```

**Usage**: Wrap app root with `<DirectionProvider>`. All layout-sensitive components consume via `useDirection()` hook.

---

## SetupScreen

**File**: `src/screens/SetupScreen.tsx`

```typescript
// No props — reads state from stores; navigates via Expo Router
export default function SetupScreen(): JSX.Element
```

**Responsibilities**:
- Checks AsyncStorage for `@joker51/savedSession` on mount; renders `ResumeGamePrompt` if present
- Composes all setup sub-components
- On successful `validateAndStart()`: calls `initGame(config)` via a store action; navigates to game board

**Must NOT**:
- Import from `src/engine/` directly (constitution Principle II)
- Define any raw style values (constitution Principle VII)

---

## ResumeGamePrompt

**File**: `src/components/setup/ResumeGamePrompt.tsx`

```typescript
interface ResumeGamePromptProps {
  onResume(): void;    // navigate to game board
  onNewGame(): void;   // clear savedSession, show setup form
}

export function ResumeGamePrompt(props: ResumeGamePromptProps): JSX.Element
```

---

## PlayerCountStepper

**File**: `src/components/setup/PlayerCountStepper.tsx`

```typescript
interface PlayerCountStepperProps {
  value: number;                   // current count (2–8)
  onChange(count: number): void;
  testID?: string;
}

export function PlayerCountStepper(props: PlayerCountStepperProps): JSX.Element
```

**Behaviour**:
- Decrement button disabled when `value === 2`
- Increment button disabled when `value === 8`
- `accessibilityLabel` on each button (e.g., `"Decrease player count"`)

---

## PlayerNameInput

**File**: `src/components/setup/PlayerNameInput.tsx`

```typescript
interface PlayerNameInputProps {
  index: number;          // 0-based
  value: string;
  error: string | null;   // already-translated error string; null = no error
  onChange(name: string): void;
  testID?: string;
}

export function PlayerNameInput(props: PlayerNameInputProps): JSX.Element
```

**Behaviour**:
- `maxLength={20}` on the underlying TextInput
- When `error !== null`: renders error text below field in `colors.error` token

---

## RoundFormatSelector

**File**: `src/components/setup/RoundFormatSelector.tsx`

```typescript
interface RoundFormatSelectorProps {
  value: 4 | 8 | 12;
  onChange(format: 4 | 8 | 12): void;
  testID?: string;
}

export function RoundFormatSelector(props: RoundFormatSelectorProps): JSX.Element
```

**Behaviour**: Renders three tappable options; selected option is visually highlighted using `colors.accent` token.

---

## DeckCountNotice

**File**: `src/components/setup/DeckCountNotice.tsx`

```typescript
interface DeckCountNoticeProps {
  deckCount: number;   // 1, 2, or 3
  testID?: string;
}

export function DeckCountNotice(props: DeckCountNoticeProps): JSX.Element | null
```

**Behaviour**:
- Returns `null` when `deckCount === 1` (no notice needed)
- Renders an info banner with translated `setup.deckNotice` string when `deckCount >= 2`

---

## LanguageSelector

**File**: `src/components/setup/LanguageSelector.tsx`

```typescript
interface LanguageSelectorProps {
  value: 'en' | 'ar';
  onChange(locale: 'en' | 'ar'): void;
  testID?: string;
}

export function LanguageSelector(props: LanguageSelectorProps): JSX.Element
```

**Behaviour**: Two-option toggle (EN / AR); selected option visually distinct; changing value triggers full i18n + direction switch.

---

## Navigation Contract

The setup screen navigates to the game board screen on successful Start or Resume. The navigation call passes the initialized `GameState` as a route parameter.

```typescript
// On Start:
router.push({ pathname: '/game', params: { gameState: JSON.stringify(gameState) } });

// On Resume:
router.push('/game');  // game board reads savedSession from AsyncStorage directly
```

**Note**: The game board screen (Phase 3) is out of scope; this contract defines what setup *emits*.
