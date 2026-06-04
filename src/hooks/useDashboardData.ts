import { type ContextualActionData, type TurmaSnapshot } from '@/components/dashboard';
import { type SparkDatum } from '@/components/ui';
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
import { useShallow } from 'zustand/react/shallow';

export function useDashboardData() {
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

  const inboxEssays = useMemo(
    () =>
      teacherEssays.filter(
        (e) => e.submittedByStudent && isCorrectedEssay(e) && !e.teacherReviewedAt
      ),
    [teacherEssays]
  );

  const lastEssay = teacherEssays[0];

  const lowConfidenceEssays = useMemo(
    () => getLowConfidenceCorrections(teacherEssays),
    [teacherEssays]
  );

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
      .filter((e) => e.correctedAt && e.totalScore != null)
      .sort((a, b) => (a.correctedAt ?? '').localeCompare(b.correctedAt ?? ''))
      .slice(-8);
    return sorted.map((e) => {
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

  const onboardingSteps = [
    { number: '1', title: 'Cadastre um aluno', desc: 'Adicione os alunos que vão enviar redações.', onPress: () => router.push('/novo-aluno'), done: teacherStudents.length > 0, icon: 'person-add-outline' as const },
    { number: '2', title: 'Cadastre um tema', desc: 'Defina o tema antes de enviar a redação.', onPress: () => router.push('/novo-tema'), done: teacherThemes.length > 0, icon: 'book-outline' as const },
    { number: '3', title: 'Envie a redação', desc: 'Foto ou galeria — a IA corrige em segundos.', onPress: () => router.push('/nova-redacao'), done: teacherEssays.length > 0, icon: 'cloud-upload-outline' as const },
  ];
  const onboardingDone = onboardingSteps.filter((s) => s.done).length;

  return {
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
  };
}
