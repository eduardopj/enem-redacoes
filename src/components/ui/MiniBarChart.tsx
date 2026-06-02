import { getScoreColor } from '@/utils/analytics';
import { useAppTheme } from '@/theme/ThemeContext';
import type { Essay } from '@/types/app';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type MiniBarChartProps = {
  essays: Essay[];
  getStudentName: (id: string) => string;
};

export function MiniBarChart({ essays, getStudentName }: MiniBarChartProps) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.chartWrap}>
      {essays.map((essay) => {
        const score = essay.totalScore ?? 0;
        const pct = (score / 1000) * 100;
        const name = getStudentName(essay.studentId).split(' ')[0];
        const barColor = getScoreColor(score, colors);
        return (
          <Pressable
            key={essay.id}
            onPress={() => router.push(`/resultado/${essay.id}` as any)}
            style={styles.barItem}
          >
            <Text style={[styles.barScore, { color: colors.text }]}>{score}</Text>
            <View style={[styles.barTrack, { backgroundColor: colors.input }]}>
              <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.mutedText }]}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: { flexDirection: 'row', gap: 8, height: 110, alignItems: 'flex-end' },
  barItem: { flex: 1, alignItems: 'center', gap: 4 },
  barScore: { fontSize: 11, fontWeight: '700' },
  barTrack: { flex: 1, width: '100%', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, textAlign: 'center' },
});
