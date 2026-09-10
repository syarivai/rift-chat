---
title: 'ADR 0002 — Persistence: react-native-mmkv'
description: Why MMKV was chosen over AsyncStorage and expo-sqlite for the outbox and preferences.
category: explanation
---

# ADR 0002 — Persistence: react-native-mmkv

**Status:** Accepted · 2026-09-10

## Context

Everything in the Zustand store is persisted: the outbox (messages the user sent, which the
server does not keep), the blocked-contact set, and the language and theme preferences.

The demanding requirement is **cold start**. The chat screen and the theme both read persisted
state during the very first render. If hydration is asynchronous, the app paints an empty
thread and the wrong theme for a frame, then corrects itself — a visible flash that reads as a
bug, and one that needs a rehydration gate to hide.

Volume is small: tens of messages, a handful of ids, two preference values.

## Options

### react-native-mmkv

| + | − |
| - | - |
| **Synchronous** reads via JSI — the store is hydrated on first render, so no flash and no rehydration gate | Native module: requires a development build, cannot run in Expo Go |
| Roughly an order of magnitude faster than AsyncStorage on both reads and writes | v3+ needs the New Architecture and cannot run under the legacy Chrome remote debugger (use React Native DevTools) |
| Simple key-value API that maps directly onto Zustand's `persist` | Tests need `jest.mock('react-native-mmkv')` — one small mock in the setup file |
| Optional encryption available if the data ever warrants it | One more native dependency to justify |

### AsyncStorage

| + | − |
| - | - |
| The default everyone recognises; zero configuration | **Asynchronous** — the flash problem above, or a rehydration gate to paper over it |
| Works in Expo Go | Noticeably slower; every read crosses the bridge |
| No New Architecture requirement | Serialises the whole persisted blob per write by default |

### expo-sqlite

| + | − |
| - | - |
| Real queries — the outbox could be paged and filtered in SQL | Schema and migrations to own, for data that is a handful of keys |
| Scales to thousands of messages without loading everything into memory | Async API, so the same first-render problem as AsyncStorage |
| Already an Expo package | Substantially more code for no benefit at this size |

## Decision

**react-native-mmkv.**

Synchronous hydration is the deciding property, not raw speed. It removes an entire class of
first-render bug rather than mitigating it, and the cost — a native module — is already paid:
the project uses `expo prebuild` and a development build for Reanimated regardless, so MMKV
adds no new constraint.

## Consequences

- Feature code never imports `react-native-mmkv`. It goes through the `Storage` port in
  `@/core/storage`, so tests substitute an in-memory map.
- Expo Go is not a supported way to run this app. Documented in
  [Run and test](../../how-to/run-and-test.md) and
  [Tech stack](../../reference/tech-stack.md).
- Debugging uses React Native DevTools, not the legacy remote debugger.

## Revisit if

Threads grow large enough that loading the whole outbox into memory is wasteful — thousands of
messages per contact rather than tens. At that point expo-sqlite with paged reads becomes the
right shape.
