import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Card, EmptyState, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  getClassStats,
  getCompetencyLabel,
  getCorrectionInsights,
  getScoreColor,
  getScoreLabel,
  getStudentStats,
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

export default function AnalyticsScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);

  const teacherStudents = useMemo(
    () => (!currentTeacher ? [] : students.filter((student) => student.teacherId === currentTeacher.id)),
    [currentTeacher, students]
  );

  const teacherEssays = useMemo(
    () => (!currentTeacher ? [] : essays.filter((essay) => essay.teacherId === currentTeacher.id)),
    [currentTeacher, essays]
  );

  const classStats = useMemo(() => getClassStats(teacherEssays, teacherStudents), [teacherEssays, teacherStudents]);
  const insights = useMemo(() => getCorrectionInsights(teacherStudents, teacherEssays), [teacherStudents, teacherEssays]);

  const studentStats = useMemo(
    () =>
      teacherStudents
        .map((student) => ({ student, stats: getStudentStats(student.id, teacherEssays) }))
        .filter((item) => item.stats.correctedEssays > 0)
        .sort((a, b) => (b.stats.averageScore ?? 0) - (a.stats.averageScore ?? 0)),
    [teacherStudents, teacherEssays]
  );

  if (insights.correctedCount === 0) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack showNav>
          <AppHeader eyebrow="Análise" title="Central pedagógica" subtitle="Acompanhe evolução, riscos e prioridades." />
          <EmptyState
            icon="bar-chart-outline"
            title="Sem correções ainda"
            description="Corrija a primeira redação para liberar médias, evolução e prioridades da turma."
            buttonLabel="Nova redação"
            onPress={() => router.push('/nova-redacao' as any)}
          />
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <ScreenContainer showBack showNav>
        <AppHeader eyebrow="Análise" title="Central pedagógica" subtitle="O que precisa de atenção agora." />

        <Card style={styles.heroCard}>
          <View style={styles.heroGrid}>
            <Metric label="Média" value={classStats.classAverage ?? '--'} color={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.text} colors={colors} />
            <Metric label="Corrigidas" value={insights.correctedCount} colors={colors} />
            <Metric label="Pendentes" value={insights.pendingCount} color={insights.pendingCount ? colors.warning : colors.text} colors={colors} />
            <Metric label="Revisão" value={insights.lowConfidenceCount} color={insights.lowConfidenceCount ? colors.danger : colors.success} colors={colors} />
          </View>
          {classStats.classAverage != null ? (
            <View style={[styles.nationalRow, { backgroundColor: classStats.classAverage >= NATIONAL_AVG ? colors.successSoft : colors.dangerSoft }]}>
              <Ionicons
                name={classStats.classAverage >= NATIONAL_AVG ? 'trending-up-outline' : 'trending-down-outline'}
                size={16}
                color={classStats.classAverage >= NATIONAL_AVG ? colors.success : colors.danger}
              />
              <Text style={[styles.nationalText, { color: classStats.classAverage >= NATIONAL_AVG ? colors.success : colors.danger }]}>
                {classStats.classAverage >= NATIONAL_AVG
                  ? `+${classStats.classAverage - NATIONAL_AVG} pts acima da média nacional`
                  : `${NATIONAL_AVG - classStats.classAverage} pts abaixo da média nacional`}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Atenção agora</Text>
          <View style={styles.insightList}>
            <InsightRow
              icon="alert-circle-outline"
              color={insights.lowConfidenceCount ? colors.warning : colors.success}
              title={insights.lowConfidenceCount ? 'Revisar correções de baixa confiança' : 'Correções confiáveis'}
              text={insights.lowConfidenceCount ? `${insights.lowConfidenceCount} correção(ões) pedem revisão manual.` : 'Nenhuma correção marcada como baixa confiança.'}
              colors={colors}
            />
            <InsightRow
              icon="school-outline"
              color={insights.studentsNeedingAttention.length ? colors.danger : colors.success}
              title={insights.studentsNeedingAttention.length ? 'Alunos que precisam de acompanhamento' : 'Turma sem alerta crítico'}
              text={
                insights.studentsNeedingAttention.length
                  ? insights.studentsNeedingAttention.slice(0, 3).map((item) => item.student.name).join(', ')
                  : 'Nenhum aluno com queda ou média crítica.'
              }
              colors={colors}
            />
            <InsightRow
              icon="bulb-outline"
              color={colors.accent}
              title={insights.weakestCompetency ? `Competência mais frágil: ${insights.weakestCompetency.label}` : 'Competência frágil'}
              text={insights.weakestCompetency?.tip ?? 'Ainda não há dados suficientes para priorizar competência.'}
              colors={colors}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Evolução da média</Text>
          <EvolutionChart data={insights.evolution} colors={colors} />
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Competências da turma</Text>
          <View style={styles.compList}>
            {Object.entries(classStats.avgCompetencies).map(([key, score]) => {
              if (!score) return null;
              const pct = Math.max(4, (score / 200) * 100);
              const color = COMP_COLORS[key] ?? colors.accent;
              return (
                <View key={key} style={styles.compRow}>
                  <View style={styles.compHeader}>
                    <Text style={[styles.compName, { color: colors.text }]}>{getCompetencyLabel(key, true)}</Text>
                    <Text style={[styles.compScore, { color }]}>{score}/200</Text>
                  </View>
                  <View style={[styles.compTrack, { backgroundColor: colors.input }]}>
                    <View style={[styles.compFill, { backgroundColor: color, width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Temas</Text>
          <View style={styles.themeList}>
            {insights.themes.slice(0, 6).map((item) => (
              <View key={item.themeTitle} style={[styles.themeRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.themeTitle, { color: colors.text }]} numberOfLines={1}>{item.themeTitle}</Text>
                  <Text style={[styles.themeMeta, { color: colors.mutedText }]}>
                    {item.count} redação(ões) · {item.lowConfidence} revisão(ões)
                  </Text>
                </View>
                <Text style={[styles.themeScore, { color: getScoreColor(item.averageScore, colors) }]}>{item.averageScore}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ranking pedagógico</Text>
          <View>
            {studentStats.map((item, index) => {
              const average = item.stats.averageScore ?? 0;
              const color = getScoreColor(average, colors);
              const trendColor = getTrendColor(item.stats.trend, colors);
              return (
                <Pressable
                  key={item.student.id}
                  onPress={() => router.push(`/aluno/${item.student.id}` as any)}
                  style={[styles.studentRow, { borderBottomColor: colors.border }]}
                >
                  <View style={[styles.rank, { backgroundColor: index === 0 ? colors.accent : colors.input }]}>
                    <Text style={[styles.rankText, { color: index === 0 ? '#fff' : colors.softText }]}>{index + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.studentName, { color: colors.text }]}>{item.student.name}</Text>
                    <Text style={[styles.studentMeta, { color: colors.mutedText }]}>
                      {item.stats.correctedEssays} correção(ões) · {getScoreLabel(average)}
                    </Text>
                  </View>
                  <Ionicons name={getTrendIcon(item.stats.trend)} size={16} color={trendColor} />
                  <Text style={[styles.studentScore, { color }]}>{average}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function Metric({ label, value, color, colors }: { label: string; value: number | string; color?: string; colors: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.input }]}>
      <Text style={[styles.metricValue, { color: color ?? colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function InsightRow({ icon, color, title, text, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  title: string;
  text: string;
  colors: any;
}) {
  return (
    <View style={[styles.insightRow, { backgroundColor: color + '10', borderColor: color + '24' }]}>
      <View style={[styles.insightIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.insightTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.insightText, { color: colors.mutedText }]}>{text}</Text>
      </View>
    </View>
  );
}

function EvolutionChart({ data, colors }: { data: ReturnType<typeof getCorrectionInsights>['evolution']; colors: any }) {
  if (!data.length) {
    return <Text style={[styles.emptyChart, { color: colors.mutedText }]}>Sem dados de evolução ainda.</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.chart, { minWidth: Math.max(300, data.length * 58) }]}>
        {data.map((item) => {
          const height = Math.max(12, (item.score / 1000) * 112);
          const color = getScoreColor(item.score, colors);
          return (
            <View key={item.essayId} style={styles.barItem}>
              <Text style={[styles.barDelta, { color: item.delta >= 0 ? colors.success : colors.danger }]}>
                {item.delta ? `${item.delta > 0 ? '+' : ''}${item.delta}` : '--'}
              </Text>
              <Text style={[styles.barScore, { color: colors.text }]}>{item.score}</Text>
              <View style={[styles.barTrack, { backgroundColor: colors.input }]}>
                <View style={[styles.barFill, { height, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heroCard: { gap: 14 },
  heroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { flex: 1, minWidth: '45%', borderRadius: 14, padding: 14 },
  metricValue: { fontSize: 28, fontWeight: '900', lineHeight: 32 },
  metricLabel: { fontSize: 11, fontWeight: '800', marginTop: 2 },
  nationalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  nationalText: { fontSize: 12, fontWeight: '800', lineHeight: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 12 },
  insightList: { gap: 10 },
  insightRow: { flexDirection: 'row', gap: 11, borderWidth: 1, borderRadius: 14, padding: 12 },
  insightIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 14, fontWeight: '900', lineHeight: 19 },
  insightText: { fontSize: 12, lineHeight: 18, marginTop: 2 },
  chart: { height: 166, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingTop: 4 },
  barItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, minWidth: 48 },
  barDelta: { fontSize: 10, fontWeight: '900' },
  barScore: { fontSize: 11, fontWeight: '900' },
  barTrack: { width: 26, height: 112, borderRadius: 9, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 9 },
  emptyChart: { fontSize: 13, lineHeight: 20 },
  compList: { gap: 12 },
  compRow: { gap: 6 },
  compHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  compName: { fontSize: 13, fontWeight: '800' },
  compScore: { fontSize: 13, fontWeight: '900' },
  compTrack: { height: 8, borderRadius: 999, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 999 },
  themeList: { gap: 0 },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  themeTitle: { fontSize: 14, fontWeight: '900' },
  themeMeta: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  themeScore: { fontSize: 22, fontWeight: '900' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  rank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '900' },
  studentName: { fontSize: 14, fontWeight: '900' },
  studentMeta: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  studentScore: { minWidth: 42, textAlign: 'right', fontSize: 19, fontWeight: '900' },
});
