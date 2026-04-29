export const colors = {
  background: '#F3F6FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F2F6',
  textPrimary: '#17191F',
  textSecondary: '#22252D',
  textMuted: '#65707F',
  primary: '#6A16D8',
  sendButton: '#6115CD',
  primarySoft: '#EEE5FF',
  primaryGradient: ['#7618E8', '#5D10C8'] as const,
  primaryDisabledGradient: ['#D6C6FF', '#C5B2F5'] as const,
  like: '#FF2F7D',
  success: '#1F9A68',
  successSoft: '#E8FFF4',
  info: '#2C8EFF',
  skeleton: '#F0F1F4',
  skeletonStrong: '#ECEEF2',
  overlayStart: 'rgba(18, 24, 31, 0.22)',
  overlayEnd: 'rgba(26, 18, 24, 0.72)',
  paywallBadge: 'rgba(106, 22, 216, 0.92)',
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
  lg: 14,
  xl: 18,
  card: 10,
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
