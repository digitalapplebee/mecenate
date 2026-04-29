import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

import * as Haptics from 'expo-haptics';
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
import { useFeedRealtime } from '../hooks/useFeedRealtime';
import type { FeedTierFilter } from '../model/FeedFiltersStore';
import { FeedCard } from './FeedCard';
import { FeedFilter } from './FeedFilter';
import { FeedSkeletonList } from './FeedSkeleton';
import { FeedStateCard } from './FeedStateCard';
import type { PostTransitionOrigin } from './postTransition';

type FeedScreenProps = {
  hiddenPostId?: string | null;
  isPostOpen?: boolean;
  onOpenPost: (post: Post, origin?: PostTransitionOrigin) => void;
};

export const FeedScreen = observer(function FeedScreen({
  hiddenPostId = null,
  isPostOpen = false,
  onOpenPost,
}: FeedScreenProps) {
  const { feedFiltersStore } = useRootStore();
  const listRef = useRef<FlatList<Post>>(null);
  const isDraggingListRef = useRef(false);
  const lastScrollAtRef = useRef(0);
  const releaseScrollGateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [isScrollGestureActive, setScrollGestureActive] = useState(false);
  const [isManualRefreshing, setManualRefreshing] = useState(false);
  const query = useFeedQuery(feedFiltersStore.apiTier);
  useFeedRealtime();
  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  const isInitialLoading = query.isPending;
  const showInitialError = query.isError && posts.length === 0;
  const showEmptyState = !query.isPending && !query.isError && posts.length === 0;
  const shouldCenterState = isInitialLoading || showInitialError || showEmptyState;

  useEffect(
    () => () => {
      if (releaseScrollGateTimeoutRef.current) {
        clearTimeout(releaseScrollGateTimeoutRef.current);
      }
    },
    [],
  );

  const releaseScrollGate = useCallback((delay = 0) => {
    if (releaseScrollGateTimeoutRef.current) {
      clearTimeout(releaseScrollGateTimeoutRef.current);
    }

    releaseScrollGateTimeoutRef.current = setTimeout(() => {
      isDraggingListRef.current = false;
      setScrollGestureActive(false);
    }, delay);
  }, []);

  const markScrollGestureActive = useCallback(() => {
    if (releaseScrollGateTimeoutRef.current) {
      clearTimeout(releaseScrollGateTimeoutRef.current);
    }

    isDraggingListRef.current = true;
    lastScrollAtRef.current = Date.now();
    setScrollGestureActive(true);
  }, []);

  const handleRefresh = useCallback(() => {
    setManualRefreshing(true);
    void query.refetch().finally(() => {
      setManualRefreshing(false);
    });
  }, [query]);

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

    void Haptics.selectionAsync();
    feedFiltersStore.setTier(nextTier);
    listRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  const handleOpenPost = useCallback(
    (post: Post, origin?: PostTransitionOrigin) => {
      const hasJustScrolled = Date.now() - lastScrollAtRef.current < 220;

      if (isDraggingListRef.current || hasJustScrolled) {
        return;
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onOpenPost(post, origin);
    },
    [onOpenPost],
  );

  const handleScroll = useCallback(
    (_event: NativeSyntheticEvent<NativeScrollEvent>) => {
      lastScrollAtRef.current = Date.now();
    },
    [],
  );

  const handleScrollEndDrag = useCallback(() => {
    releaseScrollGate(260);
  }, [releaseScrollGate]);

  const handleMomentumScrollBegin = useCallback(() => {
    markScrollGestureActive();
  }, [markScrollGestureActive]);

  const handleMomentumScrollEnd = useCallback(() => {
    releaseScrollGate(120);
  }, [releaseScrollGate]);

  return (
    <View
      pointerEvents={isPostOpen ? 'none' : 'auto'}
      style={styles.screen}
    >
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
              <FeedFilter
                onChange={handleFilterChange}
                value={feedFiltersStore.tier}
              />
            </View>
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          onMomentumScrollBegin={handleMomentumScrollBegin}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          onScroll={handleScroll}
          onScrollBeginDrag={markScrollGestureActive}
          onScrollEndDrag={handleScrollEndDrag}
          refreshControl={
            <RefreshControl
              onRefresh={handleRefresh}
              refreshing={isManualRefreshing}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <FeedCard
              isHidden={item.id === hiddenPostId}
              isOpenDisabled={isScrollGestureActive}
              onOpen={handleOpenPost}
              post={item}
            />
          )}
          scrollEventThrottle={16}
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
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  contentCentered: {
    justifyContent: 'flex-start',
    paddingTop: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
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
