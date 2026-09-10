import { useTranslation } from 'react-i18next';

import { Screen } from '@/core/ui/screen';
import { EmptyState } from '@/core/ui/states';

/** Placeholder until T-2.4 builds the real contacts list. */
export default function ChatsScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <EmptyState message={t('chats.empty')} />
    </Screen>
  );
}
