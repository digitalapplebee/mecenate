import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import type { FeedTierFilter } from '../model/FeedFiltersStore';
import { colors, radii, spacing, typography } from '../../../shared/theme/tokens';

const FILTERS: Array<{ label: string; value: FeedTierFilter }> = [
  { label: 'Все', value: 'all' },
  { label: 'Бесплатные', value: 'free' },
  { label: 'Платные', value: 'paid' },
];

type FeedFilterProps = {
  value: FeedTierFilter;
  onChange: (value: FeedTierFilter) => void;
};

export function FeedFilter({ value, onChange }: FeedFilterProps) {
  return (
    <View style={styles.container}>
      {FILTERS.map((filter) => {
        const selected = filter.value === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={filter.value}
            onPress={() => onChange(filter.value)}
            style={styles.item}
          >
            {selected ? (
              <LinearGradient
                colors={colors.primaryGradient}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={styles.selectedPill}
              >
                <Text style={styles.selectedLabel}>{filter.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.idlePill}>
                <Text style={styles.idleLabel}>{filter.label}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  item: {
    flex: 1,
    borderRadius: radii.pill,
  },
  selectedPill: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  idlePill: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  selectedLabel: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.xs,
  },
  idleLabel: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.xs,
  },
});
