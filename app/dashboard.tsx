import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ClassPerformance,
  ContextualAction,
  type ContextualActionData,
  InboxCard,
  KpiCard,
  LastEssayCard,
  MiniBarChart,
  MyTurmasCard,
  type TurmaSnapshot,
  OnboardingStep,
  PedagogicalPanel,
  TopStudents,
} from '@/components/dashboard';
import { AppHeader, Card, ScreenContainer, SkeletonDashboard, type SparkDatum, StaggerItem } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import {
  getClassStats,
  getCompColors,
  getLowConfidenceCorrections,
  getStudentsNeedingAttention,
  getTopImprovingStudents,
  isCorrectedEssay,
} from '@/utils/analytics';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

export default function DashboardScreen() {
  const { colors } = useAppTheme();
  const { hasHydrated, currentTeacher, turmas, students, themes, essays } = useAppStore(
    useShallow((state) => ({
      hasHydrated: state.hasHydrated,
      currentTeacher: state.currentTeacher,
      turmas: state.turmas,
      students: state.students,
      themes: state.themes,
      essays: state.essays,
    }))
  );

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
  const correctedEssays = teacherEssays.filter(isCorrectedEssay);

  // Inbox: student-submitted essays corrected by AI, not yet reviewed by professor
  const inboxEssays = useMemo(
    () =>
      teacherEssays.filter(
        (e) =>
          e.submittedByStudent &&
          isCorrectedEssay(e) &&
          !e.teacherReviewedAt
      ),
    [teacherEssays]
  );
  const lastEssay = teacherEssays[0];
  const lowConfidenceEssays = useMemo(() => getLowConfidenceCorrections(teacherEssays), [teacherEssays]);
  const attentionStudents = useMemo(
    () => getStudentsNeedingAttention(teacherStudents, teacherEssays).slice(0, 3),
    [teacherStudents, teacherEssays]
  );
  const improvingStudents = useMemo(
    () => getTopImprovingStudents(teacherStudents, teacherEssays, 3),
    [teacherStudents, teacherEssays]
  );

  const classStats = useMemo(
    () => getClassStats(teacherEssays, teacherStudents),
    [teacherEssays, teacherStudents]
  );

  const compColors = getCompColors(colors);

  const teacherSparkData = useMemo<SparkDatum[]>(() => {
    const sorted = [...correctedEssays]
      .filter(e => e.correctedAt && e.totalScore != null)
      .sort((a, b) => (a.correctedAt ?? '').localeCompare(b.correctedAt ?? ''))
      .slice(-8);
    return sorted.map(e => {
      const d = new Date(e.correctedAt!);
      return { value: e.totalScore!, label: `${d.getDate()}/${d.getMonth() + 1}` };
    });
  }, [correctedEssays]);

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id).slice(0, 3),
    [turmas, currentTeacher]
  );

  const turmaSnapshots = useMemo<TurmaSnapshot[]>(
    () =>
      myTurmas.map((t) => {
        const ss = students.filter((s) => s.turmaId === t.id);
        const ces = essays.filter(
          (e) => ss.some((s) => s.id === e.studentId) && isCorrectedEssay(e)
        );
        const scores = ces.map((e) => e.totalScore ?? 0).filter((s) => s > 0);
        const avg = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;
        return { turma: t, students: ss.length, avg };
      }),
    [myTurmas, students, essays]
  );

  const contextualAction = useMemo<ContextualActionData>(() => {
    if (teacherStudents.length === 0)
      return { title: 'Cadastre o primeiro aluno', subtitle: 'Esse é o primeiro passo para começar a corrigir.', buttonLabel: 'Cadastrar aluno', onPress: () => router.push('/novo-aluno'), icon: 'person-add-outline' as const };
    if (teacherThemes.length === 0)
      return { title: 'Cadastre o primeiro tema', subtitle: 'Defina o tema antes de enviar a redação.', buttonLabel: 'Cadastrar tema', onPress: () => router.push('/novo-tema'), icon: 'book-outline' as const };
    if (pendingEssays.length > 0)
      return { title: `${pendingEssays.length} redação${pendingEssays.length > 1 ? 'ões' : ''} aguardando`, subtitle: 'Abra a próxima e inicie a correção com IA.', buttonLabel: 'Corrigir agora', onPress: () => router.push(`/redacao/${pendingEssays[0].id}`), icon: 'sparkles-outline' as const };
    if (correctedEssays.length > 0)
      return { title: 'Última correção pronta', subtitle: 'Revise o parecer mais recente.', buttonLabel: 'Ver resultado', onPress: () => router.push(`/resultado/${correctedEssays[0].id}`), icon: 'analytics-outline' as const };
    return { title: 'Tudo pronto!', subtitle: 'Cadastre a primeira redação da turma.', buttonLabel: 'Nova redação', onPress: () => router.push('/nova-redacao'), icon: 'add-circle-outline' as const };
  }, [teacherStudents.length, teacherThemes.length, pendingEssays, correctedEssays]);

  const getStudentName = (studentId: string) =>
    teacherStudents.find((s) => s.id === studentId)?.name ?? 'Aluno';

  // Onboarding steps with completion state
  const onboardingSteps = [
    {
      number: '1',
      title: 'Cadastre um aluno',
      desc: 'Adicione os alunos que vão enviar redações.',
      onPress: () => router.push('/novo-aluno'),
      done: teacherStudents.length > 0,
      icon: 'person-add-outline' as const,
    },
    {
      number: '2',
      title: 'Cadastre um tema',
      desc: 'Defina o tema antes de enviar a redação.',
      onPress: () => router.push('/novo-tema'),
      done: teacherThemes.length > 0,
      icon: 'book-outline' as const,
    },
    {
      number: '3',
      title: 'Envie a redação',
      desc: 'Foto ou galeria — a IA corrige em segundos.',
      onPress: () => router.push('/nova-redacao'),
      done: teacherEssays.length > 0,
      icon: 'cloud-upload-outline' as const,
    },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;

  return (
    <ProtectedRoute>
      <ScreenContainer showHomeButton={false} showNav>

        {/* Skeleton enquanto o AsyncStorage hidrata */}
        {!hasHydrated ? (
          <SkeletonDashboard />
        ) : (
          <>
          <StaggerItem index={0}>
          <AppHeader
            eyebrow="Bem-vindo de volta"
            title={`Olá, ${teacherFirstName}`}
            subtitle="Visão geral da turma"
          />
        </StaggerItem>

        {/* Próxima ação em destaque */}
        <StaggerItem index={1}>
          <ContextualAction action={contextualAction} />
        </StaggerItem>

        {/* Inbox de revisão */}
        <StaggerItem index={2}>
          <InboxCard inboxEssays={inboxEssays} getStudentName={getStudentName} />
        </StaggerItem>

        {/* KPIs - grid 2x2 */}
        <StaggerItem index={3}>
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Alunos"
              value={teacherStudents.length}
              icon="people"
              iconBg={colors.accentSoft}
              iconColor={colors.accentHover}
              onPress={() => router.push('/alunos')}
            />
            <KpiCard
              label="Temas"
              value={teacherThemes.length}
              icon="library"
              iconBg={colors.accentSoft}
              iconColor={colors.accent}
              onPress={() => router.push('/temas')}
            />
            <KpiCard
              label="Pendentes"
              value={pendingEssays.length}
              icon="time"
              iconBg={pendingEssays.length > 0 ? colors.warningSoft : colors.input}
              iconColor={pendingEssays.length > 0 ? colors.warning : colors.mutedText}
              alert={pendingEssays.length > 0}
              onPress={() => router.push('/redacoes')}
            />
            <KpiCard
              label="Corrigidas"
              value={correctedEssays.length}
              icon="checkmark-circle"
              iconBg={colors.accentSoft}
              iconColor={colors.accent}
              onPress={() => router.push('/redacoes')}
            />
          </View>
        </StaggerItem>

        {/* Onboarding — só mostra se não tiver completado tudo */}
        {onboardingDone < 3 ? (
          <StaggerItem index={3}>
            <Card>
              {/* Header com barra de progresso */}
              <View style={styles.onboardingHeader}>
                <View style={styles.onboardingTitleRow}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Como começar</Text>
                  <Text style={[styles.onboardingCount, { color: colors.accent }]}>
                    {onboardingDone}/3
                  </Text>
                </View>
                <View style={[styles.progressTrackFull, { backgroundColor: colors.input }]}>
                  <View
                    style={[
                      styles.progressFillFull,
                      {
                        backgroundColor: colors.accent,
                        width: `${(onboardingDone / 3) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.onboardingSteps}>
                {onboardingSteps.map((step, i) => (
                  <OnboardingStep
                    key={i}
                    number={step.number}
                    title={step.title}
                    desc={step.desc}
                    onPress={step.onPress}
                    done={step.done}
                    icon={step.icon}
                    isLast={i === onboardingSteps.length - 1}
                  />
                ))}
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Painel pedagógico */}
        <StaggerItem index={4}>
          <PedagogicalPanel
            attentionStudents={attentionStudents}
            lowConfidenceEssays={lowConfidenceEssays}
            improvingStudents={improvingStudents}
          />
        </StaggerItem>

        {/* Desempenho da turma */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={4}>
            <ClassPerformance
              classStats={classStats}
              teacherSparkData={teacherSparkData}
              compColors={compColors}
            />
          </StaggerItem>
        ) : null}

        {/* Top alunos */}
        <StaggerItem index={5}>
          <TopStudents topStudents={classStats.topStudents} getStudentName={getStudentName} />
        </StaggerItem>

        {/* Mini gráfico de notas recentes */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={6}>
            <Card>
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas recentes</Text>
              </View>
              <MiniBarChart essays={correctedEssays.slice(0, 6)} getStudentName={getStudentName} />
            </Card>
          </StaggerItem>
        ) : null}

        {/* Minhas turmas */}
        <StaggerItem index={7}>
          <MyTurmasCard turmaSnapshots={turmaSnapshots} />
        </StaggerItem>

        {/* Último movimento */}
        {lastEssay ? (
          <StaggerItem index={8}>
            <LastEssayCard lastEssay={lastEssay} getStudentName={getStudentName} />
          </StaggerItem>
        ) : null}

          </>
        )}

      </ScreenContainer>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  onboardingHeader: { gap: 10, marginBottom: 4 },
  onboardingTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onboardingCount: { fontSize: 15, fontWeight: '700' },
  progressTrackFull: { height: 5, borderRadius: 999, overflow: 'hidden' },
  progressFillFull: { height: '100%', borderRadius: 999 },
  onboardingSteps: { gap: 0, marginTop: 4 },
});
