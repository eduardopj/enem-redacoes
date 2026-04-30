import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, View, ViewStyle } from 'react-native';

type SkeletonProps = {
  width?: ViewStyle['width'];
  height?: number;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = '100%', height = 16, radius = theme.radius.sm, style }: SkeletonProps) {
  const { colors } = useAppTheme();

  return (
    <View
      accessibilityLabel="Carregando"
      style={[styles.base, { width, height, borderRadius: radius, backgroundColor: colors.input }, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    opacity: 0.85,
  },
});
