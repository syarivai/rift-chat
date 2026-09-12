import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useIsOnline } from '@/core/network/network-info';
import { queryKeys } from '@/core/query-keys/keys';
import { useAppStore } from '@/core/store/store';
import { sentPost } from '@/test/fixtures';
import { useSendMessage } from './use-send-message';

const mockGet = jest.fn();
const mockPost = jest.fn();

// The seam is axios, not the API class: `api.sendMessage.useMutation` is produced by
// `withQuery`, so mocking the class away would mock away the thing under test. Same pattern
// as rift-api.test.ts — the factory delegates so it does not read the consts at hoist time.
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
jest.mock('@/core/network/network-info', () => ({ useIsOnline: jest.fn(() => true) }));
const mockedIsOnline = useIsOnline as jest.MockedFunction<typeof useIsOnline>;

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  // A fresh client per test: a shared one leaks cache and makes tests order-dependent.
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  useAppStore.setState({ outbox: {}, blockedIds: [] });
  jest.clearAllMocks();
  mockedIsOnline.mockReturnValue(true);
});

const outboxFor = (contactId: number) => useAppStore.getState().outbox[contactId] ?? [];

describe('useSendMessage', () => {
  it('shows the message before the request resolves', async () => {
    let resolveSend: (post: ReturnType<typeof sentPost>) => void = () => {};
    mockPost.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSend = resolve;
        }),
    );

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => {
      result.current.send('hello');
    });

    // Still in flight — the bubble is already there.
    expect(outboxFor(5)).toHaveLength(1);
    expect(outboxFor(5)[0]).toMatchObject({ body: 'hello', status: 'sending' });

    // Settle it, so nothing is left pending for the next test.
    await act(async () => {
      resolveSend(sentPost('hello'));
    });
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));
  });

  it('marks the message delivered using the response createdAt', async () => {
    mockPost.mockResolvedValue({
      ...sentPost('hello'),
      createdAt: '2026-09-10T12:00:00.000Z',
    });

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));

    await waitFor(() =>
      expect(outboxFor(5)[0]).toMatchObject({
        status: 'sent',
        deliveredAt: '2026-09-10T12:00:00.000Z',
      }),
    );
  });

  it('keeps a failed message with its error instead of rolling it back', async () => {
    mockPost.mockRejectedValue(new Error('Network request failed'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));

    await waitFor(() =>
      expect(outboxFor(5)[0]).toMatchObject({
        status: 'failed',
        error: 'Network request failed',
        body: 'hello',
      }),
    );
    expect(outboxFor(5)).toHaveLength(1);
  });

  it('retries a failed message and marks it delivered', async () => {
    mockPost.mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'failed' }));

    mockPost.mockResolvedValueOnce({
      ...sentPost('hello'),
      createdAt: '2026-09-10T12:00:05.000Z',
    });

    const localId = outboxFor(5)[0]?.localId ?? '';
    await act(async () => result.current.retry(localId));

    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));
    expect(outboxFor(5)).toHaveLength(1);
  });

  it('ignores a retry for a message that is not failed', async () => {
    mockPost.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    const callsBefore = mockPost.mock.calls.length;
    await act(async () => result.current.retry(outboxFor(5)[0]?.localId ?? ''));

    expect(mockPost.mock.calls).toHaveLength(callsBefore);
  });

  it('will not send a whitespace-only message', async () => {
    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('   '));

    expect(outboxFor(5)).toHaveLength(0);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('derives the title the endpoint requires from the body', async () => {
    mockPost.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));

    expect(mockPost).toHaveBeenCalledWith(
      '/api/posts',
      { userId: 5, title: 'hello', body: 'hello' },
      undefined,
    );
  });
});

describe('the rule: a send never destroys history', () => {
  it('never invalidates the thread query', async () => {
    mockPost.mockResolvedValue(sentPost('hello'));
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('never refetches the contact thread after a send', async () => {
    mockPost.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    expect(mockGet).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(queryKeys.messages.byContact(5))).toBeUndefined();
  });

  it('leaves ten consecutive sends as ten distinct messages', async () => {
    mockPost.mockResolvedValue(sentPost('x'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    for (let i = 0; i < 10; i += 1) {
      await act(async () => result.current.send(`message ${i}`));
    }

    await waitFor(() => expect(outboxFor(5)).toHaveLength(10));
    expect(new Set(outboxFor(5).map((m) => m.localId)).size).toBe(10);
    expect(outboxFor(5).map((m) => m.body)).toEqual(
      Array.from({ length: 10 }, (_, i) => `message ${i}`),
    );
  });
});

describe('reconnecting', () => {
  it("retries this contact's failed messages when connectivity returns", async () => {
    mockedIsOnline.mockReturnValue(false);
    mockPost.mockRejectedValue(new Error('offline'));

    const { result, rerender } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('queued while offline'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'failed' }));

    // Connectivity returns.
    mockPost.mockResolvedValue(sentPost('queued while offline'));
    mockedIsOnline.mockReturnValue(true);
    await act(async () => rerender({}));

    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));
    expect(outboxFor(5)).toHaveLength(1);
  });

  it('does not resend messages that already succeeded', async () => {
    mockPost.mockResolvedValue(sentPost('hello'));

    const { result, rerender } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    const callsBefore = mockPost.mock.calls.length;
    mockedIsOnline.mockReturnValue(false);
    await act(async () => rerender({}));
    mockedIsOnline.mockReturnValue(true);
    await act(async () => rerender({}));

    expect(mockPost.mock.calls).toHaveLength(callsBefore);
  });
});
