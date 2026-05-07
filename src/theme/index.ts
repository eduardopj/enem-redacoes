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
  // Base surfaces
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F4FA',
  surfaceSoft: '#F1F4FA',
  surfaceMuted: '#E8ECFA',

  // Text hierarchy
  text: '#111827',
  softText: '#4B5563',
  mutedText: '#6B7280',

  // Borders & inputs
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',
  input: '#F1F4FA',

  // Primary = índigo (marca principal — substitui o teal)
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  accentHover: '#3730A3',

  // Secondary = violeta
  secondary: '#7C3AED',
  secondarySoft: '#F3E8FF',

  // Dark blocks (índigo escuro)
  darkBlock: '#1E1B4B',
  darkBlockSoft: '#312E81',

  // Success — verde usado APENAS para sucesso real
  success: '#16A34A',
  successSoft: '#F0FDF4',

  // Warning — laranja
  warning: '#EA580C',
  warningSoft: '#FFF7ED',

  // Info — azul céu
  info: '#0EA5E9',
  infoSoft: '#F0F9FF',

  // Danger
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',

  // Utilities
  black: '#111827',
  white: '#FFFFFF',
  overlay: 'rgba(17,24,39,0.52)',
  darkBlockFg: '#FFFFFF',

  // Primary aliases
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primarySoft: '#EEF2FF',
  primaryMuted: '#A5B4FC',

  // Âmbar — acento quente pontual
  warmAccent: '#D97706',
  warmAccentSoft: '#FFFBEB',

  // Ciano — acento tecnológico
  cyan: '#0891B2',
  cyanSoft: '#ECFEFF',

  // Rosa/Pink — competência C5
  rose: '#DB2777',
  roseSoft: '#FDF2F8',
};

const darkColors = {
  background: '#090B14',
  surface: '#111827',
  surfaceElevated: '#171C2E',
  surfaceSoft: '#1F2937',
  surfaceMuted: '#2D3348',

  text: '#F9FAFB',
  softText: '#D1D5DB',
  mutedText: '#9CA3AF',

  border: '#2D3348',
  borderStrong: '#3D4663',
  input: '#1F2937',

  accent: '#818CF8',
  accentSoft: '#252A55',
  accentHover: '#A5B4FC',

  secondary: '#C084FC',
  secondarySoft: '#3B0764',

  darkBlock: '#F9FAFB',
  darkBlockSoft: '#E5E7EB',

  success: '#4ADE80',
  successSoft: '#052E16',

  warning: '#FDBA74',
  warningSoft: '#431407',

  info: '#38BDF8',
  infoSoft: '#082F49',

  danger: '#F87171',
  dangerSoft: '#450A0A',

  black: '#090B14',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.72)',
  darkBlockFg: '#090B14',

  primary: '#818CF8',
  primaryDark: '#A5B4FC',
  primarySoft: '#252A55',
  primaryMuted: '#6366F1',

  warmAccent: '#FCD34D',
  warmAccentSoft: '#451A03',

  cyan: '#22D3EE',
  cyanSoft: '#083344',

  rose: '#F472B6',
  roseSoft: '#500724',
};

export type AppColors = typeof lightColors;

export const theme = {
  colors: lightColors,

  radius: {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 18,
    xl: 22,
    xxl: 28,
    pill: 999,
  },

  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  fonts,

  shadows: {
    card: Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
    hard: Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
    strong: Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.14,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
    float: Platform.select({
      ios: {
        shadowColor: '#1E1B4B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  typography: {
    hero: {
      fontFamily: fonts.display,
      fontSize: 36,
      lineHeight: 42,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    h2: {
      fontFamily: fonts.display,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
    h3: {
      fontFamily: fonts.display,
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    metric: {
      fontFamily: fonts.display,
      fontSize: 42,
      lineHeight: 48,
      fontWeight: '800' as const,
      letterSpacing: -1,
    },
    title: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    monoLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    monoButton: {
      fontFamily: fonts.body,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '700' as const,
      letterSpacing: 0.1,
    },
    monoStatus: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
  },
};

export function getTheme(mode: 'light' | 'dark') {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return { ...theme, colors };
}
