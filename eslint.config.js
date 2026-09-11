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
    // Must be scoped to TypeScript files: eslint-config-expo registers the
    // `@typescript-eslint` plugin only for this glob, so a rule declared outside it fails
    // with "could not find plugin @typescript-eslint".
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // `tsc --noEmit` already resolves and checks every import, including the `@/` alias.
      // eslint-plugin-import would resolve them a second time through unrs-resolver, a native
      // binding that breaks whenever the editor's Node architecture differs from the one that
      // ran `npm install` (x64 Node under Rosetta on an arm64 Mac installs only the x64
      // binding). Two resolvers, one authority: keep tsc, drop the duplicate.
      'import/no-unresolved': 'off',
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
