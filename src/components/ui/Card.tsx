import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type CardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Card({ children, style }: CardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.lg,
    ...theme.shadows.card,
  },
});