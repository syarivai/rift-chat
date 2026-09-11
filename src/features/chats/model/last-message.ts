import type { OutboxMessage } from '@/core/store/types';

export type LastMessage = {
  readonly body: string;
  readonly createdAt: string;
};

/**
 * The preview line for a contact's row.
 *
 * Returns null when the user has never messaged this contact — the row then shows an honest
 * empty state rather than an invented preview. The API has no "last message" field, and
 * fabricating one from the user id would be presenting made-up data as if it came from the
 * server. See ADR 0004.
 */
export function selectLastMessage(
  outbox: Record<number, OutboxMessage[]>,
  contactId: number,
): LastMessage | null {
  const messages = outbox[contactId];
  if (!messages || messages.length === 0) return null;

  const last = messages[messages.length - 1];
  if (!last) return null;

  return { body: last.body, createdAt: last.createdAt };
}
