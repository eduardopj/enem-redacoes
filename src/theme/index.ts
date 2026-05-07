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
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F3F7',
  surfaceSoft: '#F1F3F7',
  surfaceMuted: '#E8ECF3',

  // Text hierarchy
  text: '#101828',
  softText: '#475467',
  mutedText: '#667085',

  // Borders & inputs
  border: '#E4E7EC',
  borderStrong: '#D0D5DD',
  input: '#F1F3F7',

  // Primary (indigo)
  accent: '#3454D1',
  accentSoft: '#EEF2FF',
  accentHover: '#1D2B6F',

  // Secondary (keep for compat)
  secondary: '#7C3AED',
  secondarySoft: '#EDE9FE',

  // Dark blocks (navy CTA areas)
  darkBlock: '#101828',
  darkBlockSoft: '#1D2939',

  // Success
  success: '#168A5B',
  successSoft: '#E7F8EF',

  // Warning
  warning: '#B7791F',
  warningSoft: '#FFF4D8',

  // Info
  info: '#2563A8',
  infoSoft: '#EAF3FF',

  // Danger
  danger: '#C84646',
  dangerSoft: '#FDECEC',

  // Utilities
  black: '#101828',
  white: '#FFFFFF',
  overlay: 'rgba(16,24,40,0.48)',
  darkBlockFg: '#FFFFFF',
};

const darkColors = {
  background: '#080C16',
  surface: '#101828',
  surfaceElevated: '#182230',
  surfaceSoft: '#182230',
  surfaceMuted: '#202B3C',

  text: '#F9FAFB',
  softText: '#D0D5DD',
  mutedText: '#98A2B3',

  border: '#293548',
  borderStrong: '#3B475C',
  input: '#182230',

  accent: '#91A5FF',
  accentSoft: '#1D275A',
  accentHover: '#5668C7',

  secondary: '#A78BFA',
  secondarySoft: '#2D1B69',

  darkBlock: '#F9FAFB',
  darkBlockSoft: '#E5E7EB',

  success: '#54D99A',
  successSoft: '#123A2A',

  warning: '#F2C768',
  warningSoft: '#3B3018',

  info: '#7DB7FF',
  infoSoft: '#132D4A',

  danger: '#FF7A7A',
  dangerSoft: '#3A1E24',

  black: '#080C16',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.64)',
  darkBlockFg: '#101828',
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
