import { render, screen } from '@testing-library/react-native';

import type { OutboxMessage } from '@/core/store/types';
import type { Message } from '../api/use-messages';
import { MessageBubble } from './message-bubble';

function outgoing(status: OutboxMessage['status'], extra: Partial<OutboxMessage> = {}): Message {
  return {
    kind: 'outgoing',
    id: 'local-1',
    message: {
      localId: 'local-1',
      contactId: 5,
      body: 'hello',
      createdAt: '2026-09-10T12:00:00.000Z',
      status,
      ...extra,
    } as OutboxMessage,
  };
}

const incoming: Message = {
  kind: 'incoming',
  id: 'post-1',
  body: 'hi there',
  createdAt: '2026-09-10T11:00:00.000Z',
};

describe('MessageBubble', () => {
  it('renders an incoming message', async () => {
    await render(<MessageBubble message={incoming} onRetry={jest.fn()} />);
    expect(screen.getByText('hi there')).toBeOnTheScreen();
  });

  // Delivery state is conveyed by icon colour. An unlabelled icon is invisible to a screen
  // reader, which would leave colour doing the work alone — the thing the icon exists to avoid.
  it.each([
    ['sending', 'chat.sending'],
    ['sent', 'chat.sent'],
    ['failed', 'chat.failed'],
  ] as const)('announces the %s status to a screen reader', async (status, label) => {
    const extra =
      status === 'sent'
        ? { deliveredAt: '2026-09-10T12:00:01.000Z' }
        : status === 'failed'
          ? { error: 'Network request failed' }
          : {};

    await render(<MessageBubble message={outgoing(status, extra)} onRetry={jest.fn()} />);

    expect(screen.getAllByLabelText(label).length).toBeGreaterThan(0);
  });
});
