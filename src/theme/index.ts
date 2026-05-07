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
  background: '#F8F7F2',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F4F2',
  surfaceSoft: '#F1F4F2',
  surfaceMuted: '#E8ECE8',

  // Text hierarchy
  text: '#101828',
  softText: '#4B5563',
  mutedText: '#6B7280',

  // Borders & inputs
  border: '#E2E5E0',
  borderStrong: '#C9D0C8',
  input: '#F1F4F2',

  // Primary = teal (marca principal)
  accent: '#0F766E',
  accentSoft: '#DDF7F3',
  accentHover: '#134E4A',

  // Secondary = slate
  secondary: '#334155',
  secondarySoft: '#E8EDF2',

  // Dark blocks
  darkBlock: '#17212B',
  darkBlockSoft: '#253140',

  // Success
  success: '#15803D',
  successSoft: '#E7F8EF',

  // Warning
  warning: '#B7791F',
  warningSoft: '#FFF4D8',

  // Info — azul usado apenas pontualmente
  info: '#3B5BA9',
  infoSoft: '#EEF2FF',

  // Danger
  danger: '#C84646',
  dangerSoft: '#FDECEC',

  // Utilities
  black: '#101828',
  white: '#FFFFFF',
  overlay: 'rgba(16,24,40,0.48)',
  darkBlockFg: '#FFFFFF',

  // Primary aliases (explícito para referências semânticas)
  primary: '#0F766E',
  primaryDark: '#134E4A',
  primarySoft: '#DDF7F3',
  primaryMuted: '#99E2DA',

  // Warm accent (âmbar — uso pontual)
  warmAccent: '#B86B3F',
  warmAccentSoft: '#FFF1E8',
};

const darkColors = {
  background: '#081211',
  surface: '#101B1A',
  surfaceElevated: '#162423',
  surfaceSoft: '#162423',
  surfaceMuted: '#20302E',

  text: '#F8FAFC',
  softText: '#CBD5D1',
  mutedText: '#94A3A0',

  border: '#263B38',
  borderStrong: '#35534E',
  input: '#162423',

  accent: '#5EEAD4',
  accentSoft: '#123D39',
  accentHover: '#2DD4BF',

  secondary: '#CBD5E1',
  secondarySoft: '#1E293B',

  darkBlock: '#F8FAFC',
  darkBlockSoft: '#E5E7EB',

  success: '#4ADE80',
  successSoft: '#123A22',

  warning: '#F2C768',
  warningSoft: '#3B3018',

  info: '#93A9FF',
  infoSoft: '#1E2754',

  danger: '#FF7A7A',
  dangerSoft: '#3A1E24',

  black: '#081211',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.64)',
  darkBlockFg: '#081211',

  primary: '#5EEAD4',
  primaryDark: '#99F6E4',
  primarySoft: '#123D39',
  primaryMuted: '#2DD4BF',

  warmAccent: '#E2A66B',
  warmAccentSoft: '#3A261B',
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
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
      default: {},
    }),
    hard: Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
    strong: Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 5 },
      default: {},
    }),
    float: Platform.select({
      ios: {
        shadowColor: '#101828',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 20,
      },
      android: { elevation: 7 },
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
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: 13,
      lineHeight: 19,
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: fonts.body,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.3,
    },
    caption: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '500' as const,
    },
    monoLabel: {
      fontFamily: fonts.body,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
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
