import { Platform } from 'react-native';

const fonts = {
  display: 'Nunito_800ExtraBold',
  displayBold: 'Nunito_900Black',
  displayMedium: 'Nunito_700Bold',
  displayRegular: 'Nunito_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

const lightColors = {
  // Base surfaces — branco puro (estilo Duolingo, sem tint)
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F9F9F9',
  surfaceSoft: '#F5F5F5',
  surfaceMuted: '#EBEBEB',

  // Text hierarchy
  text: '#1C1C1C',
  softText: '#4B4B4B',
  mutedText: '#777777',

  // Borders & inputs
  border: '#E5E5E5',
  borderStrong: '#CECECE',   // usado no border-bottom depth de cards/botões
  input: '#F7F7F7',

  // Accent = violeta vibrante (primary brand)
  accent: '#7C3AED',
  accentSoft: '#F3E8FF',
  accentHover: '#6D28D9',    // border-bottom de botões primários

  // Secondary = gold / XP
  secondary: '#FFB800',
  secondarySoft: '#FFF8E7',

  // Dark blocks
  darkBlock: '#1C1C1C',
  darkBlockSoft: '#2D2D2D',

  // Success — verde vivo estilo Duolingo
  success: '#58CC02',
  successSoft: '#F0FFF0',

  // Warning — âmbar
  warning: '#FF9600',
  warningSoft: '#FFF3E0',

  // Info — azul céu (Duolingo streak blue)
  info: '#1CB0F6',
  infoSoft: '#E8F7FF',

  // Danger — coral (Duolingo red)
  danger: '#FF4B4B',
  dangerSoft: '#FFF0F0',

  // Utilities
  black: '#1C1C1C',
  white: '#FFFFFF',
  overlay: 'rgba(28,28,28,0.52)',
  darkBlockFg: '#FFFFFF',

  // Primary aliases
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primarySoft: '#F3E8FF',
  primaryMuted: '#C4B5FD',

  // Âmbar — XP / conquistas
  warmAccent: '#FFB800',
  warmAccentSoft: '#FFF8E7',

  // Teal — competência C3
  cyan: '#0D9488',
  cyanSoft: '#F0FDFA',

  // Rosa — competência C5
  rose: '#EC4899',
  roseSoft: '#FDF2F8',
};

const darkColors = {
  background: '#141414',
  surface: '#1E1E1E',
  surfaceElevated: '#252525',
  surfaceSoft: '#2A2A2A',
  surfaceMuted: '#333333',

  text: '#F5F5F5',
  softText: '#D0D0D0',
  mutedText: '#8B8B8B',

  border: '#333333',
  borderStrong: '#444444',
  input: '#252525',

  accent: '#9B6EFF',         // violeta clareado para dark mode
  accentSoft: '#2E1065',
  accentHover: '#C4B5FD',

  secondary: '#FFD700',
  secondarySoft: '#3D2E00',

  darkBlock: '#F5F5F5',
  darkBlockSoft: '#D0D0D0',

  success: '#77EE00',        // verde mais brilhante em dark
  successSoft: '#0A2E00',

  warning: '#FFA500',
  warningSoft: '#3D1A00',

  info: '#38BDF8',
  infoSoft: '#082F49',

  danger: '#FF6B6B',
  dangerSoft: '#3D0000',

  black: '#141414',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.72)',
  darkBlockFg: '#141414',

  primary: '#9B6EFF',
  primaryDark: '#C4B5FD',
  primarySoft: '#2E1065',
  primaryMuted: '#7C3AED',

  warmAccent: '#FFD700',
  warmAccentSoft: '#3D2E00',

  cyan: '#2DD4BF',
  cyanSoft: '#0D3B38',

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
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
      default: {},
    }),
    hard: Platform.select({
      ios: {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
    strong: Platform.select({
      ios: {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
      },
      android: { elevation: 6 },
      default: {},
    }),
    float: Platform.select({
      ios: {
        shadowColor: '#09090B',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.14,
        shadowRadius: 28,
      },
      android: { elevation: 8 },
      default: {},
    }),
  },

  typography: {
    hero: {
      fontFamily: fonts.displayBold,
      fontSize: 36,
      lineHeight: 46,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    h1: {
      fontFamily: fonts.display,
      fontSize: 30,
      lineHeight: 40,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    h2: {
      fontFamily: fonts.displayMedium,
      fontSize: 24,
      lineHeight: 34,
      fontWeight: '700' as const,
      letterSpacing: -0.2,
    },
    h3: {
      fontFamily: fonts.displayMedium,
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    metric: {
      fontFamily: fonts.displayBold,
      fontSize: 44,
      lineHeight: 54,
      fontWeight: '800' as const,
      letterSpacing: -1,
    },
    title: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '600' as const,
      letterSpacing: 0,
    },
    body: {
      fontFamily: fonts.body,
      fontSize: 17,
      lineHeight: 28,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontFamily: fonts.body,
      fontSize: 16,
      lineHeight: 26,
      fontWeight: '400' as const,
    },
    label: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 15,
      lineHeight: 23,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
    caption: {
      fontFamily: fonts.bodyMedium,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '500' as const,
    },
    monoLabel: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 20,
      fontWeight: '700' as const,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    monoButton: {
      fontFamily: fonts.bodyBold,
      fontSize: 17,
      lineHeight: 26,
      fontWeight: '700' as const,
      letterSpacing: 0.1,
    },
    monoStatus: {
      fontFamily: fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 22,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
    },
  },
};

export function getTheme(mode: 'light' | 'dark') {
  const colors = mode === 'dark' ? darkColors : lightColors;
  return { ...theme, colors };
}
