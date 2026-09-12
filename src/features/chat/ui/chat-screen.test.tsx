import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAppStore } from '@/core/store/store';
import { contact, messagesPage } from '@/test/fixtures';
import { ChatScreen } from './chat-screen';

const mockGet = jest.fn();
const mockPost = jest.fn();

// Mock axios, not the API class: `withQuery` builds the hooks the screen calls, so replacing
// the class would mock away the thing under test. Same seam as the other API-facing suites.
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: () => ({
      get: (...args: unknown[]) => mockGet(...args),
      post: (...args: unknown[]) => mockPost(...args),
      interceptors: { response: { use: jest.fn() } },
    }),
  },
}));

// `mock`-prefixed so jest's hoisting guard allows the factory to close over it.
let mockRouteId = '5';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockRouteId }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  Stack: { Screen: () => null },
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const renderChat = () => render(<ChatScreen />, { wrapper });

beforeEach(() => {
  mockRouteId = '5';
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
  useAppStore.setState({ outbox: {}, blockedIds: [] });
  mockGet.mockImplementation((url: string) =>
    url === '/api/posts' ? Promise.resolve(messagesPage(5)) : Promise.resolve(contact({ id: 5 })),
  );
});

describe('ChatScreen', () => {
  it('renders the contact messages once loaded', async () => {
    await renderChat();

    await waitFor(() =>
      expect(screen.getByText(messagesPage(5).results[0]!.body)).toBeOnTheScreen(),
    );
  });

  it('shows a retry affordance when the thread fails to load', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await renderChat();

    await waitFor(() => expect(screen.getByText('chat.loadError')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeOnTheScreen();
  });

  // Route params come from outside the app, so a junk id must not fire a request.
  it('renders a not-found state for a non-numeric route id', async () => {
    mockRouteId = 'not-a-number';
    await renderChat();

    expect(screen.getByText('common.error')).toBeOnTheScreen();
    expect(mockGet).not.toHaveBeenCalled();
  });
});

// R-27: "the user blocks Alice from her profile / then both screens reflect the blocked state
// without a reload." The store is the shared source, so a change made anywhere reaches here.
describe('the blocked state', () => {
  it('replaces the composer but keeps the history readable', async () => {
    useAppStore.setState({ blockedIds: [5] });
    await renderChat();

    await waitFor(() =>
      expect(screen.getByText(messagesPage(5).results[0]!.body)).toBeOnTheScreen(),
    );

    expect(screen.getByText('chat.blocked')).toBeOnTheScreen();
    expect(screen.queryByTestId('composer-input')).toBeNull();
  });

  it('restores the composer when the contact is unblocked from here', async () => {
    useAppStore.setState({ blockedIds: [5] });
    await renderChat();

    await fireEvent.press(screen.getByRole('button', { name: 'profile.unblock' }));

    await waitFor(() => expect(screen.getByTestId('composer-input')).toBeOnTheScreen());
    expect(useAppStore.getState().blockedIds).not.toContain(5);
  });

  // The propagation itself: nothing re-fetches, nothing re-navigates — the screen is already
  // subscribed to the same store slice the Profile screen writes.
  it('reflects a block made elsewhere without a reload', async () => {
    await renderChat();
    await waitFor(() => expect(screen.getByTestId('composer-input')).toBeOnTheScreen());

    const callsBefore = mockGet.mock.calls.length;
    await fireEvent(screen.getByTestId('composer-input'), 'focus');
    useAppStore.getState().toggleBlocked(5);

    await waitFor(() => expect(screen.getByText('chat.blocked')).toBeOnTheScreen());
    expect(mockGet.mock.calls).toHaveLength(callsBefore);
  });
});
