import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppHeader, Button, Card, ScreenContainer, StaggerItem, StatusBadge } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { Essay } from '@/types/app';
import {
  getClassStats,
  getScoreColor,
  getScoreLabel,
  scorePct,
  getCompetencyLabel,
} from '@/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((state) => state.currentTeacher);
  const students = useAppStore((state) => state.students);
  const themes = useAppStore((state) => state.themes);
  const essays = useAppStore((state) => state.essays);

  const rawName = currentTeacher?.name ?? '';
  const teacherFirstName = rawName.startsWith('Professor ')
    ? rawName.slice('Professor '.length).split(' ')[0]
    : rawName.split(' ')[0] || 'Professor';

  const teacherStudents = useMemo(() => {
    if (!currentTeacher) return [];
    return students.filter((s) => s.teacherId === currentTeacher.id);
  }, [currentTeacher, students]);

  const teacherThemes = useMemo(() => {
    if (!currentTeacher) return [];
    return themes.filter((t) => t.teacherId === currentTeacher.id);
  }, [currentTeacher, themes]);

  const teacherEssays = useMemo(() => {
    if (!currentTeacher) return [];
    return essays.filter((e) => e.teacherId === currentTeacher.id);
  }, [currentTeacher, essays]);

  const pendingEssays = teacherEssays.filter((e) => e.status === 'pendente');
  const correctedEssays = teacherEssays.filter((e) => e.status === 'corrigida');
  const lastEssay = teacherEssays[0];

  const classStats = useMemo(
    () => getClassStats(teacherEssays, teacherStudents),
    [teacherEssays, teacherStudents]
  );

  const isNewUser = teacherStudents.length === 0 && teacherEssays.length === 0;

  const contextualAction = useMemo(() => {
    if (teacherStudents.length === 0)
      return { title: 'Cadastre o primeiro aluno', subtitle: 'Esse é o primeiro passo.', buttonLabel: 'Cadastrar aluno', onPress: () => router.push('/novo-aluno') };
    if (teacherThemes.length === 0)
      return { title: 'Cadastre o primeiro tema', subtitle: 'Sem tema, a correção fica sem contexto.', buttonLabel: 'Cadastrar tema', onPress: () => router.push('/novo-tema') };
    if (pendingEssays.length > 0)
      return { title: 'Há redações aguardando', subtitle: 'Abra a próxima e siga para a correção.', buttonLabel: 'Corrigir agora', onPress: () => router.push(`/redacao/${pendingEssays[0].id}`) };
    if (correctedEssays.length > 0)
      return { title: 'Última correção pronta', subtitle: 'Revise o parecer mais recente.', buttonLabel: 'Ver última correção', onPress: () => router.push(`/resultado/${correctedEssays[0].id}`) };
    return { title: 'Criar nova redação', subtitle: 'Sua base já está pronta.', buttonLabel: 'Nova redação', onPress: () => router.push('/nova-redacao') };
  }, [teacherStudents.length, teacherThemes.length, pendingEssays, correctedEssays]);

  const getStudentName = (studentId: string) =>
    teacherStudents.find((s) => s.id === studentId)?.name ?? 'Aluno';

  return (
    <ProtectedRoute>
      <ScreenContainer showHomeButton={false}>
        <AppHeader
          eyebrow="PAINEL"
          title={`Olá, ${teacherFirstName}`}
          subtitle="Visão geral da turma."
          showLogout
        />

        {/* Onboarding */}
        {isNewUser ? (
          <StaggerItem index={0}>
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>COMO COMEÇAR</Text>
              <View style={styles.onboardingSteps}>
                <OnboardingStep number="1" title="Cadastre um aluno" desc="Adicione os alunos que vão enviar redações." onPress={() => router.push('/novo-aluno')} colors={colors} />
                <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
                <OnboardingStep number="2" title="Cadastre um tema" desc="Defina o tema antes de enviar." onPress={() => router.push('/novo-tema')} colors={colors} />
                <View style={[styles.stepDivider, { backgroundColor: colors.border }]} />
                <OnboardingStep number="3" title="Envie a redação" desc="Foto, galeria ou documento — a IA corrige." onPress={() => router.push('/nova-redacao')} colors={colors} />
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Próxima ação */}
        <StaggerItem index={isNewUser ? 1 : 0}>
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>PRÓXIMA AÇÃO</Text>
            <Text style={[styles.heroTitle, { color: colors.text }]}>{contextualAction.title}</Text>
            <Text style={[styles.heroText, { color: colors.mutedText }]}>{contextualAction.subtitle}</Text>
            <View style={styles.heroButtonWrap}>
              <Button title={contextualAction.buttonLabel} leftIcon="flash-outline" onPress={contextualAction.onPress} />
            </View>
          </Card>
        </StaggerItem>

        {/* KPIs da turma — apenas se houver redações corrigidas */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={2}>
            <Card>
              <View style={styles.kpiHeader}>
                <Text style={[styles.sectionLabel, { color: colors.softText }]}>TURMA</Text>
                <Pressable onPress={() => router.push('/analytics' as any)} style={styles.kpiLink}>
                  <Text style={[styles.kpiLinkText, { color: colors.accent }]}>Ver análise completa</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.accent} />
                </Pressable>
              </View>
              <View style={styles.kpiRow}>
                <KpiBlock
                  label="MÉDIA"
                  value={classStats.classAverage ?? '--'}
                  sub={classStats.classAverage ? getScoreLabel(classStats.classAverage) : ''}
                  valueColor={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.text}
                  colors={colors}
                />
                <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
                <KpiBlock
                  label="MAIOR NOTA"
                  value={classStats.classHighest ?? '--'}
                  sub={classStats.classHighest ? getScoreLabel(classStats.classHighest) : ''}
                  valueColor={classStats.classHighest ? getScoreColor(classStats.classHighest, colors) : colors.text}
                  colors={colors}
                />
                <View style={[styles.kpiDivider, { backgroundColor: colors.border }]} />
                <KpiBlock
                  label="MENOR NOTA"
                  value={classStats.classLowest ?? '--'}
                  sub={classStats.classLowest ? getScoreLabel(classStats.classLowest) : ''}
                  valueColor={classStats.classLowest ? getScoreColor(classStats.classLowest, colors) : colors.text}
                  colors={colors}
                />
              </View>

              {/* Competência mais fraca da turma */}
              {classStats.weakestClassCompetency ? (
                <View style={[styles.weaknessRow, { backgroundColor: colors.input, borderRadius: 4 }]}>
                  <Ionicons name="alert-circle-outline" size={16} color={colors.warning} />
                  <Text style={[styles.weaknessText, { color: colors.softText }]}>
                    Ponto de atenção:{' '}
                    <Text style={{ color: colors.warning, fontWeight: '600' }}>
                      {getCompetencyLabel(classStats.weakestClassCompetency)}
                    </Text>{' '}
                    — menor média da turma (
                    {classStats.avgCompetencies[classStats.weakestClassCompetency]} pts)
                  </Text>
                </View>
              ) : null}
            </Card>
          </StaggerItem>
        ) : null}

        {/* Métricas em grid 2×2 */}
        <View style={styles.metricsGrid}>
          <StaggerItem index={3}>
            <MetricCard label="ALUNOS" value={teacherStudents.length} helper="Cadastrados" colors={colors} />
          </StaggerItem>
          <StaggerItem index={4}>
            <MetricCard label="TEMAS" value={teacherThemes.length} helper="Disponíveis" colors={colors} />
          </StaggerItem>
          <StaggerItem index={5}>
            <MetricCard label="PENDENTES" value={pendingEssays.length} helper="Aguardando" alert={pendingEssays.length > 0} colors={colors} />
          </StaggerItem>
          <StaggerItem index={6}>
            <MetricCard label="CORRIGIDAS" value={correctedEssays.length} helper="Prontas" colors={colors} />
          </StaggerItem>
        </View>

        {/* Top performers */}
        {classStats.topStudents.length > 0 ? (
          <StaggerItem index={7}>
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>TOP ALUNOS</Text>
              <View>
                {classStats.topStudents.map((item, i) => {
                  const name = getStudentName(item.studentId);
                  const pct = scorePct(item.averageScore);
                  const scoreColor = getScoreColor(item.averageScore, colors);
                  return (
                    <Pressable
                      key={item.studentId}
                      onPress={() => router.push(`/aluno/${item.studentId}` as any)}
                      style={[
                        styles.topRow,
                        i < classStats.topStudents.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.accent : colors.input }]}>
                        <Text style={[styles.rankText, { color: i === 0 ? colors.white : colors.softText }]}>
                          {i + 1}
                        </Text>
                      </View>
                      <View style={styles.topStudentInfo}>
                        <Text style={[styles.topStudentName, { color: colors.text }]}>{name}</Text>
                        <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: scoreColor }]} />
                        </View>
                      </View>
                      <Text style={[styles.topStudentScore, { color: scoreColor }]}>{item.averageScore}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Mini gráfico de notas */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={8}>
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>NOTAS RECENTES</Text>
              <MiniBarChart essays={correctedEssays.slice(0, 6)} getStudentName={getStudentName} colors={colors} />
            </Card>
          </StaggerItem>
        ) : null}

        {/* Atalhos rápidos */}
        <StaggerItem index={9}>
          <Card>
            <Text style={[styles.sectionLabel, { color: colors.softText }]}>ATALHOS</Text>
            <View style={styles.quickGrid}>
              <QuickActionCard icon="add-circle-outline" title="Nova redação" onPress={() => router.push('/nova-redacao')} colors={colors} />
              <QuickActionCard icon="people-outline" title="Alunos" onPress={() => router.push('/alunos')} colors={colors} />
              <QuickActionCard icon="library-outline" title="Temas" onPress={() => router.push('/temas')} colors={colors} />
              <QuickActionCard icon="bar-chart-outline" title="Análise" onPress={() => router.push('/analytics' as any)} colors={colors} />
            </View>
          </Card>
        </StaggerItem>

        {/* Último movimento */}
        {lastEssay ? (
          <StaggerItem index={10}>
            <Card>
              <Text style={[styles.sectionLabel, { color: colors.softText }]}>ÚLTIMO MOVIMENTO</Text>
              <View style={styles.lastRow}>
                <View style={styles.lastInfo}>
                  <Text style={[styles.lastStudent, { color: colors.text }]}>{getStudentName(lastEssay.studentId)}</Text>
                  <Text style={[styles.lastTheme, { color: colors.mutedText }]}>{lastEssay.themeTitle}</Text>
                </View>
                <StatusBadge status={lastEssay.status} />
              </View>
              <View style={styles.lastBtn}>
                <Button
                  title={lastEssay.status === 'corrigida' ? 'Ver resultado' : 'Abrir redação'}
                  leftIcon={lastEssay.status === 'corrigida' ? 'analytics-outline' : 'eye-outline'}
                  onPress={() =>
                    lastEssay.status === 'corrigida'
                      ? router.push(`/resultado/${lastEssay.id}`)
                      : router.push(`/redacao/${lastEssay.id}`)
                  }
                />
              </View>
            </Card>
          </StaggerItem>
        ) : null}
      </ScreenContainer>
    </ProtectedRoute>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function KpiBlock({ label, value, sub, valueColor, colors }: {
  label: string; value: number | string; sub: string; valueColor: string; colors: any;
}) {
  return (
    <View style={styles.kpiBlock}>
      <Text style={[styles.kpiLabel, { color: colors.softText }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: valueColor }]}>{value}</Text>
      {sub ? <Text style={[styles.kpiSub, { color: colors.mutedText }]}>{sub}</Text> : null}
    </View>
  );
}

