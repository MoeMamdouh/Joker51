# Quickstart: Design System, Theme & Game UX

**Feature**: `008-design-system-theme`  
**Date**: 2026-04-13

---

## Prerequisites

All dependencies are already installed — no `npm install` required for this phase:

| Already present | Used for |
|-----------------|----------|
| `react-native-gesture-handler` ~2.28.0 | Drag-to-reorder pan gesture |
| `react-native-reanimated` ~4.1.1 | Drag animations, bottom sheet animations |
| `@react-native-async-storage/async-storage` 2.2.0 | Card style preference persistence |
| `zustand` ^5.0.12 | `cardStyleStore` |
| `i18next` + `react-i18next` | Settings screen translations |

---

## Build & Run

```bash
# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Run tests
npm test

# Run tests (watch mode)
npm test -- --watch
```

---

## Verification Checklist

After implementation, manually verify on both iOS and Android:

**Card Visuals**
- [ ] Number cards show rank + suit symbol in top-left and bottom-right corners
- [ ] Aces show "A" in corners + large centered suit symbol
- [ ] Face cards show rank letter in corners; Classic style adds colored background fill in center; Minimal style has no fill
- [ ] Joker cards show "JOKER" label with distinct background color
- [ ] Face-down card shows back pattern, no content

**Card Style Selection**
- [ ] Settings screen is reachable from Setup screen
- [ ] CardStylePicker shows preview thumbnails for each style
- [ ] Selecting a style immediately updates all cards on the game board
- [ ] Selected style persists after force-quitting and reopening the app

**Staged Card Dimming**
- [ ] Tapping a card stages it (card shifts up)
- [ ] All other hand cards become visually dimmed
- [ ] Tapping a dimmed card does nothing
- [ ] Tapping a staged card de-stages it and cards return to full opacity
- [ ] Confirming or cancelling a meld restores all cards to full interactivity

**Drag-to-Reorder**
- [ ] Long-pressing a card (≥200ms) initiates drag
- [ ] Card lifts visually with shadow during drag
- [ ] Other cards animate aside to show insertion gap
- [ ] Releasing at a valid position reorders the hand
- [ ] Releasing outside the hand area snaps the card back
- [ ] Dragging does not accidentally stage cards

**Joker Placement Bottom Sheet**
- [ ] Staging a Joker + two sequence cards and initiating meld shows the bottom sheet
- [ ] Sheet shows all valid position options with Joker highlighted in each
- [ ] Selecting an option and confirming places the meld correctly on the table
- [ ] Dismissing (cancel / swipe-down / tap backdrop) returns staged cards to hand
- [ ] If only one valid position, sheet is skipped and meld proceeds directly

**RTL**
- [ ] Switch to Arabic — all new components render correctly in RTL
- [ ] Card style picker grid aligns correctly in RTL
- [ ] Bottom sheet content renders correctly in RTL

**Token compliance**
- [ ] `grep -r "color: '#" src/` returns no matches in component files (only in `tokens.ts`)
- [ ] `grep -r "padding: [0-9]" src/components` returns no matches

---

## Key Files Reference

| File | Status | Purpose |
|------|--------|---------|
| `src/theme/tokens.ts` | MODIFY | Add dimmed overlay, faceCard tokens, z-index, typography.cardCorner/cardCenter, shadows.cardLifted/bottomSheet |
| `src/store/cardStyleStore.ts` | NEW | Card style preference + AsyncStorage persistence |
| `src/components/game/CardTile.tsx` | MODIFY | Realistic corner layout, dimmed prop, style-aware center content |
| `src/components/game/HandArea.tsx` | MODIFY | Drag-to-reorder, dimming orchestration, useHandOrder hook |
| `src/components/game/JokerPlacementSheet.tsx` | NEW | Joker sequence option picker |
| `src/components/ui/BottomSheet.tsx` | NEW | Reusable animated bottom sheet |
| `src/components/settings/CardStylePicker.tsx` | NEW | Style selection grid with previews |
| `src/hooks/useHandOrder.ts` | NEW | Cosmetic hand order management |
| `src/screens/SettingsScreen.tsx` | NEW | Language + card style settings |
| `app/settings.tsx` | NEW | Expo Router route for settings screen |
| `src/i18n/en.json` | MODIFY | Add settings.* and game.jokerPlacement.* keys |
| `src/i18n/ar.json` | MODIFY | Same keys, Arabic translations |
| `app/_layout.tsx` | MODIFY | Call `cardStyleStore.loadPersistedStyle()` at startup |
| `src/screens/GameBoardScreen.tsx` | MODIFY | Wire JokerPlacementSheet into meld flow; add settings navigation |

---

## Development Order (dependency-respecting)

1. `tokens.ts` — expands the token base everything else uses
2. `cardStyleStore.ts` — store + types (`CardStyleId`, `CardStyleDefinition`)
3. `CardTile.tsx` — redesigned card component (uses tokens + store)
4. `BottomSheet.tsx` — generic sheet (used by JokerPlacementSheet)
5. `useHandOrder.ts` — hook (used by HandArea)
6. `HandArea.tsx` — drag + dimming (uses CardTile + useHandOrder)
7. `JokerPlacementSheet.tsx` — Joker picker (uses BottomSheet + CardTile)
8. `CardStylePicker.tsx` — style grid (uses CardTile + cardStyleStore types)
9. `SettingsScreen.tsx` — screen (uses CardStylePicker)
10. `app/settings.tsx` — route
11. `en.json` + `ar.json` — i18n keys (add alongside the component that needs them)
12. `app/_layout.tsx` — startup hook call
13. `GameBoardScreen.tsx` — wire JokerPlacementSheet + settings navigation
