import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'accent' | 'flat';
  accentBorder?: string;
}>;

export function Card({ children, style, variant = 'default', accentBorder }: CardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        variant === 'accent' && { backgroundColor: colors.accent },
        variant === 'flat' && { backgroundColor: colors.input },
        style,
      ]}
    >
      {/* Optional colored left accent strip */}
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
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
    position: 'relative',
    overflow: 'hidden',
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
});
