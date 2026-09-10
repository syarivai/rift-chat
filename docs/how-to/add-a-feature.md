---
title: 'Add a feature'
description: The vertical-slice workflow — from a delivery checklist item through the layers to the UI.
category: how-to
---

# How to add a feature

Features are added as **vertical slices**: a folder under `src/features/<name>/` with its own
`api/`, `model/`, and `ui/`. Use the existing `chat` slice as the template.

Read [Conventions](../reference/conventions.md) first — this guide is the workflow, that page
is the rules.

## 1. Start from the checklist

Open [`plans/rift-chat-mvp/delivery.md`](../../plans/rift-chat-mvp/delivery.md) and take the
next unchecked task. Every task carries acceptance criteria in Given/When/Then form and a
priority tier. If what you are about to build is not on the checklist, add it there first —
the checklist is the plan of record, not a summary written afterwards.

## 2. Decide where the logic lives

Most features need no domain layer at all. Ask one question: **is there a rule here that would
still be true if we swapped React Query, the UI, or the API?**

- **No** (the common case) — the logic is fetching, mapping, or rendering. Put it in `api/`
  or `ui/` and move on.
- **Yes** — it belongs in `src/features/<name>/model/` as **pure functions**, unit-tested
   without React. The outbox is the current example: its merge order and status lifecycle are
   real rules, so they live in pure functions. Tests control time with `jest.setSystemTime()`.

Resisting the urge to add layers is part of the job here. See
[Architecture](../explanation/architecture.md) for why the ceiling is set where it is.

## 3. Types first

Declare the feature's types in `model/types.ts`. Entities are `readonly`. Model states as
discriminated unions so impossible combinations cannot be represented — the outbox message's
`status` is the example. Errors throw; React Query surfaces them.

## 4. Write the failing test

Test-first, at the lowest layer that can express the behaviour:

- **Pure logic** → a plain Jest test beside the unit (`*.test.ts`).
- **A query or mutation hook** → `renderHook` with a real `QueryClient` over MSW handlers
  (`*.test.tsx`). This is where most of the value is; see
  [Testing strategy](../explanation/testing-strategy.md).
- **A component's behaviour** → RNTL, queried by accessibility role or label, never by testID
  where a role exists.

Run it. Watch it fail for the right reason before you make it pass.

## 5. Server state → `api/`

Add the fetcher and the hook. Non-negotiables:

- Query keys come from the factory in `@/core/query-keys` — never an inline array literal.
- Lists use `useInfiniteQuery` with offset paging; `getNextPageParam` returns `undefined` once
  `offset + limit >= total`, which is what stops the scroll.
- **A mutation never invalidates a message thread.** If you are reaching for
  `invalidateQueries` on a thread key, stop and read
  [Message model](../explanation/message-model.md) — that call deletes user data.

## 6. Client state → `model/`

If the feature needs state that outlives a screen, add a slice to the Zustand store. Persistence
goes through the store's `persist` middleware; tests mock the MMKV module.

Select narrowly — `useStore((s) => s.thing)`, not the whole store — or every row in a
60-item list re-renders when any unrelated value changes.

## 7. UI → `ui/`

- Every colour, space, radius, and font size comes from `@/core/theme`. A raw hex value in a
  component is a bug: it will not respond to dark mode.
- Every user-facing string is a `t()` key added to **all three** catalogs (`en`, `ms`, `id`).
- Interactive elements get `accessibilityLabel` and `accessibilityRole` — the tests and the
  Maestro flow both rely on them.
- List rows are memoised components defined outside the parent, with no inline arrow props.
  See the `rn-performance` skill.

## 8. Route it

Add the screen under `src/app/`. The file path *is* the route; the tab group lives in
`src/app/(tabs)/`.

## 9. Green before you push

```bash
npm run check
```

Type-check, lint, format, and the full suite must pass. Then tick the task in `delivery.md`
**in the same commit as the work**, and write a Conventional Commit message describing the
behaviour, not the files.

## See also

- [Run and test](./run-and-test.md) — the commands, in detail.
- [Query keys & state](../reference/query-keys-and-state.md) — the ownership boundary.
- [Conventions](../reference/conventions.md) — the rules as a checklist.
