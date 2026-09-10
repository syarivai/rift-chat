import { renderHook } from '@testing-library/react-native';
import { useColorScheme } from 'react-native';

import { useAppStore } from '../store/store';
import { darkColors, lightColors } from './tokens';
import { useTheme } from './use-theme';

jest.mock('react-native/Libraries/Utilities/useColorScheme');
const mockedColorScheme = useColorScheme as jest.MockedFunction<typeof useColorScheme>;

beforeEach(() => {
  useAppStore.setState({ theme: 'system' });
  mockedColorScheme.mockReturnValue('light');
});

describe('useTheme', () => {
  it('follows the OS when the choice is system', async () => {
    mockedColorScheme.mockReturnValue('dark');
    const { result } = await renderHook(() => useTheme());

    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toBe(darkColors);
  });

  it('lets an explicit choice override the OS', async () => {
    mockedColorScheme.mockReturnValue('light');
    useAppStore.setState({ theme: 'dark' });
    const { result } = await renderHook(() => useTheme());

    expect(result.current.scheme).toBe('dark');
    expect(result.current.colors).toBe(darkColors);
  });

  it('falls back to light when the OS reports no preference', async () => {
    // RN 0.86 types this as 'light' | 'dark' | 'unspecified' — not null.
    mockedColorScheme.mockReturnValue('unspecified');
    const { result } = await renderHook(() => useTheme());

    expect(result.current.scheme).toBe('light');
    expect(result.current.colors).toBe(lightColors);
  });

  it('exposes the same token scales in both schemes', async () => {
    const { result } = await renderHook(() => useTheme());
    expect(result.current.spacing.md).toBe(12);
    expect(result.current.radius.bubble).toBe(18);
  });

  it('defines every colour key in both palettes, so dark mode cannot have holes', async () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });
});
