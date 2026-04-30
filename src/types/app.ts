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
};

export type StudentSession = {
  studentId: string;
  teacherId: string;
  turmaId?: string;
  studentName: string;
  className: string;
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

export type Essay = {
  id: string;
  teacherId: string;
  studentId: string;
  themeTitle: string;
  inputMode?: EssayInputMode;
  essayText?: string;
  imageName?: string;
  imageUri?: string;
  documentName?: string;
  documentUri?: string;
  status: EssayStatus;
  sourceType?: EssaySourceType;
  confidenceLevel?: ConfidenceLevel;
  reviewRequired?: boolean;
  errorMessage?: string;
  correctionAttempts?: number;
  totalScore?: number;
  teacherScore?: number;   // manual grade added by teacher (0–1000)
  teacherNote?: string;    // teacher's own written assessment
  transcription?: string;
  transcriptionNotes?: string;
  transcriptionConfidence?: 'alta' | 'media' | 'baixa';
  writingMode?: 'manuscrita' | 'digitada' | 'mista' | 'indefinida';
  legibility?: {
    applicable: boolean;
    level: 'boa' | 'media' | 'baixa' | 'nao_se_aplica';
    observation: string;
    illegibleExcerpt: string;
  };
  themeAdequacy?: {
    level: 'adequado' | 'tangencial' | 'inadequado';
    observation: string;
  };
  scoreReliability?: {
    level: 'alta' | 'media' | 'baixa';
    observation: string;
  };
  competencies?: {
    c1: number;
    c2: number;
    c3: number;
    c4: number;
    c5: number;
  };
  competencyFeedbacks?: {
    c1: { diagnosis: string; positive: string; improvement: string };
    c2: { diagnosis: string; positive: string; improvement: string };
    c3: { diagnosis: string; positive: string; improvement: string };
    c4: { diagnosis: string; positive: string; improvement: string };
    c5: { diagnosis: string; positive: string; improvement: string };
  };
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  generalObservation?: string;
  congratulations?: string;
  feedback?: string;
  studentDirectMessage?: string;
  improvementPotential?: string;
  vocabularyAnalysis?: {
    frequentWords: string[];
    synonymSuggestions: {
      word: string;
      alternatives: string[];
      context: string;
    }[];
  };
  createdAt?: string;
  updatedAt?: string;
  correctedAt?: string;
};
