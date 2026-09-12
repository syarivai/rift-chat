module.exports = {
  preset: 'jest-expo',
  // react-native-worklets ships this resolver; it strips the `.native` extension so worklets
  // resolves to its JS implementation under Jest. Without it, Reanimated 4's setUpTests()
  // reaches native code and dies with "Cannot read properties of undefined (reading
  // 'loadUnpackers')".
  resolver: 'react-native-worklets/jest/resolver.js',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  // Call history is cleared before every test, so a stale assertion from a previous test
  // cannot pass by accident. Implementations survive (that is mockReset, not mockClear).
  clearMocks: true,
  // jest.spyOn handles are restored automatically, so a spy cannot leak into another file.
  restoreMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/'],
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
  // Set just under what the suite actually reaches, so the gate is real rather than
  // aspirational and a genuine regression trips it.
  coverageThreshold: {
    global: { statements: 80, branches: 78, functions: 78, lines: 80 },
  },
};
