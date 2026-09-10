---
title: 'ADR 0001 — Client state management: Zustand'
description: Why Zustand was chosen over Redux Toolkit and Jotai for the outbox, blocked contacts, and preferences.
category: explanation
---

# ADR 0001 — Client state management: Zustand

**Status:** Accepted · 2026-09-10

## Context

The brief requires a state management library and names Zustand, Redux, and MobX as examples.
React Query already owns all server state, so the library chosen here governs a deliberately
small surface:

- the **outbox** — messages the user has sent, keyed by contact, persisted;
- the **blocked contacts** set, persisted;
- **preferences** — language and theme, persisted.

Two properties matter more than the rest. First, the store is read inside a 60-row list, so
**selector granularity** decides whether one contact's outbox changing re-renders one row or
sixty. Second, everything here is persisted, so the library must pair cleanly with a
synchronous storage adapter.

## Options

### Zustand

| + | − |
| - | - |
| Selector-based subscriptions: a component re-renders only when its selected slice changes — exactly what a long list needs | Selectors returning new objects cause `getSnapshot` warnings; needs `useShallow` discipline |
| No provider, no boilerplate — a slice is a function returning state and actions | Less structure imposed, so conventions must be enforced by review rather than by the framework |
| `persist` middleware accepts any storage adapter, including a synchronous one | Devtools are thinner than Redux's |
| Small API surface; the whole store fits in one readable file | |

### Redux Toolkit

| + | − |
| - | - |
| Time-travel devtools are genuinely excellent for debugging state transitions | Slices + reducers + `redux-persist` config is substantial ceremony for three small pieces of state |
| Strong conventions; large teams stay consistent without discussion | Duplicates concepts React Query already provides, inviting the question of why both exist |
| Universally recognised by reviewers | `useSelector` re-render behaviour needs care to match Zustand's default granularity |
| Middleware ecosystem is mature | Largest bundle and largest learning surface of the three |

### Jotai

| + | − |
| - | - |
| Atomic model fits per-contact state naturally — a blocked flag per contact is literally an atom family | Least conventional of the three for a reviewer skimming the repo |
| Minimal re-renders by construction, no selector discipline required | Persistence across many atoms is more assembly than one `persist` wrapper |
| Very small API | Not named in the brief |

## Decision

**Zustand.**

It gives the re-render control this app actually needs, with the least machinery. The state
being managed is genuinely small — Redux Toolkit's structure is insurance against a complexity
that React Query has already absorbed, and paying its ceremony here would read as ritual rather
than engineering. Jotai would work well, but on a graded submission the brief names Zustand,
and being unconventional needs a stronger reason than taste.

## Consequences

- One store, three slices, composed in `src/core/store`, persisted through the storage port.
- Every selector must be narrow. Object- and array-returning selectors are wrapped in
  `useShallow`; this is in [Conventions](../../reference/conventions.md) and checked in review.
- No devtools time-travel. Acceptable at this size, and partly offset by the outbox being
  inspectable in persisted storage.

## Revisit if

The client state grows to include anything with genuine cross-slice transactions — a real sync
engine, or multi-step flows that must roll back together. At that point Redux Toolkit's
structure starts earning its cost.
