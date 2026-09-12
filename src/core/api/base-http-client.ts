import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

/**
 * Thin axios wrapper. One instance, one place that builds URLs, one place that turns a
 * transport failure into an Error.
 *
 * Errors throw rather than being wrapped in a Result type: React Query already models a
 * failed read as `error` / `isError` / retry, and the outbox's `status` union already models
 * a failed write. See docs/explanation/architecture.md.
 */
export abstract class BaseHttpClient {
  protected readonly client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: { 'Content-Type': 'application/json' },
    });

    // Unwrap to the body so callers never touch AxiosResponse.
    this.client.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => Promise.reject(toError(error)),
    );
  }

  // The response interceptor above unwraps AxiosResponse to its body, so axios's own return
  // types no longer describe reality. One cast at the seam, rather than threading a wrong
  // generic through every call site.
  protected get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(path, config) as unknown as Promise<T>;
  }

  protected post<T>(path: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(path, body, config) as unknown as Promise<T>;
  }

  /**
   * Binds an endpoint to its React Query hooks. Returns the fetcher itself, augmented — so
   * `api.getContacts(params)` is a promise and `api.getContacts.useQuery(params)` is a hook.
   *
   * The hooks are named `use*` deliberately: it keeps the react-hooks lint rule satisfied
   * without a disable comment, and it makes the call site read as what it is — a hook that
   * cannot be called conditionally.
   */
  protected withQuery<Req, Res>(key: string, fetcher: (req: Req) => Promise<Res>) {
    const useApiQuery = <TData = Res>(
      req: Req,
      options?: Partial<UseQueryOptions<Res, Error, TData>>,
    ) =>
      useQuery<Res, Error, TData>({
        queryKey: [key, req],
        queryFn: () => fetcher(req),
        ...options,
      });

    // Offset paging: the wrapper supplies the queryFn (merging `offset` from pageParam);
    // the caller supplies the key from the queryKeys factory plus the stop condition, because
    // only the caller knows the shape of `total` it is paging against.
    const useApiInfiniteQuery = (
      req: Omit<Req, 'offset'>,
      options: {
        queryKey: readonly unknown[];
        initialPageParam: number;
        getNextPageParam: (lastPage: Res) => number | undefined;
      },
    ) =>
      useInfiniteQuery({
        queryKey: options.queryKey,
        queryFn: ({ pageParam }: { pageParam: number }) =>
          fetcher({ ...req, offset: pageParam } as Req),
        initialPageParam: options.initialPageParam,
        getNextPageParam: options.getNextPageParam,
      });

    // `TVars` is the request body by default. Widen it with `toRequest` when the mutation has
    // to carry something the endpoint knows nothing about — the outbox `localId` that
    // `onSuccess`/`onError` use to mark the right message is the reason this exists.
    const useApiMutation = <TVars = Req>(
      options?: Omit<UseMutationOptions<Res, Error, TVars>, 'mutationFn'> & {
        toRequest?: (variables: TVars) => Req;
      },
    ) => {
      const { toRequest, ...rest } = options ?? {};
      return useMutation<Res, Error, TVars>({
        mutationKey: [key],
        mutationFn: (variables) =>
          fetcher(toRequest ? toRequest(variables) : (variables as unknown as Req)),
        ...rest,
      });
    };

    return Object.assign(fetcher, {
      useQuery: useApiQuery,
      useInfiniteQuery: useApiInfiniteQuery,
      useMutation: useApiMutation,
    });
  }
}

function toError(error: AxiosError): Error {
  if (error.response) {
    return new Error(`HTTP ${error.response.status} on ${error.config?.url ?? 'unknown'}`);
  }
  if (error.code === 'ECONNABORTED') {
    return new Error('Request timed out');
  }
  return new Error(error.message || 'Network request failed');
}

/** Narrow runtime guard for the collection envelope. Throws at the boundary, not three
 *  components later as an `undefined`. */
export function assertEnvelope<T>(
  value: unknown,
  endpoint: string,
): asserts value is {
  total: number;
  limit: number;
  offset: number;
  results: T[];
} {
  const v = value as Record<string, unknown> | null;
  if (
    !v ||
    typeof v.total !== 'number' ||
    typeof v.limit !== 'number' ||
    typeof v.offset !== 'number' ||
    !Array.isArray(v.results)
  ) {
    throw new Error(`Malformed envelope from ${endpoint}`);
  }
}
