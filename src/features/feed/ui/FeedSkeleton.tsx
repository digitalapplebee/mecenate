import { StyleSheet, View } from 'react-native';

import { colors, radii, shadows, spacing } from '../../../shared/theme/tokens';

export function FeedSkeletonList() {
  return (
    <View style={styles.wrapper}>
      {Array.from({ length: 2 }).map((_, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.header}>
            <View style={styles.avatar} />
            <View style={styles.headerLine} />
          </View>
          <View style={styles.cover} />
          <View style={styles.content}>
            <View style={[styles.line, styles.titleLine]} />
            <View style={[styles.line, styles.bodyLineWide]} />
            <View style={[styles.line, styles.bodyLineNarrow]} />
            <View style={styles.stats}>
              <View style={styles.statPill} />
              <View style={styles.statPill} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  card: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.skeleton,
  },
  headerLine: {
    width: 126,
    height: 16,
    marginLeft: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.skeleton,
  },
  cover: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.skeletonStrong,
  },
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  line: {
    borderRadius: radii.pill,
    backgroundColor: colors.skeleton,
  },
  titleLine: {
    width: '42%',
    height: 16,
  },
  bodyLineWide: {
    width: '92%',
    height: 14,
    marginTop: spacing.sm,
  },
  bodyLineNarrow: {
    width: '68%',
    height: 14,
    marginTop: spacing.sm,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  statPill: {
    width: 78,
    height: 32,
    borderRadius: radii.pill,
    backgroundColor: colors.skeleton,
  },
});
