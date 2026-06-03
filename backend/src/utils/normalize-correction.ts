type BandValue = 0 | 40 | 80 | 120 | 160 | 200;

interface Competencies {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

interface FeedbackBlock {
  diagnosis: string;
  positive: string;
  improvement: string;
}

interface SynonymSuggestion {
  word: string;
  alternatives: string[];
  context: string;
}

interface NormalizedCorrection {
  transcription: string;
  transcriptionNotes: string;
  transcriptionConfidence: string;
  writingMode: string;
  legibility: {
    applicable: boolean;
    level: string;
    observation: string;
    illegibleExcerpt: string;
  };
  themeAdequacy: {
    level: string;
    observation: string;
  };
  scoreReliability: {
    level: string;
    observation: string;
  };
  totalScore: number;
  competencies: Competencies;
  competencyFeedbacks: {
    c1: FeedbackBlock;
    c2: FeedbackBlock;
    c3: FeedbackBlock;
    c4: FeedbackBlock;
    c5: FeedbackBlock;
  };
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  generalObservation: string;
  congratulations: string;
  feedback: string;
  studentDirectMessage: string;
  improvementPotential: string;
  vocabularyAnalysis: {
    frequentWords: string[];
    synonymSuggestions: SynonymSuggestion[];
  };
  detectedTheme: string;
}

function clampBand(value: unknown): BandValue {
  const allowed: BandValue[] = [0, 40, 80, 120, 160, 200];
  const numeric = Number(value || 0);

  let closest: BandValue = allowed[0];
  let smallestDiff = Math.abs(numeric - closest);

  for (const option of allowed) {
    const diff = Math.abs(numeric - option);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = option;
    }
  }

  return closest;
}

function normalizeText(value: unknown, fallback = ''): string {
  return String(value || fallback).trim();
}

function normalizeStringArray(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, limit);
}

function normalizeConfidence(value: unknown): 'alta' | 'media' | 'baixa' {
  return (['alta', 'media', 'baixa'] as const).includes(value as 'alta' | 'media' | 'baixa')
    ? (value as 'alta' | 'media' | 'baixa')
    : 'media';
}

function normalizeWritingMode(value: unknown): string {
  return ['manuscrita', 'digitada', 'mista', 'indefinida'].includes(value as string)
    ? (value as string)
    : 'indefinida';
}

function normalizeThemeLevel(value: unknown): string {
  return ['adequado', 'tangencial', 'inadequado'].includes(value as string)
    ? (value as string)
    : 'tangencial';
}

function normalizeLegibilityLevel(value: unknown): string {
  return ['boa', 'media', 'baixa', 'nao_se_aplica'].includes(value as string)
    ? (value as string)
    : 'nao_se_aplica';
}

function normalizeFeedbackBlock(value: unknown): FeedbackBlock {
  const v = value as Record<string, unknown> | null | undefined;
  return {
    diagnosis: normalizeText(v?.diagnosis, 'Sem diagnóstico informado.'),
    positive: normalizeText(v?.positive, 'Sem ponto positivo informado.'),
    improvement: normalizeText(v?.improvement, 'Sem orientação de melhoria informada.'),
  };
}

