import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { api } from '@/core/api/rift-api';
import { queryKeys } from '@/core/query-keys/keys';
import { useAppStore } from '@/core/store/store';
import { sentPost } from '@/test/fixtures';
import { useSendMessage } from './use-send-message';

// `api` is a class instance whose endpoints are Object.assign'd properties, which jest's
// automock does not reproduce. Declare the shape explicitly.
jest.mock('@/core/api/rift-api', () => ({
  api: {
    getContacts: jest.fn(),
    getContact: jest.fn(),
    getThread: jest.fn(),
    sendMessage: jest.fn(),
  },
}));
const mockedApi = api as unknown as {
  getContacts: jest.Mock;
  getContact: jest.Mock;
  getThread: jest.Mock;
  sendMessage: jest.Mock;
};

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  // A fresh client per test: a shared one leaks cache and makes tests order-dependent.
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  useAppStore.setState({ outbox: {}, blockedIds: [] });
  jest.clearAllMocks();
});

const outboxFor = (contactId: number) => useAppStore.getState().outbox[contactId] ?? [];

describe('useSendMessage', () => {
  it('shows the message before the request resolves', async () => {
    let resolveSend: (post: ReturnType<typeof sentPost>) => void = () => {};
    mockedApi.sendMessage.mockImplementation(
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
    mockedApi.sendMessage.mockResolvedValue({
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
    mockedApi.sendMessage.mockRejectedValue(new Error('Network request failed'));

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
    mockedApi.sendMessage.mockRejectedValueOnce(new Error('offline'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'failed' }));

    mockedApi.sendMessage.mockResolvedValueOnce({
      ...sentPost('hello'),
      createdAt: '2026-09-10T12:00:05.000Z',
    });

    const localId = outboxFor(5)[0]?.localId ?? '';
    await act(async () => result.current.retry(localId));

    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));
    expect(outboxFor(5)).toHaveLength(1);
  });

  it('ignores a retry for a message that is not failed', async () => {
    mockedApi.sendMessage.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    const callsBefore = mockedApi.sendMessage.mock.calls.length;
    await act(async () => result.current.retry(outboxFor(5)[0]?.localId ?? ''));

    expect(mockedApi.sendMessage.mock.calls).toHaveLength(callsBefore);
  });

  it('will not send a whitespace-only message', async () => {
    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('   '));

    expect(outboxFor(5)).toHaveLength(0);
    expect(mockedApi.sendMessage).not.toHaveBeenCalled();
  });

  it('derives the title the endpoint requires from the body', async () => {
    mockedApi.sendMessage.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));

    expect(mockedApi.sendMessage).toHaveBeenCalledWith({
      userId: 5,
      title: 'hello',
      body: 'hello',
    });
  });
});

describe('the rule: a send never destroys history', () => {
  it('never invalidates the thread query', async () => {
    mockedApi.sendMessage.mockResolvedValue(sentPost('hello'));
    const invalidate = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('never refetches the contact thread after a send', async () => {
    mockedApi.sendMessage.mockResolvedValue(sentPost('hello'));

    const { result } = await renderHook(() => useSendMessage(5), { wrapper });
    await act(async () => result.current.send('hello'));
    await waitFor(() => expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' }));

    expect(mockedApi.getThread).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(queryKeys.messages.thread(5))).toBeUndefined();
  });

  it('leaves ten consecutive sends as ten distinct messages', async () => {
    mockedApi.sendMessage.mockResolvedValue(sentPost('x'));

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
