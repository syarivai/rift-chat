---
title: 'Architecture'
description: Feature slices, the dependency direction, and why the layering stops where it does.
category: explanation
---

# Architecture

## The shape

Four vertical slices over a shared core:

```text
app  →  features  →  core
```

- **`src/app/`** — expo-router routes. Thin: a route file wires providers and renders a screen
  from a slice. No data fetching, no business logic.
- **`src/features/<slice>/`** — `api/` (query and mutation hooks), `model/` (store slices,
  types, pure logic), `ui/` (components). Slices never import each other.
- **`src/core/`** — cross-cutting infrastructure: the fetch client, the store and its MMKV
  persistence, the query-key factory, theme, i18n, formatting, network monitoring, shared UI
  primitives.

The dependency direction is one-way. `core/` knows nothing about features; features know
nothing about each other. When two slices need the same thing, it moves down into `core/` —
never sideways.

## Why not full Clean Architecture

The obvious alternative is the four-layer treatment: `domain/` with entities and use-case
classes, `data/` with datasources and mappers, ports and adapters at every boundary, and a DI
container as the composition root. That structure is the right answer when there is logic worth
protecting from framework churn.

Here, there mostly is not. Strip this app to its essentials and it is **three queries and one
mutation** over a read-only API. A `FetchContactsUseCase` wrapping a single `fetch` adds a file,
an interface, a test double, and a line in a container — and protects nothing, because there is
no rule inside it to protect. Layering is a cost paid up front against a future benefit; where
no benefit is coming, the cost is just cost.

So the ceiling is set deliberately low, with **one exception**.

## The exception: the outbox has real rules

Message handling is genuinely non-trivial, and none of it is about React or React Query:

- **Merge order** — server posts and locally-stored outbox messages interleave by `createdAt`,
  and the result must be stable across renders.
- **Status lifecycle** — `sending → sent` or `sending → failed`, with retry returning a failed
  message to `sending`, and no transition permitted to run backwards.
- **Identity** — outbox messages are keyed by a client-generated `localId`, because the server
  returns `id: 101` for every write.

These are rules that would still be true if React Query were replaced tomorrow. So they live in
`src/features/chat/model/` as **pure functions**, tested without React, without a network, and
without a renderer. That is a domain layer in everything but name, applied to the one place
that earns it.

This is the position worth defending: **architecture proportional to complexity**. Uniform
layering across four slices would have looked more rigorous and taught a reader less about
where the difficulty actually is.

## State ownership

The single most consequential rule in the codebase:

> React Query owns what the server knows. Zustand owns what only this device knows.

Because `POST /api/posts` is not persisted server-side, everything the user writes is in the
second category. That is not a workaround for a toy API — it is the same reason real messaging
clients keep a local database: **the network is not the source of truth for a message you have
already written.**

See [Message model](./message-model.md) for the mechanism and
[Query keys & state](../reference/query-keys-and-state.md) for the rules.

## Presentation

Zustand slices are consumed through narrow selectors. Components read tokens through
`useTheme()` and strings through `useTranslation()`, so a component is correct in both themes
and all three languages without conditionals.

No manual `useMemo`/`useCallback` scattered on principle — but list rows _are_ memoised
deliberately; see [ADR 0003](./adr/0003-list-rendering-flatlist.md).

## The through-line

Every decision above is the same decision: **build the smallest thing that is actually correct,
and let the tools you already have do their job.** React Query already models request failure.
Jest already controls time and mocks modules. Zustand already persists. The one place that got
a genuine domain layer is the one place none of them cover — the outbox's merge and lifecycle
rules.

## See also

- [Message model](./message-model.md) — the outbox in detail.
- [Testing strategy](./testing-strategy.md) — how the shape makes testing cheap.
- [Decision records](./adr/README.md) — the alternatives, with plus/minus tables.
