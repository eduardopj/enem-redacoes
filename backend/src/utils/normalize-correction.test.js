import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeCorrection } from './normalize-correction.js';

describe('normalizeCorrection', () => {
  it('clamps competency scores to ENEM bands and recalculates total', () => {
    const result = normalizeCorrection({
      transcription: 'Texto',
      transcriptionConfidence: 'alta',
      writingMode: 'digitada',
      themeGate: {
        verdict: 'adequado',
        offTopicLevel: 'nenhum',
        directRelation: true,
        addressesCentralProblem: true,
      },
      themeAdequacy: { level: 'adequado', observation: 'ok' },
      scoreReliability: { level: 'alta', observation: 'ok' },
      competencies: { c1: 187, c2: 151, c3: 79, c4: 44, c5: 999 },
    });

    assert.deepEqual(result.competencies, { c1: 200, c2: 160, c3: 80, c4: 40, c5: 200 });
    assert.equal(result.totalScore, 680);
  });

  it('zeros the essay when hard off-topic is detected', () => {
    const result = normalizeCorrection({
      transcription: 'Texto',
      transcriptionConfidence: 'alta',
      writingMode: 'manuscrita',
      themeGate: {
        verdict: 'fuga_ao_tema',
        offTopicLevel: 'total',
        directRelation: false,
        addressesCentralProblem: false,
        evidence: 'Assunto incompatível.',
      },
      themeAdequacy: { level: 'inadequado', observation: 'fuga' },
      scoreReliability: { level: 'alta', observation: 'ok' },
      competencies: { c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 },
    });

    assert.deepEqual(result.competencies, { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 });
    assert.equal(result.totalScore, 0);
    assert.equal(result.themeAdequacy.level, 'inadequado');
  });

  it('normalizes incomplete responses safely', () => {
    const result = normalizeCorrection({});
    assert.equal(result.transcriptionConfidence, 'media');
    assert.equal(result.scoreReliability.level, 'media');
    assert.equal(result.totalScore, 0);
    assert.deepEqual(Object.keys(result.competencies), ['c1', 'c2', 'c3', 'c4', 'c5']);
  });
});
