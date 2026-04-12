import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/engine'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js'],
  collectCoverageFrom: ['src/engine/**/*.ts', '!src/engine/__tests__/**'],
  coverageThreshold: {
    global: {
      lines: 90,
    },
  },
};

export default config;
