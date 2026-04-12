# 🃏 Joker 51 — Complete Game Specification
> For use with Expo (React Native) + Speck Kit Integration

---

## 1. Game Identity

| Property | Value |
|---|---|
| **Name** | Joker 51 |
| **Genre** | Card Game / Rummy Variant |
| **Origin** | Egyptian Rummy (known regionally as "Joker") |
| **Platform** | Expo / React Native (iOS & Android) |

---

## 2. Players & Decks

### Player Count & Deck Scaling

| Decks | Cards in Play | Player Range |
|---|---|---|
| 1 deck | 54 cards (52 + 2 Jokers) | 2–3 players |
| 2 decks | 108 cards (104 + 4 Jokers) | 4–6 players |
| 3 decks | 162 cards (156 + 6 Jokers) | 7–8 players |

**Rule:** Minimum cards required = (Players × 14) + 10 (draw pile reserve).  
Players must be informed when 2+ decks are in use.

---

## 3. Card Values

| Card | Points |
|---|---|
| Number cards (2–10) | Face value (2–10) |
| Jack, Queen, King | 10 points |
| Ace | 11 points |
| Joker | 25 points |

---

## 4. Dealing

- Each player is dealt **14 cards**
- Remaining cards form the **draw pile** (face-down)
- The **top card** of the remaining deck is flipped face-up to start the **discard pile**
- Deal order and first player are decided randomly

---

## 5. Valid Combinations

### 5.1 Sequence (Run)
- Minimum **3 cards**, no maximum length
- Must be **same suit**
- Must be **consecutive in rank**
- Example: `5♣ 6♣ 7♣` ✅
- Example: `5♣ 6♣ 7♦` ❌ (mixed suits)

### 5.2 Set (Group)
- Minimum **3 cards**, maximum **4 cards** per set (one per suit)
- Must be **same rank**
- **No duplicate suits** allowed within the same set
- Example: `9♠ 9♥ 9♦` ✅
- Example: `9♠ 9♠ 9♦` ❌ (duplicate suit)
- With multiple decks: suits still cannot repeat within a single set

---

## 6. Ace Special Rule

The Ace has a **dual position** in sequences:

| Position | Valid Sequence Example |
|---|---|
| Low (1) | `A♠ 2♠ 3♠` ✅ |
| High (14) | `Q♠ K♠ A♠` ✅ |
| Wrap-around | `K♠ A♠ 2♠` ❌ — NOT allowed |

> The Ace **cannot wrap around**. It is either the first or last card of a sequence only.

---

## 7. Initial Meld (First Drop / Opening)

- A player's **first placement** on the table must total **at least 51 points**
- Must consist of **one or more valid combinations** (each with ≥ 3 cards)
- Points are summed across all combinations placed in that single turn
- Until a player has melded, they **cannot add cards to table combinations**
- If the 51-point threshold is not met on a turn, the player **cannot meld** that turn

### Example of valid opening:
`6♠ 7♠ 8♠` (21 pts) + `10♦ 10♣ 10♥` (30 pts) = **51 pts** ✅

### Discard Pile Draw Before Initial Meld

A player who has **not yet melded** may only draw from the discard pile under one condition:

- They must **use that card in their initial meld on the same turn**

If the player cannot or does not include the drawn discard card in their initial meld, the draw is invalid. Players who have not yet melded and cannot immediately use the discard card in their opening meld must draw from the draw pile instead.

---

## 8. Joker Rules

### 8.1 In Combinations
- A Joker can **substitute any card** in a sequence or set
- During the **initial meld**, only **one Joker** is allowed per combination placed
- Joker's point value during scoring = **25 points** (if left in hand)

### 8.2 Claiming a Joker from the Table
- A player can **claim a Joker** from any melded combination on the table
- **Conditions:**
  - Can only be done **on your own turn**
  - Player must hold the **real card** the Joker represents
  - Player replaces the Joker with the real card
  - The combination must remain **valid (3+ cards)** after the swap
  - The claimed Joker goes back into the **player's hand** for reuse

### 8.3 Joker Restrictions
- A Joker **cannot** be claimed out of turn
- After claiming, the Joker can be used **in the same turn** (meld, add to table, or held)

---

## 9. Turn Flow

Each turn follows this order:

```
1. DRAW        → Take 1 card from draw pile OR top card from discard pile
                  (See Section 7 for discard pile restriction before initial meld)
2. MELD        → (Optional) Place initial meld if 51pt requirement is met (first time only)
                  OR place new combinations on the table (any turn after initial meld, no point threshold)
3. ADD         → (Optional) Lay off cards onto any existing table combinations
                  (Only available after initial meld; also allowed during the same turn as initial meld)
4. DISCARD     → Must discard exactly 1 card to end the turn
```

> **Important:** Steps 2 and 3 can happen in any combination in the same turn. A player can meld initial + add new combinations + lay off all in one turn.

---

## 10. Table Interaction (After Initial Meld)

Once a player has completed their initial meld, on any subsequent turn they may:

