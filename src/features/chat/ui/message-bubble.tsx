import Ionicons from '@expo/vector-icons/Ionicons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { relativeTime } from '@/core/format/relative-time';
import { spacing } from '@/core/theme/tokens';
import { useTheme } from '@/core/theme/use-theme';
import type { Message } from '../api/use-messages';

type Props = {
  message: Message;
  onRetry: (localId: string) => void;
  /**
   * Only the newest bubble animates in. `entering` fires on mount, and a FlatList mounts rows
   * as they scroll into the window — animating every bubble would replay the effect while
   * scrolling instead of only when a message arrives.
   */
  animate?: boolean;
};

function MessageBubbleComponent({ message, onRetry, animate = false }: Props) {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();

  const isOutgoing = message.kind === 'outgoing';
  const body = isOutgoing ? message.message.body : message.body;
  const createdAt = isOutgoing ? message.message.createdAt : message.createdAt;
  const status = isOutgoing ? message.message.status : null;
  const failed = status === 'failed';

  const bubble = (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: isOutgoing ? colors.bubbleOut : colors.bubbleIn,
          borderRadius: radius.bubble,
          padding: spacing.md,
          borderWidth: failed ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.danger,
        },
      ]}
    >
      <Text
        style={[typography.body, { color: isOutgoing ? colors.onBubbleOut : colors.onBubbleIn }]}
      >
        {body}
      </Text>
    </View>
  );

  const Container = animate ? Animated.View : View;

  return (
    <Container
      entering={animate ? FadeInDown.duration(180) : undefined}
      style={[
        styles.row,
        { paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
        isOutgoing ? styles.alignEnd : styles.alignStart,
      ]}
    >
      {failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.failed')}
          onPress={() => onRetry(message.kind === 'outgoing' ? message.message.localId : '')}
        >
          {bubble}
        </Pressable>
      ) : (
        bubble
      )}

      <View style={[styles.meta, { gap: spacing.xs }]}>
        <Text style={[typography.micro, { color: failed ? colors.danger : colors.textMuted }]}>
          {failed ? t('chat.failed') : relativeTime(createdAt, t)}
        </Text>
        {/* Status is carried by an icon as well as colour — colour alone is not an accessible
            signal — and each icon is labelled, because an unlabelled one is invisible to a
            screen reader and would leave colour doing the work again. */}
        {status === 'sending' ? (
          <Ionicons
            name="time-outline"
            size={12}
            color={colors.textMuted}
            accessibilityLabel={t('chat.sending')}
          />
        ) : null}
        {status === 'sent' ? (
          <Ionicons
            name="checkmark"
            size={12}
            color={colors.success}
            accessibilityLabel={t('chat.sent')}
          />
        ) : null}
        {failed ? (
          <Ionicons
            name="refresh"
            size={12}
            color={colors.danger}
            accessibilityLabel={t('chat.failed')}
          />
        ) : null}
      </View>
    </Container>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

const styles = StyleSheet.create({
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  bubble: { maxWidth: '80%' },
  meta: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs },
  row: { width: '100%' },
});
