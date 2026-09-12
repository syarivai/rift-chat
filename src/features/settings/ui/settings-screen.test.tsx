import { fireEvent, render, screen } from '@testing-library/react-native';

import { useAppStore } from '@/core/store/store';
import { SettingsScreen } from './settings-screen';

jest.mock('@/core/i18n', () => ({
  ...jest.requireActual('@/core/i18n'),
  changeLanguage: jest.fn(),
}));

beforeEach(() => {
  useAppStore.setState({ language: 'system', theme: 'system' });
});

describe('SettingsScreen', () => {
  it('offers every language including the system default', async () => {
    await render(<SettingsScreen />);

    // Endonyms, not translations — a language picker shows each language in its own words.
    for (const label of [
      'settings.languageSystem',
      'English',
      'Bahasa Melayu',
      'Bahasa Indonesia',
    ]) {
      expect(screen.getByRole('radio', { name: label })).toBeOnTheScreen();
    }
  });

  it('persists the chosen language to the store', async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'Bahasa Melayu' }));

    expect(useAppStore.getState().language).toBe('ms');
  });

  it('persists the chosen theme to the store', async () => {
    await render(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'settings.themeDark' }));

    expect(useAppStore.getState().theme).toBe('dark');
  });

  it('marks the active choice as selected, so the picker reflects stored state', async () => {
    useAppStore.setState({ theme: 'light' });
    await render(<SettingsScreen />);

    expect(
      screen.getByRole('radio', { name: 'settings.themeLight', selected: true }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'settings.themeDark', selected: false }),
    ).toBeOnTheScreen();
  });

  it('reads the version from the build rather than a literal', async () => {
    await render(<SettingsScreen />);
    expect(screen.getByText('settings.version')).toBeOnTheScreen();
  });
});
