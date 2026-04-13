import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'engine',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/engine'],
      testMatch: ['**/__tests__/**/*.test.ts'],
      moduleFileExtensions: ['ts', 'js'],
      collectCoverageFrom: ['src/engine/**/*.ts', '!src/engine/__tests__/**'],
      coverageThreshold: {
        global: { lines: 90 },
      },
    },
    {
      displayName: 'components',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/src/components/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/components/**/__tests__/**/*.test.ts',
        '<rootDir>/src/screens/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/screens/**/__tests__/**/*.test.ts',
        '<rootDir>/src/hooks/**/__tests__/**/*.test.ts',
        '<rootDir>/src/hooks/**/__tests__/**/*.test.tsx',
        '<rootDir>/src/store/**/__tests__/**/*.test.ts',
        '<rootDir>/src/i18n/**/__tests__/**/*.test.ts',
      ],
      moduleFileExtensions: ['tsx', 'ts', 'jsx', 'js'],
      moduleNameMapper: {
        // Expo SDK 54 + Jest 30: prevent lazy require of ImportMetaRegistry
        // from firing when isInsideTestCode === false
        '^expo/src/winter$': '<rootDir>/__mocks__/expo-winter.js',
        '^expo/src/winter/ImportMetaRegistry$': '<rootDir>/__mocks__/expo-winter-import-meta.js',
      },
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
    },
  ],
};

export default config;
