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
      roots: ['<rootDir>/src/components', '<rootDir>/src/screens'],
      testMatch: ['**/__tests__/**/*.test.tsx', '**/__tests__/**/*.test.ts'],
      moduleFileExtensions: ['tsx', 'ts', 'jsx', 'js'],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
      ],
    },
  ],
};

export default config;
