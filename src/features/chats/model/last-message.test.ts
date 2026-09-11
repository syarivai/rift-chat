import type { OutboxMessage } from '@/core/store/types';
import { selectLastMessage } from './last-message';

const message = (overrides: Partial<OutboxMessage> = {}): OutboxMessage =>
  ({
    localId: 'a',
    contactId: 5,
    body: 'hello',
    createdAt: '2026-09-10T10:00:00Z',
    status: 'sent',
    deliveredAt: '2026-09-10T10:00:01Z',
    ...overrides,
  }) as OutboxMessage;

describe('selectLastMessage', () => {
  it('returns null when the user has never messaged this contact', () => {
    expect(selectLastMessage({}, 5)).toBeNull();
  });

  it('returns null for an empty outbox entry', () => {
    expect(selectLastMessage({ 5: [] }, 5)).toBeNull();
  });

  it('returns the most recent message', () => {
    const outbox = {
      5: [
        message({ localId: 'a', body: 'first' }),
        message({ localId: 'b', body: 'second', createdAt: '2026-09-10T11:00:00Z' }),
      ],
    };

    expect(selectLastMessage(outbox, 5)).toEqual({
      body: 'second',
      createdAt: '2026-09-10T11:00:00Z',
    });
  });

  it('does not leak another contact’s messages', () => {
    const outbox = { 6: [message({ body: 'to bob' })] };
    expect(selectLastMessage(outbox, 5)).toBeNull();
  });

  it('previews a failed message too — it is still the latest thing the user said', () => {
    const outbox = {
      5: [message({ status: 'failed', error: 'network' } as Partial<OutboxMessage>)],
    };
    expect(selectLastMessage(outbox, 5)?.body).toBe('hello');
  });
});
