import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, View } from 'react-native';

type ProgressBarProps = {
  value: number;
};

export function ProgressBar({ value }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const progress = Math.max(0, Math.min(100, value));

  return (
    <View style={[styles.track, { backgroundColor: colors.input }]}>
      <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 10,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
  },
});