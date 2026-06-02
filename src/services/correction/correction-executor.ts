import { correctEssayWithOpenAI } from '@/services/openai/correct-essay';
import { ConfidenceLevel } from '@/types/enums';
import * as Sentry from '@sentry/react-native';

export interface CorrectionInput {
  themeTitle: string;
  imageUri?: string;
  imageMimeType?: string;
  essayText?: string;
  token?: string;
}

export interface CorrectionProgress {
  label: string;
  partial?: Partial<CorrectionResult>;
}

export interface CorrectionResult {
  transcription: string;
  transcriptionNotes: string;
  transcriptionConfidence: string;
  writingMode: string;
  legibility: string;
  themeAdequacy: string;
  scoreReliability: { level: string; reason: string };
  competencies: Record<string, number>;
  competencyFeedbacks: Record<string, unknown>;
  totalScore: number;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  generalObservation: string;
  congratulations: string;
  feedback: string;
  studentDirectMessage: string;
  improvementPotential: string;
  vocabularyAnalysis: string;
  detectedTheme: string | null;
  /** true when correction confidence is low and should be flagged for teacher review */
  reviewRequired: boolean;
  confidenceLevel: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Executes the AI correction pipeline with staged progress callbacks.
 * Stateless — no store access. Returns the full correction result.
 */
export async function executeCorrection(
  input: CorrectionInput,
  onProgress: (p: CorrectionProgress) => void,
): Promise<CorrectionResult> {
  onProgress({ label: 'ETAPA 1/4 - lendo a imagem' });
  await wait(450);

  const raw = await Sentry.startSpan(
    { name: 'ai.correction', op: 'ai', attributes: { 'ai.model': 'openai' } },
    () => correctEssayWithOpenAI(
      input.essayText
        ? { themeTitle: input.themeTitle, essayText: input.essayText, token: input.token }
        : { themeTitle: input.themeTitle, imageUri: input.imageUri, imageMimeType: input.imageMimeType, token: input.token }
    ),
  );

  const reviewRequired =
    raw.scoreReliability.level === ConfidenceLevel.Baixa ||
    raw.transcriptionConfidence === ConfidenceLevel.Baixa;

  const partial1 = {
    transcription: raw.transcription,
    transcriptionNotes: raw.transcriptionNotes,
    transcriptionConfidence: raw.transcriptionConfidence,
    writingMode: raw.writingMode,
    legibility: raw.legibility,
    themeAdequacy: raw.themeAdequacy,
    scoreReliability: raw.scoreReliability,
    confidenceLevel: raw.scoreReliability.level,
    reviewRequired,
  };
  onProgress({ label: 'ETAPA 2/4 - transcrevendo texto', partial: partial1 });
  await wait(450);

  const partial2 = {
    competencies: raw.competencies,
    competencyFeedbacks: raw.competencyFeedbacks,
    totalScore: raw.totalScore,
  };
  onProgress({ label: 'ETAPA 3/4 - analisando competências', partial: partial2 });
  await wait(450);

  const partial3 = {
    strengths: raw.strengths,
    weaknesses: raw.weaknesses,
    improvements: raw.improvements,
    generalObservation: raw.generalObservation,
    congratulations: raw.congratulations,
  };
  onProgress({ label: 'ETAPA 4/4 - preparando devolutiva', partial: partial3 });
  await wait(450);

  return {
    ...raw,
    reviewRequired,
    confidenceLevel: raw.scoreReliability.level,
  };
}
