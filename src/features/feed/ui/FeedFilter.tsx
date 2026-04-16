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
    alignSelf: 'flex-start',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255,255,255,0.94)',
  },
  item: {
    borderRadius: radii.pill,
  },
  selectedPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  idlePill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
  },
  selectedLabel: {
    color: colors.surface,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.fontSize.sm,
  },
  idleLabel: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.fontSize.sm,
  },
});
