import { memo, useCallback, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton } from '../../../shared/components/GradientButton';
import { formatCompactCount } from '../../../shared/lib/formatters';
import { colors, radii, shadows, spacing, typography } from '../../../shared/theme/tokens';
import { togglePostLike } from '../api/feedApi';
import type { Post } from '../api/feed.types';
import {
  applyPostLike,
  postQueryKey,
  updateCachedPost,
} from '../model/feedQueryCache';
import {
  FEED_REACTION_ICON_SIZE,
  FEED_REACTION_PILL_GAP,
  FEED_REACTION_PILL_HORIZONTAL_PADDING,
  FEED_REACTION_PILL_MIN_WIDTH,
  FEED_REACTION_PILL_VERTICAL_PADDING,
  FEED_REACTION_VALUE_MIN_WIDTH,
} from './feed.constants';
import type { PostTransitionOrigin } from './postTransition';

type FeedCardProps = {
  isHidden?: boolean;
  isOpenDisabled?: boolean;
  onOpen: (post: Post, origin?: PostTransitionOrigin) => void;
  post: Post;
};

type StatPillProps = {
  active?: boolean;
  disabled?: boolean;
  icon: 'comment' | 'heart';
  onPress?: (event: GestureResponderEvent) => void;
  value: number;
};

function StatPill({
  active = false,
  disabled = false,
  icon,
  onPress,
  value,
}: StatPillProps) {
  const isHeart = icon === 'heart';
  const iconColor = active ? colors.surface : colors.textMuted;
  const pillStyle = [
    styles.statPill,
    active ? styles.statPillActive : undefined,
    disabled ? styles.statPillDisabled : undefined,
  ];
  const content = (
    <>
      <Ionicons
        color={iconColor}
        name={
          isHeart
            ? active
              ? 'heart'
              : 'heart-outline'
            : 'chatbubble-outline'
        }
        size={FEED_REACTION_ICON_SIZE}
      />
      <Text
        style={[
          styles.statValue,
          active ? styles.statValueActive : undefined,
        ]}
      >
        {formatCompactCount(value)}
      </Text>
    </>
  );

  if (!onPress) {
    return <View style={pillStyle}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={active ? 'Убрать лайк' : 'Поставить лайк'}
      accessibilityRole="button"
      accessibilityState={{ checked: active, disabled }}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        ...pillStyle,
        pressed ? styles.statPillPressed : undefined,
      ]}
    >
      {content}
    </Pressable>
  );
}

