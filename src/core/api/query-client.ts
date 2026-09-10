import { QueryClient } from '@tanstack/react-query';

/**
 * A fresh client per app instance (and per test, which is why this is a factory rather than a
 * module singleton — a shared client leaks cache between tests).
 *
 * `refetchOnWindowFocus` is off: it is a web idea, and on mobile it fires on every app
 * foreground, which is noise. Connectivity is wired to `onlineManager` in Phase 7 so queries
 * pause offline instead of burning retries.
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
    },
  });
}
