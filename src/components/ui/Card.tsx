import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'flat' | 'dark' | 'outlined';
  accentBorder?: string;
  noPadding?: boolean;
}>;

export function Card({ children, style, variant = 'default', accentBorder, noPadding }: CardProps) {
  const { colors } = useAppTheme();

  const bgColor = {
    default: colors.surface,
    accent: colors.accent,
    flat: colors.input,
    dark: colors.black,
    outlined: colors.surface,
  }[variant];

  // Duolingo-style: border-bottom mais espesso cria profundidade sem shadow
  const borderStyle = variant === 'default' || variant === 'outlined'
    ? {
        borderWidth: 2,
        borderColor: colors.border,
        borderBottomWidth: 5,
        borderBottomColor: colors.borderStrong,
      }
    : variant === 'flat'
    ? {
        borderWidth: 1,
        borderColor: colors.border,
      }
    : {};

  return (
    <View
      style={[
        styles.card,
        noPadding && styles.noPadding,
        { backgroundColor: bgColor },
        borderStyle,
        style,
      ]}
    >
      {accentBorder ? (
        <View
          style={[
            styles.accentStrip,
            {
              backgroundColor: accentBorder,
              borderTopLeftRadius: theme.radius.lg,
              borderBottomLeftRadius: theme.radius.lg,
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  noPadding: {
    padding: 0,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
