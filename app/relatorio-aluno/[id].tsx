import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, EmptyState, ScreenContainer } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import {
  formatDateShort,
  getCompetencyFocusTip,
  getCompetencyLabel,
  getScoreColor,
  getStudentStats,
  isCorrectedEssay,
  scorePct,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RelatorioAlunoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppTheme();
  const students = useAppStore((state) => state.students);
  const essays = useAppStore((state) => state.essays);

  const student = useMemo(() => students.find((item) => item.id === id), [students, id]);
  const stats = useMemo(() => (student ? getStudentStats(student.id, essays) : null), [student, essays]);
  const studentEssays = useMemo(
    () =>
      student
        ? essays
            .filter((essay) => essay.studentId === student.id)
            .filter(isCorrectedEssay)
            .sort((a, b) => (a.correctedAt ?? a.createdAt ?? '').localeCompare(b.correctedAt ?? b.createdAt ?? ''))
        : [],
    [student, essays]
  );

  if (!student || !stats) {
    return (
      <ProtectedRoute>
        <ScreenContainer showBack>
          <AppHeader title="Relatório" subtitle="Aluno não encontrado." />
          <EmptyState icon="person-outline" title="Aluno não encontrado" description="Volte para a lista de alunos e tente novamente." />
        </ScreenContainer>
      </ProtectedRoute>
    );
  }

  const firstScore = studentEssays[0]?.totalScore ?? null;
  const lastScore = studentEssays[studentEssays.length - 1]?.totalScore ?? null;
  const delta = firstScore !== null && lastScore !== null ? lastScore - firstScore : null;
  const competencyEntries = ['c1', 'c2', 'c3', 'c4', 'c5']
    .map((key) => ({ key, value: stats.avgCompetencies[key] ?? 0 }))
    .sort((a, b) => a.value - b.value);
  const weakest = competencyEntries.find((item) => item.value > 0);
  const strongest = [...competencyEntries].reverse().find((item) => item.value > 0);
  const workedThemes = Array.from(new Set(studentEssays.map((essay) => essay.themeTitle))).slice(0, 6);
  const recurringWeaknesses = collectBullets(studentEssays, 'weaknesses');
  const recurringStrengths = collectBullets(studentEssays, 'strengths');

  return (
    <ProtectedRoute>
      <ScreenContainer showBack>
        <AppHeader
          eyebrow="Relatório do aluno"
          title={student.name}
          subtitle="Evolução, competências e plano de estudo."
        />

        <Card>
          <View style={styles.heroTop}>
            <View>
              <Text style={[styles.kicker, { color: colors.mutedText }]}>Média geral</Text>
              <Text style={[styles.heroScore, { color: stats.averageScore ? getScoreColor(stats.averageScore, colors) : colors.text }]}>
                {stats.averageScore ?? '--'}
              </Text>
            </View>
            <View style={[styles.deltaPill, { backgroundColor: (delta ?? 0) >= 0 ? colors.successSoft : colors.dangerSoft }]}>
              <Ionicons name={(delta ?? 0) >= 0 ? 'trending-up' : 'trending-down'} size={15} color={(delta ?? 0) >= 0 ? colors.success : colors.danger} />
              <Text style={[styles.deltaText, { color: (delta ?? 0) >= 0 ? colors.success : colors.danger }]}>
                {delta === null ? 'Sem série' : `${delta >= 0 ? '+' : ''}${delta} pts`}
              </Text>
            </View>
          </View>
          <View style={styles.metricGrid}>
            <Metric label="Redações" value={stats.totalEssays} colors={colors} />
            <Metric label="Corrigidas" value={stats.correctedEssays} colors={colors} />
            <Metric label="Primeira" value={firstScore ?? '--'} colors={colors} />
            <Metric label="Última" value={lastScore ?? '--'} colors={colors} />
          </View>
        </Card>

        {studentEssays.length > 0 ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Evolução no tempo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chartRow}>
                {studentEssays.map((essay) => (
                  <View key={essay.id} style={styles.chartItem}>
                    <Text style={[styles.chartScore, { color: colors.text }]}>{essay.totalScore ?? 0}</Text>
                    <View style={[styles.chartTrack, { backgroundColor: colors.input }]}>
                      <View
                        style={[
                          styles.chartFill,
                          {
                            height: `${scorePct(essay.totalScore ?? 0)}%`,
                            backgroundColor: getScoreColor(essay.totalScore ?? 0, colors),
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartDate, { color: colors.mutedText }]}>{formatDateShort(essay.correctedAt ?? essay.createdAt)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        ) : (
          <EmptyState
            icon="analytics-outline"
            title="Sem correções ainda"
            description="Corrija a primeira redação para gerar um relatório completo."
            buttonLabel="Nova redação"
            onPress={() => router.push(`/nova-redacao?studentId=${student.id}` as any)}
          />
        )}

        {weakest ? (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnóstico pedagógico</Text>
            <InsightRow
              icon="alert-circle-outline"
              title="Competência mais frágil"
              text={`${getCompetencyLabel(weakest.key, true)}: ${weakest.value}/200`}
              color={colors.warning}
              colors={colors}
            />
            {strongest ? (
              <InsightRow
                icon="checkmark-circle-outline"
                title="Competência mais forte"
                text={`${getCompetencyLabel(strongest.key, true)}: ${strongest.value}/200`}
                color={colors.success}
                colors={colors}
              />
            ) : null}
            <Text style={[styles.planText, { color: colors.softText }]}>
              {getCompetencyFocusTip(weakest.key)}
            </Text>
          </Card>
        ) : null}

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Plano de estudo</Text>
          <Bullet text={weakest ? `Reescrever uma redação focando em ${getCompetencyLabel(weakest.key, true)}.` : 'Enviar a primeira redação corrigida.'} colors={colors} />
          <Bullet text="Comparar a próxima nota com a última correção." colors={colors} />
          <Bullet text="Guardar uma devolutiva curta para revisão antes da próxima proposta." colors={colors} />
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico pedagógico</Text>
          <TagList title="Temas trabalhados" items={workedThemes} colors={colors} />
          <TagList title="Avanços recorrentes" items={recurringStrengths} colors={colors} empty="Ainda sem padrão suficiente." />
          <TagList title="Dificuldades recorrentes" items={recurringWeaknesses} colors={colors} empty="Ainda sem padrão suficiente." />
        </Card>

        <Button
          title="Nova redação para este aluno"
          leftIcon="create-outline"
          onPress={() => router.push(`/nova-redacao?studentId=${student.id}` as any)}
        />
      </ScreenContainer>
    </ProtectedRoute>
  );
}

function collectBullets(essays: Essay[], key: 'strengths' | 'weaknesses') {
  return essays.flatMap((essay) => essay[key] ?? []).filter(Boolean).slice(0, 5);
}

function Metric({ label, value, colors }: { label: string; value: number | string; colors: any }) {
  return (
    <View style={[styles.metric, { backgroundColor: colors.input }]}>
      <Text style={[styles.metricValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.mutedText }]}>{label}</Text>
    </View>
  );
}

function InsightRow({ icon, title, text, color, colors }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; color: string; colors: any }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightIcon, { backgroundColor: color + '16' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.insightTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.insightText, { color: colors.mutedText }]}>{text}</Text>
      </View>
    </View>
  );
}

