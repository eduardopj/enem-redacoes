import { OPENAI_CONFIG } from '@/constants/openai';
import { Essay } from '@/types/app';

const base = () => OPENAI_CONFIG.backendUrl;

export async function pushEssayToBackend(
  essay: Essay,
  studentName: string,
  turmaId?: string,
  turmaName?: string,
): Promise<void> {
  const payload = {
    id: essay.id,
    teacherId: essay.teacherId,
    studentId: essay.studentId,
    studentName,
    turmaId: turmaId ?? null,
    turmaName: turmaName ?? null,
    themeTitle: essay.themeTitle,
    inputMode: essay.inputMode ?? 'manuscrita',
    essayText: essay.essayText ?? null,
    status: essay.status,
    totalScore: essay.totalScore ?? null,
    teacherScore: essay.teacherScore ?? null,
    teacherNote: essay.teacherNote ?? null,
    correctionJson: buildCorrectionJson(essay),
    createdAt: essay.createdAt ?? null,
    correctedAt: essay.correctedAt ?? null,
  };

  const res = await fetch(`${base()}/sync/essays`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
}

export async function fetchEssaysByTeacher(teacherId: string): Promise<BackendEssay[]> {
  const res = await fetch(`${base()}/sync/essays?teacherId=${encodeURIComponent(teacherId)}`);
  if (!res.ok) throw new Error(`sync fetch failed: ${res.status}`);
  return res.json();
}

export async function pushTeacherEvalToBackend(essayId: string, teacherScore: number | undefined, teacherNote: string): Promise<void> {
  const res = await fetch(`${base()}/sync/essays/${encodeURIComponent(essayId)}/teacher-eval`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teacherScore, teacherNote }),
  });
  if (!res.ok) throw new Error(`sync eval failed: ${res.status}`);
}

export type BackendEssay = {
  id: string;
  teacherId: string;
  studentId: string;
  studentName: string | null;
  turmaId: string | null;
  turmaName: string | null;
  themeTitle: string | null;
  inputMode: string;
  essayText: string | null;
  status: string;
  totalScore: number | null;
  teacherScore: number | null;
  teacherNote: string | null;
  correctionJson: Record<string, unknown> | null;
  createdAt: string | null;
  correctedAt: string | null;
  syncedAt: string;
};

function buildCorrectionJson(essay: Essay): Record<string, unknown> | null {
  if (essay.status !== 'corrigida') return null;
  return {
    transcription: essay.transcription,
    transcriptionNotes: essay.transcriptionNotes,
    transcriptionConfidence: essay.transcriptionConfidence,
    writingMode: essay.writingMode,
    legibility: essay.legibility,
    themeAdequacy: essay.themeAdequacy,
    scoreReliability: essay.scoreReliability,
    competencies: essay.competencies,
    competencyFeedbacks: essay.competencyFeedbacks,
    strengths: essay.strengths,
    weaknesses: essay.weaknesses,
    improvements: essay.improvements,
    generalObservation: essay.generalObservation,
    congratulations: essay.congratulations,
    feedback: essay.feedback,
    studentDirectMessage: essay.studentDirectMessage,
    improvementPotential: essay.improvementPotential,
    vocabularyAnalysis: essay.vocabularyAnalysis,
  };
}
