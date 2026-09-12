/**
 * The single source of query keys. Never write an inline key literal: a typo silently creates
 * a second cache entry instead of failing.
 *
 * The hierarchy is deliberate — `contacts.all` invalidates every contact query while
 * `contacts.detail(3)` targets one.
 */
export const queryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: () => [...queryKeys.contacts.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.contacts.all, 'detail', id] as const,
  },
  messages: {
    all: ['messages'] as const,
    /**
     * NEVER pass this key to invalidateQueries after a send. POST /api/posts is not
     * persisted, so the refetch would delete every message the user has sent.
     */
    byContact: (contactId: number) => [...queryKeys.messages.all, 'byContact', contactId] as const,
  },
} as const;
