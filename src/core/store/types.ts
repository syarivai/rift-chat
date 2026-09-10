/**
 * A message the user sent. Lives in the store, not the query cache: POST /api/posts is not
 * persisted server-side, so a refetch would lose it. See docs/explanation/message-model.md.
 *
 * The status union is the error model — there is no separate Result type, because this
 * already describes every outcome the UI renders.
 */
export type OutboxMessage = {
  readonly localId: string;
  readonly contactId: number;
  readonly body: string;
  readonly createdAt: string;
} & (
  | { readonly status: 'sending' }
  | { readonly status: 'sent'; readonly deliveredAt: string }
  | { readonly status: 'failed'; readonly error: string }
);

export type Language = 'system' | 'en' | 'ms' | 'id';
export type ThemeChoice = 'system' | 'light' | 'dark';
