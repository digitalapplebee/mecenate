import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

import { Feather, Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { GradientButton } from '../../../shared/components/GradientButton';
import { formatCompactCount, formatPostDate } from '../../../shared/lib/formatters';
import { colors, radii, shadows, spacing, typography } from '../../../shared/theme/tokens';
import { createComment } from '../api/feedApi';
import type { Comment, Post } from '../api/feed.types';
import { usePostCommentsQuery } from '../hooks/usePostCommentsQuery';
import { usePostQuery } from '../hooks/usePostQuery';
import { useTogglePostLikeMutation } from '../hooks/useTogglePostLikeMutation';
import {
  applyCommentAdded,
} from '../model/feedQueryCache';
import { FeedStateCard } from './FeedStateCard';
import {
  FEED_REACTION_ICON_SIZE,
  FEED_REACTION_PILL_GAP,
  FEED_REACTION_PILL_HORIZONTAL_PADDING,
  FEED_REACTION_PILL_MIN_WIDTH,
  FEED_REACTION_PILL_VERTICAL_PADDING,
  FEED_REACTION_VALUE_MIN_WIDTH,
} from './feed.constants';
import type { PostTransitionOrigin } from './postTransition';

type PostDetailScreenProps = {
  isPresented: boolean;
  onBack: () => void;
  onDismissed: () => void;
  post: Post;
  transitionOrigin: PostTransitionOrigin | null;
};

type CommentsSortOrder = 'newest' | 'oldest';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PostDetailScreen({
  isPresented,
  onBack,
  onDismissed,
  post: initialPost,
  transitionOrigin,
}: PostDetailScreenProps) {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const windowSize = useWindowDimensions();
  const transitionProgress = useSharedValue(0);
  const postQuery = usePostQuery(initialPost.id, initialPost);
  const post = postQuery.data ?? initialPost;
  const isPaidPost = post.tier === 'paid';
  const commentsQuery = usePostCommentsQuery(post.id, !isPaidPost);
  const isCommentsDataCurrentPost = useMemo(
    () =>
      !commentsQuery.data ||
      commentsQuery.data.pages.every((page) =>
        page.comments.every((comment) => comment.postId === post.id),
      ),
    [commentsQuery.data, post.id],
  );
  const comments =
    !isPaidPost && isCommentsDataCurrentPost
      ? (commentsQuery.data?.pages.flatMap((page) => page.comments) ?? [])
      : [];
  const [commentText, setCommentText] = useState('');
  const [commentsSortOrder, setCommentsSortOrder] =
    useState<CommentsSortOrder>('newest');
  const [isCommentsSortMenuOpen, setCommentsSortMenuOpen] = useState(false);
  const sortedComments = useMemo(
    () => sortComments(comments, commentsSortOrder),
    [comments, commentsSortOrder],
  );
  const sourceFrame = useMemo(
    () =>
      transitionOrigin ?? {
        height: Math.max(1, windowSize.height * 0.72),
        width: Math.max(1, windowSize.width - spacing.md * 2),
        x: spacing.md,
        y: windowSize.height * 0.16,
      },
    [transitionOrigin, windowSize.height, windowSize.width],
  );

  useEffect(() => {
    if (isPresented) {
      transitionProgress.value = withTiming(1, {
        duration: 240,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    transitionProgress.value = withSpring(
      0,
      {
        damping: 24,
        mass: 0.9,
        overshootClamping: true,
        stiffness: 180,
      },
      (finished) => {
        if (finished) {
          runOnJS(onDismissed)();
        }
      },
    );
  }, [isPresented, onDismissed, transitionProgress]);

  const screenTransitionStyle = useAnimatedStyle(() => ({
    borderRadius: interpolate(transitionProgress.value, [0, 1], [radii.card, 0]),
    height: interpolate(
      transitionProgress.value,
      [0, 1],
      [sourceFrame.height, windowSize.height],
    ),
    left: interpolate(transitionProgress.value, [0, 1], [sourceFrame.x, 0]),
    top: interpolate(transitionProgress.value, [0, 1], [sourceFrame.y, 0]),
    width: interpolate(
      transitionProgress.value,
      [0, 1],
      [sourceFrame.width, windowSize.width],
    ),
  }));

  const detailTransitionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0, 0.42, 1], [0, 0, 1]),
    transform: [
      {
        translateY: interpolate(transitionProgress.value, [0, 1], [18, 0]),
      },
    ],
  }));

  const heroTransitionStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transitionProgress.value, [0, 0.18, 0.48], [1, 0.92, 0]),
    transform: [
      {
        scale: interpolate(transitionProgress.value, [0, 1], [1, 1.04]),
      },
    ],
  }));

  const scrimTransitionStyle = useAnimatedStyle(() => ({
    opacity: transitionProgress.value * 0.1,
  }));

  const toggleLikeMutation = useTogglePostLikeMutation(post);

  const createCommentMutation = useMutation({
    mutationFn: (text: string) => createComment(post.id, text),
    onSuccess: (comment) => {
      setCommentText('');
      applyCommentAdded(queryClient, comment);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleBack = useCallback(() => {
    if (!isPresented) {
      return;
    }

    void Haptics.selectionAsync();
    onBack();
  }, [isPresented, onBack]);

  const handleLikePress = useCallback(() => {
    if (toggleLikeMutation.isPending || post.tier === 'paid') {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleLikeMutation.reset();
    toggleLikeMutation.mutate(undefined, {
      onError: () => {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  }, [post.tier, toggleLikeMutation]);

  const handleLoadMoreComments = useCallback(() => {
    if (!commentsQuery.hasNextPage || commentsQuery.isFetchingNextPage) {
      return;
    }

    void commentsQuery.fetchNextPage();
  }, [commentsQuery]);

  const handleSendComment = useCallback(() => {
    const nextCommentText = commentText.trim();

    if (isPaidPost || !nextCommentText || createCommentMutation.isPending) {
      return;
    }

    createCommentMutation.reset();
    createCommentMutation.mutate(nextCommentText);
  }, [commentText, createCommentMutation, isPaidPost]);

  const handleToggleCommentsSortMenu = useCallback(() => {
    void Haptics.selectionAsync();
    setCommentsSortMenuOpen((isOpen) => !isOpen);
  }, []);

  const handleSelectCommentsSort = useCallback((sortOrder: CommentsSortOrder) => {
    void Haptics.selectionAsync();
    setCommentsSortOrder(sortOrder);
    setCommentsSortMenuOpen(false);
  }, []);

  const handleCommentTextChange = useCallback(
    (nextText: string) => {
      if (createCommentMutation.isError) {
        createCommentMutation.reset();
      }

      setCommentText(nextText);
    },
    [createCommentMutation],
  );

  const canSendComment =
    !isPaidPost &&
    commentText.trim().length > 0 &&
    !createCommentMutation.isPending;
  const showCommentsLoader =
    !isPaidPost && (commentsQuery.isPending || !isCommentsDataCurrentPost);
  const inputPanelStyle = [
    styles.inputPanel,
    {
      paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm),
    },
  ];

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <Animated.View
        pointerEvents="none"
        style={[styles.overlayScrim, scrimTransitionStyle]}
      />
      <Animated.View style={[styles.screen, screenTransitionStyle]}>
        <Animated.View
          pointerEvents="none"
          style={[styles.transitionSnapshot, heroTransitionStyle]}
        >
          <TransitionCardSnapshot post={post} />
        </Animated.View>
        <Animated.View style={[styles.detailSurface, detailTransitionStyle]}>
          <SafeAreaView edges={['top']} style={styles.safeArea}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoidingView}
            >
              <View style={styles.navbar}>
                <Pressable
                  accessibilityLabel="Вернуться к ленте"
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={handleBack}
                  style={styles.backButton}
                >
                  <Feather
                    color={colors.textPrimary}
                    name="chevron-left"
                    size={26}
                  />
                </Pressable>
                <Text numberOfLines={1} style={styles.navTitle}>
                  Публикация
                </Text>
                <View style={styles.navSpacer} />
              </View>

              <FlatList<Comment>
                key={post.id}
                contentContainerStyle={styles.content}
                data={sortedComments}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                  showCommentsLoader ? (
                    <View style={styles.commentsLoader}>
                      <ActivityIndicator color={colors.primary} size="small" />
                    </View>
                  ) : !isPaidPost && commentsQuery.isError ? (
                    <FeedStateCard
                      compact
                      actionLabel="Повторить"
                      onPress={() => void commentsQuery.refetch()}
                      title="Не удалось загрузить комментарии"
                      variant="error"
                    />
                  ) : null
                }
                ListFooterComponent={
                  isPaidPost ? null : (
                    <CommentsFooter
                      hasNextPage={Boolean(commentsQuery.hasNextPage)}
                      isError={commentsQuery.isFetchNextPageError}
                      isFetchingNextPage={commentsQuery.isFetchingNextPage}
                      onRetry={handleLoadMoreComments}
                    />
                  )
                }
                ListHeaderComponent={
                  <PostDetailHeader
                    commentsCount={post.commentsCount}
                    isCommentsSortMenuOpen={isCommentsSortMenuOpen}
                    commentsSortOrder={commentsSortOrder}
                    isLikeError={toggleLikeMutation.isError}
                    isLikePending={toggleLikeMutation.isPending}
                    onLikePress={handleLikePress}
                    onSelectCommentsSort={handleSelectCommentsSort}
                    onToggleCommentsSortMenu={handleToggleCommentsSortMenu}
                    post={post}
                  />
                }
                ListHeaderComponentStyle={styles.listHeader}
                onEndReached={isPaidPost ? undefined : handleLoadMoreComments}
                onEndReachedThreshold={0.35}
                renderItem={({ item }) => <CommentRow comment={item} />}
                showsVerticalScrollIndicator={false}
              />

              {isPaidPost ? null : (
                <View style={inputPanelStyle}>
                  <View style={styles.inputRow}>
                    <TextInput
                      maxLength={500}
                      multiline
                      onChangeText={handleCommentTextChange}
                      onSubmitEditing={handleSendComment}
                      placeholder="Ваш комментарий"
                      placeholderTextColor={colors.textMuted}
                      returnKeyType="send"
                      style={styles.input}
                      value={commentText}
                    />
                    <Pressable
                      accessibilityLabel="Отправить комментарий"
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !canSendComment }}
                      disabled={!canSendComment}
                      hitSlop={8}
                      onPress={handleSendComment}
                      style={[
                        styles.sendButton,
                        canSendComment ? styles.sendButtonActive : undefined,
                      ]}
                    >
                      {createCommentMutation.isPending ? (
                        <ActivityIndicator color={colors.surface} size="small" />
                      ) : (
                        <Ionicons color={colors.surface} name="send" size={18} />
                      )}
                    </Pressable>
                  </View>
                  {createCommentMutation.isError ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={styles.inputError}
                    >
                      Не удалось отправить комментарий. Попробуйте еще раз.
                    </Text>
                  ) : null}
                </View>
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

type TransitionCardSnapshotProps = {
  post: Post;
};

function TransitionCardSnapshot({ post }: TransitionCardSnapshotProps) {
  const isPaidPost = post.tier === 'paid';

  return (
    <View style={styles.snapshotCard}>
      <View style={styles.snapshotHeader}>
        <Image
          contentFit="cover"
          source={{ uri: post.author.avatarUrl }}
          style={styles.snapshotAvatar}
        />
        <Text numberOfLines={1} style={styles.snapshotAuthorName}>
          {post.author.displayName}
        </Text>
      </View>
      <View style={styles.snapshotCoverContainer}>
        <Image
          contentFit="cover"
          source={{ uri: post.coverUrl }}
          style={styles.snapshotCover}
        />
        {isPaidPost ? (
          <View style={styles.snapshotPaywall}>
            <LinearGradient
              colors={[colors.overlayStart, colors.overlayEnd]}
              style={StyleSheet.absoluteFill}
            />
            <Ionicons color={colors.surface} name="wallet" size={18} />
          </View>
        ) : null}
      </View>
      <View style={styles.snapshotContent}>
        <Text numberOfLines={2} style={styles.snapshotTitle}>
          {post.title}
        </Text>
        <Text numberOfLines={2} style={styles.snapshotBody}>
          {isPaidPost ? 'Полный текст доступен после доната.' : post.preview}
        </Text>
        <View style={styles.snapshotStatsRow}>
          <View
            style={[
              styles.snapshotStatPill,
              post.isLiked ? styles.snapshotStatPillActive : undefined,
            ]}
          >
            <Ionicons
              color={post.isLiked ? colors.surface : colors.textMuted}
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={FEED_REACTION_ICON_SIZE}
            />
            <Text
              style={[
                styles.snapshotStatValue,
                post.isLiked ? styles.snapshotStatValueActive : undefined,
              ]}
            >
              {formatCompactCount(post.likesCount)}
            </Text>
          </View>
          <View style={styles.snapshotStatPill}>
            <Ionicons
              color={colors.textMuted}
              name="chatbubble-outline"
              size={FEED_REACTION_ICON_SIZE}
            />
            <Text style={styles.snapshotStatValue}>
              {formatCompactCount(post.commentsCount)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

type PostDetailHeaderProps = {
  commentsCount: number;
  commentsSortOrder: CommentsSortOrder;
  isCommentsSortMenuOpen: boolean;
  isLikeError: boolean;
  isLikePending: boolean;
  onLikePress: () => void;
  onSelectCommentsSort: (sortOrder: CommentsSortOrder) => void;
  onToggleCommentsSortMenu: () => void;
  post: Post;
};

const PostDetailHeader = memo(function PostDetailHeader({
  commentsCount,
  commentsSortOrder,
  isCommentsSortMenuOpen,
  isLikeError,
  isLikePending,
  onLikePress,
  onSelectCommentsSort,
  onToggleCommentsSortMenu,
  post,
}: PostDetailHeaderProps) {
  const isPaidPost = post.tier === 'paid';
  const createdAt = formatPostDate(post.createdAt);

  return (
    <View>
      <Animated.View
        entering={FadeInDown.duration(220).delay(40)}
        style={styles.authorCard}
      >
        <Image
          contentFit="cover"
          source={{ uri: post.author.avatarUrl }}
          style={styles.avatar}
          transition={200}
        />
        <View style={styles.authorContent}>
          <View style={styles.authorRow}>
            <Text numberOfLines={1} style={styles.authorName}>
              {post.author.displayName}
            </Text>
            {post.author.isVerified ? (
              <Ionicons color={colors.info} name="checkmark-circle" size={16} />
            ) : null}
          </View>
          <Text numberOfLines={2} style={styles.authorBio}>
            {post.author.bio}
          </Text>
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(240).delay(80)}
        style={styles.coverContainer}
      >
        <Image
          contentFit="cover"
          source={{ uri: post.coverUrl }}
          style={styles.cover}
          transition={250}
        />

        {isPaidPost ? <PaidOverlay /> : null}
      </Animated.View>

      <Animated.View
        entering={FadeInDown.duration(260).delay(120)}
        style={styles.bodySection}
      >
        <View style={[styles.metaRow, !isPaidPost ? styles.metaRowFree : undefined]}>
          {isPaidPost ? (
            <View style={styles.tierBadge}>
              <Ionicons color={colors.primary} name="lock-closed" size={14} />
              <Text style={[styles.tierLabel, styles.tierLabelPaid]}>
                Платный пост
              </Text>
            </View>
          ) : null}
          {createdAt ? <Text style={styles.createdAt}>{createdAt}</Text> : null}
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.bodyText}>
          {isPaidPost
            ? post.preview || 'Полный текст откроется после доната.'
            : post.body}
        </Text>

        {isPaidPost ? (
          <View style={styles.lockedNotice}>
            <Ionicons color={colors.primary} name="wallet" size={18} />
            <Text style={styles.lockedNoticeText}>
              Полная версия публикации доступна после доната. В демо оплата
              отключена.
            </Text>
          </View>
        ) : null}

        {isPaidPost ? null : (
          <View style={styles.statsRow}>
            <PostLikeButton
              disabled={isLikePending}
              isLiked={post.isLiked}
              likesCount={post.likesCount}
              onPress={onLikePress}
            />
            <StatPill icon="comment" value={commentsCount} />
          </View>
        )}
        {!isPaidPost && isLikeError ? (
          <Text accessibilityLiveRegion="polite" style={styles.likeError}>
            Не удалось обновить лайк. Попробуйте еще раз.
          </Text>
        ) : null}
      </Animated.View>

      {isPaidPost ? null : (
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>
            {formatCommentsTitle(commentsCount)}
          </Text>
          <Pressable
            accessibilityLabel="Изменить порядок комментариев"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onToggleCommentsSortMenu}
            style={styles.commentsSortButton}
          >
            <Text style={styles.commentsSort}>
              {commentsSortOrder === 'newest'
                ? 'Сначала новые'
                : 'Сначала старые'}
            </Text>
            <Feather
              color={colors.primary}
              name={isCommentsSortMenuOpen ? 'chevron-up' : 'chevron-down'}
              size={16}
            />
          </Pressable>
          {isCommentsSortMenuOpen ? (
            <View style={styles.commentsSortMenu}>
              <SortMenuOption
                label="Сначала новые"
                selected={commentsSortOrder === 'newest'}
                sortOrder="newest"
                onSelect={onSelectCommentsSort}
              />
              <SortMenuOption
                label="Сначала старые"
                selected={commentsSortOrder === 'oldest'}
                sortOrder="oldest"
                onSelect={onSelectCommentsSort}
              />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
});

type PostLikeButtonProps = {
  disabled: boolean;
  isLiked: boolean;
  likesCount: number;
  onPress: () => void;
};

type SortMenuOptionProps = {
  label: string;
  onSelect: (sortOrder: CommentsSortOrder) => void;
  selected: boolean;
  sortOrder: CommentsSortOrder;
};

function SortMenuOption({
  label,
  onSelect,
  selected,
  sortOrder,
}: SortMenuOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onSelect(sortOrder)}
      style={[
        styles.commentsSortMenuOption,
        selected ? styles.commentsSortMenuOptionSelected : undefined,
      ]}
    >
      <Text
        style={[
          styles.commentsSortMenuLabel,
          selected ? styles.commentsSortMenuLabelSelected : undefined,
        ]}
      >
        {label}
      </Text>
      {selected ? (
        <Feather color={colors.primary} name="check" size={14} />
      ) : null}
    </Pressable>
  );
}

function PostLikeButton({
  disabled,
  isLiked,
  likesCount,
  onPress,
}: PostLikeButtonProps) {
  const buttonScale = useSharedValue(1);
  const countScale = useSharedValue(1);
  const previousLikesCount = useRef(likesCount);

  useEffect(() => {
    if (previousLikesCount.current === likesCount) {
      return;
    }

    previousLikesCount.current = likesCount;
    countScale.value = withSequence(
      withTiming(1.18, { duration: 120 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
  }, [countScale, likesCount]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const countAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countScale.value }],
  }));

  const handlePress = useCallback(() => {
    buttonScale.value = withSequence(
      withTiming(1.12, { duration: 90 }),
      withSpring(1, { damping: 12, stiffness: 220 }),
    );
    onPress();
  }, [buttonScale, onPress]);

  return (
    <AnimatedPressable
      accessibilityLabel={isLiked ? 'Убрать лайк' : 'Поставить лайк'}
      accessibilityRole="button"
      accessibilityState={{ checked: isLiked, disabled }}
      disabled={disabled}
      onPress={handlePress}
      style={[
        styles.likeButton,
        isLiked ? styles.likeButtonActive : undefined,
        disabled ? styles.likeButtonDisabled : undefined,
        buttonAnimatedStyle,
      ]}
    >
      <Ionicons
        color={isLiked ? colors.surface : colors.textMuted}
        name={isLiked ? 'heart' : 'heart-outline'}
        size={FEED_REACTION_ICON_SIZE}
      />
      <Animated.Text
        style={[
          styles.likeValue,
          isLiked ? styles.likeValueActive : undefined,
          countAnimatedStyle,
        ]}
      >
        {formatCompactCount(likesCount)}
      </Animated.Text>
    </AnimatedPressable>
  );
}

type StatPillProps = {
  icon: 'comment';
  value: number;
};

function StatPill({ value }: StatPillProps) {
  return (
    <View style={styles.statPill}>
      <Ionicons
        color={colors.textMuted}
        name="chatbubble-outline"
        size={FEED_REACTION_ICON_SIZE}
      />
      <Text style={styles.statValue}>{formatCompactCount(value)}</Text>
    </View>
  );
}

type CommentRowProps = {
  comment: Comment;
};

const CommentRow = memo(function CommentRow({ comment }: CommentRowProps) {
  const createdAt = formatPostDate(comment.createdAt);
  const [isLiked, setLiked] = useState(Boolean(comment.isLiked));
  const [likesCount, setLikesCount] = useState(comment.likesCount ?? 0);

  useEffect(() => {
    setLiked(Boolean(comment.isLiked));
    setLikesCount(comment.likesCount ?? 0);
  }, [comment.id, comment.isLiked, comment.likesCount]);

  const handleCommentLikePress = useCallback(() => {
    const nextIsLiked = !isLiked;

    // The current comments API has no like endpoint, so this mirrors the design locally.
    setLiked(nextIsLiked);
    setLikesCount((currentCount) =>
      Math.max(0, currentCount + (nextIsLiked ? 1 : -1)),
    );
    void Haptics.selectionAsync();
  }, [isLiked]);

  return (
    <View style={styles.commentRow}>
      <Image
        contentFit="cover"
        source={{ uri: comment.author.avatarUrl }}
        style={styles.commentAvatar}
        transition={160}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentMeta}>
          <Text numberOfLines={1} style={styles.commentAuthor}>
            {comment.author.displayName}
          </Text>
          {createdAt ? <Text style={styles.commentDate}>{createdAt}</Text> : null}
        </View>
        <View style={styles.commentBodyRow}>
          <Text style={styles.commentText}>{comment.text}</Text>
          <Pressable
            accessibilityLabel={
              isLiked ? 'Убрать лайк с комментария' : 'Лайкнуть комментарий'
            }
            accessibilityRole="button"
            accessibilityState={{ checked: isLiked }}
            hitSlop={8}
            onPress={handleCommentLikePress}
            style={styles.commentLikeButton}
          >
            <Ionicons
              color={isLiked ? colors.like : colors.textMuted}
              name={isLiked ? 'heart' : 'heart-outline'}
              size={FEED_REACTION_ICON_SIZE}
            />
            <Text
              style={[
                styles.commentLikeValue,
                isLiked ? styles.commentLikeValueActive : undefined,
              ]}
            >
              {formatCompactCount(likesCount)}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
});

type CommentsFooterProps = {
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  onRetry: () => void;
};

function CommentsFooter({
  hasNextPage,
  isError,
  isFetchingNextPage,
  onRetry,
}: CommentsFooterProps) {
  if (isFetchingNextPage) {
    return (
      <View style={styles.commentsFooter}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  }

  if (isError) {
    return (
      <FeedStateCard
        compact
        actionLabel="Повторить"
        onPress={onRetry}
        title="Не удалось загрузить комментарии"
        variant="error"
      />
    );
  }

  if (hasNextPage) {
    return <View style={styles.commentsFooterSpace} />;
  }

  return <View style={styles.commentsFooterSpace} />;
}

function PaidOverlay() {
  return (
    <View style={styles.paywall}>
      <BlurView intensity={30} tint="dark" style={styles.paywallBlur} />
      <LinearGradient
        colors={[colors.overlayStart, colors.overlayEnd]}
        style={styles.paywallGradient}
      />
      <View style={styles.paywallContent}>
        <View style={styles.paywallBadge}>
          <Ionicons color={colors.surface} name="lock-closed" size={20} />
        </View>
        <Text style={styles.paywallTitle}>Закрытая публикация</Text>
        <Text style={styles.paywallSubtitle}>
          Доступ к полному тексту появится после доната.
        </Text>
        <GradientButton
          compact
          disabled
          onPress={() => undefined}
          solidColor={colors.sendButton}
          title="Отправить донат"
        />
      </View>
    </View>
  );
}

function formatCommentsTitle(count: number) {
  const absoluteCount = Math.abs(count);
  const lastDigit = absoluteCount % 10;
  const lastTwoDigits = absoluteCount % 100;
  const label =
    lastDigit === 1 && lastTwoDigits !== 11
      ? 'комментарий'
      : lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)
        ? 'комментария'
        : 'комментариев';

  return `${formatCompactCount(count)} ${label}`;
}

function sortComments(comments: Comment[], sortOrder: CommentsSortOrder) {
  return [...comments].sort((firstComment, secondComment) => {
    const firstTimestamp = new Date(firstComment.createdAt).getTime();
    const secondTimestamp = new Date(secondComment.createdAt).getTime();
    const firstValue = Number.isNaN(firstTimestamp) ? 0 : firstTimestamp;
    const secondValue = Number.isNaN(secondTimestamp) ? 0 : secondTimestamp;

    return sortOrder === 'newest'
      ? secondValue - firstValue
      : firstValue - secondValue;
  });
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    elevation: 20,
  },
  overlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.textPrimary,
  },
  screen: {
    position: 'absolute',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  detailSurface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  transitionSnapshot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
  },
  snapshotCard: {
    overflow: 'hidden',
    flex: 1,
    backgroundColor: colors.surface,
  },
  snapshotHeader: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: 8,
    paddingBottom: 8,
  },
  snapshotAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
  },
  snapshotAuthorName: {
    flex: 1,
    marginLeft: 10,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  snapshotCoverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.skeletonStrong,
  },
  snapshotCover: {
    width: '100%',
    height: '100%',
  },
  snapshotPaywall: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snapshotContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  snapshotTitle: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  snapshotBody: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
  },
  snapshotStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  snapshotStatPill: {
    minWidth: FEED_REACTION_PILL_MIN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: FEED_REACTION_PILL_GAP,
    paddingHorizontal: FEED_REACTION_PILL_HORIZONTAL_PADDING,
    paddingVertical: FEED_REACTION_PILL_VERTICAL_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  snapshotStatPillActive: {
    backgroundColor: colors.like,
  },
  snapshotStatValue: {
    minWidth: FEED_REACTION_VALUE_MIN_WIDTH,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  snapshotStatValueActive: {
    color: colors.surface,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  navTitle: {
    flex: 1,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
  },
  navSpacer: {
    width: 58,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  listHeader: {
    zIndex: 10,
    elevation: 10,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.skeleton,
  },
  authorContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  authorName: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  authorBio: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
  },
  coverContainer: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 1,
    borderRadius: radii.card,
    backgroundColor: colors.skeletonStrong,
    ...shadows.card,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  bodySection: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaRowFree: {
    justifyContent: 'flex-end',
  },
  tierBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  tierLabel: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
  },
  tierLabelPaid: {
    color: colors.primary,
  },
  createdAt: {
    flexShrink: 0,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.fontSize.xl,
    lineHeight: 30,
  },
  bodyText: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    lineHeight: 24,
  },
  lockedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
  },
  lockedNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FEED_REACTION_PILL_GAP,
    minWidth: FEED_REACTION_PILL_MIN_WIDTH,
    paddingHorizontal: FEED_REACTION_PILL_HORIZONTAL_PADDING,
    paddingVertical: FEED_REACTION_PILL_VERTICAL_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  likeButtonActive: {
    backgroundColor: colors.like,
  },
  likeButtonDisabled: {
    opacity: 0.7,
  },
  likeError: {
    marginTop: spacing.sm,
    color: colors.like,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  likeValue: {
    minWidth: FEED_REACTION_VALUE_MIN_WIDTH,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  likeValueActive: {
    color: colors.surface,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FEED_REACTION_PILL_GAP,
    minWidth: FEED_REACTION_PILL_MIN_WIDTH,
    paddingHorizontal: FEED_REACTION_PILL_HORIZONTAL_PADDING,
    paddingVertical: FEED_REACTION_PILL_VERTICAL_PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  statValue: {
    minWidth: FEED_REACTION_VALUE_MIN_WIDTH,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    position: 'relative',
    zIndex: 12,
    elevation: 12,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  commentsTitle: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.fontSize.md,
    textTransform: 'uppercase',
  },
  commentsSort: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.md,
  },
  commentsSortButton: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentsSortMenu: {
    position: 'absolute',
    top: 50,
    right: 0,
    minWidth: 178,
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
    zIndex: 20,
    elevation: 12,
  },
  commentsSortMenuOption: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
  },
  commentsSortMenuOptionSelected: {
    backgroundColor: colors.primarySoft,
  },
  commentsSortMenuLabel: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
  },
  commentsSortMenuLabelSelected: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.skeleton,
  },
  commentContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  commentAuthor: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
  },
  commentDate: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
  },
  commentText: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
    lineHeight: 22,
  },
  commentBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: 2,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'flex-start',
    gap: 5,
    minHeight: 30,
    marginTop: 1,
  },
  commentLikeValue: {
    minWidth: 22,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  commentLikeValueActive: {
    color: colors.like,
  },
  commentsLoader: {
    paddingVertical: spacing.xl,
  },
  commentsFooter: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  commentsFooterSpace: {
    height: spacing.xl,
  },
  inputPanel: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.skeleton,
    backgroundColor: colors.surface,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 108,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingTop: 13,
    paddingBottom: 12,
    borderWidth: 2,
    borderColor: colors.skeleton,
    borderRadius: radii.pill,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.md,
  },
  sendButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.primaryDisabledGradient[0],
  },
  sendButtonActive: {
    backgroundColor: colors.sendButton,
  },
  inputError: {
    marginTop: spacing.xs,
    color: colors.like,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  paywall: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  paywallBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  paywallGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  paywallContent: {
    width: '100%',
    maxWidth: 270,
    alignItems: 'center',
  },
  paywallBadge: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderRadius: 23,
    backgroundColor: colors.paywallBadge,
  },
  paywallTitle: {
    color: colors.surface,
    textAlign: 'center',
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.md,
  },
  paywallSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    color: colors.surface,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    opacity: 0.84,
  },
});
