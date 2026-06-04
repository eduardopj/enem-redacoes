import { useAppStore } from '@/store/app-store';
import { useAppTheme } from '@/theme/ThemeContext';
import { type RankingEntry, type TurmaRankingEntry, trendIcon } from '@/components/ranking';
import { useMemo, useState } from 'react';

export function useRankingData() {
  const { colors } = useAppTheme();
  const currentTeacher = useAppStore((s) => s.currentTeacher);
  const students = useAppStore((s) => s.students);
  const essays = useAppStore((s) => s.essays);
  const turmas = useAppStore((s) => s.turmas);

  const [mainTab, setMainTab] = useState<'alunos' | 'turmas'>('alunos');

  // ── Alunos tab ──────────────────────────────────────────────────────────────

  const classes = useMemo(() => {
    const mine = students.filter((s) => s.teacherId === currentTeacher?.id);
    return [...new Set(mine.map((s) => s.className))].sort();
  }, [students, currentTeacher]);

  const [selectedClass, setSelectedClass] = useState<string>(() => classes[0] ?? '');

  const ranking = useMemo<RankingEntry[]>(() => {
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
  }, [students, essays, currentTeacher, selectedClass, colors]);

  const classAvg = useMemo(() => {
    const withScores = ranking.filter((r) => r.average !== null);
    if (!withScores.length) return null;
    return Math.round(withScores.reduce((s, r) => s + (r.average ?? 0), 0) / withScores.length);
  }, [ranking]);

  // ── Turmas tab ──────────────────────────────────────────────────────────────

  const myTurmas = useMemo(
    () => turmas.filter((t) => t.teacherId === currentTeacher?.id),
    [turmas, currentTeacher]
  );

  const turmaRanking = useMemo<TurmaRankingEntry[]>(() => {
    if (!currentTeacher) return [];
    return myTurmas
      .map((t) => {
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
        return { turma: t, studentCount: ss.length, essayCount: allEssays.length, avg, best, above700, pctAbove700, pending };
      })
      .sort((a, b) => {
        if (a.avg === null && b.avg === null) return 0;
        if (a.avg === null) return 1;
        if (b.avg === null) return -1;
        return b.avg - a.avg;
      });
  }, [myTurmas, students, essays, currentTeacher]);

  return {
    colors,
    mainTab,
    setMainTab,
    classes,
    selectedClass,
    setSelectedClass,
    ranking,
    classAvg,
    turmaRanking,
  };
}