- **Place new combinations** on the table (sequences or sets) — no minimum point requirement
  - Example: Place `J♠ Q♠ K♠` as a new sequence at any time after initial meld
- **Extend a sequence** by adding cards to either end (lay off)
  - Example: Add `4♣` or `8♣` to `5♣ 6♣ 7♣`
- **Complete a set** by adding a missing suit (lay off)
  - Example: Add `9♣` to `9♠ 9♥ 9♦`
- **Add to any player's** melded combinations (not just their own)
- **Claim Jokers** from any table combination (see Section 8)

> Placing new combinations and laying off onto existing combinations can both happen in the same turn, in any order.

---

## 11. Draw Pile Rules

### 11.1 Drawing
- Player draws **1 card only** per turn, from either:
  - The **top of the draw pile** (face-down)
  - The **top card of the discard pile** (face-up, visible to all)
- A player who has **not yet completed their initial meld** may only draw from the discard pile if they will use that card in their initial meld on the same turn (see Section 7)

### 11.2 Draw Pile Exhaustion
- When the draw pile is **empty**, the discard pile is **reshuffled** and becomes the new draw pile
- The **top card** of the reshuffled pile is flipped to restart the discard pile

### 11.3 Cleared Combinations Trigger (On Reshuffle)
When the draw pile is exhausted and reshuffle occurs, **two types of completed table combinations are cleared** and added to the reshuffled draw pile:

| Combination Type | Trigger Condition |
|---|---|
| **Full Set** | All 4 suits of the same rank are on the table (e.g., `9♠ 9♥ 9♦ 9♣`) |
| **Full Sequence** | A complete A→K sequence of the same suit is on the table (13 cards) |

> These combinations are removed from the table and shuffled back into the draw pile at reshuffle time — **not immediately** when completed.

---

## 12. Winning Condition

A player **wins the round** when:
1. They have used all their cards via melding / adding to table
2. They **discard their last card** to end the turn

> A player **cannot** win by melding all cards with nothing left to discard. At least 1 card must always be discarded on the winning turn.

---

## 13. Scoring

### 13.1 End of Round Scoring

| Condition | Penalty |
|---|---|
| Player **did not meld at all** | Flat **100 points** penalty |
| Player **melded but did not win** | Sum of **remaining cards in hand** |

**Card values for scoring (remaining hand):**

| Card | Points |
|---|---|
| Number cards (2–10) | Face value |
| Jack, Queen, King | 10 points |
| Ace | 11 points |
| Joker | 25 points |

> 🎯 **Goal: lowest score wins.**

### 13.2 Game Format (Rounds)

| Format | Rounds |
|---|---|
| Short | 4 rounds |
| Medium | 8 rounds |
| Long | 12 rounds |

- At the end of all rounds, **total scores are summed**
- The player with the **lowest total score wins** the game

---

## 14. Game Settings (App Configuration)

| Setting | Options |
|---|---|
| **Game Format** | Short (4) / Medium (8) / Long (12) rounds |
| **Number of Players** | 2 – 8 (auto-scales decks) |
| **Deck Count** | Auto-calculated based on players (shown to all players) |
| **Player Names** | Configurable before game start |

---

## 15. Edge Cases & Special Rules Summary

| Rule | Detail |
|---|---|
| Ace position | Low (A-2-3) or High (Q-K-A) only. No wraparound. |
| Minimum meld size | Always 3 cards per combination |
| Set suit uniqueness | No two cards of the same suit in one set |
| Joker in opening meld | Max 1 Joker per combination during initial meld |
| Joker claim | Must replace with real card; combination stays valid (3+); only on own turn |
| Full set cleared | All 4 suits same rank → cleared on next reshuffle |
| Full sequence cleared | A→K same suit (13 cards) → cleared on next reshuffle |
| Winning discard | Must always discard last card to win; cannot meld out entirely |
| No meld penalty | Always flat 100, regardless of cards in hand |
| Discard pile draw | Top card only (1 card per turn); before initial meld, must use drawn card in that same turn's meld |
| Additional melds | After initial meld, player may place new valid combinations any turn with no point minimum |
| Multiple decks | Players are notified when 2+ decks are used |

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Meld** | A valid combination placed face-up on the table |
| **Initial Meld / Opening** | A player's first meld, must total ≥ 51 points |
| **Sequence / Run** | 3+ consecutive cards of the same suit |
| **Set / Group** | 3–4 cards of the same rank, all different suits |
| **Draw Pile** | Face-down stack of cards to draw from |
| **Discard Pile** | Face-up stack of discarded cards |
| **Lay Off** | Adding a card to an existing table combination |
| **Joker Claim** | Replacing a Joker on the table with the real card |
| **Reshuffle** | Discard pile becomes new draw pile when draw pile is empty |
| **Full Set** | All 4 suits of same rank present in one table set |
| **Full Sequence** | Complete A–K run of same suit on the table |

---

*Document Version: 1.0 — Joker 51 Game Specification*  
*Prepared for: Expo React Native App Development with Speck Kit*
