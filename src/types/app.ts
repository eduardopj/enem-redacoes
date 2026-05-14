import type { EssayCorrection } from './correction';

export type EssayStatus =
  | 'pendente'
  | 'processando'
  | 'corrigida'
  | 'precisa_revisao'
  | 'baixa_confiabilidade';

export type Teacher = {
  id: string;
  name: string;
  email: string;
  state?: string;
};

export type Turma = {
  id: string;
  teacherId: string;
  name: string;
  period?: 'manhã' | 'tarde' | 'noite' | 'integral';
  year?: string;
  subject?: string;
  joinCode?: string;
  createdAt: string;
};

export type QRJoinPayload = {
  type: 'enem-ia-join-v1';
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  turmaId: string;
  turmaName: string;
  joinCode: string;
};

export type Student = {
  id: string;
  teacherId: string;
  turmaId?: string;
  name: string;
  className: string;    // kept for backward compat; mirrors turma.name when turmaId set
  accessCode?: string;
  state?: string;
  birthDate?: string;   // ISO date string, e.g. "2007-03-15"
};

export type StudentSession = {
  studentId: string;
  teacherId: string;
  turmaId?: string;
  studentName: string;
  className: string;
  birthDate?: string;
};

export type ThemeItem = {
  id: string;
  teacherId?: string;
  title: string;
  category: string;
};

export type EssayInputMode = 'manuscrita' | 'digitada' | 'upload';
export type EssaySourceType = 'image' | 'document';
export type ConfidenceLevel = 'alta' | 'media' | 'baixa';

export type Atividade = {
  id: string;
  turmaId: string;
  teacherId: string;
  themeTitle: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
  status: 'ativa' | 'encerrada';
};

// Essay base fields (identity, media, status, meta)
type EssayBase = {
  id: string;
  teacherId: string;
  studentId: string;
  themeTitle: string;
  inputMode?: EssayInputMode;
  essayText?: string;
  imageName?: string;
  imageUri?: string;
  imageMimeType?: string;
  imageRemoteUrl?: string;
  documentName?: string;
  documentUri?: string;
  status: EssayStatus;
  sourceType?: EssaySourceType;
  confidenceLevel?: ConfidenceLevel;
  reviewRequired?: boolean;
  errorMessage?: string;
  correctionAttempts?: number;
  submittedByStudent?: boolean;
  totalScore?: number;
  teacherScore?: number;
  teacherNote?: string;
  teacherReviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  correctedAt?: string;
};

// Essay = base fields + AI correction fields (no duplication with BackendCorrectionJson)
export type Essay = EssayBase & EssayCorrection;

// Re-export for convenience
export type { EssayCorrection };
