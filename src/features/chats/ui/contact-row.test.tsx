import { render, screen } from '@testing-library/react-native';

import { useAppStore } from '@/core/store/store';
import { contact } from '@/test/fixtures';
import { ContactRow } from './contact-row';

beforeEach(() => {
  useAppStore.setState({ outbox: {}, blockedIds: [] });
});

describe('ContactRow', () => {
  it('shows the contact name', async () => {
    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);
    expect(screen.getByText('Alice Johnson')).toBeTruthy();
  });

  it('shows the honest empty state when nothing has been sent', async () => {
    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);
    expect(screen.getByText('chats.noMessages')).toBeTruthy();
  });

  /**
   * Regression: selectLastMessage builds a fresh object on every call. Without useShallow the
   * selector returns a new reference each render and React bails out with "Maximum update
   * depth exceeded" — which happened on device and no test caught it.
   */
  it('renders without an update loop when the contact has sent messages', async () => {
    useAppStore.getState().enqueue(1, 'see you at 6');

    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);

    expect(screen.getByText('see you at 6')).toBeTruthy();
  });

  it('exposes the row as a button labelled with the contact name', async () => {
    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Alice Johnson' })).toBeTruthy();
  });

  // The badge is a status, not the Profile screen's imperative "Block contact" action label.
  it('marks a blocked contact on the row', async () => {
    useAppStore.setState({ blockedIds: [1] });
    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);

    expect(screen.getByText('chats.blocked')).toBeOnTheScreen();
  });

  it('shows no badge for a contact who is not blocked', async () => {
    await render(<ContactRow contact={contact({ id: 1 })} onPress={jest.fn()} />);

    expect(screen.queryByText('chats.blocked')).toBeNull();
  });
});
