import { useTranslation } from 'react-i18next';

import { Screen } from '@/core/ui/screen';
import { EmptyState } from '@/core/ui/states';

/** Placeholder until Phase 5 builds the real Settings screen. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState message={t('settings.title')} />
    </Screen>
  );
}
