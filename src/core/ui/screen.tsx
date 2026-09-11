import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';

/**
 * Screen background and layout.
 *
 * ponytail: no SafeAreaView here. Every screen in this app sits under a navigator header
 * (tabs or stack), and the navigator already applies the top inset — adding another produced
 * a visible double gap. Ceiling: a future full-bleed screen with no header would need its own
 * inset. Upgrade path: take an `edges` prop and wrap in SafeAreaView only when asked.
 */
export function Screen({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.root, { backgroundColor: colors.bg }]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