function zeroCompetencies(): Competencies {
  return { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
}

function sumCompetencies(competencies: Competencies): number {
  return competencies.c1 + competencies.c2 + competencies.c3 + competencies.c4 + competencies.c5;
}

export function normalizeCorrection(raw: Record<string, unknown>): NormalizedCorrection {
  const rawComp = raw?.competencies as Record<string, unknown> | null | undefined;
  let competencies: Competencies = {
    c1: clampBand(rawComp?.c1),
    c2: clampBand(rawComp?.c2),
    c3: clampBand(rawComp?.c3),
    c4: clampBand(rawComp?.c4),
    c5: clampBand(rawComp?.c5),
  };

  const writingMode = normalizeWritingMode(raw?.writingMode);

  const rawThemeGate = raw?.themeGate as Record<string, unknown> | null | undefined;
  const themeGate = {
    themeMainSubject: normalizeText(rawThemeGate?.themeMainSubject),
    essayMainSubject: normalizeText(rawThemeGate?.essayMainSubject),
    directRelation: Boolean(rawThemeGate?.directRelation),
    addressesCentralProblem: Boolean(rawThemeGate?.addressesCentralProblem),
    offTopicLevel: (['nenhum', 'parcial', 'total'] as const).includes(rawThemeGate?.offTopicLevel as 'nenhum' | 'parcial' | 'total')
      ? (rawThemeGate!.offTopicLevel as 'nenhum' | 'parcial' | 'total')
      : 'parcial' as const,
    verdict: (['adequado', 'tangencial', 'fuga_ao_tema'] as const).includes(rawThemeGate?.verdict as 'adequado' | 'tangencial' | 'fuga_ao_tema')
      ? (rawThemeGate!.verdict as 'adequado' | 'tangencial' | 'fuga_ao_tema')
      : 'tangencial' as const,
    evidence: normalizeText(rawThemeGate?.evidence, 'Sem evidência temática informada.'),
  };

  const rawThemeAdequacy = raw?.themeAdequacy as Record<string, unknown> | null | undefined;
  const themeAdequacy = {
    level: normalizeThemeLevel(rawThemeAdequacy?.level),
    observation: normalizeText(
      rawThemeAdequacy?.observation,
      'Sem observação de adequação temática.'
    ),
  };

  const rawLegibility = raw?.legibility as Record<string, unknown> | null | undefined;
  let legibility = {
    applicable: Boolean(rawLegibility?.applicable),
    level: normalizeLegibilityLevel(rawLegibility?.level),
    observation: normalizeText(rawLegibility?.observation, ''),
    illegibleExcerpt: normalizeText(rawLegibility?.illegibleExcerpt, ''),
  };

  if (writingMode === 'digitada') {
    legibility = {
      applicable: false,
      level: 'nao_se_aplica',
      observation: 'Texto identificado como digitado. Legibilidade manuscrita não se aplica.',
      illegibleExcerpt: '',
    };
  }

  const transcriptionConfidence = normalizeConfidence(raw?.transcriptionConfidence);

  const rawScoreReliability = raw?.scoreReliability as Record<string, unknown> | null | undefined;
  const scoreReliability = {
    level: normalizeConfidence(rawScoreReliability?.level),
    observation: normalizeText(
      rawScoreReliability?.observation,
      'Sem observação de confiabilidade.'
    ),
  };

  const hardOffTopic =
    themeGate.verdict === 'fuga_ao_tema' ||
    themeGate.offTopicLevel === 'total' ||
    themeAdequacy.level === 'inadequado' ||
    (!themeGate.directRelation && !themeGate.addressesCentralProblem);

  if (hardOffTopic) {
    competencies = zeroCompetencies();
  } else if (themeGate.verdict === 'tangencial' || themeAdequacy.level === 'tangencial') {
    competencies = {
      c1: competencies.c1,
      c2: Math.min(competencies.c2, 80),
      c3: Math.min(competencies.c3, 120),
      c4: Math.min(competencies.c4, 120),
      c5: Math.min(competencies.c5, 120),
    };
  }

  if (transcriptionConfidence === 'baixa' || legibility.level === 'baixa') {
    competencies = {
      c1: Math.min(competencies.c1, 160),
      c2: Math.min(competencies.c2, 160),
      c3: Math.min(competencies.c3, 160),
      c4: Math.min(competencies.c4, 160),
      c5: Math.min(competencies.c5, 160),
    };
  }

  const totalScore = sumCompetencies(competencies);

  const feedbackPrefix = hardOffTopic
    ? 'A redação foi identificada como fuga ao tema e recebeu nota zero. '
    : themeGate.verdict === 'tangencial' || themeAdequacy.level === 'tangencial'
      ? 'A redação foi classificada como tangencial ao tema, com penalização forte nas competências temáticas. '
      : '';

  const rawCompFeedbacks = raw?.competencyFeedbacks as Record<string, unknown> | null | undefined;
  const rawVocabAnalysis = raw?.vocabularyAnalysis as Record<string, unknown> | null | undefined;

  return {
    transcription: normalizeText(raw?.transcription),
    transcriptionNotes: normalizeText(
      raw?.transcriptionNotes,
      'Transcrição realizada sem observações adicionais.'
    ),
    transcriptionConfidence,
    writingMode,
    legibility,
    themeAdequacy: {
      level: hardOffTopic ? 'inadequado' : themeAdequacy.level,
      observation: hardOffTopic
        ? `Fuga ao tema identificada. ${themeGate.evidence}`
        : themeAdequacy.observation,
    },
    scoreReliability,
    totalScore,
    competencies,
    competencyFeedbacks: {
      c1: normalizeFeedbackBlock(rawCompFeedbacks?.c1),
      c2: normalizeFeedbackBlock(rawCompFeedbacks?.c2),
      c3: normalizeFeedbackBlock(rawCompFeedbacks?.c3),
      c4: normalizeFeedbackBlock(rawCompFeedbacks?.c4),
      c5: normalizeFeedbackBlock(rawCompFeedbacks?.c5),
    },
    strengths: normalizeStringArray(raw?.strengths, 10),
    weaknesses: normalizeStringArray(raw?.weaknesses, 10),
    improvements: normalizeStringArray(raw?.improvements, 10),
    generalObservation: hardOffTopic
      ? `O texto desenvolvido não corresponde ao núcleo temático proposto. ${themeGate.evidence}`
      : normalizeText(raw?.generalObservation, 'Sem observação geral retornada.'),
    congratulations: hardOffTopic
      ? 'Há qualidades de escrita no texto, mas o tema proposto não foi atendido.'
      : normalizeText(raw?.congratulations, 'Parabéns pelo esforço e pela construção do texto.'),
    feedback: `${feedbackPrefix}${normalizeText(raw?.feedback, 'Sem feedback retornado.')}`,
    studentDirectMessage: normalizeText(raw?.studentDirectMessage, ''),
    improvementPotential: normalizeText(raw?.improvementPotential, ''),
    vocabularyAnalysis: {
      frequentWords: normalizeStringArray(rawVocabAnalysis?.frequentWords, 10),
      synonymSuggestions: (Array.isArray(rawVocabAnalysis?.synonymSuggestions)
        ? rawVocabAnalysis!.synonymSuggestions as unknown[]
        : []
      ).map((s) => {
        const item = s as Record<string, unknown>;
        return {
          word: normalizeText(item?.word, ''),
          alternatives: normalizeStringArray(item?.alternatives, 6),
          context: normalizeText(item?.context, ''),
        };
      }).filter((s) => s.word),
    },
    detectedTheme: normalizeText(raw?.detectedTheme, ''),
  };
}
