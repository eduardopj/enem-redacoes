import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  EssayCard,
  ScreenContainer,
  StaggerItem,
} from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type FilterStatus = 'todas' | 'pendente' | 'processando' | 'corrigida' | 'precisa_revisao' | 'baixa_confiabilidade';
type SortMode = 'data' | 'nota_asc' | 'nota_desc';

export default function RedacoesScreen() {
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);
  const deleteEssay = useAppStore((state) => state.deleteEssay);
  const { colors } = useAppTheme();

  const [filter, setFilter] = useState<FilterStatus>('todas');
  const [sortMode, setSortMode] = useState<SortMode>('data');
  const [search, setSearch] = useState('');

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((student) => student.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const teacherEssays = useMemo(() => {
    if (!currentTeacher) return [];
    return essays.filter((essay) => essay.teacherId === currentTeacher.id);
  }, [currentTeacher, essays]);

  const getStudentName = useCallback(
    (studentId: string) =>
      teacherStudents.find((student) => student.id === studentId)?.name ?? 'Aluno',
    [teacherStudents]
  );

  const filteredEssays = useMemo(() => {
    let result = filter === 'todas' ? teacherEssays : teacherEssays.filter((e) => e.status === filter);

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (e) =>
          e.themeTitle.toLowerCase().includes(q) ||
          getStudentName(e.studentId).toLowerCase().includes(q)
      );
    }

    if (sortMode === 'nota_asc') {
      result = [...result].sort((a, b) => (a.totalScore ?? -1) - (b.totalScore ?? -1));
    } else if (sortMode === 'nota_desc') {
      result = [...result].sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
    } else {
      result = [...result].sort((a, b) =>
        (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
      );
    }

    return result;
  }, [teacherEssays, filter, sortMode, search, getStudentName]);

  const handleDelete = (essayId: string, studentName: string) => {
    Alert.alert(
      'Excluir redação',
      `Deseja realmente excluir a redação de ${studentName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteEssay(essayId) },
      ]
    );
  };

  const hasStudents = teacherStudents.length > 0;
  const hasEssays = teacherEssays.length > 0;
  const pendingCount = teacherEssays.filter((essay) => essay.status === 'pendente').length;
  const correctedEssays = teacherEssays.filter(
    (essay) => essay.status === 'corrigida' && typeof essay.totalScore === 'number'
  );
  const reviewCount = teacherEssays.filter(
    (essay) =>
      essay.status === 'precisa_revisao' ||
      essay.status === 'baixa_confiabilidade' ||
      essay.reviewRequired ||
      essay.confidenceLevel === 'baixa'
  ).length;
  const avgScore = correctedEssays.length
    ? Math.round(correctedEssays.reduce((sum, essay) => sum + (essay.totalScore ?? 0), 0) / correctedEssays.length)
    : null;

  const cycleSortMode = () => {
    setSortMode((prev) =>
      prev === 'data' ? 'nota_desc' : prev === 'nota_desc' ? 'nota_asc' : 'data'
    );
  };

  const sortLabel = sortMode === 'data' ? 'Mais recentes' : sortMode === 'nota_desc' ? 'Maior nota' : 'Menor nota';
  const sortIcon = sortMode === 'data' ? 'time-outline' : sortMode === 'nota_desc' ? 'trending-up' : 'trending-down';

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        <AppHeader
          eyebrow="Correção com IA"
          title="Redações"
          subtitle="Acompanhe e gerencie os envios da turma."
        />

        {hasStudents && hasEssays ? (
          <Button
            title="Nova redação"
            leftIcon="cloud-upload-outline"
            onPress={() => router.push('/nova-redacao')}
          />
        ) : null}

        {!hasStudents ? (
          <EmptyState
            icon="people-outline"
            title="Cadastre seus alunos primeiro"
            description="As redações precisam ser vinculadas a um aluno. Comece cadastrando pelo menos um aluno da sua turma."
            buttonLabel="Cadastrar aluno"
            secondaryLabel="Ir para Alunos"
            onPress={() => router.push('/novo-aluno')}
            onSecondaryPress={() => router.push('/alunos')}
            tip="Você pode cadastrar alunos individualmente ou importar uma turma inteira via QR code."
          />
        ) : !hasEssays ? (
          <EmptyState
            icon="document-text-outline"
            title="Nenhuma redação ainda"
            description="Registre a primeira redação e a IA fará uma análise completa das 5 competências do ENEM."
            buttonLabel="Enviar primeira redação"
            onPress={() => router.push('/nova-redacao')}
            tip="A IA avalia Proposta, Argumentação, Coesão, Coerência e Intervenção em poucos segundos."
          />
        ) : (
          <>
            <View style={styles.summaryGrid}>
              <SummaryCard label="Pendentes" value={pendingCount} icon="time-outline" tone={pendingCount > 0 ? colors.warning : colors.mutedText} />
              <SummaryCard label="Corrigidas" value={correctedEssays.length} icon="checkmark-circle-outline" tone={colors.success} />
              <SummaryCard label="Revisão" value={reviewCount} icon="alert-circle-outline" tone={reviewCount > 0 ? colors.danger : colors.mutedText} />
              <SummaryCard label="Média IA" value={avgScore ?? '--'} icon="sparkles-outline" tone={colors.accent} />
            </View>

            {/* Busca */}
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por aluno ou tema..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                </Pressable>
              ) : null}
            </View>

            {/* Filtros de status */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                [
                  { key: 'todas', label: 'Todas' },
                  { key: 'corrigida', label: 'Corrigidas' },
                  { key: 'processando', label: 'Em análise' },
                  { key: 'pendente', label: 'Pendentes' },
                  { key: 'precisa_revisao', label: 'Revisão' },
                  { key: 'baixa_confiabilidade', label: 'Baixa confiança' },
                ] as { key: FilterStatus; label: string }[]
              ).map(({ key, label }) => (
                <FilterChip
                  key={key}
                  label={label}
                  active={filter === key}
                  onPress={() => setFilter(key)}
                />
              ))}
            </ScrollView>

            {/* Contagem + Ordenação */}
            <View style={styles.toolbarRow}>
              <Text style={[styles.resultCount, { color: colors.mutedText }]}>
                {filteredEssays.length}{' '}
                {filteredEssays.length === 1 ? 'redação' : 'redações'}
              </Text>
              <Pressable
                onPress={cycleSortMode}
                style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
              >
                <Ionicons name={sortIcon as any} size={14} color={colors.softText} />
                <Text style={[styles.sortLabel, { color: colors.softText }]}>{sortLabel}</Text>
              </Pressable>
            </View>

            {filteredEssays.length === 0 ? (
              <EmptyState
                icon="search-outline"
                title="Nenhum resultado"
                description={search.trim() ? `Nenhuma redação encontrada para "${search.trim()}".` : 'Nenhuma redação corresponde ao filtro selecionado.'}
                buttonLabel="Limpar filtros"
                onPress={() => { setFilter('todas'); setSearch(''); }}
                tip="Tente buscar pelo nome do aluno ou pelo título do tema da redação."
              />
            ) : (
              <FlatList
                data={filteredEssays}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                scrollEnabled={false}
                renderItem={({ item: essay, index }) => {
                  const studentName = getStudentName(essay.studentId);
                  return (
                    <StaggerItem index={index}>
                      <EssayCard
                        studentName={studentName}
                        themeTitle={essay.themeTitle}
                        status={essay.status}
                        totalScore={essay.totalScore}
                        competencies={essay.competencies}
                        createdAt={essay.createdAt}
                        correctedAt={essay.correctedAt}
                        onPress={() => router.push(`/redacao/${essay.id}`)}
                        onDelete={() => handleDelete(essay.id, studentName)}
                      />
                    </StaggerItem>
                  );
                }}
              />
            )}
          </>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? colors.accent + '18' : colors.surface,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.accent : colors.softText }]}>
        {label}
      </Text>
    </Pressable>
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
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    width: '48%',
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
  filterRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    gap: theme.spacing.md,
  },
});
