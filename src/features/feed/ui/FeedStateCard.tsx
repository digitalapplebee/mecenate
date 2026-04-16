import { StyleSheet, Text, View } from 'react-native';

import { GradientButton } from '../../../shared/components/GradientButton';
import { MoodIllustration } from '../../../shared/components/MoodIllustration';
import { colors, radii, shadows, spacing, typography } from '../../../shared/theme/tokens';

type FeedStateCardProps = {
  actionLabel: string;
  compact?: boolean;
  onPress: () => void;
  title: string;
  variant: 'empty' | 'error';
};

export function FeedStateCard({
  actionLabel,
  compact = false,
  onPress,
  title,
  variant,
}: FeedStateCardProps) {
  return (
    <View style={[styles.card, compact ? styles.cardCompact : undefined]}>
      <MoodIllustration mood={variant} size={compact ? 128 : 188} />
      <Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
        {title}
      </Text>
      <GradientButton
        onPress={onPress}
        style={styles.button}
        title={actionLabel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    marginTop: 0,
    minHeight: 620,
    paddingHorizontal: 32,
    paddingTop: 78,
    paddingBottom: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  cardCompact: {
    marginTop: spacing.lg,
    minHeight: 0,
    paddingVertical: spacing.xl,
  },
  title: {
    marginTop: spacing.lg,
    color: colors.textPrimary,
    textAlign: 'center',
    fontFamily: typography.fontFamily.extraBold,
    fontSize: 26,
    lineHeight: 34,
  },
  titleCompact: {
    fontSize: typography.fontSize.xl,
    lineHeight: 30,
  },
  button: {
    width: '100%',
    marginTop: 26,
  },
});
