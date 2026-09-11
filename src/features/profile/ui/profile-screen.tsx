import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/core/store/store';
import { useTheme } from '@/core/theme/use-theme';
import { Avatar } from '@/core/ui/avatar';
import { Button } from '@/core/ui/button';
import { Screen } from '@/core/ui/screen';
import { EmptyState, ErrorState, Skeleton } from '@/core/ui/states';
import { useContact } from '../api/use-contact';

export function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);
  const { t } = useTranslation();
  const { colors, spacing, radius, typography } = useTheme();

  const { data: contact, isPending, isError, refetch } = useContact(contactId);
  const isBlocked = useAppStore((state) => state.blockedIds.includes(contactId));
  const toggleBlocked = useAppStore((state) => state.toggleBlocked);

  if (!Number.isInteger(contactId) || contactId <= 0) {
    return (
      <Screen>
        <EmptyState message={t('common.error')} />
      </Screen>
    );
  }

  if (isPending) {
    return (
      <Screen>
        <View style={[styles.center, { padding: spacing.xl, gap: spacing.lg }]}>
          <Skeleton height={96} width={96} />
          <Skeleton height={20} width="50%" />
          <Skeleton height={16} width="40%" />
        </View>
      </Screen>
    );
  }

  if (isError || !contact) {
    return (
      <Screen>
        <ErrorState
          message={t('profile.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: t('profile.title') }} />
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}>
        <View style={[styles.center, { gap: spacing.md }]}>
          <Avatar uri={contact.avatar} name={contact.name} size={96} />
          <Text style={[typography.title, { color: colors.text }]}>{contact.name}</Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              padding: spacing.lg,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            {t('profile.phone')}
          </Text>
          <Text
            accessibilityLabel={contact.phone}
            style={[typography.body, { color: colors.text }]}
          >
            {contact.phone}
          </Text>
        </View>

        <Button
          label={isBlocked ? t('profile.unblock') : t('profile.block')}
          onPress={() => toggleBlocked(contactId)}
          variant="outlined"
          tone="danger"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, gap: 4 },
  center: { alignItems: 'center' },
});
