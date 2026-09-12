const expo = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  ...expo,
  prettier,
  {
    ignores: ['node_modules/**', 'android/**', 'ios/**', '.expo/**', 'coverage/**', 'dist/**'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // i18next is designed around a default-instance singleton, so `i18n.use(...)` and
      // `i18n.changeLanguage(...)` are the documented API, not a mistaken named import.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Test infrastructure written in plain JS. eslint-config-expo turns `no-undef` off for
    // TypeScript (tsc covers it there) but not for .js, so these need the globals declared.
    files: ['jest-setup.js', '__mocks__/**/*.js'],
    languageOptions: {
      globals: { jest: 'readonly', require: 'readonly', module: 'writable' },
    },
  },
  {
    // Must be scoped to TypeScript files: eslint-config-expo registers the
    // `@typescript-eslint` plugin only for this glob, so a rule declared outside it fails
    // with "could not find plugin @typescript-eslint".
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // The conventions forbid `any`; this makes CI enforce it rather than review.
      '@typescript-eslint/no-explicit-any': 'error',
      // Type-only imports are erased at compile time — keeps types out of the runtime graph.
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Expo sets this to 'warn'; unused code should fail the gate, not decorate it.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { vars: 'all', args: 'after-used', ignoreRestSiblings: true, caughtErrors: 'all' },
      ],
    },
  },
];
