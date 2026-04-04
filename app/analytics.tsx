import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Card, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  getClassStats,
  getCompetencyLabel,
  getScoreColor,
  getScoreLabel,
  getStudentStats,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

// Paleta de cores por competência
const COMP_COLORS: Record<string, string> = {
  c1: '#3B82F6',
  c2: '#8B5CF6',
  c3: '#10B981',
  c4: '#F59E0B',
  c5: '#F43F5E',
};

function scoreGradientColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  if (score >= 400) return '#EF4444';
  return '#DC2626';
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

  // Estatísticas por aluno
  const studentStats = useMemo(
    () =>
      teacherStudents
        .map((s) => ({ student: s, stats: getStudentStats(s.id, essays) }))
        .filter((item) => item.stats.correctedEssays > 0)
        .sort((a, b) => (b.stats.averageScore ?? 0) - (a.stats.averageScore ?? 0)),
    [teacherStudents, essays]
  );

  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];

  if (correctedEssays.length === 0) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <AppHeader eyebrow="ANÁLISE" title="Análise da Turma" subtitle="Dados consolidados por competência e aluno." />
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
        <AppHeader eyebrow="ANÁLISE" title="Análise da Turma" subtitle="Dados consolidados por competência e aluno." />

        {/* ── KPIs gerais ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>VISÃO GERAL</Text>
          <View style={styles.kpiRow}>
            <KpiBlock label="REDAÇÕES" value={correctedEssays.length} colors={colors} />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiBlock label="ALUNOS" value={studentStats.length} colors={colors} />
            <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
            <KpiBlock
              label="MÉDIA"
              value={classStats.classAverage ?? '--'}
              valueColor={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.text}
              sub={classStats.classAverage ? getScoreLabel(classStats.classAverage) : ''}
              colors={colors}
            />
          </View>
        </Card>

        {/* ── Médias por competência ── */}
        <Card>
          <Text style={[styles.sectionLabel, { color: colors.softText }]}>MÉDIA POR COMPETÊNCIA — TURMA</Text>
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
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>DISTRIBUIÇÃO DE NOTAS</Text>
            <ScoreDistribution essays={correctedEssays} colors={colors} />
          </Card>
        )}

        {/* ── Ranking de alunos ── */}
        {studentStats.length > 0 && (
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>RANKING DE ALUNOS</Text>
            <View>
              {studentStats.map((item, i) => {
                const avg = item.stats.averageScore ?? 0;
                const scoreColor = getScoreColor(avg, colors);
                const pct = (avg / 1000) * 100;
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
                        <Text style={[styles.rankClass, { color: colors.mutedText }]}>{item.student.className}</Text>
                      </View>
                      <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
                      </View>
                      <Text style={[styles.rankMeta, { color: colors.mutedText }]}>
                        {item.stats.correctedEssays} redaç{item.stats.correctedEssays === 1 ? 'ão' : 'ões'} · {getScoreLabel(avg)}
                      </Text>
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
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>COMPETÊNCIAS POR ALUNO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ gap: 16, paddingBottom: 4 }}>
                {/* Header */}
                <View style={[styles.tableRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableNameCell, { color: colors.mutedText }]}>ALUNO</Text>
                  {compKeys.map((k) => (
                    <View key={k} style={[styles.tableCell, { alignItems: 'center' }]}>
                      <View style={[styles.compDot, { backgroundColor: COMP_COLORS[k] }]} />
                      <Text style={[styles.tableCellLabel, { color: colors.mutedText }]}>{k.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
                {studentStats.map((item) => (
                  <View key={item.student.id} style={styles.tableRow}>
                    <Text style={[styles.tableNameCell, { color: colors.text }]} numberOfLines={1}>
                      {item.student.name.split(' ')[0]}
                    </Text>
                    {compKeys.map((k) => {
                      const val = item.stats.avgCompetencies[k] ?? 0;
                      const color = val > 0 ? (COMP_COLORS[k] ?? '#3B82F6') : colors.mutedText;
                      return (
                        <Text key={k} style={[styles.tableCell, styles.tableCellValue, { color }]}>
                          {val > 0 ? val : '—'}
                        </Text>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
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
  sectionLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 12 },
  emptyWrap: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  // KPI
  kpiRow: { flexDirection: 'row', gap: 0 },
  kpiBlock: { flex: 1, gap: 2, alignItems: 'center' },
  kpiDivider: { width: 1, marginVertical: 4 },
  kpiLabel: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4, textAlign: 'center' },
  kpiValue: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  kpiSub: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  // Competencies
  compList: { gap: 12 },
  compRow: { gap: 6 },
  compLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  compDot: { width: 8, height: 8, borderRadius: 4 },
  compName: { flex: 1, fontSize: 13, lineHeight: 20 },
  compVal: { fontSize: 15, fontWeight: '700' },
  compTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 4 },
  weakTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  weakTagText: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  // Distribution
  distList: { gap: 10 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  distLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', width: 70 },
  distTrack: { flex: 1, height: 10, borderRadius: 5, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 5 },
  distCount: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },
  // Ranking
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  rankInfo: { flex: 1, gap: 4 },
  rankNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rankName: { fontSize: 15, fontWeight: '600' },
  rankClass: { fontSize: 11 },
  rankMeta: { fontSize: 11, lineHeight: 16 },
  rankScore: { fontSize: 22, fontWeight: '700', minWidth: 44, textAlign: 'right' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  // Table
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 0, paddingBottom: 10 },
  tableNameCell: { width: 90, fontSize: 13, fontWeight: '600' },
  tableCell: { width: 52, flexDirection: 'row', alignItems: 'center', gap: 4 },
  tableCellLabel: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  tableCellValue: { fontSize: 14, fontWeight: '700', textAlign: 'center', width: 52 },
});
