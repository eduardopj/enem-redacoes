function clampBand(value) {
  const allowed = [0, 40, 80, 120, 160, 200];
  const numeric = Number(value || 0);

  let closest = allowed[0];
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

function normalizeText(value, fallback = '') {
  return String(value || fallback).trim();
}

function normalizeStringArray(value, limit = 8) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, limit);
}

function normalizeConfidence(value) {
  return ['alta', 'media', 'baixa'].includes(value) ? value : 'media';
}

function normalizeWritingMode(value) {
  return ['manuscrita', 'digitada', 'mista', 'indefinida'].includes(value)
    ? value
    : 'indefinida';
}

function normalizeThemeLevel(value) {
  return ['adequado', 'tangencial', 'inadequado'].includes(value)
    ? value
    : 'tangencial';
}

function normalizeLegibilityLevel(value) {
  return ['boa', 'media', 'baixa', 'nao_se_aplica'].includes(value)
    ? value
    : 'nao_se_aplica';
}

function normalizeFeedbackBlock(value) {
  return {
    diagnosis: normalizeText(value?.diagnosis, 'Sem diagnóstico informado.'),
    positive: normalizeText(value?.positive, 'Sem ponto positivo informado.'),
    improvement: normalizeText(value?.improvement, 'Sem orientação de melhoria informada.'),
  };
}

function zeroCompetencies() {
  return { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
}

function sumCompetencies(competencies) {
  return competencies.c1 + competencies.c2 + competencies.c3 + competencies.c4 + competencies.c5;
}

export function normalizeCorrection(raw) {
  let competencies = {
    c1: clampBand(raw?.competencies?.c1),
    c2: clampBand(raw?.competencies?.c2),
    c3: clampBand(raw?.competencies?.c3),
    c4: clampBand(raw?.competencies?.c4),
    c5: clampBand(raw?.competencies?.c5),
  };

  const writingMode = normalizeWritingMode(raw?.writingMode);

  const themeGate = {
    themeMainSubject: normalizeText(raw?.themeGate?.themeMainSubject),
    essayMainSubject: normalizeText(raw?.themeGate?.essayMainSubject),
    directRelation: Boolean(raw?.themeGate?.directRelation),
    addressesCentralProblem: Boolean(raw?.themeGate?.addressesCentralProblem),
    offTopicLevel: ['nenhum', 'parcial', 'total'].includes(raw?.themeGate?.offTopicLevel)
      ? raw.themeGate.offTopicLevel
      : 'parcial',
    verdict: ['adequado', 'tangencial', 'fuga_ao_tema'].includes(raw?.themeGate?.verdict)
      ? raw.themeGate.verdict
      : 'tangencial',
    evidence: normalizeText(raw?.themeGate?.evidence, 'Sem evidência temática informada.'),
  };

  const themeAdequacy = {
    level: normalizeThemeLevel(raw?.themeAdequacy?.level),
    observation: normalizeText(
      raw?.themeAdequacy?.observation,
      'Sem observação de adequação temática.'
    ),
  };

  let legibility = {
    applicable: Boolean(raw?.legibility?.applicable),
    level: normalizeLegibilityLevel(raw?.legibility?.level),
    observation: normalizeText(raw?.legibility?.observation, ''),
    illegibleExcerpt: normalizeText(raw?.legibility?.illegibleExcerpt, ''),
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

  const scoreReliability = {
    level: normalizeConfidence(raw?.scoreReliability?.level),
    observation: normalizeText(
      raw?.scoreReliability?.observation,
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

  const isClearlyAdequate =
    !hardOffTopic &&
    themeGate.verdict === 'adequado' &&
    themeAdequacy.level === 'adequado' &&
    themeGate.directRelation &&
    themeGate.addressesCentralProblem;

  if (isClearlyAdequate && transcriptionConfidence === 'alta') {
    const highCount = Object.values(competencies).filter((score) => score >= 160).length;
    const lowCount = Object.values(competencies).filter((score) => score <= 80).length;

    if (highCount >= 3 && lowCount === 0) {
      competencies = {
        c1: competencies.c1 < 120 ? 120 : competencies.c1,
        c2: competencies.c2 < 120 ? 120 : competencies.c2,
        c3: competencies.c3 < 120 ? 120 : competencies.c3,
        c4: competencies.c4 < 120 ? 120 : competencies.c4,
        c5: competencies.c5 < 120 ? 120 : competencies.c5,
      };
    }
  }

  const totalScore = sumCompetencies(competencies);

  const feedbackPrefix = hardOffTopic
    ? 'A redação foi identificada como fuga ao tema e recebeu nota zero. '
    : themeGate.verdict === 'tangencial' || themeAdequacy.level === 'tangencial'
      ? 'A redação foi classificada como tangencial ao tema, com penalização forte nas competências temáticas. '
      : '';

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
      c1: normalizeFeedbackBlock(raw?.competencyFeedbacks?.c1),
      c2: normalizeFeedbackBlock(raw?.competencyFeedbacks?.c2),
      c3: normalizeFeedbackBlock(raw?.competencyFeedbacks?.c3),
      c4: normalizeFeedbackBlock(raw?.competencyFeedbacks?.c4),
      c5: normalizeFeedbackBlock(raw?.competencyFeedbacks?.c5),
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
  };
}