import type { OutboxMessage } from './types';
import { settleInterrupted, useAppStore } from './store';

const initial = useAppStore.getState();

beforeEach(() => {
  useAppStore.setState({ outbox: {}, blockedIds: [], language: 'system', theme: 'system' });
  jest.useFakeTimers().setSystemTime(new Date('2026-09-10T10:00:00.000Z'));
});

afterEach(() => jest.useRealTimers());

const outboxFor = (contactId: number) => useAppStore.getState().outbox[contactId] ?? [];

describe('enqueue', () => {
  it('appends a pending message under its contact and returns its local id', () => {
    const localId = initial.enqueue(5, 'hello');

    const [message] = outboxFor(5);
    expect(message).toMatchObject({ localId, contactId: 5, body: 'hello', status: 'sending' });
    expect(message?.createdAt).toBe('2026-09-10T10:00:00.000Z');
  });

  it('keeps each contact separate', () => {
    initial.enqueue(5, 'to alice');
    initial.enqueue(6, 'to bob');

    expect(outboxFor(5)).toHaveLength(1);
    expect(outboxFor(6)).toHaveLength(1);
  });

  it('gives every message a distinct local id', () => {
    const ids = [initial.enqueue(5, 'a'), initial.enqueue(5, 'b'), initial.enqueue(5, 'c')];
    expect(new Set(ids).size).toBe(3);
  });

  it('preserves earlier messages — sending never destroys history', () => {
    initial.enqueue(5, 'first');
    initial.enqueue(5, 'second');
    initial.enqueue(5, 'third');

    expect(outboxFor(5).map((m) => m.body)).toEqual(['first', 'second', 'third']);
  });
});

describe('status lifecycle', () => {
  it('sending -> sent records the delivery time', () => {
    const localId = initial.enqueue(5, 'hello');
    initial.markSent(localId, '2026-09-10T10:00:01.000Z');

    expect(outboxFor(5)[0]).toMatchObject({
      status: 'sent',
      deliveredAt: '2026-09-10T10:00:01.000Z',
    });
  });

  it('sending -> failed keeps the message rather than removing it', () => {
    const localId = initial.enqueue(5, 'hello');
    initial.markFailed(localId, 'network');

    expect(outboxFor(5)).toHaveLength(1);
    expect(outboxFor(5)[0]).toMatchObject({ status: 'failed', error: 'network', body: 'hello' });
  });

  it('failed -> sending on retry', () => {
    const localId = initial.enqueue(5, 'hello');
    initial.markFailed(localId, 'network');
    initial.retry(localId);

    expect(outboxFor(5)[0]).toMatchObject({ status: 'sending' });
  });

  it('refuses sent -> failed, so a late error cannot unsettle a delivered message', () => {
    const localId = initial.enqueue(5, 'hello');
    initial.markSent(localId, '2026-09-10T10:00:01.000Z');
    initial.markFailed(localId, 'late error');

    expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' });
  });

  it('refuses sent -> sending, so retry cannot resurrect a delivered message', () => {
    const localId = initial.enqueue(5, 'hello');
    initial.markSent(localId, '2026-09-10T10:00:01.000Z');
    initial.retry(localId);

    expect(outboxFor(5)[0]).toMatchObject({ status: 'sent' });
  });

  it('leaves other messages untouched', () => {
    const first = initial.enqueue(5, 'first');
    initial.enqueue(5, 'second');
    initial.markFailed(first, 'network');

    expect(outboxFor(5)[1]).toMatchObject({ status: 'sending', body: 'second' });
  });

  it('ignores an unknown local id', () => {
    initial.enqueue(5, 'hello');
    expect(() => initial.markSent('nope', '2026-09-10T10:00:01.000Z')).not.toThrow();
    expect(outboxFor(5)[0]).toMatchObject({ status: 'sending' });
  });
});

describe('blocked contacts', () => {
  it('toggles on and off', () => {
    initial.toggleBlocked(5);
    expect(useAppStore.getState().blockedIds).toEqual([5]);

    initial.toggleBlocked(5);
    expect(useAppStore.getState().blockedIds).toEqual([]);
  });

  it('tracks contacts independently', () => {
    initial.toggleBlocked(5);
    initial.toggleBlocked(6);
    expect(useAppStore.getState().blockedIds).toEqual([5, 6]);
  });
});

describe('preferences', () => {
  it('stores language and theme choices', () => {
    initial.setLanguage('id');
    initial.setTheme('dark');

    expect(useAppStore.getState().language).toBe('id');
    expect(useAppStore.getState().theme).toBe('dark');
  });
});

describe('settleInterrupted', () => {
  const sending = (localId: string): OutboxMessage => ({
    localId,
    contactId: 5,
    body: 'hello',
    createdAt: '2026-09-10T12:00:00.000Z',
    status: 'sending',
  });

  // A process restart leaves nothing in flight, so a restored `sending` message is stranded:
  // only a live mutation settles one, and retry() accepts `failed` only.
  it('settles a restored sending message to failed, so it can be retried', () => {
    const settled = settleInterrupted({ 5: [sending('local-1')] });

    expect(settled[5]?.[0]).toMatchObject({ status: 'failed', body: 'hello' });
  });

  it('leaves already-settled messages exactly as they are', () => {
    const outbox = {
      5: [
        {
          localId: 'a',
          contactId: 5,
          body: 'sent one',
          createdAt: '2026-09-10T12:00:00.000Z',
          status: 'sent',
          deliveredAt: '2026-09-10T12:00:01.000Z',
        } as OutboxMessage,
        {
          localId: 'b',
          contactId: 5,
          body: 'failed one',
          createdAt: '2026-09-10T12:00:02.000Z',
          status: 'failed',
          error: 'Network request failed',
        } as OutboxMessage,
      ],
    };

    // Same reference back: nothing changed, so nothing should re-render.
    expect(settleInterrupted(outbox)).toBe(outbox);
  });

  it('settles across every contact, not just the first', () => {
    const settled = settleInterrupted({ 5: [sending('a')], 9: [sending('b')] });

    expect(settled[5]?.[0]?.status).toBe('failed');
    expect(settled[9]?.[0]?.status).toBe('failed');
  });
});
