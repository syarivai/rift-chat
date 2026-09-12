import { post } from '@/test/fixtures';
import type { OutboxMessage } from '@/core/store/types';
import { mergeMessages } from './use-messages';

const sent = (overrides: Partial<OutboxMessage> = {}): OutboxMessage =>
  ({
    localId: 'local-1',
    contactId: 5,
    body: 'hello',
    createdAt: '2025-07-02T10:00:00Z',
    status: 'sending',
    ...overrides,
  }) as OutboxMessage;

describe('mergeMessages', () => {
  it('renders server posts as incoming', () => {
    const merged = mergeMessages([post({ id: 1, body: 'from alice' })], []);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ kind: 'incoming', body: 'from alice' });
  });

  it('renders outbox entries as outgoing', () => {
    const merged = mergeMessages([], [sent({ body: 'from me' })]);

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ kind: 'outgoing' });
  });

  it('interleaves both sources oldest first', () => {
    const merged = mergeMessages(
      [
        post({ id: 1, body: 'first', createdAt: '2025-07-01T10:00:00Z' }),
        post({ id: 2, body: 'third', createdAt: '2025-07-03T10:00:00Z' }),
      ],
      [sent({ localId: 'a', body: 'second', createdAt: '2025-07-02T10:00:00Z' })],
    );

    expect(merged.map(bodyOf)).toEqual(['first', 'second', 'third']);
  });

  it('is stable when timestamps collide — bubbles must not swap between renders', () => {
    const posts = [
      post({ id: 2, body: 'b', createdAt: '2025-07-01T10:00:00Z' }),
      post({ id: 1, body: 'a', createdAt: '2025-07-01T10:00:00Z' }),
    ];
    const outbox = [sent({ localId: 'z', body: 'z', createdAt: '2025-07-01T10:00:00Z' })];

    const first = mergeMessages(posts, outbox).map((m) => m.id);
    const second = mergeMessages(posts, outbox).map((m) => m.id);

    expect(first).toEqual(second);
  });

  it('gives incoming and outgoing distinct ids, so id 101 cannot collide', () => {
    const merged = mergeMessages(
      [post({ id: 101 })],
      [sent({ localId: 'local-101' }), sent({ localId: 'local-102' })],
    );

    expect(new Set(merged.map((m) => m.id)).size).toBe(3);
  });

  it('returns an empty thread when both sources are empty', () => {
    expect(mergeMessages([], [])).toEqual([]);
  });

  it('keeps failed messages in the thread rather than dropping them', () => {
    const merged = mergeMessages(
      [],
      [sent({ status: 'failed', error: 'network' } as Partial<OutboxMessage>)],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ kind: 'outgoing' });
  });
});

function bodyOf(message: ReturnType<typeof mergeMessages>[number]): string {
  return message.kind === 'incoming' ? message.body : message.message.body;
}
