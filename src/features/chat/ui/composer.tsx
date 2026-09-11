import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/core/theme/use-theme';
import { MAX_MESSAGE_LENGTH } from '../api/use-send-message';

export function Composer({ onSend }: { onSend: (body: string) => void }) {
  const { colors, spacing, radius, typography } = useTheme();
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  const canSend = value.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue(''); // cleared immediately; the keyboard stays open for the next message
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          padding: spacing.sm,
          gap: spacing.sm,
        },
      ]}
    >
      <TextInput
        accessibilityLabel={t('chat.composerPlaceholder')}
        placeholder={t('chat.composerPlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        maxLength={MAX_MESSAGE_LENGTH}
        multiline
        style={[
          typography.body,
          styles.input,
          {
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.lg,
            color: colors.text,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('chat.send')}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={submit}
        style={[
          styles.send,
          {
            backgroundColor: canSend ? colors.accent : colors.surfaceMuted,
            borderRadius: radius.full,
          },
        ]}
      >
        <Ionicons name="send" size={18} color={canSend ? colors.onAccent : colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'flex-end', borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row' },
  input: { flex: 1, maxHeight: 120 },
  send: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
});