function Bullet({ text, colors }: { text: string; colors: any }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
      <Text style={[styles.bulletText, { color: colors.softText }]}>{text}</Text>
    </View>
  );
}

function TagList({ title, items, colors, empty = 'Sem dados suficientes.' }: { title: string; items: string[]; colors: any; empty?: string }) {
  return (
    <View style={styles.tagSection}>
      <Text style={[styles.tagTitle, { color: colors.mutedText }]}>{title}</Text>
      <View style={styles.tagWrap}>
        {(items.length ? items : [empty]).map((item, index) => (
          <View key={`${item}-${index}`} style={[styles.tag, { backgroundColor: colors.input, borderColor: colors.border }]}>
            <Text style={[styles.tagText, { color: colors.softText }]} numberOfLines={2}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  kicker: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  heroScore: { fontSize: 52, lineHeight: 58, fontWeight: '900', letterSpacing: 0 },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  deltaText: { fontSize: 12, fontWeight: '800' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', borderRadius: 12, padding: 12 },
  metricValue: { fontSize: 19, fontWeight: '900' },
  metricLabel: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '900', marginBottom: 12 },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, minHeight: 160, paddingRight: 4 },
  chartItem: { width: 54, alignItems: 'center', gap: 4, height: 156, justifyContent: 'flex-end' },
  chartScore: { fontSize: 11, fontWeight: '800' },
  chartTrack: { width: 34, height: 112, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  chartFill: { width: '100%', borderRadius: 8 },
  chartDate: { fontSize: 10, fontWeight: '700' },
  insightRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  insightIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  insightTitle: { fontSize: 13, fontWeight: '900' },
  insightText: { fontSize: 12, lineHeight: 17 },
  planText: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  bulletDot: { width: 7, height: 7, borderRadius: 4, marginTop: 7 },
  bulletText: { flex: 1, fontSize: 13, lineHeight: 20 },
  tagSection: { marginBottom: 14 },
  tagTitle: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', marginBottom: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '100%' },
  tagText: { fontSize: 12, fontWeight: '700' },
});
