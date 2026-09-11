import { api } from '@/core/api/rift-api';
import { queryKeys } from '@/core/query-keys/keys';

export const PAGE_SIZE = 20;

/**
 * The contacts list. Offset-paginated: the envelope carries `total`, so the stop condition is
 * arithmetic rather than a guess. Returning `undefined` is what sets `hasNextPage` to false —
 * get it wrong and you get either an endless loop of empty fetches or a list that stops at
 * page one.
 */
export function useContactsInfinite() {
  return api.getContacts.useInfiniteQuery(
    { limit: PAGE_SIZE },
    {
      queryKey: queryKeys.contacts.list(),
      initialPageParam: 0,
      getNextPageParam: (last) => {
        const next = last.offset + last.limit;
        return next >= last.total ? undefined : next;
      },
    },
  );
}
