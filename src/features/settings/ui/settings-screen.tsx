import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { changeLanguage, SUPPORTED_LANGUAGES } from '@/core/i18n';
import { useAppStore } from '@/core/store/store';
import type { Language, ThemeChoice } from '@/core/store/types';
import { useTheme } from '@/core/theme/use-theme';
import { Button } from '@/core/ui/button';
import { Screen } from '@/core/ui/screen';

const DEVELOPER_NAME = 'Muhammad Syarif Abdullah';

const LANGUAGE_OPTIONS: Language[] = ['system', ...SUPPORTED_LANGUAGES];
const THEME_OPTIONS: ThemeChoice[] = ['system', 'light', 'dark'];

export function SettingsScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const language = useAppStore((state) => state.language);
  const theme = useAppStore((state) => state.theme);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setTheme = useAppStore((state) => state.setTheme);

  // Read from the build, never hardcoded — so it cannot drift from what was shipped.
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}>
        <Section title={t('settings.developer')}>
          <Row label={DEVELOPER_NAME} />
        </Section>

        <Section title={t('settings.version')}>
          <Row label={version} />
        </Section>

        <Section title={t('settings.language')}>
          <View style={[styles.options, { gap: spacing.sm }]}>
            {LANGUAGE_OPTIONS.map((option) => (
              <Button
                key={option}
                label={languageLabel(option, t)}
                variant="chip"
                role="radio"
                selected={language === option}
                onPress={() => {
                  setLanguage(option);
                  changeLanguage();
                }}
              />
            ))}
          </View>
        </Section>

        <Section title={t('settings.theme')}>
          <View style={[styles.options, { gap: spacing.sm }]}>
            {THEME_OPTIONS.map((option) => (
              <Button
                key={option}
                label={themeLabel(option, t)}
                variant="chip"
                role="radio"
                selected={theme === option}
                onPress={() => setTheme(option)}
              />
            ))}
          </View>
        </Section>
      </ScrollView>
    </Screen>
  );
}

type Translate = ReturnType<typeof useTranslation>['t'];

function languageLabel(option: Language, t: Translate): string {
  if (option === 'system') return t('settings.languageSystem');
  return { en: 'English', ms: 'Bahasa Melayu', id: 'Bahasa Indonesia' }[option];
}

function themeLabel(option: ThemeChoice, t: Translate): string {
  return {
    system: t('settings.themeSystem'),
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
  }[option];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.caption, { color: colors.textMuted }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label }: { label: string }) {
  const { colors, typography } = useTheme();
  return <Text style={[typography.body, { color: colors.text }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  options: { flexDirection: 'row', flexWrap: 'wrap' },
});
