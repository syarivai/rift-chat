import type { Post } from '@/core/api/types';
import type { OutboxMessage } from '@/core/store/types';

export type ThreadMessage =
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
export function mergeThread(
  posts: readonly Post[],
  outbox: readonly OutboxMessage[],
): ThreadMessage[] {
  const incoming: ThreadMessage[] = posts.map((post) => ({
    kind: 'incoming',
    id: `post-${post.id}`,
    body: post.body,
    createdAt: post.createdAt,
  }));

  const outgoing: ThreadMessage[] = outbox.map((message) => ({
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

function timeOf(message: ThreadMessage): string {
  return message.kind === 'incoming' ? message.createdAt : message.message.createdAt;
}