function MetricCard({ label, value, helper, alert = false, colors }: {
  label: string; value: number; helper: string; alert?: boolean; colors: any;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: alert ? colors.warning : colors.border }]}>
      <Text style={[styles.metricLabel, { color: colors.softText }]}>{label}</Text>
      <Text style={[styles.metricValue, { color: alert ? colors.warning : colors.text }]}>{value}</Text>
      <Text style={[styles.metricHelper, { color: colors.mutedText }]}>{helper}</Text>
    </View>
  );
}

function QuickActionCard({ icon, title, onPress, colors }: {
  icon: ComponentProps<typeof Ionicons>['name']; title: string; onPress: () => void; colors: any;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.quickCard, { borderColor: colors.border, backgroundColor: colors.input }]}>
      <Ionicons name={icon} size={24} color={colors.accent} />
      <Text style={[styles.quickTitle, { color: colors.text }]}>{title}</Text>
    </Pressable>
  );
}

function OnboardingStep({ number, title, desc, onPress, colors }: {
  number: string; title: string; desc: string; onPress: () => void; colors: any;
}) {
  return (
    <Pressable onPress={onPress} style={styles.step}>
      <View style={[styles.stepNum, { backgroundColor: colors.accent }]}>
        <Text style={[styles.stepNumText, { color: colors.white }]}>{number}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={[styles.stepTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.stepDesc, { color: colors.mutedText }]}>{desc}</Text>
      </View>
    </Pressable>
  );
}

