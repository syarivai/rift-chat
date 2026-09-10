import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTheme } from '../theme/use-theme';

/**
 * Reads get a skeleton, not a spinner: it matches the shape of the content that is coming, so
 * the layout does not jump when it arrives. See docs/reference/conventions.md.
 */
export function Skeleton({ height, width = '100%' }: { height: number; width?: number | string }) {
  const { colors, radius } = useTheme();
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      style={[
        styles.skeleton,
        {
          height,
          width: width as number,
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.sm,
        },
      ]}
    />
  );
}

export function EmptyState({ message }: { message: string }) {
  const { colors, spacing, typography } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.centered, { padding: spacing.xl }]}
    >
      <Text style={[typography.body, { color: colors.textMuted }]}>{message}</Text>
    </Animated.View>
  );
}

export function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <View style={[styles.centered, { padding: spacing.xl, gap: spacing.md }]}>
      <Text style={[typography.body, { color: colors.text }]}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={retryLabel}
        onPress={onRetry}
        style={[
          styles.button,
          {
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
          },
        ]}
      >
        <Text style={[typography.label, { color: colors.onAccent }]}>{retryLabel}</Text>
      </Pressable>
    </View>
  );
}

/** Only for a write that blocks the UI. A read shows a Skeleton; an optimistic write shows
 *  its own result and needs nothing here. */
export function Spinner() {
  const { colors } = useTheme();
  return <ActivityIndicator color={colors.accent} />;
}

const styles = StyleSheet.create({
  button: { alignItems: 'center' },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  skeleton: { overflow: 'hidden' },
});
