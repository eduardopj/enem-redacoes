import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  AppHeader,
  Button,
  Card,
  EmptyState,
  ScreenContainer,
  SkeletonCorrecoes,
  StatusBadge,
  SwipeableRow,
} from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/app-store';
import { theme } from '@/theme';
import { useAppTheme } from '@/theme/ThemeContext';
import { useShallow } from 'zustand/react/shallow';
import { Essay } from '@/types/app';
import { getLowConfidenceCorrections, isCorrectedEssay } from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type QueueTab = 'agora' | 'revisar' | 'corrigidas';

function byRecent(a: Essay, b: Essay) {
  return (b.updatedAt ?? b.correctedAt ?? b.createdAt ?? '').localeCompare(
    a.updatedAt ?? a.correctedAt ?? a.createdAt ?? ''
  );
}

export default function CorrecoesScreen() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const {
    hasHydrated, currentTeacher, students, essays, retryQueue,
    deleteEssay, backendSyncHasMore, fetchMoreEssaysFromBackend,
  } = useAppStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      currentTeacher: state.currentTeacher,
      students: state.students,
      essays: state.essays,
      retryQueue: state.retryQueue,
      deleteEssay: state.deleteEssay,
      backendSyncHasMore: state.backendSyncHasMore,
      fetchMoreEssaysFromBackend: state.fetchMoreEssaysFromBackend,
    }))
  );
  const [tab, setTab] = useState<QueueTab>('agora');
  const [loadingMore, setLoadingMore] = useState(false);

  const teacherStudents = useMemo(
    () => students.filter((student) => student.teacherId === currentTeacher?.id),
    [students, currentTeacher?.id]
  );

  const teacherEssays = useMemo(
    () => essays.filter((essay) => essay.teacherId === currentTeacher?.id).sort(byRecent),
    [essays, currentTeacher?.id]
  );

  const pending = teacherEssays.filter((essay) => essay.status === 'pendente');
  const processing = teacherEssays.filter((essay) => essay.status === 'processando');
  const corrected = teacherEssays.filter(isCorrectedEssay);
  const lowConfidence = getLowConfidenceCorrections(teacherEssays);
  const needsTeacherReview = corrected.filter(
    (essay) => !essay.teacherReviewedAt || essay.reviewRequired || lowConfidence.some((item) => item.id === essay.id)
  );

  const nextEssay = pending[0] ?? processing[0] ?? needsTeacherReview[0] ?? corrected[0];

  const getStudentName = (studentId: string) =>
    teacherStudents.find((student) => student.id === studentId)?.name ?? 'Aluno';

  const visibleEssays =
    tab === 'agora'
      ? [...processing, ...pending].sort(byRecent)
      : tab === 'revisar'
        ? needsTeacherReview.sort(byRecent)
        : corrected.sort(byRecent);

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        <AppHeader
          eyebrow="Central do professor"
          title="Correções"
          subtitle="Fila, revisão humana e devolutivas em um só lugar."
        />

        {!hasHydrated ? (
          <SkeletonCorrecoes />
        ) : teacherEssays.length === 0 ? (
          <EmptyState
            icon="sparkles-outline"
            title="Nenhuma correção ainda"
            description="Envie a primeira redação para iniciar a fila de correções da turma."
            buttonLabel="Nova redação"
            onPress={() => router.push('/nova-redacao' as any)}
          />
        ) : (
          <>
            <Card style={[styles.hero, { backgroundColor: colors.accent }]}>
              <View style={styles.heroTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.heroEyebrow}>Próxima melhor ação</Text>
                  <Text style={styles.heroTitle}>
                    {pending.length > 0
                      ? `${pending.length} redação${pending.length > 1 ? 'ões' : ''} para corrigir`
                      : needsTeacherReview.length > 0
                        ? `${needsTeacherReview.length} para revisar`
                        : 'Fila em dia'}
                  </Text>
                  <Text style={styles.heroText}>
                    {nextEssay
                      ? `${getStudentName(nextEssay.studentId)} · ${nextEssay.themeTitle}`
                      : 'Tudo certo por enquanto.'}
                  </Text>
                </View>
                <View style={styles.heroIcon}>
                  <Ionicons name="sparkles-outline" size={24} color="#fff" />
                </View>
              </View>
              <Button
                variant="secondary"
                title={pending.length > 0 ? 'Corrigir próxima' : needsTeacherReview.length > 0 ? 'Revisar agora' : 'Nova redação'}
                leftIcon={pending.length > 0 ? 'play-outline' : needsTeacherReview.length > 0 ? 'create-outline' : 'add-circle-outline'}
                onPress={() =>
                  nextEssay
                    ? router.push(pending.length > 0 || processing.length > 0 ? `/redacao/${nextEssay.id}` as any : `/resultado/${nextEssay.id}` as any)
                    : router.push('/nova-redacao' as any)
                }
              />
            </Card>

            <View style={styles.kpiGrid}>
              <MiniKpi label="Pendentes" value={pending.length} icon="time-outline" color={colors.warning} />
              <MiniKpi label="Processando" value={processing.length} icon="sync-outline" color={colors.info} />
              <MiniKpi label="Revisão" value={needsTeacherReview.length} icon="create-outline" color={colors.accent} />
              <MiniKpi label="Baixa confiança" value={lowConfidence.length} icon="warning-outline" color={colors.danger} />
            </View>

            {retryQueue.length > 0 ? (
              <Card style={[styles.alertCard, { borderColor: colors.warning }]}>
                <Ionicons name="cloud-offline-outline" size={18} color={colors.warning} />
                <Text style={[styles.alertText, { color: colors.softText }]}>
                  {retryQueue.length} redação{retryQueue.length > 1 ? 'ões' : ''} na fila de reprocessamento.
                </Text>
              </Card>
            ) : null}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              <QueueChip label="Agora" count={processing.length + pending.length} active={tab === 'agora'} onPress={() => setTab('agora')} />
              <QueueChip label="Revisar" count={needsTeacherReview.length} active={tab === 'revisar'} onPress={() => setTab('revisar')} />
              <QueueChip label="Corrigidas" count={corrected.length} active={tab === 'corrigidas'} onPress={() => setTab('corrigidas')} />
            </ScrollView>

            {visibleEssays.length === 0 ? (
              <EmptyState
                icon="checkmark-circle-outline"
                title={tab === 'agora' ? 'Nada pendente' : tab === 'revisar' ? 'Nada para revisar' : 'Sem corrigidas'}
                description="Quando houver novas redações, elas aparecerão aqui automaticamente."
                buttonLabel="Nova redação"
                onPress={() => router.push('/nova-redacao' as any)}
              />
            ) : (
              <View style={styles.queueList}>
                {visibleEssays.map((essay) => (
                  <CorrectionRow
                    key={essay.id}
                    essay={essay}
                    studentName={getStudentName(essay.studentId)}
                    onDelete={() => {
                      deleteEssay(essay.id);
                      showToast({ message: 'Redação removida', type: 'success' });
                    }}
                  />
                ))}
                {tab === 'corrigidas' && backendSyncHasMore && (
                  <Pressable
                    style={[styles.loadMoreBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={async () => {
                      setLoadingMore(true);
                      try { await fetchMoreEssaysFromBackend(); } finally { setLoadingMore(false); }
                    }}
                    disabled={loadingMore}
                  >
                    {loadingMore
                      ? <ActivityIndicator size="small" color={colors.accent} />
                      : <Text style={[styles.loadMoreText, { color: colors.accent }]}>Carregar mais</Text>}
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function QueueChip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.tabChip,
        {
          backgroundColor: active ? colors.accent : colors.surface,
          borderColor: active ? colors.accent : colors.border,
        },
      ]}
    >
      <Text style={[styles.tabText, { color: active ? '#fff' : colors.softText }]}>{label}</Text>
      <View style={[styles.tabCount, { backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.input }]}>
        <Text style={[styles.tabCountText, { color: active ? '#fff' : colors.mutedText }]}>{count}</Text>
      </View>
    </Pressable>
  );
}

function MiniKpi({ label, value, icon, color }: { label: string; value: number; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  const { colors } = useAppTheme();
  return (
    <Card style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>{label}</Text>
    </Card>
  );
}

function CorrectionRow({ essay, studentName, onDelete }: { essay: Essay; studentName: string; onDelete?: () => void }) {
  const { colors } = useAppTheme();
  const reviewed = Boolean(essay.teacherReviewedAt);
  const target = isCorrectedEssay(essay) ? `/resultado/${essay.id}` : `/redacao/${essay.id}`;

  const content = (
    <Pressable onPress={() => router.push(target as any)} style={[styles.row, { backgroundColor: colors.surface }]}>
      <View style={[styles.rowIcon, { backgroundColor: reviewed ? colors.successSoft : colors.accent + '14' }]}>
        <Ionicons name={reviewed ? 'shield-checkmark-outline' : 'document-text-outline'} size={18} color={reviewed ? colors.success : colors.accent} />
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>{studentName}</Text>
        <Text style={[styles.rowSub, { color: colors.mutedText }]} numberOfLines={1}>{essay.themeTitle}</Text>
        <View style={styles.rowMeta}>
          <StatusBadge status={essay.status} />
          {reviewed ? (
            <View style={[styles.reviewedBadge, { backgroundColor: colors.successSoft }]}>
              <Text style={[styles.reviewedText, { color: colors.success }]}>Revisada</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.rowScore}>
        <Text style={[styles.scoreValue, { color: colors.text }]}>{essay.totalScore ?? '—'}</Text>
        <Text style={[styles.scoreLabel, { color: colors.mutedText }]}>nota</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </Pressable>
  );

  if (!onDelete) return content;

  return (
    <SwipeableRow onDelete={onDelete} label="Excluir">
      {content}
    </SwipeableRow>
  );
}

const styles = StyleSheet.create({
  hero: { gap: theme.spacing.md },
  heroTop: { flexDirection: 'row', gap: theme.spacing.md, alignItems: 'center' },
  heroEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '800', letterSpacing: 0.4 },
  heroTitle: { color: '#fff', fontSize: 22, lineHeight: 30, fontWeight: '900', marginTop: 4 },
  heroText: { color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 21, marginTop: 4 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  kpiCard: { width: '48%', padding: theme.spacing.md, gap: 5 },
  kpiIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { fontSize: 25, fontWeight: '900', letterSpacing: 0 },
  kpiLabel: { fontSize: 13, fontWeight: '800' },
  alertCard: { borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertText: { flex: 1, fontSize: 14, lineHeight: 21 },
  tabs: { gap: theme.spacing.sm, paddingRight: 20 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  tabText: { fontSize: 14, fontWeight: '800' },
  tabCount: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  tabCountText: { fontSize: 13, fontWeight: '900' },
  queueList: { gap: theme.spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, padding: 14, ...theme.shadows.card },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { fontSize: 16, fontWeight: '900', lineHeight: 22 },
  rowSub: { fontSize: 13, lineHeight: 19 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  reviewedBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  reviewedText: { fontSize: 12, fontWeight: '800' },
  rowScore: { alignItems: 'flex-end', minWidth: 42 },
  scoreValue: { fontSize: 18, fontWeight: '900' },
  scoreLabel: { fontSize: 12, fontWeight: '700' },
  loadMoreBtn: { alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 16, paddingVertical: 14, minHeight: 48 },
  loadMoreText: { fontSize: 15, fontWeight: '700' },
});
