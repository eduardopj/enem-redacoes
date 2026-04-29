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
  const turmas = useAppStore((state) => state.turmas);
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

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id).slice(0, 3),
    [turmas, currentTeacher]
  );

  const turmaSnapshots = useMemo(
    () =>
      myTurmas.map((t) => {
        const ss = students.filter((s) => s.turmaId === t.id);
        const ces = essays.filter(
          (e) => ss.some((s) => s.id === e.studentId) && e.status === 'corrigida'
        );
        const scores = ces.map((e) => e.totalScore ?? 0).filter((s) => s > 0);
        const avg = scores.length
          ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
          : null;
        return { turma: t, students: ss.length, avg };
      }),
    [myTurmas, students, essays]
  );

  const contextualAction = useMemo(() => {
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

        {/* Header */}
        <StaggerItem index={0}>
          <AppHeader
            eyebrow="Bem-vindo de volta"
            title={`Olá, ${teacherFirstName} 👋`}
            subtitle="Visão geral da turma"
            showLogout
          />
        </StaggerItem>

        {/* Próxima ação em destaque */}
        <StaggerItem index={1}>
          <Pressable
            onPress={contextualAction.onPress}
            style={[styles.actionCard, { backgroundColor: colors.accent }]}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name={contextualAction.icon} size={24} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{contextualAction.title}</Text>
              <Text style={styles.actionSub}>{contextualAction.subtitle}</Text>
            </View>
            <View style={styles.actionBtn}>
              <Ionicons name="arrow-forward" size={18} color={colors.accent} />
            </View>
          </Pressable>
        </StaggerItem>

        {/* KPIs — grid 2×2 */}
        <StaggerItem index={2}>
          <View style={styles.kpiGrid}>
            <KpiCard
              label="Alunos"
              value={teacherStudents.length}
              icon="people"
              iconBg={colors.infoSoft}
              iconColor={colors.accent}
              onPress={() => router.push('/alunos')}
              colors={colors}
            />
            <KpiCard
              label="Temas"
              value={teacherThemes.length}
              icon="library"
              iconBg={colors.successSoft}
              iconColor={colors.success}
              onPress={() => router.push('/temas')}
              colors={colors}
            />
            <KpiCard
              label="Pendentes"
              value={pendingEssays.length}
              icon="time"
              iconBg={pendingEssays.length > 0 ? colors.warningSoft : colors.input}
              iconColor={pendingEssays.length > 0 ? colors.warning : colors.mutedText}
              alert={pendingEssays.length > 0}
              onPress={() => router.push('/redacoes')}
              colors={colors}
            />
            <KpiCard
              label="Corrigidas"
              value={correctedEssays.length}
              icon="checkmark-circle"
              iconBg={colors.infoSoft}
              iconColor={colors.info}
              onPress={() => router.push('/redacoes')}
              colors={colors}
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
                    colors={colors}
                  />
                ))}
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Média da turma — só se houver correções */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={4}>
            <Card>
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Desempenho da turma</Text>
                <Pressable onPress={() => router.push('/analytics' as any)}>
                  <Text style={[styles.linkText, { color: colors.accent }]}>Ver análise</Text>
                </Pressable>
              </View>

              <View style={styles.classKpiRow}>
                <ClassKpi
                  label="Média"
                  value={classStats.classAverage ?? '--'}
                  sub={classStats.classAverage ? getScoreLabel(classStats.classAverage) : ''}
                  color={classStats.classAverage ? getScoreColor(classStats.classAverage, colors) : colors.mutedText}
                  colors={colors}
                />
                <View style={[styles.kpiSep, { backgroundColor: colors.border }]} />
                <ClassKpi
                  label="Maior nota"
                  value={classStats.classHighest ?? '--'}
                  sub={classStats.classHighest ? getScoreLabel(classStats.classHighest) : ''}
                  color={classStats.classHighest ? getScoreColor(classStats.classHighest, colors) : colors.mutedText}
                  colors={colors}
                />
                <View style={[styles.kpiSep, { backgroundColor: colors.border }]} />
                <ClassKpi
                  label="Menor nota"
                  value={classStats.classLowest ?? '--'}
                  sub={classStats.classLowest ? getScoreLabel(classStats.classLowest) : ''}
                  color={classStats.classLowest ? getScoreColor(classStats.classLowest, colors) : colors.mutedText}
                  colors={colors}
                />
              </View>

              {classStats.weakestClassCompetency ? (
                <View style={[styles.weakRow, { backgroundColor: colors.warningSoft, borderRadius: 12 }]}>
                  <Ionicons name="warning-outline" size={15} color={colors.warning} />
                  <Text style={[styles.weakText, { color: colors.warning }]}>
                    Atenção:{' '}
                    <Text style={{ fontWeight: '700' }}>
                      {getCompetencyLabel(classStats.weakestClassCompetency)}
                    </Text>
                    {' '}— menor média da turma
                  </Text>
                </View>
              ) : null}
            </Card>
          </StaggerItem>
        ) : null}

        {/* Top alunos */}
        {classStats.topStudents.length > 0 ? (
          <StaggerItem index={5}>
            <Card>
              <View style={styles.cardHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Top alunos</Text>
              </View>
              <View style={styles.topList}>
                {classStats.topStudents.map((item, i) => {
                  const name = getStudentName(item.studentId);
                  const pct = scorePct(item.averageScore);
                  const sColor = getScoreColor(item.averageScore, colors);
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
                        <Text style={[styles.rankText, { color: i === 0 ? '#fff' : colors.softText }]}>
                          {i + 1}
                        </Text>
                      </View>
                      <View style={styles.topStudentInfo}>
                        <Text style={[styles.topStudentName, { color: colors.text }]}>{name}</Text>
                        <View style={[styles.progressTrack, { backgroundColor: colors.input }]}>
                          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: sColor }]} />
                        </View>
                      </View>
                      <Text style={[styles.topStudentScore, { color: sColor }]}>{item.averageScore}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </StaggerItem>
        ) : null}

        {/* Mini gráfico de notas recentes */}
        {correctedEssays.length > 0 ? (
          <StaggerItem index={6}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Notas recentes</Text>
              <MiniBarChart essays={correctedEssays.slice(0, 6)} getStudentName={getStudentName} colors={colors} />
            </Card>
          </StaggerItem>
        ) : null}

        {/* ── Minhas turmas ── */}
        <StaggerItem index={7}>
          <Card>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas turmas</Text>
              <Pressable onPress={() => router.push('/turmas' as any)} style={styles.seeAllBtn}>
                <Text style={[styles.seeAllText, { color: colors.accent }]}>Ver todas</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.accent} />
              </Pressable>
            </View>

            {turmaSnapshots.length === 0 ? (
              <Pressable
                onPress={() => router.push('/nova-turma' as any)}
                style={[styles.emptyTurmaRow, { backgroundColor: colors.input, borderColor: colors.border }]}
              >
                <View style={[styles.emptyTurmaIcon, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="people-outline" size={18} color={colors.accent} />
                </View>
                <Text style={[styles.emptyTurmaText, { color: colors.softText }]}>
                  Crie sua primeira turma para organizar os alunos
                </Text>
                <View style={[styles.emptyTurmaBtn, { backgroundColor: colors.accent }]}>
                  <Ionicons name="add" size={16} color="#fff" />
                </View>
              </Pressable>
            ) : (
              <View style={styles.turmaList}>
                {turmaSnapshots.map(({ turma, students: sCount, avg }) => (
                  <Pressable
                    key={turma.id}
                    onPress={() => router.push(`/turma/${turma.id}` as any)}
                    style={[styles.turmaRow, { borderBottomColor: colors.border }]}
                  >
                    <View style={[styles.turmaIconWrap, { backgroundColor: colors.accent + '14' }]}>
                      <Ionicons name="school-outline" size={16} color={colors.accent} />
                    </View>
                    <View style={styles.turmaInfo}>
                      <Text style={[styles.turmaName, { color: colors.text }]}>{turma.name}</Text>
                      <Text style={[styles.turmaMeta, { color: colors.mutedText }]}>
                        {sCount} aluno{sCount !== 1 ? 's' : ''}
                        {turma.period ? ` · ${turma.period}` : ''}
                      </Text>
                    </View>
                    {avg !== null ? (
                      <Text style={[styles.turmaAvg, {
                        color: avg >= 700 ? colors.success : avg >= 500 ? colors.warning : colors.danger
                      }]}>
                        {avg} pts
                      </Text>
                    ) : (
                      <Text style={[styles.turmaAvg, { color: colors.mutedText }]}>— pts</Text>
                    )}
                    <Ionicons name="chevron-forward" size={14} color={colors.border} />
                  </Pressable>
                ))}
              </View>
            )}
          </Card>
        </StaggerItem>

        {/* Último movimento */}
        {lastEssay ? (
          <StaggerItem index={8}>
            <Card>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Último movimento</Text>
              <View style={styles.lastRow}>
                <View style={[styles.lastAvatar, { backgroundColor: colors.accent + '18' }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.accent} />
                </View>
                <View style={styles.lastInfo}>
                  <Text style={[styles.lastStudent, { color: colors.text }]}>{getStudentName(lastEssay.studentId)}</Text>
                  <Text style={[styles.lastTheme, { color: colors.mutedText }]} numberOfLines={1}>{lastEssay.themeTitle}</Text>
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

function KpiCard({ label, value, icon, iconBg, iconColor, onPress, alert = false, colors }: {
  label: string; value: number; icon: ComponentProps<typeof Ionicons>['name']; iconBg: string; iconColor: string; onPress?: () => void; alert?: boolean; colors: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.kpiCard, { backgroundColor: colors.surface }]}
    >
      {/* Icon badge */}
      <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
        {alert ? (
          <View style={[styles.kpiAlert, { backgroundColor: colors.warning }]} />
        ) : null}
      </View>
      {/* Number */}
      <Text style={[styles.kpiValue, { color: alert ? colors.warning : colors.text }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.mutedText }]}>{label}</Text>
      {/* Chevron hint */}
      <View style={styles.kpiChevron}>
        <Ionicons name="chevron-forward" size={12} color={colors.border} />
      </View>
    </Pressable>
  );
}

function ClassKpi({ label, value, sub, color, colors }: {
  label: string; value: number | string; sub: string; color: string; colors: any;
}) {
  return (
    <View style={styles.classKpiBlock}>
      <Text style={[styles.classKpiLabel, { color: colors.mutedText }]}>{label}</Text>
      <Text style={[styles.classKpiValue, { color }]}>{value}</Text>
      {sub ? <Text style={[styles.classKpiSub, { color: colors.mutedText }]}>{sub}</Text> : null}
    </View>
  );
}

function OnboardingStep({ number, title, desc, onPress, done, icon, isLast, colors }: {
  number: string; title: string; desc: string; onPress: () => void; done: boolean; icon: ComponentProps<typeof Ionicons>['name']; isLast: boolean; colors: any;
}) {
  return (
    <Pressable
      onPress={done ? undefined : onPress}
      style={[styles.step, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      {/* Step indicator */}
      <View style={[
        styles.stepNum,
        done
          ? { backgroundColor: colors.success }
          : { backgroundColor: colors.accent },
      ]}>
        {done ? (
          <Ionicons name="checkmark" size={14} color="#fff" />
        ) : (
          <Text style={[styles.stepNumText, { color: '#fff' }]}>{number}</Text>
        )}
      </View>

      <View style={styles.stepText}>
        <Text style={[
          styles.stepTitle,
          { color: done ? colors.mutedText : colors.text },
          done && { textDecorationLine: 'line-through' },
        ]}>
          {title}
        </Text>
        {!done ? (
          <Text style={[styles.stepDesc, { color: colors.mutedText }]}>{desc}</Text>
        ) : null}
      </View>

      {done ? (
        <View style={[styles.doneTag, { backgroundColor: colors.successSoft }]}>
          <Text style={[styles.doneTagText, { color: colors.success }]}>Feito</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
      )}
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
            <View style={[styles.barTrack, { backgroundColor: colors.input }]}>
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
  // Section headers
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Contextual action card
  actionCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#4E76F8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.26,
    shadowRadius: 20,
    elevation: 8,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionText: { flex: 1, gap: 3 },
  actionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', lineHeight: 20 },
  actionSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, lineHeight: 16 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // KPI grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 18,
    padding: 16,
    gap: 4,
    shadowColor: '#1B2559',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 3,
    position: 'relative',
  },
  kpiIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  kpiAlert: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  kpiValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 38,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  kpiChevron: {
    position: 'absolute',
    top: 14,
    right: 14,
  },

  // Class KPI
  classKpiRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  classKpiBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  classKpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  classKpiValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    letterSpacing: -0.6,
  },
  classKpiSub: {
    fontSize: 11,
    lineHeight: 14,
  },
  kpiSep: {
    width: 1,
    marginVertical: 4,
  },
  weakRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
  },
  weakText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },

  // Top students
  topList: { gap: 0 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700' },
  topStudentInfo: { flex: 1, gap: 6 },
  topStudentName: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  topStudentScore: { fontSize: 16, fontWeight: '700', minWidth: 38, textAlign: 'right' },

  // Last essay
  lastRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  lastAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  lastInfo: { flex: 1, gap: 3 },
  lastStudent: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  lastTheme: { fontSize: 13, lineHeight: 17 },
  lastBtn: {},

  // Onboarding
  onboardingHeader: { gap: 10, marginBottom: 4 },
  onboardingTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  onboardingCount: { fontSize: 13, fontWeight: '700' },
  progressTrackFull: { height: 5, borderRadius: 999, overflow: 'hidden' },
  progressFillFull: { height: '100%', borderRadius: 999 },
  onboardingSteps: { gap: 0, marginTop: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  stepNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  stepDesc: { fontSize: 13, lineHeight: 18 },
  doneTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  doneTagText: { fontSize: 11, fontWeight: '700' },

  // Turmas section
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seeAllText: { fontSize: 13, fontWeight: '600' },
  turmaList: { gap: 0, marginTop: 8 },
  turmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  turmaIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  turmaInfo: { flex: 1, gap: 2 },
  turmaName: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  turmaMeta: { fontSize: 12, lineHeight: 16 },
  turmaAvg: { fontSize: 13, fontWeight: '700', minWidth: 52, textAlign: 'right' },
  emptyTurmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyTurmaIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emptyTurmaText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyTurmaBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Mini bar chart
  chartWrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, marginTop: 12 },
  barItem: { flex: 1, alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' },
  barScore: { fontSize: 10, fontWeight: '700' },
  barTrack: { width: '80%', flex: 1, borderRadius: 6, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 10, textAlign: 'center' },
});
