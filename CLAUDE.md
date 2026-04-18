# Joker Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-15

## Active Technologies
- TypeScript 5.x (strict mode) — React Native + Expo SDK ~54 + Expo Router (navigation), Zustand (state), i18next + react-i18next (i18n), expo-localization (locale detection), @react-native-async-storage/async-storage (persistence), React Native Reanimated 3+ (animations) (002-game-setup-screen)
- AsyncStorage — `@joker51/language` (locale), `@joker51/savedSession` (in-progress game) (002-game-setup-screen)
- TypeScript 5.x strict mode (already in project) + React Native + Expo SDK ~54, Expo Router, Zustand, i18next + react-i18next, React Native Reanimated 3+, @react-native-async-storage/async-storage (003-game-board-screen)
- AsyncStorage — key `@joker51/savedSession` (established in Phase 2) (003-game-board-screen)
- TypeScript 5.x strict mode + React Native + Expo SDK ~54; Zustand (state); @react-native-async-storage/async-storage (persistence) (005-sort-meld-fix-layoff)
- TypeScript 5.x strict mode + React Native + Expo SDK ~54, Expo Router, Zustand, i18next + react-i18nex (006-round-end-scoring)
- AsyncStorage — `@joker51/savedSession` (no new keys) (006-round-end-scoring)
- TypeScript 5.x strict mode + i18next, react-i18next, React Native `I18nManager`, Zustand, AsyncStorage (006-round-end-scoring)
- AsyncStorage — key `@joker51/language` (already established) (006-round-end-scoring)
- TypeScript 5.9 stric + React Native + Expo SDK ~54, Expo Router ~6.0, Zustand ^5.0, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, AsyncStorage 2.2.0 (008-phase-7-game)
- AsyncStorage — new key `@joker51/cardStyle`; existing `@joker51/language` and `@joker51/savedSession` unchanged (008-phase-7-game)
- TypeScript 5.9 (strict mode) + React Native + Expo SDK ~54, Expo Router, Zustand, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, i18next + react-i18nex (009-hand-sort-enhancements)
- N/A — sort mode is session-scoped only; no new AsyncStorage keys (009-hand-sort-enhancements)

- TypeScript 5.9 (strict mode, already in project) + None (engine is pure TS). Dev: Jest + ts-jest (to be added) (main)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.9 (strict mode, already in project): Follow standard conventions

## Recent Changes
- 009-hand-sort-enhancements: Added TypeScript 5.9 (strict mode) + React Native + Expo SDK ~54, Expo Router, Zustand, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, i18next + react-i18nex
- 008-phase-7-game: Added TypeScript 5.9 stric + React Native + Expo SDK ~54, Expo Router ~6.0, Zustand ^5.0, React Native Reanimated ~4.1.1, React Native Gesture Handler ~2.28.0, AsyncStorage 2.2.0
- 006-round-end-scoring: Added TypeScript 5.x strict mode + i18next, react-i18next, React Native `I18nManager`, Zustand, AsyncStorage


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
