import type { AppColors } from '@/theme';
import type { Student } from '@/types/app';

export type RankingEntry = {
  student: Student;
  scores: number[];
  average: number | null;
  best: number | null;
  trend: { name: string; color: string };
  totalEssays: number;
};

export type TurmaRankingEntry = {
  turma: { id: string; name: string; period?: string; year?: string; teacherId: string };
  studentCount: number;
  essayCount: number;
  avg: number | null;
  best: number | null;
  above700: number;
  pctAbove700: number;
  pending: number;
};

export function scoreColor(score: number, colors: AppColors): string {
  if (score >= 700) return colors.success;
  if (score >= 500) return colors.warning;
  return colors.danger;
}

export function trendIcon(scores: number[], colors: AppColors): { name: string; color: string } {
  if (scores.length < 2) return { name: 'remove-outline', color: colors.mutedText };
  const delta = scores[scores.length - 1] - scores[scores.length - 2];
  if (delta > 20) return { name: 'trending-up', color: colors.success };
  if (delta < -20) return { name: 'trending-down', color: colors.danger };
  return { name: 'remove-outline', color: colors.mutedText };
}

export const MEDAL_BG = ['#FFF7E0', '#F0F4FF', '#FFF1EE'];
export const MEDAL_BORDER = ['#FBBF24', '#94A3B8', '#F97316'];
export const MEDAL_LABEL = ['1º', '2º', '3º'];

export const PERIOD_ICON: Record<string, string> = {
  manhã: 'sunny-outline',
  tarde: 'partly-sunny-outline',
  noite: 'moon-outline',
  integral: 'time-outline',
};

export const PERIOD_COLOR: Record<string, string> = {
  manhã: '#B7791F',
  tarde: '#3B5BA9',
  noite: '#6D4C9E',
  integral: '#15803D',
};
