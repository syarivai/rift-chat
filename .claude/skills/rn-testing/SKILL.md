---
name: rn-testing
description: Testing setup and patterns for rift-chat — jest-expo config, native module mocks, RNTL conventions, API mocking, hook tests with a real QueryClient, and the one Maestro flow. Load before writing any test or touching jest config.
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
- **Reanimated needs two things**: the `react-native-reanimated/plugin` Babel plugin listed
  **last** in `babel.config.js`, and `require('react-native-reanimated').setUpTests()` in a
  setup file referenced by **`setupFilesAfterEnv`** (not `setupFiles` — that is the pre-Jest-28
  form). It also needs `react-native-worklets`, a separate package since Reanimated 4.
- **MMKV needs the manual mock at `__mocks__/react-native-mmkv.js`.** v4 is a Nitro module, so
  a real import under Jest dies with `Failed to get NitroModules`. The mock is Map-backed and
  Jest applies it automatically to every test file — no `jest.mock('react-native-mmkv')` call
  needed. If you see the NitroModules error, that file is missing or misnamed.
- **RNTL v14's `render` is async** — `await render(<C />)`.
- **`transformIgnorePatterns`** must keep the jest-expo default; narrowing it breaks ESM
  dependencies.

## Unit tests — pure logic

The outbox merge, ordering, status lifecycle, and relative-time formatting. No React, no
network, no renderer.

```ts
jest.useFakeTimers().setSystemTime(new Date('2026-09-10T10:00:00Z'));
const merged = mergeThread({ posts, outbox });
expect(merged.map((m) => m.id)).toEqual([...]);
```

Determinism comes from Jest, not from an injected clock abstraction: `jest.setSystemTime()`
pins the clock, and `newId()` is mocked in one place. Re-implementing that with a `Clock` port
would duplicate what the test framework already gives you.

## Integration tests — hooks with a mocked API class

This is where most of the value is. Mock the **API class**, not the hooks, so the real React
Query machinery — cache, retry, mutation lifecycle — actually runs.

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

| Behaviour                                                | Why it matters                                              |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `getNextPageParam` stops at `offset + limit >= total`    | Wrong → infinite empty fetches, or a list that stops early  |
| A send appends to the outbox and **invalidates nothing** | Wrong → every sent message is deleted                       |
| `201` moves the message to `sent`                        | The optimistic lifecycle's happy path                       |
| A network error moves it to `failed`, not removed        | Rollback would delete user content                          |
| Retry returns `failed` → `sending`                       | The recovery path                                           |
| Merge order is stable across renders                     | Wrong → bubbles jump around                                 |
| Outbox and blocked set survive a store rehydrate         | The persistence promise                                     |
| A malformed API payload throws at the boundary           | Otherwise it surfaces as `undefined` three components later |

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

## Mocking the API

**Which seam depends on how the code calls the API.**

`api.getContacts` is not a plain function — `withQuery` attaches `.useQuery`,
`.useInfiniteQuery` and `.useMutation` to it. Replacing it with a bare `jest.fn()` strips those
and the hook fails with `api.getContacts.useInfiniteQuery is not a function`.

| Code under test                                          | Mock this                                                         |
| -------------------------------------------------------- | ----------------------------------------------------------------- |
| Calls `api.x.useQuery(...)` / `.useInfiniteQuery(...)`   | **axios** — keeps withQuery, the fetcher and React Query all real |
| Calls `api.x(...)` directly (e.g. inside a `mutationFn`) | the **`@/core/api/rift-api` module**                              |

Mocking axios:

```ts
const mockGet = jest.fn();
const mockPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      // Delegate rather than referencing mockGet directly: jest.mock is hoisted above the
      // const declarations, and `api` is constructed at module load.
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      interceptors: { response: { use: jest.fn() } },
    }),
  },
}));
```

Mocking the module — declare the endpoints explicitly, because jest's automock does not
reproduce a class instance's `Object.assign`ed properties:

```ts
jest.mock('@/core/api');
const mockedApi = jest.mocked(api);

mockedApi.getContacts.mockResolvedValue({
  total: 60,
  limit: 20,
  offset: 0,
  results: [contactFixture()],
});
```

Fixtures live in `src/test/fixtures.ts` and **mirror the real shapes exactly**, including the
quirks from [api-contract.md](../../../docs/reference/api-contract.md): a `POST` fixture returns
`id: 101` and the collection fixture is unchanged afterwards. A fixture that pretended the write
persisted would hide the very bug the whole app is designed around.

Failure cases are one line:

```ts
mockedApi.sendMessage.mockRejectedValue(new Error('network'));
```

**Do not mock hooks.** `jest.mock('@/features/chat/api/use-thread')` tests the mock. The point
of these tests is that `getNextPageParam` and the mutation lifecycle are exercised for real.

**What this does not cover**: the axios interceptors and URL building sit below the mock, so
they are not exercised here. For four endpoints that is an accepted trade — the Maestro flow
hits the real API.

## End-to-end — one Maestro flow

`.maestro/send-message.yaml`: launch → scroll the contacts list → open a chat → send → stop the
app → relaunch → the message is still there → block the contact → the composer is replaced.

One flow, deliberately. The second costs as much as the first and proves much less.

## Coverage

Thresholds apply to `src/features/*/model` and `src/core` — the logic. Route files, thin
platform adapters, and pure type modules are excluded: a coverage number over code with no
branches measures nothing.
