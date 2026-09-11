---
title: 'Tech stack & versions'
description: Every dependency, the role it plays, and the version pins that matter.
category: reference
---

# Tech stack & versions

Pinned as of scaffold on **2026-09-10** (Expo SDK 57). Exact versions live in
[`package.json`](../../package.json); this is the annotated map, and it records _why_ each
dependency is here.

**"Latest" is the wrong target for an Expo project.** Expo SDK 57 pins compatible versions of
every native package in its own `bundledNativeModules.json`, and npm's `latest` tag is ahead of
several of them — `react-native-gesture-handler` is a **whole major version** ahead (npm 3.2.x
vs the SDK's 2.32.x). Installing npm-latest for a native package against SDK 57 is how you get
a build that compiles and then crashes on a device. Always install native and `expo-*` packages
with `npx expo install`, which resolves the SDK-compatible version. The table below records the
**SDK 57** versions, verified against Expo's manifest on 2026-09-10.

## Runtime

| Package                           | Version   | Role                                                                                                    |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| `expo`                            | ~57.0     | SDK and framework                                                                                       |
| `react-native`                    | 0.86.3    | Native runtime (New Architecture) — SDK 57 pin, _not_ npm latest 0.87.x                                 |
| `react`                           | 19.2.3    | React — SDK 57 pin, _not_ npm latest 19.3.x                                                             |
| `expo-router`                     | ~57.0     | File-based navigation, typed routes                                                                     |
| `axios`                           | ^1.20     | HTTP client — interceptors, timeouts, typed request/response                                            |
| `@tanstack/react-query`           | ^5.102    | Server state: caching, infinite queries, mutations                                                      |
| `zustand`                         | ^5.0      | Client state: outbox, blocked contacts, preferences                                                     |
| `react-native-mmkv`               | ^4.3      | Synchronous persistent storage behind the store — not in Expo's manifest, so npm latest is correct here |
| `expo-image`                      | ~57.0     | Avatar rendering with disk + memory caching and `recyclingKey`                                          |
| `expo-constants`                  | ~57.0     | App version for the Settings screen — never hardcoded                                                   |
| `expo-localization`               | ~57.0     | Reads the device locale to pick the default language                                                    |
| `i18next` / `react-i18next`       | ^26 / ^17 | Translation engine and its React bindings                                                               |
| `react-native-reanimated`         | 4.5.1     | Screen and shared-element transitions — SDK 57 pin, _not_ npm latest 4.6.x                              |
| `react-native-worklets`           | 0.10.1    | Required peer of Reanimated 4 — a separate package since v4                                             |
| `@react-native-community/netinfo` | ^12       | Connectivity, wired to React Query's `onlineManager`                                                    |
| `react-native-safe-area-context`  | ~5.7.0    | Safe-area insets                                                                                        |
| `react-native-screens`            | ~4.26.0   | Native screen primitives under expo-router                                                              |
| `react-native-gesture-handler`    | ~2.32.0   | Gesture primitives — **npm latest is 3.2.x, a major ahead; do not install it**                          |

### Why these three for i18n

They do three unrelated jobs and none subsumes another: **`i18next`** is the engine (catalogs,
key lookup, interpolation, CLDR plurals, the `ms → en` fallback chain) and knows nothing about
React; **`react-i18next`** is the React binding (`useTranslation`, and the subscription that
re-renders the tree when the language changes); **`expo-localization`** is the only one that
touches native code, reading the device's locale to choose the initial language. See
[i18n](./i18n.md).

## Tooling

| Package                               | Version      | Role                      |
| ------------------------------------- | ------------ | ------------------------- |
| `typescript`                          | ~6.0         | Strict typing             |
| `jest` + `jest-expo`                  | 29 / ~57     | Test runner and RN preset |
| `@testing-library/react-native`       | ^14          | Component and hook tests  |
| `eslint` + `eslint-config-expo`       | ^9 / ^57     | Linting (flat config)     |
| `prettier` + `eslint-config-prettier` | ^3 / ^10     | Formatting                |
| `husky` + `lint-staged`               | ^9 / ^17     | Git hooks                 |
| Maestro                               | external CLI | End-to-end UI flow        |

## Version pins that matter

These are traps, not preferences. Each one costs an afternoon if you trip it.

- **`jest` stays on v29, not v30 — verified.** `jest-expo@57.0.5` depends on `babel-jest`,
  `@jest/globals`, `jest-snapshot` and `jest-environment-jsdom` all at `^29.2.1`. Mixing in
  jest 30 breaks the module mocker with `clearMocksOnScope is not a function`. Install
  `jest@^29` explicitly — and `@types/jest@^29` with it. `npm i -D @types/jest` resolves to
  **v30** by default, which is a silent mismatch against a jest-29 runtime.
- **`react-dom` needs an override pinning it to `19.2.3`.** It is an optional peer of `expo`
  and `@expo/router-server` for web. Left alone, npm resolves `react-dom@19.3.0`, whose own
  peer demands `react@^19.3.0` — but SDK 57 pins `react@19.2.3`, so `npm install` fails with
  `ERESOLVE`. The fix is the `overrides` block, **not** `--legacy-peer-deps`, which would hide
  a real version mismatch rather than resolve it.
- **Reanimated 4 needs `react-native-worklets`' Jest resolver.** Add
  `resolver: 'react-native-worklets/jest/resolver.js'` to `jest.config.js`. It strips the
  `.native` extension so worklets resolves to its JS implementation under Jest. Without it,
  `setUpTests()` reaches native code and every suite dies with
  `Cannot read properties of undefined (reading 'loadUnpackers')`.
- **`eslint` stays on the latest 9.x, not v10 — verified.** `eslint-config-expo` 57 itself
  permits `eslint >=8.10`, but the plugins it depends on do not: `eslint-plugin-react` (7.37.5,
  the newest) peers `^3 || … || ^9.7`, and `eslint-plugin-react-hooks@7` caps at `^9.0.0`.
  Neither declares ESLint 10 support.
- **`typescript` stays on 6.x — verified, not assumed.** `@typescript-eslint/parser@8`, which
  `eslint-config-expo` 57 depends on, declares `typescript: ">=4.8.4 <6.1.0"`. TypeScript 7.0
  (npm latest) is outside that range and would break linting outright.
- **`react-native-mmkv` v4 requires the New Architecture** and uses JSI, so it cannot run under
  the legacy remote (Chrome) debugger. Use the built-in React Native DevTools instead. It also
  cannot run in Expo Go — this project needs a development build.
- **MMKV v4's API is a factory**: `createMMKV()`, not `new MMKV()` as in v2/v3, and the delete
  method is `remove()`.
- **MMKV v4 needs a hand-written Jest mock.** It is a Nitro module, so importing it under Jest
  fails with `Failed to get NitroModules: The native NitroModules Turbo/Native-Module could not
be found`. The docs describe an automatic mock; it does not apply at this version. A
  Map-backed mock lives at `__mocks__/react-native-mmkv.js`, which Jest picks up automatically
  for node_modules packages with no `jest.mock()` call in test files.
- **`react-native-reanimated` v4 requires `react-native-worklets`** as a separate dependency,
  plus `react-native-reanimated/plugin` listed **last** in `babel.config.js`. Installing
  Reanimated alone gives cryptic worklet errors at runtime. For tests it needs
  `require('react-native-reanimated').setUpTests()` in a file referenced by
  **`setupFilesAfterEnv`**.
- **RNTL v14's `render` is async** — `await render(<C />)` in component tests. So is
  `renderHook`.
- **Hermes does NOT implement `Intl.RelativeTimeFormat`.** It is `undefined` on device. Node
  has full Intl, so unit tests pass while the app crashes — this was found only by running on
  a device. Relative times are formatted from the i18n catalogs instead; see
  `src/core/format/relative-time.ts`. `Intl.DateTimeFormat` and `Intl.NumberFormat` are
  available, but nothing in this app depends on them.
- **TanStack Query v5.90 mutation callbacks take four arguments.** The `onMutate` return value
  is the third (`onMutateResult`); the fourth is a `context` carrying `context.client`, so a
  callback needing the QueryClient does not need `useQueryClient()`.
- **`@types/node` tracks the runtime major** (24 for Node 24), not npm's `latest` tag.
- **Install native and `expo-*` packages with `npx expo install`**, not `npm install` — it
  resolves the version matching the installed SDK. JS-only dev dependencies use `npm i -D`.
- **`npx expo install --check`** reports any dependency that has drifted from the SDK's pinned
  version. Run it after any dependency change; it is the authoritative check, and it is wired
  into `npm run doctor`.

## Where these numbers come from

Two authorities, in this order:

1. **Expo's `bundledNativeModules.json` for SDK 57** — the compatible version of every native
   and `expo-*` package. This is what `npx expo install` reads.
2. **npm** — for JS-only tooling that Expo does not pin (`axios`, `prettier`, `husky`,
   `lint-staged`, and the deliberate `jest` / `eslint` / `typescript` pins above).

For anything Expo pins, npm's `latest` tag is **not** the target. `api-contract-verifier`
handles API drift; dependency drift is caught by `npx expo install --check`.

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
