---
title: 'Testing strategy'
description: The test pyramid, what each layer is worth, and what is deliberately not tested.
category: explanation
---

# Testing strategy

Tests follow the shape of the architecture: the more framework-free a piece of code is, the more
thoroughly and cheaply it is tested.

## The pyramid

| Level           | Tooling                                                     | What it covers                                                                                               | Where                       |
| --------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------- |
| **Static**      | `tsc --noEmit`, ESLint                                      | Exhaustive union handling, no `any`, hook rules, import hygiene                                              | every file                  |
| **Unit**        | Jest                                                        | Pure logic: outbox merge and ordering, the status lifecycle, relative-time formatting, the query-key factory | `*.test.ts` beside the unit |
| **Integration** | RNTL `renderHook` + real `QueryClient` + a mocked API class | Offset paging and its stop condition, the optimistic send lifecycle, failure and retry, store persistence    | `*.test.tsx`                |
| **Component**   | RNTL, queried by a11y role                                  | Composer clears on send, blocked bar replaces the composer, empty state renders                              | `*.test.tsx`                |
| **End-to-end**  | Maestro                                                     | One real flow on a device: open, scroll, open a chat, send, see it persist, block                            | `.maestro/`                 |

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

These tests mock the **API class**, not the hooks. `@/core/api` is a single object with one
method per endpoint, so replacing it with `jest.mock` leaves everything above it running for
real — the actual cache, the actual retry behaviour, the actual mutation lifecycle. Stubbing
`useQuery` would test the mock.

The axios interceptors and URL building sit _below_ that seam and are not exercised here. For
four endpoints that is an accepted trade, and it is why the Maestro flow runs against the real
API.

## Determinism

Determinism comes from Jest, not from injected abstractions: `jest.setSystemTime()` pins the
clock so ordering is assertable, `newId()` is mocked in one place, and `jest.mock` replaces
MMKV and NetInfo. Building a `Clock` port and a storage port to achieve this would have
re-implemented the test framework — see [Architecture](./architecture.md). No real timers, no
real network, no flake.

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
