import { useAppTheme } from '@/theme/ThemeContext';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type TurmaSnapshot = {
  turma: { id: string; name: string; period?: string };
  students: number;
  avg: number | null;
};

type Props = {
  turmaSnapshots: TurmaSnapshot[];
};

export function MyTurmasCard({ turmaSnapshots }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: '#09090B' }]}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas turmas</Text>
        <Pressable onPress={() => router.push('/turmas' as any)} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver todas</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.accent} />
        </Pressable>
      </View>

      {turmaSnapshots.length === 0 ? (
        <Pressable
          onPress={() => router.push('/nova-turma' as any)}
          style={[styles.emptyTurmaRow, { backgroundColor: colors.input, borderColor: colors.border }]}
        >
          <View style={[styles.emptyTurmaIcon, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="people-outline" size={18} color={colors.accent} />
          </View>
          <Text style={[styles.emptyTurmaText, { color: colors.softText }]}>
            Crie sua primeira turma para organizar os alunos
          </Text>
          <View style={[styles.emptyTurmaBtn, { backgroundColor: colors.accent }]}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </Pressable>
      ) : (
        <View style={styles.turmaList}>
          {turmaSnapshots.map(({ turma, students: sCount, avg }) => (
            <Pressable
              key={turma.id}
              onPress={() => router.push(`/turma/${turma.id}` as any)}
              style={[styles.turmaRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.turmaIconWrap, { backgroundColor: colors.accent + '14' }]}>
                <Ionicons name="school-outline" size={16} color={colors.accent} />
              </View>
              <View style={styles.turmaInfo}>
                <Text style={[styles.turmaName, { color: colors.text }]}>{turma.name}</Text>
                <Text style={[styles.turmaMeta, { color: colors.mutedText }]}>
                  {sCount} aluno{sCount !== 1 ? 's' : ''}
                  {turma.period ? ` · ${turma.period}` : ''}
                </Text>
              </View>
              {avg !== null ? (
                <Text style={[styles.turmaAvg, {
                  color: getScoreColor(avg, colors)
                }]}>
                  {avg} pts
                </Text>
              ) : (
                <Text style={[styles.turmaAvg, { color: colors.mutedText }]}>— pts</Text>
              )}
              <Ionicons name="chevron-forward" size={14} color={colors.border} />
            </Pressable>
          ))}
        </View>
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 4,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 15, fontWeight: '600' },
  turmaList: { gap: 0, marginTop: 8 },
  turmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  turmaIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaInfo: { flex: 1, gap: 2 },
  turmaName: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  turmaMeta: { fontSize: 14, lineHeight: 20 },
  turmaAvg: { fontSize: 15, fontWeight: '700', minWidth: 52, textAlign: 'right' },
  emptyTurmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyTurmaIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyTurmaText: { flex: 1, fontSize: 15, lineHeight: 22 },
  emptyTurmaBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
