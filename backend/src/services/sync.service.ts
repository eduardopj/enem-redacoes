import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  checkEssayConflict,
  findEssayById,
  findEssayImagePath,
  findEssaysByTeacher,
  updateEssayTeacherEval,
  upsertEssayRow,
} from '../repositories/essay.repository.js';
import { findTurmaByCode, upsertTurmaRow } from '../repositories/turma.repository.js';
import { getTeacherPushTokenById } from '../repositories/teacher.repository.js';
import { validateAndOptimizeImage } from '../utils/image.js';
import { storeImage } from '../utils/image-storage.js';
import { env } from '../config/env.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(
  pushToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  if (!pushToken?.startsWith('ExponentPushToken')) return;
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: 'default', priority: 'high' }),
    });
  } catch (_) {
    // push is best-effort — never throw
  }
}

const DATA_DIR = process.env.DATA_DIR ?? join(fileURLToPath(import.meta.url), '../../../../data');
const IMAGES_DIR = join(DATA_DIR, 'images');
mkdirSync(IMAGES_DIR, { recursive: true });

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface UpsertEssayInput {
  id: string;
  teacherId: string;
  studentId: string;
  studentName?: string | null;
  turmaId?: string | null;
  turmaName?: string | null;
  themeTitle?: string | null;
  inputMode?: string;
  essayText?: string | null;
  status?: string;
  totalScore?: number | null;
  teacherScore?: number | null;
  teacherNote?: string | null;
  correctionJson?: Record<string, unknown> | null;
  createdAt?: string | null;
  correctedAt?: string | null;
  updatedAt?: string | null;
  imageBase64?: string | null;
  imageMimeType?: string | null;
  submittedByStudent?: boolean;
}

interface UpsertEssayResult {
  ok: boolean;
  skipped: boolean;
  imageUrl: string | null;
}

export async function upsertEssay(essay: UpsertEssayInput): Promise<UpsertEssayResult> {
  // ── Quick conflict check (read, outside transaction) ──────────────────────
  const existing = await checkEssayConflict(essay.id);
  if (existing?.updatedAt && essay.updatedAt && existing.updatedAt >= essay.updatedAt) {
    return { ok: true, skipped: true, imageUrl: null };
  }

  const isNew = !existing;

  // ── P1: Validate + optimize image BEFORE touching the DB ─────────────────
  // Local mode: pre-compute the path (known before write).
  // S3 mode:    imagePath stays null; S3 key is derived from essay ID.
  let imageBuffer: Buffer | null = null;
  let localImagePath: string | null = null;
  if (essay.imageBase64 && essay.imageMimeType && ALLOWED_IMAGE_MIME.has(essay.imageMimeType)) {
    const optimized = await validateAndOptimizeImage(essay.imageBase64);
    imageBuffer = Buffer.from(optimized.base64, 'base64');
    if (!env.s3Bucket) {
      // Reserve the local path so the DB row is immediately consistent
      localImagePath = join(IMAGES_DIR, `${essay.id}.webp`);
    }
  }

  // ── P2: Atomic DB write ───────────────────────────────────────────────────
  await upsertEssayRow({
    id: essay.id,
    teacherId: essay.teacherId,
    studentId: essay.studentId,
    studentName: essay.studentName ?? null,
    turmaId: essay.turmaId ?? null,
    turmaName: essay.turmaName ?? null,
    themeTitle: essay.themeTitle ?? null,
    inputMode: essay.inputMode ?? 'manuscrita',
    essayText: essay.essayText ?? null,
    status: essay.status ?? 'corrigida',
    totalScore: essay.totalScore ?? null,
    teacherScore: essay.teacherScore ?? null,
    teacherNote: essay.teacherNote ?? null,
    correctionJson: essay.correctionJson != null ? JSON.stringify(essay.correctionJson) : null,
    createdAt: essay.createdAt ?? null,
    correctedAt: essay.correctedAt ?? null,
    updatedAt: essay.updatedAt ?? null,
    imagePath: localImagePath, // COALESCE in SQL keeps existing if null
    submittedByStudent: isNew && essay.submittedByStudent ? 1 : 0,
  });

  // ── P3: Store image AFTER successful DB commit ────────────────────────────
  // Local: writes bytes to disk (path was already committed in DB).
  // S3:    uploads to S3; returns the CDN/S3 URL (no DB update needed — URL is deterministic).
  let imageUrl: string | null = null;
  if (imageBuffer) {
    const stored = await storeImage(essay.id, imageBuffer, localImagePath);
    imageUrl = stored.imageUrl; // non-null only in S3 mode
  }

  // imageUrl is non-null only in S3 mode — returned to frontend so it can set imageRemoteUrl to the CDN URL.
  // In local mode the frontend constructs the URL from backendUrl config; we return null.

  // Push notification: new student essay that was AI-corrected
  const correctedStatuses = ['corrigida', 'precisa_revisao', 'baixa_confiabilidade'];
  if (isNew && essay.submittedByStudent && correctedStatuses.includes(essay.status ?? 'corrigida')) {
    const pushToken = await getTeacherPushTokenById(essay.teacherId);
    if (pushToken) {
      const studentName = essay.studentName ?? 'Aluno';
      const theme = essay.themeTitle ?? 'Redação';
      const score = essay.totalScore != null ? ` • ${essay.totalScore}/1000` : '';
      sendExpoPush(
        pushToken,
        `Redação corrigida pela IA${score}`,
        `${studentName}: ${theme}`,
        { essayId: essay.id, screen: 'resultado' }
      );
    }
  }

  return { ok: true, skipped: false, imageUrl };
}

export async function getEssaysByTeacher(
  teacherId: string,
  opts: { cursor?: string; limit?: number },
): ReturnType<typeof findEssaysByTeacher> {
  return findEssaysByTeacher(teacherId, opts);
}

export async function getEssayById(id: string): ReturnType<typeof findEssayById> {
  return findEssayById(id);
}

export async function getEssayImagePath(id: string): Promise<string | null> {
  return findEssayImagePath(id);
}

export async function updateTeacherEval(
  id: string,
  teacherScore: number | null,
  teacherNote: string | null,
): Promise<{ ok: boolean }> {
  await updateEssayTeacherEval(id, teacherScore, teacherNote);
  return { ok: true };
}

export async function upsertTurma(
  data: Parameters<typeof upsertTurmaRow>[0],
): Promise<{ ok: boolean }> {
  await upsertTurmaRow(data);
  return { ok: true };
}

export async function getTurmaByCode(joinCode: string): ReturnType<typeof findTurmaByCode> {
  return findTurmaByCode(joinCode);
}

export { IMAGES_DIR };
