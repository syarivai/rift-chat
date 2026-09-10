---
name: react-query-patterns
description: TanStack Query v5 patterns for rift-chat — the query-key factory, offset-based infinite queries, the optimistic send lifecycle, and the mistakes that cost user data. Load before writing any query or mutation hook.
---

# React Query patterns

TanStack Query v5. Read [state-boundaries](../state-boundaries/SKILL.md) first — it defines
what belongs in a query at all.

## Client configuration

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // the API sets cache-control: max-age=300
      gcTime: 5 * 60_000,
      retry: 2, // exponential backoff is the default
      refetchOnWindowFocus: false, // meaningless on mobile; noisy
    },
  },
});
```

Connectivity is wired to `onlineManager` via NetInfo, so queries **pause** when the device is
offline instead of failing and burning retries.

## Where endpoints live

Every endpoint is declared **once**, on the `RiftApi` class in `@/core/api/rift-api`, using
`withQuery`. That returns the fetcher augmented with `.query()`, `.infiniteQuery()` and
`.mutation()`, so a feature hook is a thin wrapper supplying options:

```ts
export const useContactsInfinite = () =>
  api.getContacts.infiniteQuery(
    { limit: PAGE_SIZE },
    {
      queryKey: queryKeys.contacts.list(),
      initialPageParam: 0,
      getNextPageParam: (last) =>
        last.offset + last.limit >= last.total ? undefined : last.offset + last.limit,
    },
  );
```

Never call `axios` from a feature file, and never build a URL outside `RiftApi`.

**`useQuery` has no `onSuccess` / `onError` / `onSettled` in v5** — they were removed. Derive
from `data` and `error`; if a side effect is genuinely required, use `useEffect`. Mutations
still have their callbacks.

## Query keys

From the factory in `@/core/query-keys`, never inline:

```ts
queryKeys.contacts.list(); // ['contacts','list']
queryKeys.contacts.detail(id); // ['contacts','detail',id]
queryKeys.messages.thread(id); // ['messages','thread',id]
```

The hierarchy is deliberate: `queryKeys.contacts.all` invalidates every contact query while
`detail(3)` targets one.

## Infinite queries

Both collections are offset-paginated with `total` in the envelope:

```ts
useInfiniteQuery({
  queryKey: queryKeys.contacts.list(),
  queryFn: ({ pageParam }) => fetchContacts({ offset: pageParam, limit: PAGE_SIZE }),
  initialPageParam: 0,
  getNextPageParam: (last) =>
    last.offset + last.limit >= last.total ? undefined : last.offset + last.limit,
});
```

- Flatten with `data.pages.flatMap((p) => p.results)` inside a memo, not inline in JSX.
- Drive `onEndReached` with `hasNextPage && !isFetchingNextPage`, or the list fires repeatedly
  while a fetch is already in flight.
- `onEndReachedThreshold={0.5}` — far enough ahead that the next page lands before the user
  reaches the end.

## Seeding a detail query from a list

`GET /api/users` already returns everything the Profile screen needs, so the profile query
resolves instantly from cache and refetches in the background:

```ts
useQuery({
  queryKey: queryKeys.contacts.detail(id),
  queryFn: () => fetchContact(id),
  initialData: () => findContactInListCache(queryClient, id),
  initialDataUpdatedAt: () => listCacheUpdatedAt(queryClient),
});
```

`initialDataUpdatedAt` matters: without it, the seeded data is treated as fresh and the
background refetch never happens.

## The send mutation

This is the pattern that differs from the textbook, and the difference is deliberate.

```ts
useMutation({
  mutationFn: (input) => postMessage(input),
  onMutate: (input) => {
    // durable first: the message exists before the request leaves
    const localId = store.getState().outbox.enqueue(input.contactId, input.body);
    return { localId }; // becomes `onMutateResult` below
  },
  onSuccess: (res, _input, onMutateResult) => {
    store.getState().outbox.markSent(onMutateResult.localId, res.createdAt);
  },
  onError: (_err, _input, onMutateResult) => {
    store.getState().outbox.markFailed(onMutateResult.localId); // NOT a rollback
  },
  // no onSettled, and no invalidateQueries — see below
});
```

**Callback signatures (v5.90+).** The value returned from `onMutate` is the **third**
positional argument, now named `onMutateResult`, and there is a **fourth** `context` argument
carrying the QueryClient:

```ts
onMutate:  (variables, context) => onMutateResult
onSuccess: (data, variables, onMutateResult, context) => void
onError:   (error, variables, onMutateResult, context) => void
onSettled: (data, error, variables, onMutateResult, context) => void
```

`context.client` is the QueryClient, so a callback that needs it does **not** need a separate
`useQueryClient()` call. The canonical optimistic-update recipe in the docs uses
`context.client.cancelQueries` / `setQueryData` / `invalidateQueries` — **none of which apply
here**, because this mutation never touches the query cache. Do not copy that recipe in.

**Why no invalidation.** The write is not persisted server-side. Refetching the thread returns
the original posts and deletes every message the user has sent. See
[Message model](../../../docs/explanation/message-model.md).

**Why no rollback.** The optimistic claim being made is _delivery_, not existence. A failed
send stays visible with a retry affordance; deleting content the user typed is the wrong
response to a network error.

**Why the response `id` is ignored.** It is always `101`. Only `createdAt` is used.

## Loading states

**Reads get skeletons. Writes get spinners — and usually not even that.**

A skeleton shows the shape of the content that is coming, so the layout does not jump when it
arrives. A spinner says only "something is happening" and is the wrong choice for a screen whose
shape is already known.

| State                                           | Treatment                                                                                                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isPending` — a read with no data yet           | **Skeleton** matching the real layout. Never a spinner.                                                                                             |
| `isFetching && !isPending` — background refresh | Nothing. Leave the content; do not flash a spinner over data the user is reading.                                                                   |
| `isFetchingNextPage`                            | Small footer spinner on the list — the shape below is unknown, so a skeleton would be a guess.                                                      |
| `isError`                                       | Error state with a retry that calls `refetch()`.                                                                                                    |
| Loaded but empty                                | Empty state. Never a spinner.                                                                                                                       |
| **A mutation in flight**                        | Usually nothing — the optimistic bubble is the feedback. Show a spinner only where a write blocks the UI and there is no optimistic result to show. |

Sending a message needs **no spinner**: the bubble appears immediately with a pending indicator,
which communicates more than a spinner would. Adding one on top would be feedback for something
the user can already see.

## Testing

Mock the API class (`jest.mock('@/core/api')`); never stub `useQuery`. A test with a stubbed
hook tests the stub. See [rn-testing](../rn-testing/SKILL.md).
