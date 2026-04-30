import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ScreenContainer,
  StaggerItem,
  StudentCard,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AlunosScreen() {
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);
  const turmas = useAppStore((state) => state.turmas);
  const deleteStudent = useAppStore((state) => state.deleteStudent);
  const { colors } = useAppTheme();

  const [search, setSearch] = useState('');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>('');

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((s) => s.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  // Compute per-student stats inline
  const studentStats = useMemo(() => {
    return teacherStudents.reduce<Record<string, { avg: number | null; count: number; trend: 'up' | 'down' | 'stable' | null }>>((acc, s) => {
      const ces = essays.filter((e) => e.studentId === s.id && e.status === 'corrigida')
        .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''));
      const scores = ces.map((e) => e.totalScore ?? 0);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      let trend: 'up' | 'down' | 'stable' | null = null;
      if (scores.length >= 2) {
        const delta = scores[scores.length - 1] - scores[scores.length - 2];
        trend = delta > 20 ? 'up' : delta < -20 ? 'down' : 'stable';
      }
      acc[s.id] = { avg, count: essays.filter((e) => e.studentId === s.id).length, trend };
      return acc;
    }, {});
  }, [teacherStudents, essays]);

  const filteredStudents = useMemo(() => {
    let result = teacherStudents;

    if (selectedTurmaId) {
      result = result.filter((s) => s.turmaId === selectedTurmaId);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.className.toLowerCase().includes(q)
      );
    }

    return result;
  }, [teacherStudents, search, selectedTurmaId]);

  const handleDelete = (studentId: string, studentName: string) => {
    Alert.alert(
      'Excluir aluno',
      `Deseja realmente excluir ${studentName}? As redações vinculadas também serão removidas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteStudent(studentId) },
      ]
    );
  };

  const hasStudents = teacherStudents.length > 0;
  const studentsWithEssays = teacherStudents.filter((student) => (studentStats[student.id]?.count ?? 0) > 0).length;
  const attentionStudents = teacherStudents.filter((student) => {
    const stats = studentStats[student.id];
    return !stats || stats.count === 0 || stats.trend === 'down' || (stats.avg !== null && stats.avg < 600);
  }).length;
  const classAverage = teacherStudents
    .map((student) => studentStats[student.id]?.avg)
    .filter((score): score is number => typeof score === 'number');
  const averageScore = classAverage.length
    ? Math.round(classAverage.reduce((sum, score) => sum + score, 0) / classAverage.length)
    : null;

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        <AppHeader
          eyebrow="Turma"
          title="Alunos"
          subtitle={hasStudents ? `${teacherStudents.length} aluno${teacherStudents.length !== 1 ? 's' : ''} cadastrado${teacherStudents.length !== 1 ? 's' : ''}` : 'Cadastre e acompanhe seus alunos.'}
        />

        {hasStudents && (
          <Button
            title="Novo aluno"
            leftIcon="add-outline"
            onPress={() => router.push('/novo-aluno')}
          />
        )}

        {!hasStudents ? (
          <EmptyState
            icon="people-outline"
            title="Nenhum aluno cadastrado"
            description="Antes de cadastrar uma redação, cadastre pelo menos um aluno."
            buttonLabel="Cadastrar aluno"
            onPress={() => router.push('/novo-aluno')}
          />
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard label="Com redação" value={studentsWithEssays} icon="document-text-outline" tone={colors.success} />
              <SummaryCard label="Atenção" value={attentionStudents} icon="alert-circle-outline" tone={attentionStudents > 0 ? colors.warning : colors.mutedText} />
              <SummaryCard label="Média" value={averageScore ?? '--'} icon="analytics-outline" tone={colors.accent} />
            </View>

            {/* Busca */}
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por nome ou turma..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                </Pressable>
              )}
            </View>

            {/* Filtro por turma */}
            {myTurmas.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={styles.turmaFilterRow}>
                <Pressable
                  onPress={() => setSelectedTurmaId('')}
                  style={[
                    styles.turmaChip,
                    !selectedTurmaId
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.input, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.turmaChipText, { color: !selectedTurmaId ? '#fff' : colors.softText }]}>
                    Todos
                  </Text>
                </Pressable>
                {myTurmas.map((t) => {
                  const active = selectedTurmaId === t.id;
                  const count = teacherStudents.filter((s) => s.turmaId === t.id).length;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setSelectedTurmaId(active ? '' : t.id)}
                      style={[
                        styles.turmaChip,
                        active
                          ? { backgroundColor: colors.accent, borderColor: colors.accent }
                          : { backgroundColor: colors.input, borderColor: colors.border },
                      ]}
                    >
                      <Ionicons name="school-outline" size={12} color={active ? '#fff' : colors.mutedText} />
                      <Text style={[styles.turmaChipText, { color: active ? '#fff' : colors.softText }]}>
                        {t.name}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.border }]}>
                        <Text style={[styles.countBadgeText, { color: active ? '#fff' : colors.mutedText }]}>{count}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Resultado + lista */}
            {selectedTurmaId || search ? (
              <View style={styles.resultRow}>
                <Text style={[styles.resultCount, { color: colors.mutedText }]}>
                  {filteredStudents.length} aluno{filteredStudents.length !== 1 ? 's' : ''}
                </Text>
                {(selectedTurmaId || search) && (
                  <Pressable
                    onPress={() => { setSelectedTurmaId(''); setSearch(''); }}
                    style={[styles.clearBtn, { backgroundColor: colors.input }]}
                  >
                    <Ionicons name="close" size={12} color={colors.mutedText} />
                    <Text style={[styles.clearBtnText, { color: colors.mutedText }]}>Limpar filtros</Text>
                  </Pressable>
                )}
              </View>
            ) : null}

            <FlatList
              data={filteredStudents}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              scrollEnabled={false}
              renderItem={({ item: student, index }) => {
                const stats = studentStats[student.id];
                return (
                  <StaggerItem index={index}>
                    <StudentCard
                      name={student.name}
                      className={student.className}
                      avgScore={stats?.avg}
                      essayCount={stats?.count}
                      trend={stats?.trend}
                      onPress={() => router.push(`/aluno/${student.id}`)}
                      onDelete={() => handleDelete(student.id, student.name)}
                    />
                  </StaggerItem>
                );
              }}
              ListEmptyComponent={
                <EmptyState
                  icon="search-outline"
                  title="Nenhum aluno encontrado"
                  description={search ? `Nenhum resultado para "${search}".` : 'Nenhum aluno nesta turma ainda.'}
                />
              }
            />
          </>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: number | string; icon: keyof typeof Ionicons.glyphMap; tone: string }) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.summaryCard}>
      <View style={[styles.summaryIcon, { backgroundColor: tone + '16' }]}>
        <Ionicons name={icon} size={15} color={tone} />
      </View>
      <Text style={[styles.summaryValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.mutedText }]} numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    padding: theme.spacing.md,
    gap: 6,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    paddingVertical: 0,
  },
  turmaFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  turmaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  turmaChipText: { fontSize: 12, fontWeight: '600' },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeText: { fontSize: 10, fontWeight: '700' },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: { fontSize: 12, fontWeight: '500' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  clearBtnText: { fontSize: 11, fontWeight: '600' },
  list: { gap: theme.spacing.md },
});
