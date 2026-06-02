import { StudentRoute } from '@/components/auth/StudentRoute';
import { Card, EmptyState, ScreenContainer, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import { getScoreColor } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Filter = 'todas' | 'corrigida' | 'processando' | 'pendente';
type Sort = 'data' | 'nota_desc' | 'nota_asc';


function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const animateScale = (toValue: number) => {
    Animated.spring(scale, {
      toValue,
      stiffness: 350,
      damping: 15,
      useNativeDriver: true,
    }).start();
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animateScale(0.92)}
        onPressOut={() => animateScale(1)}
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
              <Card style={styles.listCard}>
                <FlatList
                  data={filtered}
                  keyExtractor={e => e.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                  renderItem={({ item: essay }) => (
                    <StudentEssayCard essay={essay} colors={colors} />
                  )}
                />
              </Card>
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

  const handlePress = () => {
    if (essay.status === 'corrigida') {
      router.push(`/resultado/${essay.id}`);
    } else {
      router.push(`/redacao/${essay.id}` as any);
    }
  };

  const dateStr = essay.createdAt
    ? new Date(essay.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null;

  const hasError = essay.status === 'pendente' && Boolean(essay.errorMessage);

  return (
    <Pressable onPress={handlePress} style={cardStyles.row}>
      {/* Left: date box or score box */}
      {essay.status === 'corrigida' && essay.totalScore != null ? (
        <View style={[cardStyles.scoreBox, { backgroundColor: scoreColor + '14' }]}>
          <Text style={[cardStyles.scoreNum, { color: scoreColor }]}>{essay.totalScore}</Text>
          <Text style={[cardStyles.scoreSuffix, { color: scoreColor + '99' }]}>pts</Text>
        </View>
      ) : (
        <View style={[cardStyles.iconBox, {
          backgroundColor: hasError ? colors.danger + '14' : colors.input,
        }]}>
          <Ionicons
            name={hasError ? 'alert-circle-outline' : essay.status === 'processando' ? 'sync-outline' : 'time-outline'}
            size={18}
            color={hasError ? colors.danger : colors.mutedText}
          />
        </View>
      )}

      {/* Info */}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.themeTitle, { color: colors.text }]} numberOfLines={1}>
          {essay.themeTitle}
        </Text>
        <View style={cardStyles.metaRow}>
          <StatusBadge status={essay.status} />
          {dateStr ? (
            <Text style={[cardStyles.date, { color: colors.mutedText }]}>{dateStr}</Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
    </Pressable>
  );
}


const cardStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 60,
  },
  scoreBox: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
    flexShrink: 0,
  },
  scoreNum: { fontSize: 15, fontWeight: '800', lineHeight: 18 },
  scoreSuffix: { fontSize: 10, fontWeight: '600' },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  themeTitle: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 11 },
});

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: 0, lineHeight: 32 },
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
  listCard: { padding: 0, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: 16 },
});
