---
title: 'Tech stack & versions'
description: Every dependency, the role it plays, and the version pins that matter.
category: reference
---

# Tech stack & versions

Pinned as of scaffold on **2026-09-10** (Expo SDK 57). Exact versions live in
[`package.json`](../../package.json); this is the annotated map, and it records *why* each
dependency is here.

## Runtime

| Package | Version | Role |
| ------- | ------- | ---- |
| `expo` | ~57.0 | SDK and framework |
| `react-native` | 0.87.x | Native runtime (New Architecture) |
| `react` | 19.3.x | React |
| `expo-router` | ~57.0 | File-based navigation, typed routes |
| `@tanstack/react-query` | ^5.102 | Server state: caching, infinite queries, mutations |
| `zustand` | ^5.0 | Client state: outbox, blocked contacts, preferences |
| `react-native-mmkv` | ^4.3 | Synchronous persistent storage behind the store |
| `expo-image` | ~57.0 | Avatar rendering with disk + memory caching and `recyclingKey` |
| `expo-constants` | ~57.0 | App version for the Settings screen — never hardcoded |
| `expo-localization` | ~57.0 | Reads the device locale to pick the default language |
| `i18next` / `react-i18next` | ^26 / ^17 | Translation engine and its React bindings |
| `react-native-reanimated` | ^4.6 | Screen and shared-element transitions |
| `react-native-worklets` | ^0.10 | Required peer of Reanimated 4 — a separate package since v4 |
| `@react-native-community/netinfo` | ^12 | Connectivity, wired to React Query's `onlineManager` |
| `react-native-safe-area-context` | ~5.7 | Safe-area insets |
| `react-native-screens` | ~4.25 | Native screen primitives under expo-router |
| `react-native-gesture-handler` | ~2.32 | Gesture primitives for Reanimated transitions |

### Why these three for i18n

They do three unrelated jobs and none subsumes another: **`i18next`** is the engine (catalogs,
key lookup, interpolation, CLDR plurals, the `ms → en` fallback chain) and knows nothing about
React; **`react-i18next`** is the React binding (`useTranslation`, and the subscription that
re-renders the tree when the language changes); **`expo-localization`** is the only one that
touches native code, reading the device's locale to choose the initial language. See
[i18n](./i18n.md).

## Tooling

| Package | Version | Role |
| ------- | ------- | ---- |
| `typescript` | ~6.0 | Strict typing |
| `jest` + `jest-expo` | 29 / ~57 | Test runner and RN preset |
| `@testing-library/react-native` | ^14 | Component and hook tests |
| `msw` | ^2.15 | Mocks the API at the network boundary |
| `eslint` + `eslint-config-expo` | ^9 / ^57 | Linting (flat config) |
| `prettier` + `eslint-config-prettier` | ^3 / ^10 | Formatting |
| `husky` + `lint-staged` | ^9 / ^17 | Git hooks |
| Maestro | external CLI | End-to-end UI flow |

## Version pins that matter

These are traps, not preferences. Each one costs an afternoon if you trip it.

- **`jest` stays on v29, not v30.** `jest-expo` 57 is built on the jest 29 toolchain; mixing in
  jest 30 packages breaks the module mocker with `clearMocksOnScope is not a function`. The
  whole jest family is pinned through the `overrides` block in `package.json`.
- **`eslint` stays on the latest 9.x, not v10.** `eslint-config-expo` 57 pulls in
  `eslint-plugin-react`, which still calls `context.getFilename()` — an API ESLint 10 removed —
  so ESLint 10 crashes on load.
- **`typescript` stays on 6.x.** TypeScript 7 (the native port) is released, but the RN and
  ESLint toolchains have not caught up. Revisit after submission, not during.
- **`react-native-mmkv` v4 requires the New Architecture** and uses JSI, so it cannot run under
  the legacy remote (Chrome) debugger. Use the built-in React Native DevTools instead. It also
  cannot run in Expo Go — this project needs a development build.
- **`react-native-reanimated` v4 requires `react-native-worklets`** as a separate dependency
  and a Babel plugin entry. Installing Reanimated alone gives cryptic worklet errors at runtime.
- **RNTL v14's `render` is async** — `await render(<C />)` in component tests.
- **`@types/node` tracks the runtime major** (24 for Node 24), not npm's `latest` tag.
- **Install native and `expo-*` packages with `npx expo install`**, not `npm install` — it
  resolves the version matching the installed SDK. JS-only dev dependencies use `npm i -D`.

## Platform

- **Node 24 LTS**, **Java 17**, Android SDK via `ANDROID_HOME`. CI uses Node 24.
- **npm** is the package manager. Not pnpm: Metro and Expo autolinking do not reliably follow
  pnpm's symlinked layout, and dependency resolution is the last place this project needs
  novelty.
- `android/` and `ios/` are **generated** by `npx expo prebuild` and are gitignored. Native
  configuration belongs in `app.json`.

## See also

- [Commands](./commands.md) — how to drive all of this.
- [Decision records](../explanation/adr/README.md) — why Zustand, MMKV, and FlatList.
