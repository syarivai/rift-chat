import { useEffect, useState } from 'react';
import { Keyboard, Platform, useWindowDimensions } from 'react-native';

/**
 * Space below the keyboard's top edge.
 *
 * Measured from `screenY` rather than the keyboard's reported `height`: under Android
 * edge-to-edge the reported height under-measures against a full-screen window, which left
 * the composer clipped behind the keyboard.
 */
export function keyboardHeightFrom(windowHeight: number, keyboardTopY: number): number {
  return Math.max(0, windowHeight - keyboardTopY);
}

/**
 * The keyboard's height, or 0 when it is closed.
 *
 * ponytail: `KeyboardAvoidingView` does not work on Android under Expo SDK 54+, which enables
 * edge-to-edge by default — the window no longer resizes, so both 'height' and 'padding'
 * leave the composer under the keyboard. This reads the keyboard events directly instead of
 * adding `react-native-keyboard-controller` (a native dependency plus a full rebuild).
 *
 * Ceiling: padding is applied on the `Did` events, so it snaps rather than tracking the
 * keyboard's animation. Upgrade path: react-native-keyboard-controller for interactive
 * tracking, if the snap ever reads as cheap.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  const { height: windowHeight } = useWindowDimensions();

  useEffect(() => {
    // iOS reports the frame before animating; Android only fires the Did* events reliably.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) =>
      setHeight(keyboardHeightFrom(windowHeight, event.endCoordinates.screenY)),
    );
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [windowHeight]);

  return height;
}
