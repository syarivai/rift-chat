import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../theme/use-theme';

/** The list-row size. Exported so a row's separator inset can be derived rather than guessed. */
export const AVATAR_SIZE = 48;

type Props = {
  uri: string;
  name: string;
  size?: number;
  /** Must be set inside a list: without it a recycled row shows the previous contact's face. */
  recyclingKey?: string;
};

export function Avatar({ uri, name, size = AVATAR_SIZE, recyclingKey }: Props) {
  const { colors, typography } = useTheme();
  const dimensions = { width: size, height: size, borderRadius: size / 2 };

  return (
    <View style={[dimensions, styles.fallback, { backgroundColor: colors.surfaceMuted }]}>
      <Text style={[typography.label, { color: colors.textMuted }]}>{initials(name)}</Text>
      <Image
        source={uri}
        recyclingKey={recyclingKey ?? uri}
        cachePolicy="memory-disk"
        contentFit="cover"
        transition={120}
        style={[dimensions, styles.image]}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

/** Rendered underneath the image, so a failed or slow load degrades to initials for free. */
export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { position: 'absolute' },
});
