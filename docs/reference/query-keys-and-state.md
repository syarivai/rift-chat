---
title: 'Query keys & state'
description: The query-key factory, the store slices, and the boundary between server and client state.
category: reference
---

# Query keys & state

## The ownership boundary

One rule decides where every piece of state lives:

> **React Query owns what the server knows. Zustand owns what only this device knows.**

| State                           | Owner       | Persisted      | Why                                          |
| ------------------------------- | ----------- | -------------- | -------------------------------------------- |
| Contacts list                   | React Query | no             | Server data; refetchable                     |
| Contact profile                 | React Query | no             | Server data; seeded from the list cache      |
| Thread (contact's posts)        | React Query | no             | Server data; **never invalidated by a send** |
| Outbox (messages the user sent) | Zustand     | **yes** (MMKV) | The server does not persist writes           |
| Blocked contacts                | Zustand     | **yes** (MMKV) | Client-only preference                       |
| Language, theme                 | Zustand     | **yes** (MMKV) | Client-only preference                       |

Never mirror server data into the store, and never keep client state in the query cache. The
query cache is a cache — it is allowed to be thrown away at any moment. User-authored data is
not, which is exactly why the outbox exists.

## The query-key factory

All keys come from `@/core/query-keys`. Inline array literals are forbidden: they drift, and a
typo silently creates a second cache entry instead of failing.

```ts
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: () => [...queryKeys.contacts.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.contacts.all, 'detail', id] as const,
  },
  messages: {
    all: ['messages'] as const,
    byContact: (contactId: number) => [...queryKeys.messages.all, 'byContact', contactId] as const,
  },
} as const;
```

The hierarchy means `queryKeys.contacts.all` invalidates every contact query, while
`queryKeys.contacts.detail(3)` targets one. That is the reason for the nesting.

## Pagination

Both collections are offset-paginated and return `total`, so the stop condition is arithmetic
rather than a guess:

```ts
useInfiniteQuery({
  queryKey: queryKeys.contacts.list(),
  queryFn: ({ pageParam }) => fetchContacts({ offset: pageParam, limit: PAGE_SIZE }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => {
    const next = lastPage.offset + lastPage.limit;
    return next >= lastPage.total ? undefined : next;
  },
});
```

Returning `undefined` is what sets `hasNextPage` to false and stops the scroll. Getting this
wrong produces either an infinite loop of empty fetches or a list that stops early.

## Invalidation rules

| Action                   | Invalidate                          | Never invalidate                                  |
| ------------------------ | ----------------------------------- | ------------------------------------------------- |
| Pull-to-refresh on Chats | `contacts.list()`                   | —                                                 |
| Opening a profile        | — (background refetch is automatic) | —                                                 |
| **Sending a message**    | **nothing**                         | `messages.byContact(id)` — this deletes user data |
| Blocking a contact       | nothing — it is client state        | any server query                                  |

The send mutation touches no query at all. It appends to the outbox, and the thread selector
merges the outbox with whatever the thread query holds. See
[Message model](../explanation/message-model.md).

## Store shape

One flat store, persisted with MMKV through Zustand's `persist` middleware. Feature code imports
the store, never `react-native-mmkv`; tests mock the module. Flat rather than nested slices
because nesting buys nothing at this size and costs a selector hop on every read.

```ts
export type AppState = {
  /** Messages the user sent, keyed by contact. The server does not keep these. */
  outbox: Record<number, OutboxMessage[]>;
  blockedIds: number[];
  language: Language;
  theme: ThemeChoice;

  enqueue: (contactId: number, body: string) => string; // returns a local id
  markSent: (localId: string, deliveredAt: string) => void;
  markFailed: (localId: string, error: string) => void;
  retry: (localId: string) => void;

  toggleBlocked: (contactId: number) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemeChoice) => void;
};
```

`OutboxMessage` carries a client-generated `localId` — never the server's `id`, which is always
`101` and therefore neither unique nor stable.

## Selector discipline

Select the narrowest slice a component needs:

```ts
const blocked = useAppStore((s) => s.blockedIds.includes(contactId)); // good
const store = useAppStore(); // re-renders on everything
```

A selector returning a new object or array every render causes
`The result of getSnapshot should be cached` warnings and, eventually, an update loop. Wrap
those in `useShallow` from `zustand/react/shallow`.

This matters most in the contacts list: a badly-scoped selector makes all sixty rows re-render
whenever any unrelated value changes. See
[ADR 0003](../explanation/adr/0003-list-rendering-flatlist.md).
