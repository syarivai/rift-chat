module.exports = {
  preset: 'jest-expo',
  // react-native-worklets ships this resolver; it strips the `.native` extension so worklets
  // resolves to its JS implementation under Jest. Without it, Reanimated 4's setUpTests()
  // reaches native code and dies with "Cannot read properties of undefined (reading
  // 'loadUnpackers')".
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/core/**/*.{ts,tsx}',
    'src/features/*/model/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/types.ts',
    // Pure data modules: a coverage number over a constants file measures nothing.
    '!src/core/theme/tokens.ts',
    '!src/core/i18n/locales/**',
  ],
  coverageThreshold: {
    global: { statements: 60, branches: 60, functions: 60, lines: 60 },
  },
  // ponytail: threshold starts at 60, not the 80/70 the testing-strategy doc targets.
  // Ceiling: it is set to what Phase 1's code actually reaches, so the gate is real rather
  // than aspirational. Upgrade path: raise to 80/80/80/70 in T-8.1, once the outbox and
  // hooks are covered.
};
