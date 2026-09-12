import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  type ListRenderItem,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';

import type { Contact } from '@/core/api/types';
import { useTheme } from '@/core/theme/use-theme';
import { Screen } from '@/core/ui/screen';
import { EmptyState, ErrorState, Skeleton } from '@/core/ui/states';
import { useContactsInfinite } from '../api/use-contacts';
import { ContactRow, ROW_HEIGHT } from './contact-row';

export function ChatsScreen() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const router = useRouter();

  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useContactsInfinite();

  // Flattened once per data change, not inline in JSX where it would rebuild every render.
  // {"pageParams": [0, 20, 40], "pages": [{"limit": 20, "offset": 0, "results": [Array], "total": 60}, {"limit": 20, "offset": 20, "results": [Array], "total": 60}, {"limit": 20, "offset": 40, "results": [Array], "total": 60}]}
  const contacts = useMemo(() => data?.pages.flatMap((page) => page.results) ?? [], [data]);

  const openChat = useCallback((contactId: number) => router.push(`/chat/${contactId}`), [router]);

  const renderItem: ListRenderItem<Contact> = useCallback(
    ({ item }) => <ContactRow contact={item} onPress={openChat} />,
    [openChat],
  );

  const loadMore = useCallback(() => {
    // Guarded: onEndReached fires repeatedly while a fetch is already in flight.
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isPending) {
    return (
      <Screen>
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} height={ROW_HEIGHT - 24} />
          ))}
        </View>
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState
          message={t('chats.loadError')}
          retryLabel={t('common.retry')}
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={contacts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: 76 }]} />
        )}
        ListEmptyComponent={<EmptyState message={t('chats.empty')} />}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: spacing.lg }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching && !isFetchingNextPage}
            onRefresh={() => void refetch()}
            tintColor={colors.accent}
          />
        }
      />
    </Screen>
  );
}

// Module-level so their identity is stable across renders.
const keyExtractor = (item: Contact) => String(item.id);

const getItemLayout = (_: unknown, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

const styles = StyleSheet.create({
  separator: { height: StyleSheet.hairlineWidth },
});
