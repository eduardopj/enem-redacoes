import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  getClassStats,
  getCompetencyFocusTip,
  getCompetencyLabel,
  getScoreColor,
  getScoreLabel,
  getStudentStats,
  getTrend,
  getTrendColor,
  getTrendIcon,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const NATIONAL_AVG = 624;

const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

function cellBg(score: number): string {
  if (score >= 160) return '#16A34A22';
  if (score >= 120) return '#22C55E18';
  if (score >= 80)  return '#EAB30818';
  if (score > 0)   return '#EF444418';
  return 'transparent';
}

function cellColor(score: number): string {
  if (score >= 160) return '#16A34A';
  if (score >= 120) return '#22C55E';
  if (score >= 80)  return '#CA8A04';
  if (score > 0)   return '#EF4444';
  return '#94A3B8';
}

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const students = useAppStore((s) => s.students);
  const essays = useAppStore((s) => s.essays);

  const teacherStudents = useMemo(
    () => (!currentTeacher ? [] : students.filter((s) => s.teacherId === currentTeacher.id)),
    [currentTeacher, students]
  );

  const teacherEssays = useMemo(
    () => (!currentTeacher ? [] : essays.filter((e) => e.teacherId === currentTeacher.id)),
    [currentTeacher, essays]
  );

  const classStats = useMemo(
    () => getClassStats(teacherEssays, teacherStudents),
    [teacherEssays, teacherStudents]
  );

  const correctedEssays = teacherEssays.filter((e) => e.status === 'corrigida');

  const studentStats = useMemo(
    () =>
      teacherStudents
        .map((s) => ({ student: s, stats: getStudentStats(s.id, essays) }))
        .filter((item) => item.stats.correctedEssays > 0)
        .sort((a, b) => (b.stats.averageScore ?? 0) - (a.stats.averageScore ?? 0)),
    [teacherStudents, essays]
  );

  const needAttention = useMemo(
    () => studentStats.filter((item) => (item.stats.averageScore ?? 0) < NATIONAL_AVG),
    [studentStats]
  );

  const topPerformer = studentStats[0] ?? null;

  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];

  if (correctedEssays.length === 0) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack showNav>
          <AppHeader eyebrow="Análise" title="Análise da Turma" subtitle="Dados consolidados por competência e aluno." />
          <Card>
            <View style={styles.emptyWrap}>
              <Ionicons name="bar-chart-outline" size={40} color={colors.mutedText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem dados ainda</Text>
              <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                Corrija ao menos uma redação para visualizar a análise completa da turma.
              </Text>
            </View>
          </Card>
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader eyebrow="Análise" title="Análise da Turma" subtitle="Dados consolidados por competência e aluno." />

        {/* ── KPIs gerais ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>Visão geral</Text>
          <View style={styles.kpiRow}>
            <KpiBlock label="Redações" value={correctedEssays.length} colors={colors} />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiBlock label="Alunos" value={studentStats.length} colors={colors} />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiBlock
              label="Média"
              value={classStats.classAverage ?? '--'}
              valueColor={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.text}
              sub={classStats.classAverage ? getScoreLabel(classStats.classAverage) : ''}
              colors={colors}
            />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiBlock
              label="Melhor"
              value={classStats.classHighest ?? '--'}
              valueColor={classStats.classHighest ? getScoreColor(classStats.classHighest, colors) : colors.text}
              colors={colors}
            />
          </View>
          {classStats.classAverage !== null && (
            <View style={[styles.avgCompRow, { borderTopColor: colors.border }]}>
              <Ionicons
                name={classStats.classAverage >= NATIONAL_AVG ? 'trending-up' : 'trending-down'}
                size={14}
                color={classStats.classAverage >= NATIONAL_AVG ? colors.success : colors.danger}
              />
              <Text style={[styles.avgCompText, { color: classStats.classAverage >= NATIONAL_AVG ? colors.success : colors.danger }]}>
                {classStats.classAverage >= NATIONAL_AVG
                  ? `+${classStats.classAverage - NATIONAL_AVG} pts acima da média nacional (${NATIONAL_AVG})`
                  : `${classStats.classAverage - NATIONAL_AVG} pts abaixo da média nacional (${NATIONAL_AVG})`}
              </Text>
            </View>
          )}
        </Card>

        {/* ── Insights da Turma ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>Insights da turma</Text>
          <View style={{ gap: 10 }}>

            {/* Top performer */}
            {topPerformer && (
              <Pressable
                onPress={() => router.push(`/aluno/${topPerformer.student.id}` as any)}
                style={[styles.insightRow, { backgroundColor: colors.accent + '0F', borderColor: colors.accent + '30' }]}
              >
                <View style={[styles.insightIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="trophy-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    Top: {topPerformer.student.name.split(' ')[0]}
                  </Text>
                  <Text style={[styles.insightSub, { color: colors.mutedText }]}>
                    Média {topPerformer.stats.averageScore} · {topPerformer.student.className}
                  </Text>
                </View>
                {topPerformer.stats.scores.length >= 2 && (
                  <Ionicons
                    name={getTrendIcon(getTrend(topPerformer.stats.scores))}
                    size={16}
                    color={getTrendColor(getTrend(topPerformer.stats.scores), colors)}
                  />
                )}
                <Ionicons name="chevron-forward" size={14} color={colors.mutedText} />
              </Pressable>
            )}

            {/* Weakest class competency */}
            {classStats.weakestClassCompetency && (
              <View style={[styles.insightRow, { backgroundColor: colors.warningSoft + '80', borderColor: colors.warning + '30' }]}>
                <View style={[styles.insightIcon, { backgroundColor: colors.warning + '20' }]}>
                  <Ionicons name="bulb-outline" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    Foco coletivo: {getCompetencyLabel(classStats.weakestClassCompetency, true)}
                  </Text>
                  <Text style={[styles.insightSub, { color: colors.mutedText }]}>
                    {getCompetencyFocusTip(classStats.weakestClassCompetency)}
                  </Text>
                </View>
              </View>
            )}

            {/* Students needing attention */}
            {needAttention.length > 0 && (
              <View style={[styles.insightRow, { backgroundColor: colors.dangerSoft + '60', borderColor: colors.danger + '25' }]}>
                <View style={[styles.insightIcon, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.insightTitle, { color: colors.text }]}>
                    {needAttention.length} aluno{needAttention.length > 1 ? 's' : ''} abaixo da média nacional
                  </Text>
                  <Text style={[styles.insightSub, { color: colors.mutedText }]}>
                    {needAttention.slice(0, 3).map((i) => i.student.name.split(' ')[0]).join(', ')}
                    {needAttention.length > 3 ? ` e mais ${needAttention.length - 3}` : ''} — média nacional: {NATIONAL_AVG}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Card>

        {/* ── Médias por competência ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>Média por competência</Text>
          <View style={styles.compList}>
            {compKeys.map((k) => {
              const val = classStats.avgCompetencies[k] ?? 0;
              if (val === 0) return null;
              const pct = (val / 200) * 100;
              const barColor = COMP_COLORS[k] ?? '#3B82F6';
              const isWeakest = k === classStats.weakestClassCompetency;
              return (
                <View key={k} style={styles.compRow}>
                  <View style={styles.compLabelRow}>
                    <View style={[styles.compDot, { backgroundColor: barColor }]} />
                    <Text style={[styles.compName, { color: colors.text }]}>{getCompetencyLabel(k, true)}</Text>
                    {isWeakest && (
                      <View style={[styles.weakTag, { backgroundColor: colors.warningSoft }]}>
                        <Text style={[styles.weakTagText, { color: colors.warning }]}>Foco</Text>
                      </View>
                    )}
                    <Text style={[styles.compVal, { color: barColor }]}>{val}</Text>
                  </View>
                  <View style={[styles.compTrack, { backgroundColor: colors.input }]}>
                    <View style={[styles.compFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* ── Distribuição de notas ── */}
        {correctedEssays.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>Distribuição de notas</Text>
            <ScoreDistribution essays={correctedEssays} colors={colors} />
          </Card>
        )}

        {/* ── Ranking de alunos ── */}
        {studentStats.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>Ranking de alunos</Text>
            <View>
              {studentStats.map((item, i) => {
                const avg = item.stats.averageScore ?? 0;
                const scoreColor = getScoreColor(avg, colors);
                const pct = (avg / 1000) * 100;
                const trend = getTrend(item.stats.scores);
                const trendColor = getTrendColor(trend, colors);
                const belowAvg = avg < NATIONAL_AVG;
                return (
                  <Pressable
                    key={item.student.id}
                    onPress={() => router.push(`/aluno/${item.student.id}` as any)}
                    style={[
                      styles.rankRow,
                      i < studentStats.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                    ]}
                  >
                    <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.accent : colors.input }]}>
                      <Text style={[styles.rankText, { color: i === 0 ? colors.white : colors.softText }]}>{i + 1}</Text>
                    </View>
                    <View style={styles.rankInfo}>
                      <View style={styles.rankNameRow}>
                        <Text style={[styles.rankName, { color: colors.text }]}>{item.student.name}</Text>
                        {belowAvg && (
                          <View style={[styles.attentionTag, { backgroundColor: colors.dangerSoft }]}>
                            <Text style={[styles.attentionTagText, { color: colors.danger }]}>Atenção</Text>
                          </View>
                        )}
                        <Text style={[styles.rankClass, { color: colors.mutedText }]}>{item.student.className}</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
                      </View>
                      <View style={styles.rankMetaRow}>
                        <Text style={[styles.rankMeta, { color: colors.mutedText }]}>
                          {item.stats.correctedEssays} redaç{item.stats.correctedEssays === 1 ? 'ão' : 'ões'} · {getScoreLabel(avg)}
                        </Text>
                        {item.stats.scores.length >= 2 && (
                          <Ionicons name={getTrendIcon(trend)} size={12} color={trendColor} />
                        )}
                      </View>
                    </View>
                    <Text style={[styles.rankScore, { color: scoreColor }]}>{avg}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>
        )}

        {/* ── Competências por aluno ── */}
        {studentStats.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>Competências por aluno</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ gap: 0, paddingBottom: 4 }}>
                {/* Header */}
                <View style={[styles.tableRow, { borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 4 }]}>
                  <Text style={[styles.tableNameCell, { color: colors.mutedText }]}>Aluno</Text>
                  {compKeys.map((k) => (
                    <View key={k} style={[styles.tableCell, { alignItems: 'center', justifyContent: 'center' }]}>
                      <View style={[styles.compDot, { backgroundColor: COMP_COLORS[k] }]} />
                      <Text style={[styles.tableCellLabel, { color: colors.mutedText }]}>{k.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                {studentStats.map((item) => (
                  <Pressable
                    key={item.student.id}
                    onPress={() => router.push(`/aluno/${item.student.id}` as any)}
                    style={[styles.tableRow, { paddingVertical: 6 }]}
                  >
                    <Text style={[styles.tableNameCell, { color: colors.text }]} numberOfLines={1}>
                      {item.student.name.split(' ')[0]}
                    </Text>
                    {compKeys.map((k) => {
                      const val = item.stats.avgCompetencies[k] ?? 0;
                      const bg = cellBg(val);
                      const fg = val > 0 ? cellColor(val) : colors.mutedText;
                      return (
                        <View key={k} style={[styles.tableCell, { alignItems: 'center', justifyContent: 'center' }]}>
                          <View style={[styles.cellPill, { backgroundColor: bg }]}>
                            <Text style={[styles.tableCellValue, { color: fg }]}>
                              {val > 0 ? val : '—'}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={[styles.tableLegend, { borderTopColor: colors.border }]}>
              {[
                { label: '≥160', color: '#16A34A' },
                { label: '≥120', color: '#22C55E' },
                { label: '≥80', color: '#CA8A04' },
                { label: '<80', color: '#EF4444' },
              ].map((l) => (
                <View key={l.label} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                  <Text style={[styles.legendLabel, { color: colors.mutedText }]}>{l.label}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiBlock({ label, value, sub, valueColor, colors }: {
  label: string; value: number | string; sub?: string; valueColor?: string; colors: any;
}) {
  return (
    <View style={styles.kpiBlock}>
      <Text style={[styles.kpiLabel, { color: colors.softText }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: valueColor ?? colors.text }]}>{value}</Text>
      {sub ? <Text style={[styles.kpiSub, { color: colors.mutedText }]}>{sub}</Text> : null}
    </View>
  );
}

function ScoreDistribution({ essays, colors }: { essays: any[]; colors: any }) {
  const bands = [
    { label: '900–1000', min: 900, max: 1000, color: '#16A34A' },
    { label: '800–899', min: 800, max: 899, color: '#22C55E' },
    { label: '700–799', min: 700, max: 799, color: '#84CC16' },
    { label: '600–699', min: 600, max: 699, color: '#EAB308' },
    { label: '500–599', min: 500, max: 599, color: '#F97316' },
    { label: '400–499', min: 400, max: 499, color: '#EF4444' },
    { label: '0–399',   min: 0,   max: 399, color: '#DC2626' },
  ];
  const total = essays.length;
  return (
    <View style={styles.distList}>
      {bands.map((band) => {
        const count = essays.filter((e) => {
          const s = e.totalScore ?? 0;
          return s >= band.min && s <= band.max;
        }).length;
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <View key={band.label} style={styles.distRow}>
            <Text style={[styles.distLabel, { color: colors.softText }]}>{band.label}</Text>
            <View style={[styles.distTrack, { backgroundColor: colors.input }]}>
              <View style={[styles.distFill, { width: `${pct}%`, backgroundColor: band.color }]} />
            </View>
            <Text style={[styles.distCount, { color: band.color }]}>{count}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1, marginBottom: 14 },
  emptyWrap: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 0 },
  kpiBlock: { flex: 1, gap: 2, alignItems: 'center' },
  kpiDivider: { width: 1, marginVertical: 4 },
  kpiLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1, textAlign: 'center' },
  kpiValue: { fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  kpiSub: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  avgCompRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 10, marginTop: 10, borderTopWidth: 1 },
  avgCompText: { fontSize: 12, fontWeight: '600', lineHeight: 18 },
  // Insights
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  insightIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  insightTitle: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 2 },
  insightSub: { fontSize: 12, lineHeight: 18 },
  // Competencies
  compList: { gap: 12 },
  compRow: { gap: 6 },
  compLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compDot: { width: 8, height: 8, borderRadius: 4 },
  compName: { flex: 1, fontSize: 13, lineHeight: 20 },
  compVal: { fontSize: 15, fontWeight: '700' },
  compTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 4 },
  weakTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  weakTagText: { fontSize: 10, fontWeight: '700' },
  // Distribution
  distList: { gap: 10 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distLabel: { fontSize: 11, fontWeight: '600', width: 70 },
  distTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 5 },
  distCount: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },
  // Ranking
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  rankInfo: { flex: 1, gap: 4 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  rankName: { fontSize: 15, fontWeight: '600' },
  rankClass: { fontSize: 11 },
  rankMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rankMeta: { fontSize: 11, lineHeight: 16 },
  rankScore: { fontSize: 22, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  attentionTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  attentionTagText: { fontSize: 9, fontWeight: '700' },
  // Table
  tableRow: { flexDirection: 'row', alignItems: 'center' },
  tableNameCell: { width: 90, fontSize: 13, fontWeight: '600' },
  tableCell: { width: 52, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tableCellLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  tableCellValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  cellPill: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, minWidth: 38, alignItems: 'center' },
  tableLegend: { flexDirection: 'row', gap: 14, paddingTop: 10, marginTop: 10, borderTopWidth: 1, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '600' },
});
