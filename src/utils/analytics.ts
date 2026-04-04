import { Essay, Student } from '@/types/app';

// ─── Score classification ──────────────────────────────────────────────────

export function getScoreLabel(score: number): string {
  if (score >= 900) return 'Excelente';
  if (score >= 750) return 'Muito Bom';
  if (score >= 600) return 'Bom';
  if (score >= 450) return 'Regular';
  if (score >= 300) return 'Insuficiente';
  return 'Muito Baixo';
}

export function getScoreTier(score: number): 'excellent' | 'good' | 'regular' | 'weak' | 'poor' {
  if (score >= 750) return 'excellent';
  if (score >= 600) return 'good';
  if (score >= 450) return 'regular';
  if (score >= 300) return 'weak';
  return 'poor';
}

export function getScoreColor(
  score: number,
  colors: { success: string; accent: string; warning: string; danger: string; mutedText: string }
): string {
  if (score >= 750) return colors.success;
  if (score >= 600) return colors.accent;
  if (score >= 450) return colors.warning;
  return colors.danger;
}

// ─── Competency helpers ────────────────────────────────────────────────────

export const COMPETENCY_LABELS: Record<string, string> = {
  c1: 'C1 • Norma Culta',
  c2: 'C2 • Compreensão do Tema',
  c3: 'C3 • Argumentação',
  c4: 'C4 • Coesão Textual',
  c5: 'C5 • Proposta de Intervenção',
};

export const COMPETENCY_SHORT: Record<string, string> = {
  c1: 'Norma Culta',
  c2: 'Tema',
  c3: 'Argumentação',
  c4: 'Coesão',
  c5: 'Intervenção',
};

export function getCompetencyLabel(key: string, short = false): string {
  return short ? COMPETENCY_SHORT[key] ?? key : COMPETENCY_LABELS[key] ?? key;
}

export function getCompetencyFocusTip(key: string): string {
  const tips: Record<string, string> = {
    c1: 'Pratique reescrita de frases complexas e revise regras de concordância e pontuação.',
    c2: 'Estude repertórios temáticos e leia editoriais sobre temas de atualidade.',
    c3: 'Treine estrutura dissertativa: tese → argumentos → contra-argumentação → conclusão.',
    c4: 'Foque em conectivos e progressão temática entre parágrafos.',
    c5: 'Elabore propostas com Agente, Ação, Meio, Finalidade e Efeito esperado.',
  };
  return tips[key] ?? 'Concentre-se em melhorar os fundamentos desta competência.';
}

// ─── Date formatting ───────────────────────────────────────────────────────

