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
      // The repo rules are enforced by review and by rn-code-checker, not by ESLint.
      // ponytail: no `@typescript-eslint/no-explicit-any` rule here. The plugin is only a
      // transitive dep of eslint-config-expo, so using it would mean declaring a direct
      // devDependency for one rule. Ceiling: explicit `any` is not caught by CI.
      // It is still caught by `strict` tsc for implicit any, and by rn-code-checker for
      // explicit any. Upgrade path: add @typescript-eslint/eslint-plugin as a direct
      // devDependency and register it in its own config object.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // i18next is designed around a default-instance singleton, so `i18n.use(...)` and
      // `i18n.changeLanguage(...)` are the documented API, not a mistaken named import.
      'import/no-named-as-default-member': 'off',
    },
  },
];
