/**
 * Shared correction result type — single source of truth for the AI-generated
 * correction fields. Both `Essay` (local store) and `BackendCorrectionJson`
 * (backend API contract) compose from this type to eliminate duplication.
 */
export type EssayCorrection = {
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
  competencies?: { c1: number; c2: number; c3: number; c4: number; c5: number };
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
  detectedTheme?: string;
  vocabularyAnalysis?: {
    frequentWords: string[];
    synonymSuggestions: { word: string; alternatives: string[]; context: string }[];
  };
};
