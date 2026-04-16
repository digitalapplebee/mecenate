export const colors = {
  background: '#EEF2FB',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF1F7',
  textPrimary: '#171C28',
  textSecondary: '#4D566A',
  textMuted: '#7D8597',
  primary: '#6F1CE6',
  primarySoft: '#EFE7FF',
  primaryGradient: ['#8628FF', '#5B16DB'] as const,
  primaryDisabledGradient: ['#CFC1FB', '#B8A6F4'] as const,
  like: '#FF4F97',
  success: '#24956A',
  successSoft: '#E8FFF4',
  info: '#2C8EFF',
  skeleton: '#E9ECF4',
  skeletonStrong: '#E3E7F2',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  xxl: 40,
} as const;

export const radii = {
  lg: 18,
  xl: 22,
  card: 20,
  pill: 999,
} as const;

export const typography = {
  fontFamily: {
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold',
    extraBold: 'Manrope_800ExtraBold',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 22,
    xxl: 32,
    hero: 40,
  },
} as const;

export const shadows = {
  card: {
    shadowColor: '#1A2440',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 4,
  },
} as const;
