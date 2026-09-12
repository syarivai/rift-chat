import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { BaseHttpClient, assertEnvelope } from './base-http-client';

describe('assertEnvelope', () => {
  const valid = { total: 60, limit: 20, offset: 0, results: [{ id: 1 }] };

  it('accepts the shape the API actually returns', () => {
    expect(() => assertEnvelope(valid, '/api/users')).not.toThrow();
  });

  it.each([
    ['null', null],
    ['a bare array', []],
    ['missing total', { limit: 20, offset: 0, results: [] }],
    ['total as a string', { total: '60', limit: 20, offset: 0, results: [] }],
    ['results not an array', { total: 1, limit: 20, offset: 0, results: {} }],
  ])('throws at the boundary on %s', (_label, value) => {
    expect(() => assertEnvelope(value, '/api/users')).toThrow(/Malformed envelope/);
  });

  it('names the endpoint so the failure is traceable', () => {
    expect(() => assertEnvelope(null, '/api/posts')).toThrow('/api/posts');
  });
});

describe('withQuery', () => {
  // A throwaway subclass: `withQuery` is protected, and the point of these tests is the
  // wrapper, not any particular endpoint. The fetchers resolve locally, so no HTTP happens.
  class TestApi extends BaseHttpClient {
    echo = this.withQuery('echo', (input: { value: string }) =>
      Promise.resolve({ echoed: input.value }),
    );
  }

  let client: QueryClient;
  const testApi = new TestApi('https://example.test');

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }

  beforeEach(() => {
    client = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false, gcTime: 0 },
      },
    });
  });

  it('exposes the fetcher itself alongside its hooks', async () => {
    await expect(testApi.echo({ value: 'direct' })).resolves.toEqual({ echoed: 'direct' });
    expect(typeof testApi.echo.useQuery).toBe('function');
    expect(typeof testApi.echo.useMutation).toBe('function');
  });

  it('runs the fetcher through useQuery', async () => {
    const { result } = await renderHook(() => testApi.echo.useQuery({ value: 'read' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toEqual({ echoed: 'read' }));
  });

  it('treats the variables as the request body when no mapper is given', async () => {
    const { result } = await renderHook(() => testApi.echo.useMutation(), { wrapper });

    await act(async () => result.current.mutate({ value: 'plain' }));

    await waitFor(() => expect(result.current.data).toEqual({ echoed: 'plain' }));
  });

  it('narrows wider variables to the request body via toRequest', async () => {
    const onSuccess = jest.fn();
    const { result } = await renderHook(
      () =>
        testApi.echo.useMutation<{ localId: string; input: { value: string } }>({
          toRequest: (variables) => variables.input,
          onSuccess,
        }),
      { wrapper },
    );

    await act(async () => result.current.mutate({ localId: 'local-1', input: { value: 'wide' } }));

    await waitFor(() => expect(result.current.data).toEqual({ echoed: 'wide' }));
    // The callbacks still see the wide variables — that is the whole point of the mapper.
    expect(onSuccess.mock.calls[0]?.slice(0, 2)).toEqual([
      { echoed: 'wide' },
      { localId: 'local-1', input: { value: 'wide' } },
    ]);
  });
});
