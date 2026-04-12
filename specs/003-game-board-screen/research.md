# Research: Game Board Screen

**Branch**: `003-game-board-screen` | **Date**: 2026-04-12

---

## Decision 1: Card Selection State Location

**Decision**: Local `useState` inside `GameBoardScreen` (or a dedicated `useCardSelection` hook), not Zustand.

**Rationale**: Card selection is ephemeral UI state — it resets to empty after every action (draw, meld, discard). Storing it in Zustand would couple transient interaction state to the persistent game store, polluting serialized game state and complicating persistence. Local state is simpler, co-located with the component that owns the interaction, and requires zero migration strategy if the shape changes.

**Alternatives considered**:
- Zustand gameStore slice: rejected — ephemeral selection doesn't belong in persisted state (violates Principle V serialization rule).
- React Context: rejected — overkill for a single-screen concern.

---

## Decision 2: Round Summary Display

**Decision**: Full-screen modal overlay rendered conditionally from `GameBoardScreen` when `gameState.status === 'round_ended' || 'game_over'`. Not a separate route.

**Rationale**: The game remains on the `/game` route throughout all rounds. A route change would complicate back-navigation (pressing back could accidentally exit the game) and would require threading game state through navigation params. A conditional overlay within the same screen keeps game state in `gameStore` with zero routing side-effects and allows "Next Round" to dismiss the overlay and trigger a new deal instantly.

**Alternatives considered**:
- Separate `/round-summary` route: rejected — back button exits game unexpectedly; navigation params can't hold large `GameState` objects safely across route transitions.
- Bottom sheet: rejected — screen real estate is too small on 320pt devices; full-screen summary is clearer.

---

## Decision 3: Game Action Side Effects (persistence + store update)

**Decision**: `useGameActions` custom hook. Each action method (e.g., `drawFromPile`, `placeMeld`, `discardCard`) calls the engine, then on success calls `gameStore.setGame(result.state)` and `AsyncStorage.setItem(SESSION_KEY, JSON.stringify(result.state))`. Returns `{ error: string | null }` for error surfacing.

**Rationale**: Keeps `GameBoardScreen` a pure rendering consumer. The three concerns — call engine, update store, persist to storage — always happen together; co-locating them in a hook avoids repeating the pattern six times across action handlers. The hook is easily testable in isolation.

**Alternatives considered**:
- Inline in screen handlers: rejected — repeats persistence logic 6× and makes the screen hard to test.
- Middleware in gameStore: rejected — Zustand middleware adds indirection and makes persistence behavior less transparent.

---

## Decision 4: Error Display Pattern

**Decision**: Transient inline error banner below the action bar, auto-dismissing after 3 seconds. Implemented as a `useErrorBanner` hook returning `{ errorMessage, showError }`.

**Rationale**: A non-blocking banner lets players see the error and immediately retry without dismissing a modal. 3-second auto-dismiss matches React Native/Expo community conventions. Avoids a third-party toast library (Principle VIII — no unjustified dependencies).

**Alternatives considered**:
- Alert/Modal: rejected — blocks interaction; player must tap to dismiss before retrying.
- Third-party toast (react-native-toast-message): rejected — adds a dependency for a feature that is trivially implementable.
- Inline text under the card hand: rejected — obscured when the hand area is large.

---

## Decision 5: Animation Approach

**Decision**: React Native Reanimated `withTiming` (150ms) for card selection elevation (translateY −8). `withSpring` for card entering the hand after draw. No animation for card leaving the hand (instant removal keeps turn flow snappy).

**Rationale**: Constitution Principle IV mandates Reanimated for 60fps. Principle VIII prohibits decorative animations that impact performance. Card selection feedback (lift) is gameplay-essential UX. Draw animation (spring into hand) communicates the "new card received" event clearly. Removal is kept instant to keep turn pace fast.

**Alternatives considered**:
- Animated API (legacy): rejected — Principle IV explicitly requires Reanimated.
- Flip card animation on draw: rejected — introduces 400ms+ delay per draw; slows game pace.
- Full drag-and-drop for meld placement: deferred to a future polish phase — tap-to-select + tap-button is simpler and still fully functional.

---

## Decision 6: Pass-and-Play Hand Privacy

**Decision**: When `turnState.activePlayerId !== currentViewingPlayerId` (after a turn ends), display a "Pass the device to [next player name]" fullscreen privacy overlay before revealing the next player's hand. Player taps "I'm [Name], show my hand" to dismiss.

**Rationale**: In pass-and-play the previous player must not accidentally see the next player's cards. An explicit handoff screen is standard for physical card game digital adaptations (Catan, UNO). This is required for game integrity (Principle I — Game Rule Fidelity).

**Alternatives considered**:
- No privacy screen (trust players): rejected — violates the spirit of the pass-and-play model and makes the game unfair.
- Auto-dismiss after timeout: rejected — next player may not be ready, leading to accidental exposure.

---

## Decision 7: Token Expansion Required

**Decision**: Expand `src/theme/tokens.ts` with card-specific and suit-specific tokens before any `CardTile` component work. New tokens:
- `colors.card.face` (card face background)
- `colors.card.back` (face-down card background)
- `colors.card.selected` (highlighted state border/background)
- `colors.card.joker` (Joker wildcard indicator color)
- `colors.suit.red` (hearts + diamonds)
- `colors.suit.black` (spades + clubs)
- `shadows.card.elevation` (selected card lift shadow — `elevation: 6` on Android, shadow props on iOS)

**Rationale**: Principle VII (Design System) forbids raw values in components. CardTile is the most visually complex component in the app — it needs dedicated tokens rather than repurposing generic surface/accent tokens.

**Alternatives considered**:
- Reuse `colors.surface` / `colors.accent` for cards: rejected — semantically wrong; card face color is distinct from a surface panel.

---

## Decision 8: i18n Keys for Board

All board-specific strings externalized. New key namespaces needed:
- `game.turnIndicator` — "{{name}}'s turn"
- `game.phase.drawing` — "Draw a card"
- `game.phase.acting` — "Play your hand"
- `game.drawPile` — "Draw pile"
- `game.discardPile` — "Discard pile"
- `game.actions.meld` — "Meld"
- `game.actions.discard` — "Discard"
- `game.actions.claimJoker` — "Claim Joker"
- `game.actions.layOff` — "Lay Off"
- `game.handOff.prompt` — "Pass to {{name}}"
- `game.handOff.confirm` — "I'm {{name}}, show my hand"
- `game.roundSummary.title` — "Round {{round}} Complete"
- `game.roundSummary.penalty` — "Penalty: {{points}} pts"
- `game.roundSummary.nextRound` — "Next Round"
- `game.roundSummary.gameOver` — "Game Over"
- `game.roundSummary.playAgain` — "Play Again"
- `game.roundSummary.winner` — "Round Winner"
- `game.roundSummary.coWinners` — "Round Co-Winners"
- `game.score.label` — "{{name}}: {{score}}"
- `game.deckCount` — "{{count}} decks"
- `game.errors.*` — one key per engine EngineErrorCode (17 codes)
