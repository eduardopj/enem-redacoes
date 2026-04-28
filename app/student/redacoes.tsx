import { StudentRoute } from '@/components/auth/StudentRoute';
import { Card, EmptyState, ScreenContainer, StaggerItem, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Filter = 'todas' | 'corrigida' | 'processando' | 'pendente';
type Sort = 'data' | 'nota_desc' | 'nota_asc';

const COMP_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E'];

function MiniCompBars({ competencies }: { competencies: NonNullable<Essay['competencies']> }) {
  const vals = [competencies.c1, competencies.c2, competencies.c3, competencies.c4, competencies.c5];
  return (
    <View style={barStyles.wrap}>
      {vals.map((v, i) => (
        <View key={i} style={barStyles.col}>
          <View style={barStyles.track}>
            <View style={[barStyles.fill, { height: `${(v / 200) * 100}%`, backgroundColor: COMP_COLORS[i] }]} />
          </View>
          <Text style={[barStyles.label, { color: COMP_COLORS[i] }]}>C{i + 1}</Text>
        </View>
      ))}
    </View>
  );
}

const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 28 },
  col: { flex: 1, alignItems: 'center', gap: 2 },
  track: { width: '100%', height: 20, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: 3 },
  label: { fontSize: 8, fontWeight: '700' },
});

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92, { stiffness: 350, damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 350, damping: 15 }); }}
        style={[styles.chip, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.input : colors.surface }]}
      >
        <Text style={[styles.chipText, { color: active ? colors.accent : colors.softText }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function StudentRedacoesScreen() {
  const { colors } = useAppTheme();
  const currentStudent = useAppStore(s => s.currentStudent);
  const essays = useAppStore(s => s.essays);

  const [filter, setFilter] = useState<Filter>('todas');
  const [sort, setSort] = useState<Sort>('data');
  const [search, setSearch] = useState('');

  const myEssays = useMemo(
    () => essays.filter(e => e.studentId === currentStudent?.studentId),
    [essays, currentStudent]
  );

  const filtered = useMemo(() => {
    let result = filter === 'todas' ? myEssays : myEssays.filter(e => e.status === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(e => e.themeTitle.toLowerCase().includes(q));
    }
    if (sort === 'nota_desc') return [...result].sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
    if (sort === 'nota_asc') return [...result].sort((a, b) => (a.totalScore ?? -1) - (b.totalScore ?? -1));
    return [...result].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }, [myEssays, filter, sort, search]);

  const cycleSortMode = () =>
    setSort(prev => prev === 'data' ? 'nota_desc' : prev === 'nota_desc' ? 'nota_asc' : 'data');

  const sortLabel = sort === 'data' ? 'Mais recentes' : sort === 'nota_desc' ? 'Maior nota' : 'Menor nota';
  const sortIcon = sort === 'data' ? 'time-outline' : sort === 'nota_desc' ? 'trending-up' : 'trending-down';

  return (
    <StudentRoute>
      <ScreenContainer showStudentNav>

        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.mutedText }]}>Minhas redações</Text>
            <Text style={[styles.title, { color: colors.text }]}>Histórico</Text>
          </View>
          <Pressable
            onPress={() => router.push('/student/nova' as any)}
            style={[styles.newBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newBtnText}>Nova</Text>
          </Pressable>
        </View>

        {myEssays.length === 0 ? (
          <EmptyState
            icon="document-outline"
            title="Nenhuma redação ainda"
            description="Envie sua primeira redação para começar."
            buttonLabel="Enviar redação"
            onPress={() => router.push('/student/nova' as any)}
          />
        ) : (
          <>
            {/* Search */}
            <View style={[styles.searchRow, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.mutedText} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar por tema..."
                placeholderTextColor={colors.mutedText}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.mutedText} />
                </Pressable>
              )}
            </View>

            {/* Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {([
                { key: 'todas', label: 'Todas' },
                { key: 'corrigida', label: 'Corrigidas' },
                { key: 'processando', label: 'Processando' },
                { key: 'pendente', label: 'Pendentes' },
              ] as { key: Filter; label: string }[]).map(({ key, label }) => (
                <FilterChip key={key} label={label} active={filter === key} onPress={() => setFilter(key)} />
              ))}
            </ScrollView>

            {/* Toolbar */}
            <View style={styles.toolbarRow}>
              <Text style={[styles.resultCount, { color: colors.mutedText }]}>
                {filtered.length} {filtered.length === 1 ? 'redação' : 'redações'}
              </Text>
              <Pressable
                onPress={cycleSortMode}
                style={[styles.sortBtn, { borderColor: colors.border, backgroundColor: colors.input }]}
              >
                <Ionicons name={sortIcon as any} size={13} color={colors.softText} />
                <Text style={[styles.sortLabel, { color: colors.softText }]}>{sortLabel}</Text>
              </Pressable>
            </View>

            {filtered.length === 0 ? (
              <EmptyState icon="filter-outline" title="Nenhuma redação neste filtro" description="Ajuste o filtro ou a busca." />
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={e => e.id}
                scrollEnabled={false}
                contentContainerStyle={styles.list}
                renderItem={({ item: essay, index }) => (
                  <StaggerItem index={index}>
                    <StudentEssayCard essay={essay} colors={colors} />
                  </StaggerItem>
                )}
              />
            )}
          </>
        )}
      </ScreenContainer>
    </StudentRoute>
  );
}

