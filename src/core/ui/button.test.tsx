import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './button';

describe('Button', () => {
  it('exposes its label as the accessible name', async () => {
    await render(<Button label="Try again" onPress={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Try again' })).toBeTruthy();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Try again" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Send" onPress={onPress} disabled />);

    const button = screen.getByRole('button', { name: 'Send' });
    expect(button).toBeDisabled();

    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('announces itself as a radio with its selection when used as a chip', async () => {
    await render(<Button label="Dark" onPress={jest.fn()} variant="chip" role="radio" selected />);

    const chip = screen.getByRole('radio', { name: 'Dark' });
    expect(chip).toBeTruthy();
    expect(chip).toBeSelected();
  });

  it('is not selected when the chip is idle', async () => {
    await render(<Button label="Light" onPress={jest.fn()} variant="chip" role="radio" />);
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeSelected();
  });

  it.each(['filled', 'outlined', 'text', 'chip'] as const)(
    'renders the %s variant',
    async (variant) => {
      await render(<Button label="Action" onPress={jest.fn()} variant={variant} />);
      expect(screen.getByText('Action')).toBeTruthy();
    },
  );
});
