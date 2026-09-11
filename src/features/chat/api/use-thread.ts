import { useMemo } from 'react';

import { api } from '@/core/api/rift-api';
import { queryKeys } from '@/core/query-keys/keys';
import { useAppStore } from '@/core/store/store';
import type { OutboxMessage } from '@/core/store/types';
import { mergeThread, type ThreadMessage } from '../model/thread';

export const PAGE_SIZE = 20;

/** Module-level so the selector returns a stable reference when a contact has no outbox. */
const NO_MESSAGES: OutboxMessage[] = [];

/**
 * A contact's thread: their posts from the server, merged with the user's own messages from
 * the persisted outbox.
 *
 * The two sources are queried and stored separately on purpose — the server does not keep the
 * user's messages, so they cannot live in the query cache.
 */
export function useThread(contactId: number) {
  const query = api.getThread.useInfiniteQuery(
    { limit: PAGE_SIZE, userId: contactId },
    {
      queryKey: queryKeys.messages.thread(contactId),
      initialPageParam: 0,
      getNextPageParam: (last) => {
        const next = last.offset + last.limit;
        return next >= last.total ? undefined : next;
      },
    },
  );

  const outbox = useAppStore((state) => state.outbox[contactId] ?? NO_MESSAGES);

  const posts = useMemo(
    () => query.data?.pages.flatMap((page) => page.results) ?? [],
    [query.data],
  );

  const messages: ThreadMessage[] = useMemo(() => mergeThread(posts, outbox), [posts, outbox]);

  return { ...query, messages };
}
