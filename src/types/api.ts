/**
 * Tipos do contrato backend ↔ frontend.
 * Elimina todos os `as any` nos mapeamentos de sincronização.
 */
import type { EssayCorrection } from './correction';

export type { EssayCorrection };

// BackendCorrectionJson is an alias — EssayCorrection is the single source of truth
export type BackendCorrectionJson = EssayCorrection;

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
  correctionJson: BackendCorrectionJson | null;
  createdAt: string | null;
  correctedAt: string | null;
  updatedAt: string | null;
  syncedAt: string;
};
