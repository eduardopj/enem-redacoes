import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { StudentRanking, TurmaRanking, type RankingEntry, type TurmaRankingEntry, trendIcon } from '@/components/ranking';
import { ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RankingScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const students = useAppStore((s) => s.students);
  const essays = useAppStore((s) => s.essays);
  const turmas = useAppStore((s) => s.turmas);

  const [mainTab, setMainTab] = useState<'alunos' | 'turmas'>('alunos');

  // ── Alunos tab ────────────────────────────────────────────────────────────

  const classes = useMemo(() => {
    const mine = students.filter((s) => s.teacherId === currentTeacher?.id);
    return [...new Set(mine.map((s) => s.className))].sort();
  }, [students, currentTeacher]);

  const [selectedClass, setSelectedClass] = useState<string>(() => classes[0] ?? '');

  const ranking = useMemo<RankingEntry[]>(() => {
    if (!currentTeacher) return [];
    const classStudents = students.filter(
      (s) => s.teacherId === currentTeacher.id && s.className === selectedClass
    );
    return classStudents
      .map((s) => {
        const ces = essays
          .filter((e) => e.studentId === s.id && e.status === 'corrigida')
          .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));
        const scores = ces.map((e) => e.totalScore ?? 0);
        const average = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const best = scores.length ? Math.max(...scores) : null;
        const trend = trendIcon(scores, colors);
        return { student: s, scores, average, best, trend, totalEssays: ces.length };
      })
      .sort((a, b) => {
        if (a.average === null && b.average === null) return 0;
        if (a.average === null) return 1;
        if (b.average === null) return -1;
        return b.average - a.average;
      });
  }, [students, essays, currentTeacher, selectedClass]);

  const classAvg = useMemo(() => {
    const withScores = ranking.filter((r) => r.average !== null);
    if (!withScores.length) return null;
    return Math.round(withScores.reduce((s, r) => s + (r.average ?? 0), 0) / withScores.length);
  }, [ranking]);

  // ── Turmas tab ────────────────────────────────────────────────────────────

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const turmaRanking = useMemo<TurmaRankingEntry[]>(() => {
    if (!currentTeacher) return [];
    return myTurmas
      .map((t) => {
        // Include students linked by turmaId OR by matching className (backward compat)
        const ss = students.filter(
          (s) => s.turmaId === t.id || (!s.turmaId && s.className === t.name && s.teacherId === currentTeacher.id)
        );
        const allEssays = essays.filter((e) => ss.some((s) => s.id === e.studentId) && e.status === 'corrigida');
        const scores = allEssays.map((e) => e.totalScore ?? 0).filter((s) => s > 0);
        const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
        const best = scores.length ? Math.max(...scores) : null;
        const above700 = scores.filter((s) => s >= 700).length;
        const pctAbove700 = scores.length ? Math.round((above700 / scores.length) * 100) : 0;
        const pending = essays.filter((e) => ss.some((s) => s.id === e.studentId) && e.status === 'pendente').length;
        return {
          turma: t,
          studentCount: ss.length,
          essayCount: allEssays.length,
          avg,
          best,
          above700,
          pctAbove700,
          pending,
        };
      })
      .sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0;
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return b.avg - a.avg;
      });
  }, [myTurmas, students, essays, currentTeacher]);

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        {/* Title */}
        <View style={styles.titleSection}>
          <View style={[styles.titleIcon, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="trophy" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>Ranking</Text>
            <Text style={[styles.pageSub, { color: colors.mutedText }]}>Desempenho comparativo</Text>
          </View>
        </View>

        {/* Main tabs */}
        <View style={[styles.mainTabs, { backgroundColor: colors.input }]}>
          <Pressable
            onPress={() => setMainTab('alunos')}
            style={[styles.mainTab, mainTab === 'alunos' && { backgroundColor: colors.surface, shadowColor: '#09090B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="people" size={15} color={mainTab === 'alunos' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'alunos' ? colors.accent : colors.mutedText }]}>
              Alunos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMainTab('turmas')}
            style={[styles.mainTab, mainTab === 'turmas' && { backgroundColor: colors.surface, shadowColor: '#09090B', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="school" size={15} color={mainTab === 'turmas' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'turmas' ? colors.accent : colors.mutedText }]}>
              Turmas
            </Text>
          </Pressable>
        </View>

        {/* Tab content */}
        {mainTab === 'alunos' && (
          <StudentRanking
            classes={classes}
            selectedClass={selectedClass}
            setSelectedClass={setSelectedClass}
            ranking={ranking}
            classAvg={classAvg}
            colors={colors}
          />
        )}

        {mainTab === 'turmas' && (
          <TurmaRanking turmaRanking={turmaRanking} colors={colors} />
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  titleSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  titleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0, lineHeight: 26 },
  pageSub: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  mainTabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  mainTabText: { fontSize: 14, fontWeight: '700' },
});
