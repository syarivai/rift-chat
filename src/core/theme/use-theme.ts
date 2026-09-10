import { useColorScheme } from 'react-native';

import { useAppStore } from '../store/store';
import { darkColors, lightColors, radius, spacing, typography, type Theme } from './tokens';

/**
 * Resolution order: the user's explicit choice, then the OS scheme, then light.
 *
 * The choice is read from MMKV synchronously, so the very first render is already correct —
 * there is no light frame before dark applies. That is the reason MMKV was chosen over
 * AsyncStorage (ADR 0002).
 */
export function useTheme(): Theme {
  const choice = useAppStore((state) => state.theme);
  const system = useColorScheme();

  const scheme: 'light' | 'dark' =
    choice === 'system' ? (system === 'dark' ? 'dark' : 'light') : choice;

  return {
    colors: scheme === 'dark' ? darkColors : lightColors,
    spacing,
    radius,
    typography,
    scheme,
  };
}
