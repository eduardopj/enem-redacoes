import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  ClassPerformance,
  ContextualAction,
  InboxCard,
  KpiCard,
  LastEssayCard,
  MiniBarChart,
  MyTurmasCard,
  OnboardingStep,
  PedagogicalPanel,
  TopStudents,
} from '@/components/dashboard';
import { AppHeader, Card, ScreenContainer, SkeletonDashboard, StaggerItem } from '@/components/ui';
import { useDashboardData } from '@/hooks/useDashboardData';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function DashboardScreen() {
  const {
    colors,
    hasHydrated,
    teacherFirstName,
    teacherStudents,
    teacherThemes,
    teacherEssays,
    correctedEssays,
    pendingEssays,
    inboxEssays,
    lastEssay,
    lowConfidenceEssays,
    attentionStudents,
    improvingStudents,
    classStats,
    compColors,
    teacherSparkData,
    turmaSnapshots,
    contextualAction,
    getStudentName,
    onboardingSteps,
    onboardingDone,
  } = useDashboardData();

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