export const FeedCard = memo(function FeedCard({
  isHidden = false,
  isOpenDisabled = false,
  onOpen,
  post,
}: FeedCardProps) {
  const queryClient = useQueryClient();
  const cardRef = useRef<View>(null);
  const [expanded, setExpanded] = useState(false);
  const isPaidPost = post.tier === 'paid';
  const canExpand =
    !isPaidPost &&
    post.body.trim().length > 0 &&
    post.body.trim() !== post.preview.trim();
  const collapsedBodyText = post.preview.trim().length
    ? post.preview.trim()
    : `${post.body.trim().slice(0, 110).trimEnd()}...`;
  const bodyText =
    expanded || !canExpand
      ? post.body.trim()
      : collapsedBodyText;

  const handleOpen = useCallback(() => {
    if (isHidden || isOpenDisabled) {
      return;
    }

    const node = cardRef.current;

    if (!node) {
      onOpen(post);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      onOpen(post, { height, width, x, y });
    });
  }, [isHidden, isOpenDisabled, onOpen, post]);

  const toggleLikeMutation = useMutation({
    mutationFn: () => togglePostLike(post.id),
    onMutate: async () => {
      const cachedPost =
        queryClient.getQueryData<Post>(postQueryKey(post.id)) ?? post;
      const nextIsLiked = !cachedPost.isLiked;
      const nextLikesCount = Math.max(
        0,
        cachedPost.likesCount + (nextIsLiked ? 1 : -1),
      );

      applyPostLike(queryClient, post.id, {
        isLiked: nextIsLiked,
        likesCount: nextLikesCount,
      });

      return {
        previousPost: cachedPost,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        updateCachedPost(queryClient, post.id, () => context.previousPost);
      }

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
    onSuccess: (data) => {
      applyPostLike(queryClient, post.id, data);
    },
  });

  const handleLikePress = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation();

      if (toggleLikeMutation.isPending) {
        return;
      }

      void Haptics.selectionAsync();
      toggleLikeMutation.reset();
      toggleLikeMutation.mutate();
    },
    [toggleLikeMutation],
  );

  const handleExpand = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    void Haptics.selectionAsync();
    setExpanded(true);
  }, []);

  const handleCollapse = useCallback((event: GestureResponderEvent) => {
    event.stopPropagation();
    void Haptics.selectionAsync();
    setExpanded(false);
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isHidden || isOpenDisabled}
      onPress={handleOpen}
      ref={cardRef}
      style={[styles.card, isHidden ? styles.cardHidden : undefined]}
      unstable_pressDelay={80}
    >
      <View style={styles.header}>
        <Image
          contentFit="cover"
          source={{ uri: post.author.avatarUrl }}
          style={styles.avatar}
          transition={200}
        />
        <View style={styles.headerText}>
          <View style={styles.authorRow}>
            <Text numberOfLines={1} style={styles.authorName}>
              {post.author.displayName}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.coverContainer}>
        <Image
          contentFit="cover"
          source={{ uri: post.coverUrl }}
          style={styles.cover}
          transition={250}
        />

        {isPaidPost ? (
          <View style={styles.paywall}>
            <BlurView intensity={28} tint="dark" style={styles.paywallBlur} />
            <LinearGradient
              colors={[colors.overlayStart, colors.overlayEnd]}
              style={styles.paywallGradient}
            />
            <View style={styles.paywallContent}>
              <View style={styles.paywallBadge}>
                <Ionicons color={colors.surface} name="wallet" size={18} />
              </View>
              <Text style={styles.paywallTitle}>
                Контент скрыт пользователем.
              </Text>
              <Text style={styles.paywallSubtitle}>
                Доступ откроется после доната
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
        ) : null}
      </View>

      <View style={styles.content}>
        {isPaidPost ? (
          <View>
            <Text numberOfLines={2} style={styles.title}>
              {post.title}
            </Text>
            <Text numberOfLines={2} style={styles.lockedBody}>
              Полный текст доступен после доната.
            </Text>
          </View>
        ) : (
          <View>
            <Text numberOfLines={2} style={styles.title}>
              {post.title}
            </Text>
            <Text style={styles.body}>
              {bodyText}
              {canExpand && !expanded ? (
                <Text onPress={handleExpand} style={styles.expandLink}>
                  {' '}
                  Показать еще
                </Text>
              ) : null}
            </Text>
            {canExpand && expanded ? (
              <Pressable hitSlop={8} onPress={handleCollapse}>
                <Text style={styles.collapseLink}>Свернуть</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.statsRow}>
          <StatPill
            active={post.isLiked}
            disabled={toggleLikeMutation.isPending}
            icon="heart"
            onPress={handleLikePress}
            value={post.likesCount}
          />
          <StatPill icon="comment" value={post.commentsCount} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  cardHidden: {
    opacity: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: 8,
    paddingBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
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
    fontSize: typography.fontSize.xs,
    lineHeight: 16,
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.skeletonStrong,
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  paywall: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxWidth: 252,
    alignItems: 'center',
    paddingTop: 26,
  },
  paywallBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.paywallBadge,
  },
  paywallTitle: {
    color: colors.surface,
    textAlign: 'center',
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 22,
  },
  paywallSubtitle: {
    marginTop: 4,
    marginBottom: spacing.md,
    color: colors.surface,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.sm,
    opacity: 0.84,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: typography.fontSize.sm,
    lineHeight: 18,
  },
  body: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
  },
  expandLink: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
  collapseLink: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
  lockedBody: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.fontSize.xs,
    lineHeight: 17,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  statPillActive: {
    backgroundColor: colors.like,
  },
  statPillDisabled: {
    opacity: 0.75,
  },
  statPillPressed: {
    opacity: 0.9,
  },
  statValue: {
    minWidth: FEED_REACTION_VALUE_MIN_WIDTH,
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  statValueActive: {
    color: colors.surface,
  },
});
