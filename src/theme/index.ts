import { Platform } from 'react-native';

const fonts = {
  display: Platform.select({
    ios: 'System',
    android: 'sans-serif-medium',
    default: 'sans-serif',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

const lightColors = {
  background: '#F0F2FA',
  text: '#1B2559',
  accent: '#4E76F8',
  input: '#F5F7FD',
  border: '#E4E7F2',
  surface: '#FFFFFF',

  mutedText: '#8E9AB8',
  softText: '#4A5878',

  black: '#1B2559',
  white: '#FFFFFF',

  success: '#22C55E',
  successSoft: '#DCFCE7',

  warning: '#F59E0B',
  warningSoft: '#FEF3C7',

  info: '#3B82F6',
  infoSoft: '#DBEAFE',

  danger: '#EF4444',
  dangerSoft: '#FEE2E2',
};

const darkColors = {
  background: '#0D0F1C',
  text: '#E8ECF8',
  accent: '#6B8EFF',
  input: '#1E2136',
  border: '#2A2F4A',
  surface: '#181A2E',

  mutedText: '#5C6585',
  softText: '#8895B8',

  black: '#0D0F1C',
  white: '#FFFFFF',

  success: '#4ADE80',
  successSoft: '#14532D',

  warning: '#FBBF24',
  warningSoft: '#78350F',

  info: '#60A5FA',
  infoSoft: '#1E3A5F',

  danger: '#F87171',
  dangerSoft: '#7F1D1D',
};

export type AppColors = typeof lightColors;

export const theme = {
  colors: lightColors,

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    pill: 999,
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
    xxxl: 48,
  },

  fonts,

  shadows: {
    card: Platform.select({
      ios: {
        shadowColor: '#1B2559',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
    hard: Platform.select({
      ios: {
        shadowColor: '#1B2559',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    strong: Platform.select({
      ios: {
        shadowColor: '#4E76F8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
      android: {
        elevation: 6,
      },
      default: {},
    }),
  },

  typography: {
    hero: {
      fontFamily: fonts.display,
      fontSize: 40,
      lineHeight: 44,
      fontWeight: '700' as const,
      letterSpacing: -1.0,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: 32,
      lineHeight: 38,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 26,
      lineHeight: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.4,
    },
    h3: {
      fontFamily: fonts.display,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '600' as const,
      letterSpacing: -0.2,
    },
    metric: {
      fontFamily: fonts.display,
      fontSize: 48,
      lineHeight: 52,
      fontWeight: '700' as const,
      letterSpacing: -1.4,
    },
    title: {
      fontFamily: fonts.body,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '500' as const,
    },
    // Keep monoLabel for backward compat
    monoLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.4,
    },
    monoButton: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    monoStatus: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
  },
};

export function getTheme(mode: 'light' | 'dark') {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return { ...theme, colors };
}
