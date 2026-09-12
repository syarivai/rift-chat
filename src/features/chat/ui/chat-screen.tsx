import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppStore } from '@/core/store/store';
import { spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';
import { Avatar } from '@/core/ui/avatar';
import { Button } from '@/core/ui/button';
import { EmptyState, ErrorState, Skeleton } from '@/core/ui/states';
import { useKeyboardHeight } from '@/core/ui/use-keyboard-height';
import { useContact } from '@/features/profile/api/use-contact';
import { useSendMessage } from '../api/use-send-message';
import { useMessages } from '../api/use-messages';
import type { Message } from '../api/use-messages';
import { Composer } from './composer';
import { MessageBubble } from './message-bubble';

export function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contactId = Number(id);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, spacing, typography } = useTheme();
  const listRef = useRef<FlatList<Message>>(null);
  const keyboardHeight = useKeyboardHeight();

  const { data: contact } = useContact(contactId);
  const { messages, isPending, isError, refetch } = useMessages(contactId);
  const { send, retry } = useSendMessage(contactId);
  const isBlocked = useAppStore((state) => state.blockedIds.includes(contactId));

  // Newest message stays in view when the thread grows — and when the keyboard opens, which
  // shrinks the list without changing its content.
  useEffect(() => {
    if (messages.length > 0) listRef.current?.scrollToEnd({ animated: true });
  }, [messages.length, keyboardHeight]);

  const lastId = messages[messages.length - 1]?.id;

  const renderItem = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} onRetry={retry} animate={item.id === lastId} />
    ),
    [retry, lastId],
  );

  // Route params come from outside the app, so an unusable id renders a not-found state
  // rather than firing a garbage request.
  if (!Number.isInteger(contactId) || contactId <= 0) {
    return <EmptyState message={t('common.error')} />;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={contact?.name ?? ''}
              onPress={() => router.push(`/profile/${contactId}`)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 16 }}
              style={[styles.header, { gap: spacing.sm }]}
            >
              {contact ? <Avatar uri={contact.avatar} name={contact.name} size={32} /> : null}
              <Text numberOfLines={1} style={[typography.title, { color: colors.text }]}>
                {contact?.name ?? ''}
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={[styles.fill, { paddingBottom: keyboardHeight }]}>
        {isPending ? (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} height={44} width={i % 2 === 0 ? '60%' : '45%'} />
            ))}
          </View>
        ) : isError ? (
          <ErrorState
            message={t('chat.loadError')}
            retryLabel={t('common.retry')}
            onRetry={() => void refetch()}
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[styles.content, { paddingVertical: spacing.md }]}
            ListEmptyComponent={<EmptyState message={t('chat.empty')} />}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {isBlocked ? (
          <View
            style={[
              styles.blocked,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                padding: spacing.lg,
              },
            ]}
          >
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {t('chat.blocked')}
            </Text>
            <Button
              label={t('profile.unblock')}
              onPress={() => useAppStore.getState().toggleBlocked(contactId)}
              variant="text"
            />
          </View>
        ) : (
          <Composer onSend={send} />
        )}
      </View>
    </>
  );
}

const keyExtractor = (item: Message) => item.id;

const styles = StyleSheet.create({
  blocked: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.xs },
  content: { flexGrow: 1, justifyContent: 'flex-end' },
  fill: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row' },
});
