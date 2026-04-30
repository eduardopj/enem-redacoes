import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';

type CompetencyProgressProps = {
  label: string;
  score: number;
  color?: string;
};

export function CompetencyProgress({ label, score, color }: CompetencyProgressProps) {
  const { colors } = useAppTheme();
  const barColor = color ?? colors.accent;
  const pct = Math.max(0, Math.min(100, Math.round((score / 200) * 100)));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.score, { color: barColor }]}>{score}/200</Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.input }]}>
        <View style={[styles.fill, { backgroundColor: barColor, width: `${pct}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 7 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  label: { flex: 1, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  score: { fontSize: 13, fontWeight: '800' },
  track: { height: 7, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
