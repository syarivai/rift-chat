import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { queryKeys } from '@/core/query-keys/keys';
import { useAppStore } from '@/core/store/store';
import { contact, contactsPage } from '@/test/fixtures';
import { ProfileScreen } from './profile-screen';

const mockGet = jest.fn();

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

// `mock`-prefixed so jest's hoisting guard allows the factory to close over it.
let mockRouteId = '1';
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockRouteId }),
  Stack: { Screen: () => null },
}));

let queryClient: QueryClient;

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mockRouteId = '1';
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  useAppStore.setState({ blockedIds: [] });
  mockGet.mockResolvedValue(contact({ id: 1 }));
});

describe('ProfileScreen', () => {
  it('shows the contact details', async () => {
    await render(<ProfileScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('Alice Johnson')).toBeOnTheScreen());
    expect(screen.getByText('+1-202-555-0101')).toBeOnTheScreen();
  });

  it('offers retry when the contact fails to load', async () => {
    mockGet.mockRejectedValue(new Error('boom'));
    await render(<ProfileScreen />, { wrapper });

    await waitFor(() => expect(screen.getByText('profile.loadError')).toBeOnTheScreen());
    expect(screen.getByRole('button', { name: 'common.retry' })).toBeOnTheScreen();
  });

  it('renders a not-found state for a non-numeric route id, without fetching', async () => {
    mockRouteId = 'nope';
    await render(<ProfileScreen />, { wrapper });

    expect(screen.getByText('common.error')).toBeOnTheScreen();
    expect(mockGet).not.toHaveBeenCalled();
  });

  // ADR: GET /api/users already returns every field this screen shows, so the detail query is
  // seeded from the list cache — no spinner for data the app is already holding.
  it('renders instantly from the list cache instead of spinning', async () => {
    // The background refetch is held open for the whole test. Letting it resolve would race
    // the assertion — the seeded name would be replaced mid-test by the fetched one, which is
    // correct behaviour but makes the test about timing rather than about the seed.
    mockGet.mockReturnValue(new Promise(() => {}));
    queryClient.setQueryData(queryKeys.contacts.list(), {
      pages: [contactsPage(0, 20, 60)],
      pageParams: [0],
    });

    await render(<ProfileScreen />, { wrapper });

    // Present on the very first frame, with the request still in flight.
    expect(screen.getByText('Contact 1')).toBeOnTheScreen();
    expect(screen.queryByText('profile.loadError')).toBeNull();
  });
});

describe('blocking from the profile', () => {
  it('writes the block to the shared store, which every other screen reads', async () => {
    await render(<ProfileScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText('Alice Johnson')).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('button', { name: 'profile.block' }));

    expect(useAppStore.getState().blockedIds).toContain(1);
  });

  it('toggles back to block after unblocking', async () => {
    useAppStore.setState({ blockedIds: [1] });
    await render(<ProfileScreen />, { wrapper });
    await waitFor(() => expect(screen.getByText('Alice Johnson')).toBeOnTheScreen());

    await fireEvent.press(screen.getByRole('button', { name: 'profile.unblock' }));

    expect(useAppStore.getState().blockedIds).not.toContain(1);
    expect(screen.getByRole('button', { name: 'profile.block' })).toBeOnTheScreen();
  });
});
