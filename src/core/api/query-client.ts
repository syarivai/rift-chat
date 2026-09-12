import { QueryClient } from '@tanstack/react-query';

/**
 * A fresh client per app instance (and per test, which is why this is a factory rather than a
 * module singleton — a shared client leaks cache between tests).
 *
 * `refetchOnWindowFocus` is off: it is a web idea, and on mobile it fires on every app
 * foreground, which is noise. Connectivity is wired to `onlineManager` in Phase 7 so queries
 * pause offline instead of burning retries.
 *
 * Mutations take the opposite setting deliberately. React Query's default `networkMode:
 * 'online'` PAUSES a mutation while offline — the mutationFn never runs, so `onError` never
 * fires and the outbox message sits on `sending` with no retry affordance, for as long as the
 * device is offline. The design calls for the opposite: let the send attempt, let it fail
 * fast, mark it `failed`, and show tap-to-retry. `useSendMessage` then flushes failed messages
 * when connectivity returns. See docs/explanation/message-model.md.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // the API sets cache-control: public, max-age=300
        gcTime: 5 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
      },
      mutations: {
        networkMode: 'always',
      },
    },
  });
}
