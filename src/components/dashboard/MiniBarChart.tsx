import { useAppTheme } from '@/theme/ThemeContext';
import type { Essay } from '@/types/app';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  essays: Essay[];
  getStudentName: (id: string) => string;
};

function scoreGradientColor(score: number, colors: ReturnType<typeof useAppTheme>['colors']): string {
  if (score >= 900) return colors.success;
  if (score >= 550) return colors.accent;
  if (score >= 380) return colors.warning;
  return colors.danger;
}

export const MiniBarChart = React.memo(function MiniBarChart({ essays, getStudentName }: Props) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.chartWrap}>
      {essays.map((essay) => {
        const score = essay.totalScore ?? 0;
        const pct = (score / 1000) * 100;
        const name = getStudentName(essay.studentId).split(' ')[0];
        const barColor = scoreGradientColor(score, colors);
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
});

const styles = StyleSheet.create({
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 12 },
  barItem: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barScore: { fontSize: 10, fontWeight: '700' },
  barTrack: { width: '80%', flex: 1, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, textAlign: 'center' },
});
