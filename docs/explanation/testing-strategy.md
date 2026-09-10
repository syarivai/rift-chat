---
title: 'Testing strategy'
description: The test pyramid, what each layer is worth, and what is deliberately not tested.
category: explanation
---

# Testing strategy

Tests follow the shape of the architecture: the more framework-free a piece of code is, the more
thoroughly and cheaply it is tested.

## The pyramid

| Level | Tooling | What it covers | Where |
| ----- | ------- | -------------- | ----- |
| **Static** | `tsc --noEmit`, ESLint | Exhaustive `Failure` handling, no `any`, hook rules, import hygiene | every file |
| **Unit** | Jest | Pure logic: outbox merge and ordering, the status lifecycle, relative-time formatting, the query-key factory | `*.test.ts` beside the unit |
| **Integration** | RNTL `renderHook` + real `QueryClient` + MSW | Offset paging and its stop condition, the optimistic send lifecycle, failure and retry, store persistence | `*.test.tsx` |
| **Component** | RNTL, queried by a11y role | Composer clears on send, blocked bar replaces the composer, empty state renders | `*.test.tsx` |
| **End-to-end** | Maestro | One real flow on a device: open, scroll, open a chat, send, see it persist, block | `.maestro/` |

Static analysis is listed as a test layer on purpose. It catches more real defects per unit of
effort than any of the rows below it, and it costs nothing per feature.

## Where the value actually is

The integration row. It is where this app can genuinely be wrong:

- `getNextPageParam` returning the wrong thing — an infinite loop of empty fetches, or a list
  that stops at page one.
- A send that invalidates the thread — which silently deletes user data and would pass any
  test that only checks "the bubble appeared".
- A failed send that rolls back instead of surfacing a retry.
- A merge that reorders messages between renders.

MSW mocks at the network boundary rather than stubbing hooks, so these tests exercise the real
React Query machinery — the actual cache, the actual retry behaviour, the actual mutation
lifecycle. Stubbing `useQuery` would test the mock.

## Determinism

Logic that reads the clock or generates ids takes them by injection (`Clock`, id generator),
so tests supply a fixed clock and assert exact ordering. The storage port is swapped for an
in-memory map; the connectivity monitor is a controllable fake with `setOnline()`. No real
timers, no real network, no flake.

## What is deliberately not tested

- **Broad screen snapshots.** High maintenance, low defect yield: they fail on every
  intentional design change and catch almost nothing unintentional.
- **Thin platform adapters.** The MMKV storage adapter and the NetInfo monitor are a few lines
  each with no branching; they are covered by the Maestro flow, not by mocking a native module
  to assert it was called.
- **The API itself.** `api-contract-verifier` re-probes the live endpoints and reports drift.
  That is monitoring, not a unit test, and it belongs outside the suite.

## One E2E flow, not six

The Maestro flow covers open → scroll → open a chat → send → restart → the message is still
there → block. It is capped at one deliberately: the second flow costs about as much as the
first and proves considerably less, and E2E is where a four-day budget disappears fastest.

## Coverage

`npm run test:ci` collects coverage over `src/features/*/model` and `src/core` — the
framework-independent logic — and enforces a threshold there. Route files, thin adapters, and
pure type modules are excluded, because a coverage number over code with no branches measures
nothing.

## See also

- [Guardrails](./guardrails.md) — where each layer runs.
- [Run and test](../how-to/run-and-test.md) — the commands.
