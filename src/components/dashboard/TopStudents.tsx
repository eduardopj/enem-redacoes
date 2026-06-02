import { useAppTheme } from '@/theme/ThemeContext';
import { getScoreColor, scorePct } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  topStudents: { studentId: string; averageScore: number }[];
  getStudentName: (studentId: string) => string;
};

export function TopStudents({ topStudents, getStudentName }: Props) {
  const { colors } = useAppTheme();

  if (topStudents.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#09090B' }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Top alunos</Text>
        <Pressable onPress={() => router.push('/alunos' as any)} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver todos</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </Pressable>
      </View>
      <View style={styles.topList}>
        {topStudents.map((item, i) => {
          const name = getStudentName(item.studentId);
          const pct = scorePct(item.averageScore);
          const sColor = getScoreColor(item.averageScore, colors);
          return (
            <Pressable
              key={item.studentId}
              onPress={() => router.push(`/aluno/${item.studentId}` as any)}
              style={[
                styles.topRow,
                i < topStudents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.accent : colors.input }]}>
                <Text style={[styles.rankText, { color: i === 0 ? '#fff' : colors.softText }]}>
                  {i + 1}
                </Text>
              </View>
              <View style={styles.topStudentInfo}>
                <Text style={[styles.topStudentName, { color: colors.text }]}>{name}</Text>
                <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
                  <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: sColor }]} />
                </View>
              </View>
              <Text style={[styles.topStudentScore, { color: sColor }]}>{item.averageScore}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 18,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 4,
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 15, fontWeight: '600' },
  topList: { gap: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 14, fontWeight: '700' },
  topStudentInfo: { flex: 1, gap: 6 },
  topStudentName: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  topStudentScore: { fontSize: 16, fontWeight: '700', minWidth: 38, textAlign: 'right' },
});
