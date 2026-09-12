import { keyboardHeightFrom } from './use-keyboard-height';

describe('keyboardHeightFrom', () => {
  it('measures the space below the keyboard top edge', () => {
    // Window 800 tall, keyboard top at 500 → 300 below it.
    expect(keyboardHeightFrom(800, 500)).toBe(300);
  });

  it('is zero when the keyboard is closed and sits at the window bottom', () => {
    expect(keyboardHeightFrom(800, 800)).toBe(0);
  });

  it('never returns a negative height when the keyboard reports past the window', () => {
    expect(keyboardHeightFrom(800, 900)).toBe(0);
  });

  it('does not use the keyboard reported height, which under-measures edge-to-edge', () => {
    // A device reporting height 260 while its top edge is at 500 must still yield 300 —
    // trusting `height` here is what left the composer clipped behind the keyboard.
    expect(keyboardHeightFrom(800, 500)).not.toBe(260);
  });
});
