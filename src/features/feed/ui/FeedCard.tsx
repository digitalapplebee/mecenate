import { memo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { GradientButton } from '../../../shared/components/GradientButton';
import { formatCompactCount } from '../../../shared/lib/formatters';
import { colors, radii, shadows, spacing, typography } from '../../../shared/theme/tokens';
import type { Post } from '../api/feed.types';

type FeedCardProps = {
  post: Post;
};

type StatPillProps = {
  active?: boolean;
  icon: 'comment' | 'heart';
  value: number;
};

function StatPill({ active = false, icon, value }: StatPillProps) {
  const isHeart = icon === 'heart';

  return (
    <View
      style={[
        styles.statPill,
        active ? styles.statPillActive : undefined,
      ]}
    >
      {isHeart ? (
        <Ionicons
          color={active ? colors.surface : colors.textMuted}
          name={active ? 'heart' : 'heart-outline'}
          size={15}
        />
      ) : (
        <Feather
          color={colors.textMuted}
          name="message-circle"
          size={14}
        />
      )}
      <Text
        style={[
          styles.statValue,
          active ? styles.statValueActive : undefined,
        ]}
      >
        {formatCompactCount(value)}
      </Text>
    </View>
  );
}

export const FeedCard = memo(function FeedCard({ post }: FeedCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isPaidPost = post.tier === 'paid';
  const canExpand =
    !isPaidPost &&
    post.body.trim().length > 0 &&
    post.body.trim() !== post.preview.trim();
  const bodyText = expanded || !canExpand ? post.body : post.preview;

  return (
    <View style={styles.card}>
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
              colors={['rgba(22, 20, 38, 0.24)', 'rgba(22, 20, 38, 0.72)']}
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
                Доступ откроется после доната. В демо кнопка неактивна.
              </Text>
              <GradientButton
                compact
                disabled
                onPress={() => undefined}
                title="Отправить донат"
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        {isPaidPost ? (
          <View style={styles.paidFooterSpacer} />
        ) : (
          <View>
            <Text numberOfLines={2} style={styles.title}>
              {post.title}
            </Text>
            <Text style={styles.body}>
              {bodyText}
              {canExpand && !expanded ? (
                <Text onPress={() => setExpanded(true)} style={styles.expandLink}>
                  {' '}
                  Показать еще
                </Text>
              ) : null}
            </Text>
            {canExpand && expanded ? (
              <Pressable hitSlop={8} onPress={() => setExpanded(false)}>
                <Text style={styles.collapseLink}>Свернуть</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <View style={styles.statsRow}>
          <StatPill active={post.isLiked} icon="heart" value={post.likesCount} />
          <StatPill icon="comment" value={post.commentsCount} />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
    lineHeight: 18,
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1.32,
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
    backgroundColor: 'rgba(111, 28, 230, 0.88)',
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
    paddingHorizontal: spacing.md,
    paddingTop: 12,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.extraBold,
    fontSize: 16,
    lineHeight: 23,
  },
  body: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  expandLink: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  collapseLink: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 14,
  },
  paidFooterSpacer: {
    height: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  statPillActive: {
    backgroundColor: colors.like,
  },
  statValue: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: 13,
  },
  statValueActive: {
    color: colors.surface,
  },
});
