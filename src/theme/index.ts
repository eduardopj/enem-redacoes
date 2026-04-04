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
  background: '#F6F4ED',
  text: '#1A1A1A',
  accent: '#E59B24',
  input: '#EBE8DF',
  border: '#E1DECE',
  surface: '#FFFFFF',

  mutedText: '#666054',
  softText: '#4A453C',

  black: '#151515',
  white: '#FFFFFF',

  success: '#1F8A57',
  successSoft: '#E8F4ED',

  warning: '#B97708',
  warningSoft: '#FBF1D8',

  info: '#2268B5',
  infoSoft: '#E8F0FB',

  danger: '#C84C3A',
  dangerSoft: '#FCEAE7',
};

const darkColors = {
  background: '#1A1814',
  text: '#F0EDE6',
  accent: '#E59B24',
  input: '#2A2620',
  border: '#3A352C',
  surface: '#222018',

  mutedText: '#9A9080',
  softText: '#C8C0B0',

  black: '#151515',
  white: '#FFFFFF',

  success: '#2DA864',
  successSoft: '#1A3526',

  warning: '#D4891A',
  warningSoft: '#3A2A10',

  info: '#4B88D4',
  infoSoft: '#1A2840',

  danger: '#E85A46',
  dangerSoft: '#3A1A16',
};

export type AppColors = typeof lightColors;

export const theme = {
  colors: lightColors,

  radius: {
    xs: 2,
    sm: 4,
    md: 4,
    lg: 4,
    xl: 4,
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
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 0,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    hard: Platform.select({
      ios: {
        shadowColor: '#1A1A1A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 0,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },

  typography: {
    hero: {
      fontFamily: fonts.display,
      fontSize: 44,
      lineHeight: 46,
      fontWeight: '700' as const,
      letterSpacing: -1.2,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: 34,
      lineHeight: 38,
      fontWeight: '700' as const,
      letterSpacing: -0.8,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '700' as const,
      letterSpacing: -0.6,
    },
    h3: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '600' as const,
      letterSpacing: -0.3,
    },
    metric: {
      fontFamily: fonts.display,
      fontSize: 52,
      lineHeight: 52,
      fontWeight: '700' as const,
      letterSpacing: -1.6,
    },
    title: {
      fontFamily: fonts.body,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    monoLabel: {
      fontFamily: fonts.mono,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.6,
    },
    monoButton: {
      fontFamily: fonts.mono,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.8,
    },
    monoStatus: {
      fontFamily: fonts.mono,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 1.6,
    },
  },
};

export function getTheme(mode: 'light' | 'dark') {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return { ...theme, colors };
}