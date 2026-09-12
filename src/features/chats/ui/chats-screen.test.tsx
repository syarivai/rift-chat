import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAppStore } from '@/core/store/store';
import { contactsPage } from '@/test/fixtures';
import { ChatsScreen } from './chats-screen';

const mockGet = jest.fn();
const mockPush = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      post: jest.fn(),
      interceptors: { response: { use: jest.fn() } },
    }),
  },
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: (...a: unknown[]) => mockPush(...a) }),
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  useAppStore.setState({ outbox: {}, blockedIds: [] });
  mockGet.mockResolvedValue(contactsPage(0, 20, 60));
});

describe('ChatsScreen', () => {
  it('lists the first page of contacts', async () => {
    await render(<ChatsScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('Contact 1')).toBeOnTheScreen());

    // Only the first window is mounted — initialNumToRender={12}, which is the tuning ADR 0003
    // chose over a recycler. Row 20 is fetched but deliberately not yet rendered.
    expect(screen.getByText('Contact 12')).toBeOnTheScreen();
    expect(screen.queryByText('Contact 20')).toBeNull();
  });

  it('offers retry when the list fails to load', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await render(<ChatsScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('chats.loadError')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeOnTheScreen();
  });

  it('shows the empty placeholder when the API returns no contacts', async () => {
    mockGet.mockResolvedValue({ total: 0, limit: 20, offset: 0, results: [] });
    await render(<ChatsScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('chats.empty')).toBeOnTheScreen());
  });

  it('opens a conversation when a row is pressed', async () => {
    await render(<ChatsScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText('Contact 3')).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('button', { name: 'Contact 3' }));

    expect(mockPush).toHaveBeenCalledWith('/chat/3');
  });

  // Rows preview the user's own last message, because GET /api/users carries no last post and
  // fetching one per contact would be 60 extra requests. See ADR 0004.
  it('previews the user outbox message on the contact row', async () => {
    useAppStore.setState({
      outbox: {
        2: [
          {
            localId: 'local-1',
            contactId: 2,
            body: 'see you tomorrow',
            createdAt: '2026-09-10T12:00:00.000Z',
            status: 'sent',
            deliveredAt: '2026-09-10T12:00:01.000Z',
          },
        ],
      },
    });

    await render(<ChatsScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('see you tomorrow')).toBeOnTheScreen());
    // A contact with no outbox falls back to the honest empty state rather than invented text.
    expect(screen.getAllByText('chats.noMessages').length).toBeGreaterThan(0);
  });
});
