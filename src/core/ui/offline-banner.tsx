import { useTranslation } from 'react-i18next';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '../network/network-info';
import { useTheme } from '../theme/use-theme';

/** Renders nothing while online, so it costs a single boolean subscription. */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();
  // The banner sits above the navigator, at the very top of an edge-to-edge window, so
  // nothing else applies the status-bar inset for it. Without this it draws under the clock
  // and the camera cutout.
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <Animated.View
      entering={FadeInUp.duration(180)}
      exiting={FadeOutUp.duration(180)}
      accessible
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: colors.danger,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.sm,
          paddingTop: insets.top + spacing.sm,
        },
      ]}
    >
      <Text style={[typography.caption, { color: colors.onAccent }]}>{t('common.offline')}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { alignItems: 'center', width: '100%' },
});
