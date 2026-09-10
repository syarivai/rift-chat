import type { Contact, Envelope, Post } from '@/core/api/types';

/**
 * Fixtures mirror the real API shapes, including the quirks that drive the design:
 * `sentPost` returns id 101, and `threadPage` is unchanged after a send. A fixture that
 * pretended the write persisted would hide the bug the whole app is built around.
 * See docs/reference/api-contract.md.
 */

export function contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    name: 'Alice Johnson',
    username: 'alicej',
    email: 'alice.johnson@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    phone: '+1-202-555-0101',
    website: 'https://alicejohnson.dev',
    address: { street: '123 Maple St', city: 'Springfield', zipcode: '62704' },
    ...overrides,
  };
}

export function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 1,
    userId: 5,
    title: 'Exploring REST APIs in 2025',
    body: 'REST APIs continue to be the backbone of modern web development.',
    tags: ['1', '16', '15'],
    category: 'API Design',
    createdAt: '2025-07-01T10:12:00Z',
    ...overrides,
  };
}

/** `total` is 60 in the real API — the value the infinite query stops on. */
export function contactsPage(offset = 0, limit = 20, total = 60): Envelope<Contact> {
  const results = Array.from({ length: Math.max(0, Math.min(limit, total - offset)) }, (_, i) =>
    contact({ id: offset + i + 1, name: `Contact ${offset + i + 1}` }),
  );
  return { total, limit, offset, results };
}

/** A contact's thread. The real API returns two or three posts per user. */
export function threadPage(userId = 5, count = 3): Envelope<Post> {
  const results = Array.from({ length: count }, (_, i) =>
    post({ id: i + 1, userId, createdAt: `2025-07-0${i + 1}T10:00:00Z` }),
  );
  return { total: count, limit: 20, offset: 0, results };
}

/** What POST /api/posts actually returns: id is ALWAYS 101, and nothing is persisted. */
export function sentPost(body: string, userId = 5): Post {
  return post({
    id: 101,
    userId,
    body,
    title: body.slice(0, 40),
    createdAt: new Date().toISOString(),
  });
}
