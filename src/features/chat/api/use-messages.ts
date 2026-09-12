import { useMemo } from 'react';

import { api } from '@/core/api/rift-api';
import type { Post } from '@/core/api/types';
import { queryKeys } from '@/core/query-keys/keys';
import { useAppStore } from '@/core/store/store';
import type { OutboxMessage } from '@/core/store/types';

export const PAGE_SIZE = 20;

/** Module-level so the selector returns a stable reference when a contact has no outbox. */
const NO_MESSAGES: OutboxMessage[] = [];

export type Message =
  | {
      readonly kind: 'incoming';
      readonly id: string;
      readonly body: string;
      readonly createdAt: string;
    }
  | { readonly kind: 'outgoing'; readonly id: string; readonly message: OutboxMessage };

/**
 * A conversation is the union of two sources: the contact's posts (incoming, from the server)
 * and the user's own messages (outgoing, from the persisted outbox). Neither source knows
 * about the other; they are merged here, at read time.
 *
 * Pure by design — no clock, no store access — so ordering is assertable in tests.
 * See docs/explanation/message-model.md.
 */
export function mergeMessages(posts: readonly Post[], outbox: readonly OutboxMessage[]): Message[] {
  const incoming: Message[] = posts.map((post) => ({
    kind: 'incoming',
    id: `post-${post.id}`,
    body: post.body,
    createdAt: post.createdAt,
  }));

  const outgoing: Message[] = outbox.map((message) => ({
    kind: 'outgoing',
    id: message.localId,
    message,
  }));

  // Oldest first. The id tiebreaker keeps the order stable when two messages share a
  // timestamp — without it, bubbles can swap places between renders.
  return [...incoming, ...outgoing].sort((a, b) => {
    const byTime = timeOf(a).localeCompare(timeOf(b));
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });
}

function timeOf(message: Message): string {
  return message.kind === 'incoming' ? message.createdAt : message.message.createdAt;
}

/**
 * A contact's messages: their posts from the server, merged with the user's own from the
 * persisted outbox.
 *
 * The two sources are queried and stored separately on purpose — the server does not keep the
 * user's messages, so they cannot live in the query cache.
 */
export function useMessages(contactId: number) {
  const query = api.getMessages.useInfiniteQuery(
    { limit: PAGE_SIZE, userId: contactId },
    {
      queryKey: queryKeys.messages.byContact(contactId),
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

  const messages: Message[] = useMemo(() => mergeMessages(posts, outbox), [posts, outbox]);

  return { ...query, messages };
}
