import { fireEvent, render, screen } from '@testing-library/react-native';

import { Composer } from './composer';

const input = () => screen.getByLabelText('chat.composerPlaceholder');
const sendButton = () => screen.getByRole('button', { name: 'chat.send' });

describe('Composer', () => {
  it('disables send while the input is empty', async () => {
    await render(<Composer onSend={jest.fn()} />);
    expect(sendButton()).toBeDisabled();
  });

  it('disables send for whitespace only', async () => {
    await render(<Composer onSend={jest.fn()} />);
    await fireEvent.changeText(input(), '   ');
    expect(sendButton()).toBeDisabled();
  });

  it('sends the typed message', async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    await fireEvent.changeText(input(), 'hello');
    await fireEvent.press(sendButton());

    expect(onSend).toHaveBeenCalledWith('hello');
  });

  it('clears the input after sending, ready for the next message', async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    await fireEvent.changeText(input(), 'hello');
    expect(input()).toHaveProp('value', 'hello');

    await fireEvent.press(sendButton());

    // Asserting the send fired too, so this cannot pass vacuously on an already-empty input.
    expect(onSend).toHaveBeenCalledWith('hello');
    expect(input()).toHaveProp('value', '');
  });

  it('does not call onSend when the message is only whitespace', async () => {
    const onSend = jest.fn();
    await render(<Composer onSend={onSend} />);

    await fireEvent.changeText(input(), '   ');
    await fireEvent.press(sendButton());

    expect(onSend).not.toHaveBeenCalled();
  });
});
