# Data Model: Hand Sort Enhancements

**Feature**: 009-hand-sort-enhancements
**Date**: 2026-04-14

## New Types

### SortMode

```
'bySuit' | 'byRank'
```

Enumeration of the two available sort modes. Session-scoped; not persisted.

---

### HandOrderState (internal to `useHandOrder`)

| Field | Type | Description |
|---|---|---|
| orderedCards | Card[] | The player's cards in their current display order |
| sortMode | SortMode | Active sort mode; default `'bySuit'` |
| isCustomOrder | boolean | True when the player has manually dragged at least one card since the last sort |
| newCard | Card \| null | The single card most recently drawn; null if batch deal or no recent draw |

---

### Display Power Constants (UI-only, not engine)

**RANK_POWER** — maps Rank to descending display priority (higher = shown further left):

| Rank | Power |
|---|---|
| ACE | 13 (highest) |
| KING | 12 |
| QUEEN | 11 |
| JACK | 10 |
| TEN | 9 |
| NINE | 8 |
| EIGHT | 7 |
| SEVEN | 6 |
| SIX | 5 |
| FIVE | 4 |
| FOUR | 3 |
| THREE | 2 |
| TWO | 1 (lowest) |

**SUIT_POWER** — maps Suit to descending display priority (higher = shown further left):

| Suit | Power |
|---|---|
| SPADES | 3 (first) |
| HEARTS | 2 |
| CLUBS | 1 |
| DIAMONDS | 0 (last) |

Jokers have no suit/rank; they receive priority `[Infinity, Infinity]` and always sort first.

---

## Sort Algorithms

### By Suit (Primary: suit, Secondary: rank — both descending)
```
Jokers → ♠ A K Q J 10 9 8 7 6 5 4 3 2 → ♥ A K … 2 → ♣ A K … 2 → ♦ A K … 2
```

### By Rank (Primary: rank, Secondary: suit — both descending)
```
Jokers → all A (♠♥♣♦) → all K (♠♥♣♦) → … → all 3 → all 2
```

---

## Modified Hook API

`useHandOrder(cards: Card[])` returns:

| Field | Type | Description |
|---|---|---|
| orderedCards | Card[] | Current display order |
| sortMode | SortMode | Active sort mode |
| isCustomOrder | boolean | Whether drag has overridden sort |
| newCard | Card \| null | Most recently drawn card (single draw only) |
| moveCard | (from, to) => void | Drag reorder — sets isCustomOrder=true |
| sortBySuit | () => void | Apply By Suit sort, clear custom order |
| sortByRank | () => void | Apply By Rank sort, clear custom order |
| clearNewCard | () => void | Dismiss the new card indicator |

---

## Modified Component Props

### CardTile (additive — no breaking changes)

| Prop | Type | Default | Description |
|---|---|---|---|
| isNew | boolean | false | Show "new card" indicator (pulsing border). Suppressed when dimmed=true. |

### HandArea (additive — no breaking changes)

No new props required. `newCard` is managed internally via `useHandOrder`.