function scoreGradientColor(score: number): string {
  if (score >= 900) return '#16A34A';
  if (score >= 800) return '#22C55E';
  if (score >= 700) return '#84CC16';
  if (score >= 600) return '#EAB308';
  if (score >= 500) return '#F97316';
  if (score >= 400) return '#EF4444';
  return '#DC2626';
}

function MiniBarChart({ essays, getStudentName, colors }: {
  essays: Essay[]; getStudentName: (id: string) => string; colors: any;
}) {
  return (
    <View style={styles.chartWrap}>
      {essays.map((essay) => {
        const score = essay.totalScore ?? 0;
        const pct = (score / 1000) * 100;
        const name = getStudentName(essay.studentId).split(' ')[0];
        const barColor = scoreGradientColor(score);
        return (
          <Pressable key={essay.id} onPress={() => router.push(`/resultado/${essay.id}` as any)} style={styles.barItem}>
            <Text style={[styles.barScore, { color: colors.text }]}>{score}</Text>
            <View style={[styles.barTrack, { backgroundColor: colors.input, borderColor: colors.border }]}>
              <View style={[styles.barFill, { height: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.barLabel, { color: colors.mutedText }]}>{name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 12 },
  heroTitle: { fontSize: 28, lineHeight: 32, fontWeight: '700', letterSpacing: -0.6, marginBottom: 8 },
  heroText: { fontSize: 15, lineHeight: 24 },
  heroButtonWrap: { marginTop: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metricCard: { flex: 1, minWidth: '45%', minHeight: 110, borderWidth: 1, borderRadius: 4, padding: 16, gap: 4, alignItems: 'center' },
  metricLabel: { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.6, textAlign: 'center' },
  metricValue: { fontSize: 52, lineHeight: 52, fontWeight: '700', letterSpacing: -1.6, textAlign: 'center' },
  metricHelper: { fontSize: 13, lineHeight: 20, marginTop: 4, textAlign: 'center' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { flex: 1, minWidth: '45%', borderWidth: 1, borderRadius: 4, padding: 14, gap: 8, alignItems: 'center' },
  quickTitle: { fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  lastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  lastInfo: { flex: 1, gap: 4 },
  lastStudent: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
  lastTheme: { fontSize: 15, lineHeight: 24 },
  lastBtn: { marginTop: 16 },
  onboardingSteps: { gap: 0 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, paddingVertical: 12 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700' },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  stepDesc: { fontSize: 13, lineHeight: 20 },
  stepDivider: { height: 1, marginLeft: 42 },
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100 },
  barItem: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barScore: { fontSize: 10, fontWeight: '700' },
  barTrack: { width: '80%', flex: 1, borderWidth: 1, borderRadius: 2, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 2 },
  barLabel: { fontSize: 10, textAlign: 'center' },
  // KPI turma
  kpiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  kpiLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kpiLinkText: { fontSize: 12, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 0 },
  kpiBlock: { flex: 1, gap: 2, alignItems: 'center' },
  kpiDivider: { width: 1, marginVertical: 4 },
  kpiLabel: { fontFamily: 'monospace', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4, textAlign: 'center' },
  kpiValue: { fontSize: 30, lineHeight: 34, fontWeight: '700', letterSpacing: -0.8, textAlign: 'center' },
  kpiSub: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  weaknessRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, marginTop: 12 },
  weaknessText: { flex: 1, fontSize: 12, lineHeight: 18 },
  // Top performers
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  topStudentInfo: { flex: 1, gap: 6 },
  topStudentName: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  topStudentScore: { fontSize: 18, lineHeight: 22, fontWeight: '700', minWidth: 42, textAlign: 'right' },
});
