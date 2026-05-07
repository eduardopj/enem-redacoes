import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

function scoreColor(score: number, colors: any): string {
  if (score >= 700) return colors.success;
  if (score >= 500) return colors.warning;
  return colors.danger;
}

function trendIcon(scores: number[], colors: any): { name: any; color: string } {
  if (scores.length < 2) return { name: 'remove-outline', color: colors.mutedText };
  const delta = scores[scores.length - 1] - scores[scores.length - 2];
  if (delta > 20) return { name: 'trending-up', color: colors.success };
  if (delta < -20) return { name: 'trending-down', color: colors.danger };
  return { name: 'remove-outline', color: colors.mutedText };
}

const MEDAL_BG = ['#FFF7E0', '#F0F4FF', '#FFF1EE'];
const MEDAL_BORDER = ['#FBBF24', '#94A3B8', '#F97316'];
const MEDAL_LABEL = ['1º', '2º', '3º'];

const PERIOD_ICON: Record<string, any> = {
  manhã: 'sunny-outline',
  tarde: 'partly-sunny-outline',
  noite: 'moon-outline',
  integral: 'time-outline',
};
const PERIOD_COLOR: Record<string, string> = {
  manhã: '#B7791F',
  tarde: '#3B5BA9',
  noite: '#6D4C9E',
  integral: '#15803D',
};

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

  const ranking = useMemo(() => {
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

  const top3 = ranking.slice(0, 3).filter((r) => r.average !== null);

  // ── Turmas tab ────────────────────────────────────────────────────────────

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const turmaRanking = useMemo(() => {
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
            style={[styles.mainTab, mainTab === 'alunos' && { backgroundColor: colors.surface, shadowColor: '#101828', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="people" size={15} color={mainTab === 'alunos' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'alunos' ? colors.accent : colors.mutedText }]}>
              Alunos
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMainTab('turmas')}
            style={[styles.mainTab, mainTab === 'turmas' && { backgroundColor: colors.surface, shadowColor: '#101828', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
          >
            <Ionicons name="school" size={15} color={mainTab === 'turmas' ? colors.accent : colors.mutedText} />
            <Text style={[styles.mainTabText, { color: mainTab === 'turmas' ? colors.accent : colors.mutedText }]}>
              Turmas
            </Text>
          </Pressable>
        </View>

        {/* ─── ALUNOS TAB ─── */}
        {mainTab === 'alunos' && (
          <>
            {/* Class filter */}
            {classes.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabContent}>
                {classes.map((cls) => (
                  <Pressable
                    key={cls}
                    onPress={() => setSelectedClass(cls)}
                    style={[styles.tab, selectedClass === cls
                      ? { backgroundColor: colors.accent, borderColor: colors.accent }
                      : { backgroundColor: colors.input, borderColor: colors.border }]}
                  >
                    <Text style={[styles.tabText, { color: selectedClass === cls ? '#fff' : colors.softText }]}>{cls}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {ranking.length === 0 ? (
              <EmptyCard
                icon="people-outline"
                title="Nenhum aluno ainda"
                text="Cadastre alunos e corrija redações para ver o ranking."
                colors={colors}
              />
            ) : (
              <>
                {classAvg !== null && (
                  <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
                    <SummaryChip label="Média" value={String(classAvg)} color={scoreColor(classAvg, colors)} colors={colors} />
                    <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
                    <SummaryChip label="Alunos" value={String(ranking.length)} color={colors.accent} colors={colors} />
                    <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
                    <SummaryChip label="Com notas" value={String(ranking.filter((r) => r.average !== null).length)} color={colors.success} colors={colors} />
                  </View>
                )}

                {top3.length >= 2 && (
                  <View style={styles.podium}>
                    {top3[1] && <PodiumCard rank={2} entry={top3[1]} height={100} medalBg={MEDAL_BG[1]} medalBorder={MEDAL_BORDER[1]} medal={MEDAL_LABEL[1]} colors={colors} />}
                    {top3[0] && <PodiumCard rank={1} entry={top3[0]} height={128} medalBg={MEDAL_BG[0]} medalBorder={MEDAL_BORDER[0]} medal={MEDAL_LABEL[0]} colors={colors} />}
                    {top3[2] && <PodiumCard rank={3} entry={top3[2]} height={80} medalBg={MEDAL_BG[2]} medalBorder={MEDAL_BORDER[2]} medal={MEDAL_LABEL[2]} colors={colors} />}
                  </View>
                )}

                <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.listTitle, { color: colors.softText }]}>Classificação completa</Text>
                  {ranking.map((entry, i) => {
                    const isTop3 = i < 3;
                    const avg = entry.average;
                    const color = avg !== null ? scoreColor(avg, colors) : colors.mutedText;
                    return (
                      <Pressable
                        key={entry.student.id}
                        onPress={() => router.push(`/aluno/${entry.student.id}` as any)}
                        style={[styles.listRow, i < ranking.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                      >
                        <View style={[styles.posWrap, isTop3 ? { backgroundColor: MEDAL_BORDER[i] + '18' } : { backgroundColor: colors.input }]}>
                          <Text style={[styles.posText, { color: isTop3 ? MEDAL_BORDER[i] : colors.softText }]}>
                            {isTop3 ? MEDAL_LABEL[i] : `${i + 1}`}
                          </Text>
                        </View>
                        <View style={styles.listInfo}>
                          <Text style={[styles.listName, { color: colors.text }]} numberOfLines={1}>{entry.student.name}</Text>
                          <View style={styles.listMeta}>
                            <Text style={[styles.listMetaText, { color: colors.mutedText }]}>{entry.totalEssays} redaç{entry.totalEssays !== 1 ? 'ões' : 'ão'}</Text>
                            {entry.best !== null && <Text style={[styles.listMetaText, { color: colors.mutedText }]}>· Melhor: {entry.best}</Text>}
                          </View>
                        </View>
                        <View style={styles.listRight}>
                          {avg !== null ? (
                            <>
                              <View style={styles.listScoreRow}>
                                <Ionicons name={entry.trend.name} size={14} color={entry.trend.color} />
                                <Text style={[styles.listScore, { color }]}>{avg}</Text>
                              </View>
                              <Text style={[styles.listScoreSub, { color: colors.mutedText }]}>média</Text>
                            </>
                          ) : (
                            <Text style={[styles.listNone, { color: colors.mutedText }]}>sem notas</Text>
                          )}
                          <Ionicons name="chevron-forward" size={14} color={colors.border} />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}

        {/* ─── TURMAS TAB ─── */}
        {mainTab === 'turmas' && (
          <>
            {turmaRanking.length === 0 ? (
              <EmptyCard
                icon="school-outline"
                title="Nenhuma turma ainda"
                text="Crie turmas e cadastre alunos para ver a comparação entre turmas."
                colors={colors}
                action={{ label: 'Criar turma', onPress: () => router.push('/nova-turma' as any) }}
              />
            ) : (
              <>
                {/* Overview summary */}
                <View style={[styles.summaryBar, { backgroundColor: colors.surface }]}>
                  <SummaryChip label="Turmas" value={String(turmaRanking.length)} color={colors.accent} colors={colors} />
                  <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
                  <SummaryChip
                    label="Melhor turma"
                    value={turmaRanking[0]?.avg !== null ? String(turmaRanking[0]?.avg) : '—'}
                    color={turmaRanking[0]?.avg ? scoreColor(turmaRanking[0].avg, colors) : colors.mutedText}
                    colors={colors}
                  />
                  <View style={[styles.summaryDiv, { backgroundColor: colors.border }]} />
                  <SummaryChip
                    label="Total redações"
                    value={String(turmaRanking.reduce((s, t) => s + t.essayCount, 0))}
                    color={colors.success}
                    colors={colors}
                  />
                </View>

                {/* Turma cards */}
                {turmaRanking.map((item, i) => {
                  const { turma, avg, studentCount, essayCount, pctAbove700, pending, best } = item;
                  const pColor = turma.period ? PERIOD_COLOR[turma.period] : colors.accent;
                  const pIcon = turma.period ? PERIOD_ICON[turma.period] : 'school-outline';
                  const isTop = i === 0 && avg !== null;
                  return (
                    <Pressable
                      key={turma.id}
                      onPress={() => router.push(`/turma/${turma.id}` as any)}
                      style={[
                        styles.turmaCard,
                        { backgroundColor: colors.surface },
                        isTop && { borderWidth: 2, borderColor: MEDAL_BORDER[0] + '80' },
                      ]}
                    >
                      {/* Top row */}
                      <View style={styles.turmaCardTop}>
                        <View style={[styles.turmaRankBadge, { backgroundColor: i < 3 ? MEDAL_BORDER[i] + '18' : colors.input }]}>
                          <Text style={[styles.turmaRankText, { color: i < 3 ? MEDAL_BORDER[i] : colors.softText }]}>
                            {i < 3 ? MEDAL_LABEL[i] : `${i + 1}º`}
                          </Text>
                        </View>
                        <View style={[styles.turmaPeriodIcon, { backgroundColor: pColor + '18' }]}>
                          <Ionicons name={pIcon} size={16} color={pColor} />
                        </View>
                        <View style={styles.turmaCardInfo}>
                          <Text style={[styles.turmaCardName, { color: colors.text }]}>{turma.name}</Text>
                          <View style={styles.turmaCardMeta}>
                            {turma.period && <TurmaPill label={turma.period.charAt(0).toUpperCase() + turma.period.slice(1)} color={pColor} />}
                            {turma.year && <TurmaPill label={turma.year} color={colors.mutedText} />}
                          </View>
                        </View>
                        {avg !== null ? (
                          <View style={styles.turmaAvgBlock}>
                            <Text style={[styles.turmaAvgValue, { color: scoreColor(avg, colors) }]}>{avg}</Text>
                            <Text style={[styles.turmaAvgSub, { color: colors.mutedText }]}>pts</Text>
                          </View>
                        ) : (
                          <Text style={[styles.turmaNoScore, { color: colors.mutedText }]}>sem notas</Text>
                        )}
                      </View>

                      {/* Stats row */}
                      <View style={[styles.turmaStatsRow, { borderTopColor: colors.border }]}>
                        <TurmaStatChip icon="people" value={String(studentCount)} label="Alunos" color={colors.accent} colors={colors} />
                        <TurmaStatChip icon="document-text" value={String(essayCount)} label="Redações" color={colors.info} colors={colors} />
                        {best !== null && <TurmaStatChip icon="star" value={String(best)} label="Melhor" color={colors.warning} colors={colors} />}
                        <TurmaStatChip icon="checkmark-circle" value={`${pctAbove700}%`} label="≥700pts" color={pctAbove700 >= 50 ? colors.success : colors.warning} colors={colors} />
                      </View>

                      {/* Pending alert */}
                      {pending > 0 && (
                        <View style={[styles.pendingRow, { backgroundColor: colors.warning + '14' }]}>
                          <Ionicons name="time-outline" size={12} color={colors.warning} />
                          <Text style={[styles.pendingText, { color: colors.warning }]}>
                            {pending} redaç{pending !== 1 ? 'ões' : 'ão'} aguardando correção
                          </Text>
                        </View>
                      )}

                      {/* Best label */}
                      {isTop && (
                        <View style={[styles.topTurmaBadge, { backgroundColor: MEDAL_BORDER[0] + '18' }]}>
                          <Ionicons name="trophy" size={12} color={MEDAL_BORDER[0]} />
                          <Text style={[styles.topTurmaText, { color: MEDAL_BORDER[0] }]}>Melhor turma</Text>
                        </View>
                      )}

                      <View style={styles.chevronRow}>
                        <Text style={[styles.viewLabel, { color: colors.accent }]}>Ver painel</Text>
                        <Ionicons name="chevron-forward" size={13} color={colors.accent} />
                      </View>
                    </Pressable>
                  );
                })}
              </>
            )}
          </>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TurmaPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[turmaStyles.pill, { backgroundColor: color + '18' }]}>
      <Text style={[turmaStyles.pillText, { color }]}>{label}</Text>
    </View>
  );
}
const turmaStyles = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 10, fontWeight: '600' },
});

function TurmaStatChip({ icon, value, label, color, colors }: { icon: any; value: string; label: string; color: string; colors: any }) {
  return (
    <View style={styles.statChip}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '14' }]}>
        <Ionicons name={icon} size={12} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function PodiumCard({ rank, entry, height, medalBg, medalBorder, medal, colors }: {
  rank: number; entry: any; height: number; medalBg: string; medalBorder: string; medal: string; colors: any;
}) {
  const color = entry.average !== null ? scoreColor(entry.average, colors) : colors.mutedText;
  const initials = entry.student.name.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  return (
    <View style={[styles.podiumItem, { flex: rank === 1 ? 1.2 : 1 }]}>
      <Text style={styles.podiumMedal}>{medal}</Text>
      <View style={[styles.podiumAvatar, { backgroundColor: medalBorder + '22', borderColor: medalBorder }]}>
        <Text style={[styles.podiumInitials, { color: medalBorder }]}>{initials}</Text>
      </View>
      <Text style={[styles.podiumName, { color: colors.text }]} numberOfLines={1}>
        {entry.student.name.split(' ')[0]}
      </Text>
      <View style={[styles.podiumBase, { height, backgroundColor: medalBg, borderColor: medalBorder + '50' }]}>
        <Text style={[styles.podiumScore, { color }]}>{entry.average}</Text>
        <Text style={[styles.podiumScoreSub, { color: colors.mutedText }]}>pts</Text>
      </View>
    </View>
  );
}

function SummaryChip({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={[styles.summaryChipLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.summaryChipValue, { color }]}>{value}</Text>
    </View>
  );
}

function EmptyCard({ icon, title, text, colors, action }: {
  icon: any; title: string; text: string; colors: any; action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={40} color={colors.mutedText} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptyText, { color: colors.mutedText }]}>{text}</Text>
      {action && (
        <Pressable onPress={action.onPress} style={[styles.emptyBtn, { backgroundColor: colors.accent }]}>
          <Text style={styles.emptyBtnText}>{action.label}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  titleSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  titleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0, lineHeight: 26 },
  pageSub: { fontSize: 13, lineHeight: 18, marginTop: 2 },

  // Main tabs
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

  // Class filter tabs
  tabScroll: { flexGrow: 0 },
  tabContent: { gap: 8, paddingVertical: 2 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: '600' },

  // Summary bar
  summaryBar: {
    flexDirection: 'row', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 8,
    shadowColor: '#101828', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
  },
  summaryChip: { flex: 1, alignItems: 'center', gap: 3 },
  summaryChipLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
  summaryChipValue: { fontSize: 22, fontWeight: '700', letterSpacing: 0 },
  summaryDiv: { width: 1, marginVertical: 4 },

  // Podium
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8, paddingTop: 8 },
  podiumItem: { alignItems: 'center', gap: 6 },
  podiumMedal: { fontSize: 22 },
  podiumAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  podiumInitials: { fontSize: 16, fontWeight: '800' },
  podiumName: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14 },
  podiumBase: { width: '100%', borderTopLeftRadius: 10, borderTopRightRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 0 },
  podiumScore: { fontSize: 20, fontWeight: '700', letterSpacing: 0 },
  podiumScoreSub: { fontSize: 10, fontWeight: '600' },

  // List
  listCard: {
    borderRadius: 18, padding: 18,
    shadowColor: '#101828', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2, gap: 2,
  },
  listTitle: { fontSize: 13, fontWeight: '700', letterSpacing: 0, marginBottom: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  posWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posText: { fontSize: 14, fontWeight: '700' },
  listInfo: { flex: 1, gap: 3 },
  listName: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  listMeta: { flexDirection: 'row', gap: 4 },
  listMetaText: { fontSize: 11, lineHeight: 16 },
  listRight: { alignItems: 'flex-end', gap: 2 },
  listScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  listScore: { fontSize: 18, fontWeight: '700', letterSpacing: 0 },
  listScoreSub: { fontSize: 10, fontWeight: '600' },
  listNone: { fontSize: 11 },

  // Turma cards
  turmaCard: {
    borderRadius: 18, padding: 18, gap: 14,
    shadowColor: '#101828', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3,
  },
  turmaCardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  turmaRankBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaRankText: { fontSize: 16, fontWeight: '700' },
  turmaPeriodIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaCardInfo: { flex: 1, gap: 5 },
  turmaCardName: { fontSize: 16, fontWeight: '700', letterSpacing: 0 },
  turmaCardMeta: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  turmaAvgBlock: { alignItems: 'flex-end' },
  turmaAvgValue: { fontSize: 24, fontWeight: '800', letterSpacing: 0 },
  turmaAvgSub: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  turmaNoScore: { fontSize: 12, fontWeight: '500' },
  turmaStatsRow: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 12 },
  statChip: { flex: 1, alignItems: 'center', gap: 3 },
  statIconWrap: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', letterSpacing: 0 },
  statLabel: { fontSize: 9, fontWeight: '500' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  pendingText: { fontSize: 11, fontWeight: '600' },
  topTurmaBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  topTurmaText: { fontSize: 11, fontWeight: '700' },
  chevronRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewLabel: { fontSize: 12, fontWeight: '600' },

  // Empty
  emptyCard: { borderRadius: 18, padding: 32, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
