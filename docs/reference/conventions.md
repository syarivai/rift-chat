---
title: 'Conventions'
description: The coding rules as a quick checklist.
category: reference
---

# Conventions

The rules, condensed. The _why_ is in [Architecture](../explanation/architecture.md) and
[Message model](../explanation/message-model.md). This is the page the checker agents cite.

## Layering

- `core/` imports nothing from `features/`.
- Feature slices never import each other; shared code moves to `core/`.
- `model/` holds pure logic and store slices — no React components, no JSX.
- Native capabilities are reached only through a `core/` port. Feature code never imports
  `react-native-mmkv`, `expo-localization`, or `@react-native-community/netinfo` directly.
- Add a domain layer only when a rule would survive swapping React Query, the UI, or the API.

## Modules & imports

- One folder, one barrel `index.ts`; import through it, not deep paths.
- Use the `@/…` alias, never `../../../`.
- `kebab-case.ts` filenames; one primary export per file where practical.

## Types & errors

- `strict` TypeScript; no `any`. Prefer `unknown` plus narrowing.
- Fallible operations return `Result<T, Failure>`; never throw for an expected failure.
- `Failure` is a sealed union (`network | validation | storage | unknown`) — handle every
  `kind`, so adding a case surfaces every unhandled `switch` at compile time.
- Entities and state are `readonly`; updates produce new objects.

## Server state (React Query)

- Query keys come from the factory in `@/core/query-keys`. No inline key literals.
- Infinite lists stop by arithmetic: `offset + limit >= total` → `undefined`.
- **A send never invalidates a thread.** This is not a style preference; it deletes user data.
- Mutations that touch client state go through the store, not `setQueryData`.

## Client state (Zustand)

- The outbox, blocked contacts, and preferences are the only client state.
- Persist through the `@/core/storage` port so tests can swap in memory.
- Select narrowly; wrap object- or array-returning selectors in `useShallow`.
- Client-generated `localId` identifies an outbox message. The server's `id` is always `101`
  and must never be used as a key or identity.

## Presentation

- Every colour, space, radius, and font size comes from `@/core/theme`. No raw hex, no magic
  numbers.
- Every user-facing string is a `t()` key present in **all three** catalogs.
- Interactive elements carry `accessibilityLabel` and `accessibilityRole`.
- List rows are memoised components declared outside the parent; no inline arrow props, no
  inline object styles in a row.
- `expo-image` gets a `recyclingKey` wherever it renders inside a list.
- Every screen handles four states: loading (skeleton), empty, error (with retry), and content.

## Time & determinism

- Inject `Clock` from `@/core/time`; never call `Date.now()` inside logic.
- Generate ids through the injected generator, never `Math.random()` inline.
- This is what makes outbox ordering assertable in tests.

## Tests

- Co-locate `*.test.ts(x)` beside the unit.
- Mock the API at the network boundary with MSW, not by stubbing hooks.
- Query by accessibility role or label; use `testID` only where no role fits.
- Deterministic: fixed clock, no real timers, no real network.
- RNTL v14's `render` is async — `await render(<C />)`.

## Native & config

- `android/` and `ios/` are generated — never hand-edit, never commit.
- Native and `expo-*` dependencies via `npx expo install`; JS-only dev dependencies via
  `npm i -D`.
- App configuration lives in `app.json`.

## Git

- Trunk-based: small commits straight to `main`.
- [Conventional Commits](https://www.conventionalcommits.org/) messages describing behaviour,
  not files.
- Tick the `delivery.md` task in the same commit as the work it describes.
- `npm run check` before every push. Never `--no-verify`.
