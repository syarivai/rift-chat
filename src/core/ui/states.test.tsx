import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState, ErrorState, Skeleton } from './states';

describe('EmptyState', () => {
  it('shows the message it is given', async () => {
    await render(<EmptyState message="Tap to start chatting" />);
    expect(screen.getByText('Tap to start chatting')).toBeTruthy();
  });
});

describe('ErrorState', () => {
  it('shows the message and a labelled retry control', async () => {
    await render(
      <ErrorState message="Could not load" retryLabel="Try again" onRetry={jest.fn()} />,
    );

    expect(screen.getByText('Could not load')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('calls onRetry when the control is pressed', async () => {
    const onRetry = jest.fn();
    await render(<ErrorState message="Could not load" retryLabel="Try again" onRetry={onRetry} />);

    fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('Skeleton', () => {
  it('reports itself as a progress indicator rather than empty content', async () => {
    await render(<Skeleton height={48} />);
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
