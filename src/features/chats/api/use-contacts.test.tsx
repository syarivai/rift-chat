import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { contactsPage } from '@/test/fixtures';
import { useContactsInfinite } from './use-contacts';

const mockGet = jest.fn();
const mockPost = jest.fn();

// Mock the transport, not the api module: `api.getContacts` carries the hooks attached by
// withQuery, and replacing it with a bare jest.fn() would strip them. Mocking axios keeps the
// real withQuery wiring, the real fetcher (including its envelope check) and the real React
// Query machinery in play.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      interceptors: { response: { use: jest.fn() } },
    }),
  },
}));

let queryClient: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  jest.clearAllMocks();
});

describe('useContactsInfinite', () => {
  it('requests the first page from offset 0', async () => {
    mockGet.mockResolvedValue(contactsPage(0));

    const { result } = await renderHook(() => useContactsInfinite(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockGet).toHaveBeenCalledWith('/api/users', { params: { limit: 20, offset: 0 } });
  });

  it('advances the offset by the page size', async () => {
    mockGet.mockResolvedValue(contactsPage(0));

    const { result } = await renderHook(() => useContactsInfinite(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(true);

    mockGet.mockResolvedValue(contactsPage(20));
    await result.current.fetchNextPage();

    await waitFor(() =>
      expect(mockGet).toHaveBeenCalledWith('/api/users', { params: { limit: 20, offset: 20 } }),
    );
  });

  it('stops once offset + limit reaches total', async () => {
    // Final page: offset 40 + limit 20 === total 60.
    mockGet.mockResolvedValue(contactsPage(40));

    const { result } = await renderHook(() => useContactsInfinite(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('does not page past the end even when a page comes back short', async () => {
    mockGet.mockResolvedValue({ total: 5, limit: 20, offset: 0, results: [] });

    const { result } = await renderHook(() => useContactsInfinite(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.hasNextPage).toBe(false);
  });

  it('surfaces a failure as an error state rather than throwing', async () => {
    mockGet.mockRejectedValue(new Error('HTTP 500 on /api/users'));

    const { result } = await renderHook(() => useContactsInfinite(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toMatch(/HTTP 500/);
  });
});
