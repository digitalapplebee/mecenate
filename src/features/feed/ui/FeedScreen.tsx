import { useRef } from 'react';

import { observer } from 'mobx-react-lite';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { useRootStore } from '../../../core/stores/RootStoreProvider';
import { colors, spacing, typography } from '../../../shared/theme/tokens';
import type { Post } from '../api/feed.types';
import { useFeedQuery } from '../hooks/useFeedQuery';
import type { FeedTierFilter } from '../model/FeedFiltersStore';
import { FeedCard } from './FeedCard';
import { FeedFilter } from './FeedFilter';
import { FeedSkeletonList } from './FeedSkeleton';
import { FeedStateCard } from './FeedStateCard';

export const FeedScreen = observer(function FeedScreen() {
  const { feedFiltersStore } = useRootStore();
  const listRef = useRef<FlatList<Post>>(null);
  const query = useFeedQuery(feedFiltersStore.apiTier);
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  const isInitialLoading = query.isPending;
  const isRefreshing =
    query.isRefetching && !query.isFetchingNextPage && !query.isPending;
  const showInitialError = query.isError && posts.length === 0;
  const showEmptyState = !query.isPending && !query.isError && posts.length === 0;
  const shouldCenterState = isInitialLoading || showInitialError || showEmptyState;

  const handleRefresh = () => {
    void query.refetch();
  };

  const handleLoadMore = () => {
    if (!query.hasNextPage || query.isFetchingNextPage) {
      return;
    }

    void query.fetchNextPage();
  };

  const handleEmptyAction = () => {
    feedFiltersStore.reset();
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const handleFilterChange = (nextTier: FeedTierFilter) => {
    if (nextTier === feedFiltersStore.tier) {
      return;
    }

    feedFiltersStore.setTier(nextTier);
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <FlatList<Post>
          ref={listRef}
          contentContainerStyle={[
            styles.content,
            shouldCenterState ? styles.contentCentered : undefined,
          ]}
          data={posts}
          ItemSeparatorComponent={ItemSeparator}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            isInitialLoading ? (
              <FeedSkeletonList />
            ) : showInitialError ? (
              <FeedStateCard
                actionLabel="Повторить"
                onPress={handleRefresh}
                title="Не удалось загрузить публикации"
                variant="error"
              />
            ) : showEmptyState ? (
              <FeedStateCard
                actionLabel="Показать всё"
                onPress={handleEmptyAction}
                title="По вашему запросу ничего не найдено"
                variant="empty"
              />
            ) : null
          }
          ListFooterComponent={
            posts.length > 0 ? (
              <FeedFooter
                hasNextPage={Boolean(query.hasNextPage)}
                isFetchNextPageError={query.isFetchNextPageError}
                isFetchingNextPage={query.isFetchingNextPage}
                onRetry={handleLoadMore}
              />
            ) : (
              <View style={styles.emptyFooterSpace} />
            )
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>Лента авторов</Text>
                <Text style={styles.headerSubtitle}>
                  Публикации можно быстро отфильтровать по типу доступа.
                </Text>
              </View>
              <FeedFilter
                onChange={handleFilterChange}
                value={feedFiltersStore.tier}
              />
            </View>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <FeedCard post={item} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
});

function ItemSeparator() {
  return <View style={styles.separator} />;
}

type FeedFooterProps = {
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  onRetry: () => void;
};

function FeedFooter({
  hasNextPage,
  isFetchNextPageError,
  isFetchingNextPage,
  onRetry,
}: FeedFooterProps) {
  if (isFetchingNextPage) {
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (isFetchNextPageError) {
    return (
      <FeedStateCard
        compact
        actionLabel="Попробовать снова"
        onPress={onRetry}
        title="Не удалось загрузить еще публикации"
        variant="error"
      />
    );
  }

  if (!hasNextPage) {
    return (
      <View style={styles.footer}>
        <Text style={styles.footerText}>Вы дошли до конца ленты</Text>
      </View>
    );
  }

  return <View style={styles.footerSpacer} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  contentCentered: {
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  header: {
    paddingBottom: spacing.md,
  },
  headerCopy: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.fontSize.xxl,
    lineHeight: 38,
  },
  headerSubtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  separator: {
    height: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  footerSpacer: {
    height: spacing.xl,
  },
  emptyFooterSpace: {
    height: spacing.xl,
  },
});