function StudentEssayCard({ essay, colors }: { essay: Essay; colors: any }) {
  const scoreColor = essay.status === 'corrigida' && essay.totalScore != null
    ? getScoreColor(essay.totalScore, colors)
    : colors.mutedText;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    if (essay.status === 'corrigida') {
      router.push(`/resultado/${essay.id}`);
    } else {
      router.push(`/redacao/${essay.id}` as any);
    }
  };

  return (
    <Animated.View style={animStyle}>
    <Card>
      <Pressable
        onPress={handlePress}
        onPressIn={() => { scale.value = withSpring(0.97, { stiffness: 250, damping: 18 }); }}
        onPressOut={() => { scale.value = withSpring(1, { stiffness: 250, damping: 18 }); }}
      >
        <View style={cardStyles.topRow}>
          {/* Score pill or status */}
          {essay.status === 'corrigida' && essay.totalScore != null ? (
            <View style={[cardStyles.scorePill, { backgroundColor: scoreColor + '14' }]}>
              <Text style={[cardStyles.scoreNum, { color: scoreColor }]}>{essay.totalScore}</Text>
              <Text style={[cardStyles.scoreDenom, { color: scoreColor + '99' }]}>/1000</Text>
            </View>
          ) : (
            <View style={[cardStyles.scorePill, { backgroundColor: colors.input }]}>
              <Ionicons
                name={essay.status === 'processando' ? 'sync-outline' : 'time-outline'}
                size={22}
                color={colors.mutedText}
              />
            </View>
          )}

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={[cardStyles.themeTitle, { color: colors.text }]} numberOfLines={2}>
              {essay.themeTitle}
            </Text>
            {essay.createdAt && (
              <Text style={[cardStyles.date, { color: colors.mutedText }]}>
                {new Date(essay.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            )}
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
        </View>

        {/* Mini comp bars */}
        {essay.status === 'corrigida' && essay.competencies && (
          <View style={[cardStyles.compSection, { borderTopColor: colors.border }]}>
            <MiniCompBars competencies={essay.competencies} />
          </View>
        )}

        <View style={[cardStyles.metaRow, { borderTopColor: colors.border }]}>
          <StatusBadge status={essay.status} />
          {essay.status === 'corrigida' && essay.totalScore != null && (
            <Text style={[cardStyles.scoreLabel, { color: colors.mutedText }]}>
              {getScoreLabel(essay.totalScore, colors)}
            </Text>
          )}
        </View>
      </Pressable>
    </Card>
    </Animated.View>
  );
}

function getScoreLabel(score: number, _colors: any): string {
  if (score >= 900) return 'Excelente';
  if (score >= 750) return 'Muito bom';
  if (score >= 600) return 'Bom';
  if (score >= 450) return 'Regular';
  if (score >= 300) return 'Insuficiente';
  return 'Muito baixo';
}

const cardStyles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  scorePill: { borderRadius: 12, padding: 8, alignItems: 'center', minWidth: 56, justifyContent: 'center' },
  scoreNum: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, lineHeight: 24 },
  scoreDenom: { fontSize: 10, fontWeight: '600' },
  themeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 2 },
  date: { fontSize: 11, lineHeight: 16 },
  compSection: { paddingTop: theme.spacing.sm, marginBottom: theme.spacing.sm, borderTopWidth: 1 },
  metaRow: {
    paddingTop: theme.spacing.sm, borderTopWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  scoreLabel: { fontSize: 11, fontWeight: '600' },
});

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 32 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
  },
  newBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingVertical: 2 },
  chip: { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },
  toolbarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { fontSize: 12, fontWeight: '500' },
  sortBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  sortLabel: { fontSize: 11, fontWeight: '600' },
  list: { gap: theme.spacing.md },
});