export function formatDate(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateShort(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeDate(iso?: string): string {
  if (!iso) return '--';
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'hoje';
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana(s)`;
  if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} mês(es)`;
  return formatDate(iso);
}

// ─── Trend helpers ─────────────────────────────────────────────────────────

export type Trend = 'up' | 'down' | 'stable';

export function getTrend(scores: number[]): Trend {
  if (scores.length < 2) return 'stable';
  const recent = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const diff = recent - prev;
  if (diff >= 40) return 'up';
  if (diff <= -40) return 'down';
  return 'stable';
}

export function getTrendIcon(trend: Trend): 'trending-up' | 'trending-down' | 'remove-outline' {
  if (trend === 'up') return 'trending-up';
  if (trend === 'down') return 'trending-down';
  return 'remove-outline';
}

export function getTrendColor(
  trend: Trend,
  colors: { success: string; danger: string; mutedText: string }
): string {
  if (trend === 'up') return colors.success;
  if (trend === 'down') return colors.danger;
  return colors.mutedText;
}

export function getTrendLabel(trend: Trend, delta: number): string {
  if (trend === 'up') return `+${delta} pts vs anterior`;
  if (trend === 'down') return `${delta} pts vs anterior`;
  return 'estável';
}

// ─── Student stats ─────────────────────────────────────────────────────────

export type StudentStats = {
  studentId: string;
  totalEssays: number;
  correctedEssays: number;
  pendingEssays: number;
  averageScore: number | null;
  highestScore: number | null;
  lowestScore: number | null;
  lastScore: number | null;
  scores: number[];
  trend: Trend;
  trendDelta: number;
  weakestCompetency: string | null;
  strongestCompetency: string | null;
  avgCompetencies: Record<string, number>;
  lastCorrectedAt: string | undefined;
};

export function getStudentStats(studentId: string, essays: Essay[]): StudentStats {
  const studentEssays = essays.filter((e) => e.studentId === studentId);
  const corrected = studentEssays.filter((e) => e.status === 'corrigida');
  const pending = studentEssays.filter((e) => e.status === 'pendente');

  // Sort corrected essays by correctedAt or createdAt ascending
  const sorted = [...corrected].sort((a, b) => {
    const aDate = a.correctedAt ?? a.createdAt ?? '';
    const bDate = b.correctedAt ?? b.createdAt ?? '';
    return aDate.localeCompare(bDate);
  });

  const scores = sorted.map((e) => e.totalScore ?? 0);
  const averageScore =
    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const highestScore = scores.length > 0 ? Math.max(...scores) : null;
  const lowestScore = scores.length > 0 ? Math.min(...scores) : null;
  const lastScore = scores.length > 0 ? scores[scores.length - 1] : null;

  const trend = getTrend(scores);
  const trendDelta =
    scores.length >= 2 ? scores[scores.length - 1] - scores[scores.length - 2] : 0;

  // Average competency scores
  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const avgCompetencies: Record<string, number> = {};
  for (const key of compKeys) {
    const vals = corrected
      .map((e) => e.competencies?.[key as keyof typeof e.competencies] ?? 0)
      .filter((v) => v !== undefined);
    avgCompetencies[key] =
      vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  }

  const compEntries = compKeys.map((k) => ({ key: k, val: avgCompetencies[k] }));
  const withData = compEntries.filter((e) => e.val > 0);
  const weakestCompetency =
    withData.length > 0 ? withData.reduce((a, b) => (a.val <= b.val ? a : b)).key : null;
  const strongestCompetency =
    withData.length > 0 ? withData.reduce((a, b) => (a.val >= b.val ? a : b)).key : null;

  const lastCorrectedAt =
    sorted.length > 0 ? sorted[sorted.length - 1].correctedAt : undefined;

  return {
    studentId,
    totalEssays: studentEssays.length,
    correctedEssays: corrected.length,
    pendingEssays: pending.length,
    averageScore,
    highestScore,
    lowestScore,
    lastScore,
    scores,
    trend,
    trendDelta,
    weakestCompetency,
    strongestCompetency,
    avgCompetencies,
    lastCorrectedAt,
  };
}

// ─── Class stats ───────────────────────────────────────────────────────────

export type ClassStats = {
  totalStudents: number;
  totalEssays: number;
  correctedEssays: number;
  pendingEssays: number;
  classAverage: number | null;
  classHighest: number | null;
  classLowest: number | null;
  distributionBands: { label: string; min: number; max: number; count: number }[];
  avgCompetencies: Record<string, number>;
  weakestClassCompetency: string | null;
  strongestClassCompetency: string | null;
  topStudents: { studentId: string; averageScore: number }[];
};

export function getClassStats(essays: Essay[], students: Student[]): ClassStats {
  const corrected = essays.filter((e) => e.status === 'corrigida');
  const pending = essays.filter((e) => e.status === 'pendente');
  const scores = corrected.map((e) => e.totalScore ?? 0);

  const classAverage =
    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const classHighest = scores.length > 0 ? Math.max(...scores) : null;
  const classLowest = scores.length > 0 ? Math.min(...scores) : null;

  const bands = [
    { label: '0–299', min: 0, max: 299 },
    { label: '300–449', min: 300, max: 449 },
    { label: '450–599', min: 450, max: 599 },
    { label: '600–749', min: 600, max: 749 },
    { label: '750–899', min: 750, max: 899 },
    { label: '900–1000', min: 900, max: 1000 },
  ];
  const distributionBands = bands.map((b) => ({
    ...b,
    count: scores.filter((s) => s >= b.min && s <= b.max).length,
  }));

  // Class average by competency
  const compKeys = ['c1', 'c2', 'c3', 'c4', 'c5'];
  const avgCompetencies: Record<string, number> = {};
  for (const key of compKeys) {
    const vals = corrected
      .map((e) => e.competencies?.[key as keyof typeof e.competencies] ?? 0);
    avgCompetencies[key] =
      vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  }

  const compEntries = compKeys.map((k) => ({ key: k, val: avgCompetencies[k] }));
  const withData = compEntries.filter((e) => e.val > 0);
  const weakestClassCompetency =
    withData.length > 0 ? withData.reduce((a, b) => (a.val <= b.val ? a : b)).key : null;
  const strongestClassCompetency =
    withData.length > 0 ? withData.reduce((a, b) => (a.val >= b.val ? a : b)).key : null;

  // Top students by average score
  const topStudents = students
    .map((s) => {
      const stats = getStudentStats(s.id, essays);
      return { studentId: s.id, averageScore: stats.averageScore ?? 0 };
    })
    .filter((s) => s.averageScore > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);

  return {
    totalStudents: students.length,
    totalEssays: essays.length,
    correctedEssays: corrected.length,
    pendingEssays: pending.length,
    classAverage,
    classHighest,
    classLowest,
    distributionBands,
    avgCompetencies,
    weakestClassCompetency,
    strongestClassCompetency,
    topStudents,
  };
}

// ─── Score band percentage ─────────────────────────────────────────────────

export function scorePct(score: number, max = 1000): number {
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
}

export function competencyPct(score: number, max = 200): number {
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
}
