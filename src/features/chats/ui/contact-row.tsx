import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Contact } from '@/core/api/types';
import { relativeTime } from '@/core/format/relative-time';
import { spacing } from '@/core/theme/tokens';
import { useShallow } from 'zustand/react/shallow';

import { useAppStore } from '@/core/store/store';
import { useTheme } from '@/core/theme/use-theme';
import { Avatar } from '@/core/ui/avatar';
import { selectLastMessage } from '../model/last-message';

/** Fixed so the list can supply getItemLayout and skip measurement entirely. */
export const ROW_HEIGHT = 76;

type Props = {
  contact: Contact;
  onPress: (contactId: number) => void;
};

function ContactRowComponent({ contact, onPress }: Props) {
  const { colors, spacing, typography } = useTheme();
  const { t } = useTranslation();

  // Narrow selectors: subscribing to the whole store would re-render all 60 rows whenever
  // any unrelated value changed.
  // useShallow is required: selectLastMessage builds a fresh object every call, and an
  // unwrapped selector returning a new reference each render loops until React bails out with
  // "Maximum update depth exceeded".
  const lastMessage = useAppStore(
    useShallow((state) => selectLastMessage(state.outbox, contact.id)),
  );
  const isBlocked = useAppStore((state) => state.blockedIds.includes(contact.id));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={contact.name}
      onPress={() => onPress(contact.id)}
      style={({ pressed }) => [
        styles.row,
        {
          paddingHorizontal: spacing.lg,
          backgroundColor: pressed ? colors.surfaceMuted : colors.surface,
        },
      ]}
    >
      <Avatar uri={contact.avatar} name={contact.name} recyclingKey={String(contact.id)} />

      <View style={[styles.body, { marginLeft: spacing.md }]}>
        <View style={styles.line}>
          <Text numberOfLines={1} style={[typography.label, styles.name, { color: colors.text }]}>
            {contact.name}
          </Text>
          {lastMessage ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              {relativeTime(lastMessage.createdAt, t)}
            </Text>
          ) : null}
        </View>

        <View style={styles.line}>
          <Text
            numberOfLines={1}
            style={[
              typography.caption,
              styles.preview,
              { color: colors.textMuted, fontStyle: lastMessage ? 'normal' : 'italic' },
            ]}
          >
            {lastMessage ? lastMessage.body : t('chats.noMessages')}
          </Text>
          {isBlocked ? (
            <Text style={[typography.micro, { color: colors.danger }]}>{t('chats.blocked')}</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Memoised and declared outside the list. Without this, fetching page two re-renders every
 * already-mounted row. See docs/explanation/adr/0003-list-rendering-flatlist.md.
 */
export const ContactRow = memo(ContactRowComponent);

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: 'center' },
  line: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  name: { flex: 1, marginRight: spacing.sm },
  preview: { flex: 1, marginRight: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', height: ROW_HEIGHT },
});
