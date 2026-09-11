import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '../theme/use-theme';

type Variant = 'filled' | 'outlined' | 'text' | 'chip';
type Tone = 'accent' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  tone?: Tone;
  /** Chip only. Also drives accessibilityState, so a screen reader announces the selection. */
  selected?: boolean;
  disabled?: boolean;
  /** `radio` for a chip in a single-choice group; `button` otherwise. */
  role?: 'button' | 'radio';
};

/**
 * The one shared button. Four variants cover every labelled action in the app: filled (retry),
 * outlined (block), text (unblock), chip (settings pickers).
 *
 * It exists to stop the accessibility contract being re-typed at each call site — every button
 * gets a role, a label, and a disabled state without the caller remembering to add them.
 */
export function Button({
  label,
  onPress,
  variant = 'filled',
  tone = 'accent',
  selected = false,
  disabled = false,
  role = 'button',
}: Props) {
  const { colors, spacing, radius, typography } = useTheme();

  const toneColor = tone === 'danger' ? colors.danger : colors.accent;

  const shape = {
    filled: { backgroundColor: toneColor },
    outlined: { borderColor: toneColor, borderWidth: StyleSheet.hairlineWidth },
    text: { paddingHorizontal: 0, paddingVertical: spacing.xs },
    chip: {
      backgroundColor: selected ? colors.accent : colors.surfaceMuted,
      borderRadius: radius.full,
    },
  }[variant];

  const labelColor = {
    filled: colors.onAccent,
    outlined: toneColor,
    text: toneColor,
    chip: selected ? colors.onAccent : colors.text,
  }[variant];

  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: role === 'radio' ? selected : undefined }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
        shape,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[typography.label, { color: disabled ? colors.textMuted : labelColor }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
