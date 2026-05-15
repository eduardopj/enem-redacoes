import type { BackendCorrectionJson, BackendEssay } from '@/types/api';
import type { Essay, EssayStatus, Student } from '@/types/app';

export function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('connect') ||
    lower.includes('conectar') ||
    lower.includes('servidor') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused')
  );
}

/**
 * Returns true for errors that are worth retrying automatically:
 * timeouts, transient network failures, and 5xx server errors.
 * Does NOT retry 4xx (bad request, auth, rate-limit, invalid image).
 */
export function isRetriableError(error: unknown): boolean {
  if (error == null) return false;
  const code = (error as Record<string, unknown>).code;
  if (code === 'TIMEOUT' || code === 'NETWORK_ERROR') return true;
  const status = (error as Record<string, unknown>).status;
  if (typeof status === 'number' && status >= 500) return true;
  if (error instanceof Error) return isNetworkError(error.message);
  return false;
}

export function mapCorrectionJsonToEssayFields(c: BackendCorrectionJson): Partial<Essay> {
  return {
    transcription: c.transcription,
    transcriptionNotes: c.transcriptionNotes,
    transcriptionConfidence: c.transcriptionConfidence,
    writingMode: c.writingMode,
    legibility: c.legibility,
    themeAdequacy: c.themeAdequacy,
    scoreReliability: c.scoreReliability,
    competencies: c.competencies,
    competencyFeedbacks: c.competencyFeedbacks,
    strengths: c.strengths ?? [],
    weaknesses: c.weaknesses ?? [],
    improvements: c.improvements ?? [],
    generalObservation: c.generalObservation,
    congratulations: c.congratulations,
    feedback: c.feedback,
    studentDirectMessage: c.studentDirectMessage,
    improvementPotential: c.improvementPotential,
    vocabularyAnalysis: c.vocabularyAnalysis,
  };
}

/**
 * Pure helper: merges a page of remote essays into local state arrays.
 * Returns null if nothing changed (skips unnecessary re-renders).
 */
export function mergeRemoteEssays(
  remote: BackendEssay[],
  existingEssays: Essay[],
  existingStudents: Student[],
): { essays: Essay[]; students: Student[] } | null {
  const existingIds = new Set(existingEssays.map((e) => e.id));
  const existingStudentIds = new Set(existingStudents.map((s) => s.id));
  const toAdd: Essay[] = [];
  const studentsToAdd: Student[] = [];

  for (const r of remote) {
    if (!existingStudentIds.has(r.studentId) && r.studentName) {
      studentsToAdd.push({
        id: r.studentId,
        teacherId: r.teacherId,
        turmaId: r.turmaId ?? undefined,
        name: r.studentName,
        className: r.turmaName ?? '',
      });
      existingStudentIds.add(r.studentId);
    }
    if (!existingIds.has(r.id)) {
      const c: BackendCorrectionJson = r.correctionJson ?? {};
      toAdd.push({
        id: r.id,
        teacherId: r.teacherId,
        studentId: r.studentId,
        themeTitle: r.themeTitle ?? '',
        inputMode: (r.inputMode as Essay['inputMode']) ?? 'manuscrita',
        essayText: r.essayText ?? undefined,
        status: (r.status as EssayStatus) ?? 'corrigida',
        totalScore: r.totalScore ?? undefined,
        teacherScore: r.teacherScore ?? undefined,
        teacherNote: r.teacherNote ?? undefined,
        ...mapCorrectionJsonToEssayFields(c),
        createdAt: r.createdAt ?? undefined,
        correctedAt: r.correctedAt ?? undefined,
        updatedAt: r.updatedAt ?? undefined,
      });
      existingIds.add(r.id);
    }
  }

  if (!toAdd.length && !studentsToAdd.length) return null;
  return {
    essays: toAdd.length ? [...toAdd, ...existingEssays] : existingEssays,
    students: studentsToAdd.length ? [...studentsToAdd, ...existingStudents] : existingStudents,
  };
}
