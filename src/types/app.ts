import type { EssayCorrection } from './correction';
import type {
  AtividadeStatus,
  ConfidenceLevel,
  EssayInputMode,
  EssaySourceType,
  EssayStatus,
  TurmaPeriod,
} from './enums';

// Re-export so consumers can import everything from '@/types/app' as before
export type { AtividadeStatus, ConfidenceLevel, EssayInputMode, EssaySourceType, EssayStatus, TurmaPeriod };

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
  period?: TurmaPeriod;
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
  className: string;
  accessCode?: string;
  state?: string;
  birthDate?: string;
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

export type Atividade = {
  id: string;
  turmaId: string;
  teacherId: string;
  themeTitle: string;
  description?: string;
  dueDate?: string;
  createdAt: string;
  status: AtividadeStatus;
};

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

export type Essay = EssayBase & EssayCorrection;

export type { EssayCorrection };
