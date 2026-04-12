# Data Model: Game Board Screen

**Branch**: `003-game-board-screen` | **Date**: 2026-04-12

All entities are read from `GameState` (engine output). The board is a pure read layer — it calls engine actions and receives new `GameState` snapshots; it never mutates state directly.

---

## Entities from Engine (read-only)

### GameState
The root snapshot passed to `gameStore.currentGame`.

| Field | Type | Notes |
|---|---|---|
| config | GameConfig | Players + totalRounds; immutable after game start |
| status | `'in_progress' \| 'round_ended' \| 'game_over'` | Gates round summary overlay |
| currentRound | number | 1-based; display as "Round N of totalRounds" |
| hands | Hand[] | One per player; active player's rendered face-up |
| drawPile | DrawPile | Count shown; individual cards hidden |
| discardPile | DiscardPile | Top card shown face-up |
| tableState | TableState | All combinations visible to all players |
| turnState | TurnState | activePlayerId + phase (DRAWING/ACTING) |
| meldedPlayerIds | string[] | Used to gate Meld vs. LayOff action availability |
| roundResults | RoundResult[] | Full history; rendered in score history panel |
| deckCount | number | Shown in header badge |

### Card
Rendered as `CardTile` component.

| Field | Type | Notes |
|---|---|---|
| rank | Rank \| null | null for Joker |
| suit | Suit \| null | null for Joker |
| isJoker | boolean | Renders wildcard indicator when true |

**Display rules**:
- Face cards: show rank abbreviation + suit symbol
- Joker: show "🃏" indicator with `colors.card.joker` background
- Selected: `translateY(-8)` elevation + `colors.card.selected` border
- Face-down (non-active player badge): shows card back pattern

### Combination
Rendered as `CombinationRow`.

| Field | Type | Notes |
|---|---|---|
| id | string | Key for React list rendering |
| cards | Card[] | Rendered left-to-right (right-to-left in RTL) |
| type | `'sequence' \| 'set'` | Label shown below combination |
| ownerId | string | Player name shown above combination |

**Interaction rules**:
- Non-melded active player: tapping a combination has no effect
- Melded active player in ACTING phase: tapping a combination with selected cards triggers lay-off
- Joker in combination: shows "Claim" affordance if active player holds the replacement card

### TurnState

| Field | Type | Notes |
|---|---|---|
| activePlayerId | string | Drives whose-turn indicator + hand visibility |
| phase | `'drawing' \| 'acting'` | Gates which action buttons are enabled |

**Phase transition**:
- `drawing` → `acting`: triggered by draw or discard-pile pickup
- `acting` → `drawing` (next player): triggered by discard

---

## Ephemeral UI State (not persisted)

### CardSelection (local useState)
| Field | Type | Notes |
|---|---|---|
| selectedCards | Card[] | Cleared after every action |

**Rules**:
- Tap an unselected card → add to selectedCards
- Tap a selected card → remove from selectedCards
- selectedCards cleared on: any successful action, turn change, phase change

### ErrorBanner (local useState)
| Field | Type | Notes |
|---|---|---|
| message | string \| null | Translated error string; null = hidden |
| timerId | ReturnType\<typeof setTimeout\> \| null | Auto-dismiss after 3000ms |

### HandOffScreen (local useState)
| Field | Type | Notes |
|---|---|---|
| pendingHandOff | boolean | True after turn ends, before next player confirms |

---

## Derived Display Values

| Derived Value | Source | Formula |
|---|---|---|
| My hand | `hands` + `turnState.activePlayerId` | `hands.find(h => h.playerId === activePlayerId)?.cards` |
| Other players | `config.players` filter | All players except active; show name + card count |
| Cumulative score | `roundResults` | Sum of `penalty` for each playerId across all RoundResult entries |
| Round winner(s) | Latest `roundResults` entry | Player(s) with minimum penalty in that round; may be multiple (co-winners) |
| Has melded | `meldedPlayerIds` | `meldedPlayerIds.includes(activePlayerId)` |
| Discard top | `discardPile.cards` | `discardPile.cards[discardPile.cards.length - 1]` |

---

## State Transitions Diagram

```
Game starts (status: in_progress)
  ↓
DRAWING phase (active player must draw)
  ├─ draw from draw pile → ACTING phase
  └─ pick up discard top → ACTING phase

ACTING phase
  ├─ [not yet melded] place meld → stay in ACTING
  ├─ [melded] lay off on combination → stay in ACTING
  ├─ [melded] claim Joker → stay in ACTING
  └─ discard one card → DRAWING phase (next player)
                       OR round_ended (if hand empty)

round_ended
  ├─ more rounds: startNextRound() → in_progress → DRAWING
  └─ final round: → game_over

game_over → navigate to setup (New Game) or re-deal (Play Again)
```
