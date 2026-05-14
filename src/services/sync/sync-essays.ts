import { OPENAI_CONFIG } from '@/constants/openai';
import type { BackendEssay } from '@/types/api';
import { Essay } from '@/types/app';
import * as FileSystem from 'expo-file-system';

export type { BackendEssay };

const base = () => OPENAI_CONFIG.backendUrl;

// In-memory ETag cache: avoids re-parsing identical paginated responses
const etagCache = new Map<string, { etag: string; data: { data: BackendEssay[]; hasMore: boolean; nextCursor: string | null } }>();

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

export async function pushEssayToBackend(
  essay: Essay,
  studentName: string,
  turmaId?: string,
  turmaName?: string,
  token?: string,
): Promise<void> {
  // Attempt to upload image for server-side backup; fails silently (file may have been cleared by OS)
  let imageBase64: string | null = null;
  if (essay.imageUri?.startsWith('file://')) {
    try {
      // eslint-disable-next-line deprecation/deprecation
      imageBase64 = await FileSystem.readAsStringAsync(essay.imageUri, { encoding: 'base64' });
    } catch {
      // proceed without image
    }
  }

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
    updatedAt: essay.updatedAt ?? new Date().toISOString(),
    imageBase64,
    imageMimeType: imageBase64 ? (essay.imageMimeType ?? null) : null,
    submittedByStudent: essay.submittedByStudent ?? false,
  };

  const res = await fetch(`${base()}/v1/sync/essays`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`sync push failed: ${res.status}`);
}

export async function fetchEssaysByTeacher(
  _teacherId: string,
  token?: string,
  cursor?: string,
  limit = 50,
): Promise<{ data: BackendEssay[]; hasMore: boolean; nextCursor: string | null }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);

  const cacheKey = `essays?${params}`;
  const cached = etagCache.get(cacheKey);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (cached) headers['If-None-Match'] = cached.etag;

  const res = await fetch(`${base()}/v1/sync/essays?${params}`, { headers });

  if (res.status === 304 && cached) return cached.data;
  if (!res.ok) throw new Error(`sync fetch failed: ${res.status}`);

  const body = await res.json();
  let parsed: { data: BackendEssay[]; hasMore: boolean; nextCursor: string | null };
  if (Array.isArray(body)) {
    parsed = { data: body, hasMore: false, nextCursor: null };
  } else if (Array.isArray(body.data)) {
    parsed = { data: body.data, hasMore: body.hasMore ?? false, nextCursor: body.nextCursor ?? null };
  } else {
    parsed = { data: [], hasMore: false, nextCursor: null };
  }

  const etag = res.headers.get('ETag');
  if (etag) etagCache.set(cacheKey, { etag, data: parsed });

  return parsed;
}

export async function fetchEssayDetail(
  essayId: string,
  token?: string,
): Promise<BackendEssay | null> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${base()}/v1/sync/essays/${encodeURIComponent(essayId)}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`sync detail fetch failed: ${res.status}`);

  const body = await res.json();
  return (body.data ?? body) as BackendEssay;
}

export async function pushTeacherEvalToBackend(
  essayId: string,
  teacherScore: number | undefined,
  teacherNote: string,
  token?: string,
): Promise<void> {
  const res = await fetch(
    `${base()}/v1/sync/essays/${encodeURIComponent(essayId)}/teacher-eval`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify({ teacherScore, teacherNote }),
    },
  );
  if (!res.ok) throw new Error(`sync eval failed: ${res.status}`);
}

const CORRECTED_STATUSES: Essay['status'][] = ['corrigida', 'precisa_revisao', 'baixa_confiabilidade'];

function buildCorrectionJson(essay: Essay): Record<string, unknown> | null {
  if (!CORRECTED_STATUSES.includes(essay.status)) return null;
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
