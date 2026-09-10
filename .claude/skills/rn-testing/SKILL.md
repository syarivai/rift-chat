---
name: rn-testing
description: Testing setup and patterns for rift-chat — jest-expo config, native module mocks, RNTL conventions, MSW handlers, hook tests with a real QueryClient, and the one Maestro flow. Load before writing any test or touching jest config.
---

# React Native testing

The pyramid and its rationale are in
[Testing strategy](../../../docs/explanation/testing-strategy.md). This is how to actually
write the tests.

## Setup traps

These cost an afternoon each if you trip them.

- **jest stays on v29.** `jest-expo` 57 is built on the jest 29 toolchain. A jest 30 package
  leaking in breaks the module mocker with `clearMocksOnScope is not a function`. Pins live in
  the `overrides` block of `package.json`.
- **Reanimated needs its jest setup entry** in `setupFiles`, plus `react-native-worklets` — a
  separate package since Reanimated 4.
- **MMKV cannot run under Jest.** Tests use the in-memory adapter from `@/core/storage`. If a
  test needs to mock `react-native-mmkv` directly, the feature code imported it directly, and
  *that* is the bug.
- **RNTL v14's `render` is async** — `await render(<C />)`.
- **`transformIgnorePatterns`** must keep the jest-expo default; narrowing it breaks ESM
  dependencies.

## Unit tests — pure logic

The outbox merge, ordering, status lifecycle, and relative-time formatting. No React, no
network, no renderer.

```ts
const clock = fixedClock('2026-09-10T10:00:00Z');
const merged = mergeThread({ posts, outbox, clock });
expect(merged.map((m) => m.id)).toEqual([...]);
```

Determinism comes from injection: a fixed `Clock` and a seeded id generator. Never let logic
call `Date.now()` — ordering assertions become flaky the moment a test runs slowly.

## Integration tests — hooks with MSW

This is where most of the value is. Mock at the network boundary, so the real React Query
machinery runs.

```ts
const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },   // no retry in tests
  })}>{children}</QueryClientProvider>
);

const { result } = renderHook(() => useContactsInfinite(), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

Always build a **fresh `QueryClient` per test** — a shared client leaks cache between tests and
produces order-dependent failures.

### What to cover

| Behaviour | Why it matters |
| --------- | -------------- |
| `getNextPageParam` stops at `offset + limit >= total` | Wrong → infinite empty fetches, or a list that stops early |
| A send appends to the outbox and **invalidates nothing** | Wrong → every sent message is deleted |
| `201` moves the message to `sent` | The optimistic lifecycle's happy path |
| A network error moves it to `failed`, not removed | Rollback would delete user content |
| Retry returns `failed` → `sending` | The recovery path |
| Merge order is stable across renders | Wrong → bubbles jump around |
| Outbox and blocked set survive a store rehydrate | The persistence promise |

## Component tests — RNTL

Query by accessibility role or label; use `testID` only where no role fits. The Maestro flow
uses the same labels, so good a11y pays twice.

```ts
await render(<Composer contactId={5} />);
fireEvent.changeText(screen.getByLabelText('Message'), 'hello');
fireEvent.press(screen.getByRole('button', { name: 'Send' }));
expect(screen.getByLabelText('Message')).toHaveProp('value', '');
```

Test behaviour, not structure. Avoid broad snapshots — they fail on every intentional design
change and catch almost nothing unintentional.

## MSW handlers

Handlers live in `src/test/msw/handlers.ts` and mirror the real shapes in
[api-contract.md](../../../docs/reference/api-contract.md) exactly — including the quirks:
`POST /api/posts` returns `id: 101` and does not mutate the collection. A handler that
persists the write would hide the very bug the app is designed around.

Override per test for failure cases:

```ts
server.use(http.post('*/api/posts', () => HttpResponse.error()));
```

## End-to-end — one Maestro flow

`.maestro/send-message.yaml`: launch → scroll the contacts list → open a chat → send → stop the
app → relaunch → the message is still there → block the contact → the composer is replaced.

One flow, deliberately. The second costs as much as the first and proves much less.

## Coverage

Thresholds apply to `src/features/*/model` and `src/core` — the logic. Route files, thin
platform adapters, and pure type modules are excluded: a coverage number over code with no
branches measures nothing.
