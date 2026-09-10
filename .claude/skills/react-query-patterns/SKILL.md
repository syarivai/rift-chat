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
      staleTime: 60_000,        // the API sets cache-control: max-age=300
      gcTime: 5 * 60_000,
      retry: 2,                 // exponential backoff is the default
      refetchOnWindowFocus: false,   // meaningless on mobile; noisy
    },
  },
});
```

Connectivity is wired to `onlineManager` via NetInfo, so queries **pause** when the device is
offline instead of failing and burning retries.

## Query keys

From the factory in `@/core/query-keys`, never inline:

```ts
queryKeys.contacts.list()          // ['contacts','list']
queryKeys.contacts.detail(id)      // ['contacts','detail',id]
queryKeys.messages.thread(id)      // ['messages','thread',id]
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
    return { localId };                       // becomes `onMutateResult` below
  },
  onSuccess: (res, _input, onMutateResult) => {
    store.getState().outbox.markSent(onMutateResult.localId, res.createdAt);
  },
  onError: (_err, _input, onMutateResult) => {
    store.getState().outbox.markFailed(onMutateResult.localId);   // NOT a rollback
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

**Why no rollback.** The optimistic claim being made is *delivery*, not existence. A failed
send stays visible with a retry affordance; deleting content the user typed is the wrong
response to a network error.

**Why the response `id` is ignored.** It is always `101`. Only `createdAt` is used.

## Loading states

Distinguish them — collapsing them produces a spinner where a skeleton belongs:

- `isPending` — no data yet → skeleton.
- `isFetching && !isPending` — background refresh → leave content, no spinner.
- `isFetchingNextPage` → footer spinner on the list.
- `isError` → error state with a retry that calls `refetch()`.
- data present but empty → empty state, never a spinner.

## Testing

Mock at the network boundary with MSW; never stub `useQuery`. A test with a stubbed hook tests
the stub. See [rn-testing](../rn-testing/SKILL.md).
