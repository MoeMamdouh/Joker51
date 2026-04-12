# Quickstart: Core Game Engine

**Module path**: `src/engine/index.ts`

---

## 1. Start a game

```typescript
import { initGame } from '@/engine';

const state = initGame({
  players: [
    { id: 'p1', name: 'Alice' },
    { id: 'p2', name: 'Bob' },
  ],
  totalRounds: 4,
});
// 2 players, 1 deck: 54 - (2×14) - 1 = 25 cards in draw pile
```

---

## 2. Execute a turn

```typescript
import { draw, placeInitialMeld, discard } from '@/engine';

// Step 1: Draw
let result = draw(state, { playerId: 'p1', source: 'draw_pile' });
if (!result.success) {
  // result.error is an EngineErrorCode — pass to i18n for display
  console.error(result.error); // e.g. "NOT_YOUR_TURN"
  return;
}
state = result.state;

// Step 2 (optional): Place initial meld if hand total ≥ 51
result = placeInitialMeld(state, {
  playerId: 'p1',
  combinations: [
    [card('6', 'SPADES'), card('7', 'SPADES'), card('8', 'SPADES')],   // 21 pts
    [card('10', 'DIAMONDS'), card('10', 'CLUBS'), card('10', 'HEARTS')], // 30 pts
  ],
});
if (!result.success) return; // e.g. MELD_BELOW_51_POINTS
state = result.state;

// Step 3: Discard
result = discard(state, { playerId: 'p1', card: card('2', 'CLUBS') });
if (!result.success) return;
state = result.state;

// Check status
if (state.status === 'round_ended') {
  const latest = state.roundResults[state.roundResults.length - 1];
  console.log('Round winner:', latest.winnerId);
  console.log('Scores:', latest.scores);
}
```

---

## 3. Advance to next round

```typescript
import { startNextRound } from '@/engine';

if (state.status === 'round_ended' && state.currentRound < state.config.totalRounds) {
  state = startNextRound(state);
  // state.status === 'in_progress', state.currentRound === 2
}

if (state.status === 'game_over') {
  // Sum roundResults[*].scores per player to find the overall winner (lowest total)
}
```

---

## 4. Pre-validate a combination (for UI feedback)

```typescript
import { validateCombination, calculateMeldPoints } from '@/engine';

const selectedCards = [card('5', 'CLUBS'), card('6', 'CLUBS'), card('7', 'CLUBS')];

const { valid, error } = validateCombination(selectedCards, { isInitialMeld: true });
if (!valid) {
  // Show translated error: t(`engine.errors.${error}`)
}

const pts = calculateMeldPoints([selectedCards]);
// Display: `${pts} / 51 points`
```

---

## 5. Deterministic testing

```typescript
// Seeded RNG for reproducible tests
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const state = initGame({
  players: [{ id: 'p1', name: 'Test' }, { id: 'p2', name: 'Bot' }],
  totalRounds: 4,
  random: seededRng(42), // always produces the same shuffle
});
```

---

## Source layout

```
src/engine/
├── index.ts          ← public API (re-exports only)
├── types.ts          ← Card, GameState, ActionResult, EngineErrorCode, enums
├── deck.ts           ← createDeck(), shuffle()
├── deal.ts           ← dealCards(), initGame()
├── validation.ts     ← validateCombination(), calculateMeldPoints()
├── scoring.ts        ← calculateRoundScores()
├── reshuffle.ts      ← handleDrawPileExhaustion()
└── actions/
    ├── draw.ts
    ├── meld.ts       ← placeInitialMeld()
    ├── layOff.ts
    ├── claimJoker.ts
    └── discard.ts    ← discard(), startNextRound()
```
