---
name: state-boundaries
description: The server/client state ownership boundary in rift-chat — what React Query owns, what Zustand owns, and the invalidation rule that protects user data. Load before writing or reviewing any query, mutation, or store slice.
---

# State boundaries

Read this before touching any query, mutation, or store slice. It encodes the rule that the
whole app depends on, and the one mistake that silently destroys user data.

## The rule

> **React Query owns what the server knows. Zustand owns what only this device knows.**

| State | Owner | Persisted |
| ----- | ----- | --------- |
| Contacts list, contact profile | React Query | no |
| Thread (the contact's posts) | React Query | no |
| Outbox (messages the user sent) | Zustand | **yes** |
| Blocked contacts | Zustand | **yes** |
| Language, theme | Zustand | **yes** |

Never mirror server data into the store. Never keep client state in the query cache. The query
cache may be discarded at any moment — user-authored data may not.

## The rule that protects user data

**A send never invalidates a message thread.**

`POST /api/posts` returns `201` but does not persist, and always returns `id: 101`. Calling
`queryClient.invalidateQueries({ queryKey: queryKeys.messages.thread(id) })` after a successful
send refetches the original posts and **deletes every message the user has ever sent to that
contact**.

The send mutation touches no query at all. It appends to the outbox; the merged selector picks
the message up on the next render.

### Red flags — stop and reconsider

| You are about to write | Why it is wrong |
| ---------------------- | --------------- |
| `invalidateQueries` on a `messages.thread` key | Deletes user data. There is no exception. |
| `setQueryData` to insert a sent message | Puts non-server data in the query cache; it will not survive a restart |
| `onSettled: () => invalidate...` on the send mutation | The textbook pattern, wrong here |
| Using the response `id` as a key or identity | It is always `101` |
| Persisting the query cache to disk | Persists a cache as if it were data; the outbox is the right home |
| Rolling back the optimistic message on error | Deletes something the user wrote. Mark it `failed` with retry instead. |

## Query keys

Always from the factory in `@/core/query-keys` — never an inline array literal, which drifts
and silently creates a second cache entry on a typo.

## Pagination

Offset-based, with `total` in the envelope, so the stop condition is arithmetic:

```ts
getNextPageParam: (lastPage) => {
  const next = lastPage.offset + lastPage.limit;
  return next >= lastPage.total ? undefined : next;
}
```

Returning `undefined` is what sets `hasNextPage` to false. Getting it wrong gives either an
infinite loop of empty fetches or a list that stops after page one.

## Selector discipline

Select the narrowest slice a component needs. In a 60-row list, a badly-scoped selector makes
every row re-render when any unrelated value changes. Object- or array-returning selectors are
wrapped in `useShallow` from `zustand/react/shallow`.

## Full detail

- [Explanation: Message model](../../../docs/explanation/message-model.md) — why all of this.
- [Reference: Query keys & state](../../../docs/reference/query-keys-and-state.md) — the tables.
- [ADR 0004](../../../docs/explanation/adr/0004-message-model-and-outbox.md) — the alternatives.
