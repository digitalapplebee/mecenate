import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { colors, radii, spacing, typography } from '../theme/tokens';

type GradientButtonProps = {
  compact?: boolean;
  disabled?: boolean;
  onPress: () => void;
  solidColor?: string;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function GradientButton({
  compact = false,
  disabled = false,
  onPress,
  solidColor,
  style,
  title,
}: GradientButtonProps) {
  const buttonColors = solidColor
    ? ([solidColor, solidColor] as const)
    : disabled
      ? colors.primaryDisabledGradient
      : colors.primaryGradient;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        style,
        pressed ? styles.pressed : undefined,
        disabled ? styles.disabled : undefined,
      ]}
    >
      <LinearGradient
        colors={buttonColors}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={[styles.button, compact ? styles.compactButton : undefined]}
      >
        <Text style={[styles.label, compact ? styles.compactLabel : undefined]}>
          {title}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
  },
  compactButton: {
    minHeight: 36,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
  },
  label: {
    color: colors.surface,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.lg,
  },
  compactLabel: {
    fontSize: typography.fontSize.xs,
  },
  pressed: {
    opacity: 0.92,
  },
  disabled: {
    opacity: 1,
  },
});
