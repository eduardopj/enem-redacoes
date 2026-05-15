import { Essay } from '@/types/app';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Colors = { text: string; mutedText: string; input: string; accent: string };

function scoreColor(score: number, colors: Colors): string {
  if (score >= 900) return '#22c55e';
  if (score >= 550) return colors.accent;
  if (score >= 380) return '#f59e0b';
  return '#ef4444';
}

type MiniBarChartProps = {
  essays: Essay[];
  getStudentName: (id: string) => string;
  colors: Colors;
};

export function MiniBarChart({ essays, getStudentName, colors }: MiniBarChartProps) {
  return (
    <View style={styles.chartWrap}>
      {essays.map((essay) => {
        const score = essay.totalScore ?? 0;
        const pct = (score / 1000) * 100;
        const name = getStudentName(essay.studentId).split(' ')[0];
        const barColor = scoreColor(score, colors);
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
  barScore: { fontSize: 10, fontWeight: '700', lineHeight: 13 },
  barTrack: { flex: 1, width: '100%', borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, lineHeight: 13 },
});
