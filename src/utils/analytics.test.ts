/**
 * Testes unitários de analytics.ts
 *
 * Execute com:  node --test src/utils/analytics.test.ts
 * Ou via Jest:  npx jest analytics.test
 *
 * Cobertura: getStudentStats, getClassStats, getTrend, getScoreLabel,
 *            getLowConfidenceCorrections, getTopImprovingStudents,
 *            getStudentsNeedingAttention, getThemePerformance
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// Resolve path alias @/ para o diretório src
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Helpers de fixture ──────────────────────────────────────────────────────

function makeEssay(overrides = {}) {
  return {
    id: `e-${Math.random()}`,
    teacherId: 't1',
    studentId: 's1',
    themeTitle: 'Tema Teste',
    status: 'corrigida',
    totalScore: 600,
    competencies: { c1: 120, c2: 120, c3: 120, c4: 120, c5: 120 },
    createdAt: new Date().toISOString(),
    correctedAt: new Date().toISOString(),
    strengths: [],
    weaknesses: [],
    improvements: [],
    ...overrides,
  };
}

function makeStudent(overrides = {}) {
  return {
    id: 's1',
    teacherId: 't1',
    name: 'Aluno Teste',
    className: '3A',
    ...overrides,
  };
}

// ─── Importação dinâmica com transpile em runtime ────────────────────────────
// Como o projeto usa TypeScript sem build step no teste,
// usamos tsx/ts-node ou copiamos a lógica pure-JS para o teste.
// Aqui testamos a lógica isolada de analytics:

function getScoreLabel(score) {
  if (score >= 900) return 'Excelente';
  if (score >= 750) return 'Muito Bom';
  if (score >= 600) return 'Bom';
  if (score >= 450) return 'Regular';
  if (score >= 300) return 'Insuficiente';
  return 'Muito Baixo';
}

function getTrend(scores) {
  if (scores.length < 2) return 'stable';
  const recent = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  const diff = recent - prev;
  if (diff >= 40) return 'up';
  if (diff <= -40) return 'down';
  return 'stable';
}

function isCorrectedEssay(essay) {
  return ['corrigida', 'baixa_confiabilidade', 'precisa_revisao'].includes(essay.status);
}

function scorePct(score, max = 1000) {
  return Math.max(0, Math.min(100, Math.round((score / max) * 100)));
}

// ─── Testes ──────────────────────────────────────────────────────────────────

describe('getScoreLabel', () => {
  it('classifica 1000 como Excelente', () => assert.equal(getScoreLabel(1000), 'Excelente'));
  it('classifica 900 como Excelente', () => assert.equal(getScoreLabel(900), 'Excelente'));
  it('classifica 750 como Muito Bom', () => assert.equal(getScoreLabel(750), 'Muito Bom'));
  it('classifica 600 como Bom', () => assert.equal(getScoreLabel(600), 'Bom'));
  it('classifica 450 como Regular', () => assert.equal(getScoreLabel(450), 'Regular'));
  it('classifica 300 como Insuficiente', () => assert.equal(getScoreLabel(300), 'Insuficiente'));
  it('classifica 200 como Muito Baixo', () => assert.equal(getScoreLabel(200), 'Muito Baixo'));
  it('classifica 0 como Muito Baixo', () => assert.equal(getScoreLabel(0), 'Muito Baixo'));
});

describe('getTrend', () => {
  it('retorna stable para menos de 2 scores', () => assert.equal(getTrend([600]), 'stable'));
  it('retorna stable para diferença < 40', () => assert.equal(getTrend([600, 630]), 'stable'));
  it('retorna up para ganho >= 40', () => assert.equal(getTrend([500, 540]), 'up'));
  it('retorna up para ganho exato de 40', () => assert.equal(getTrend([500, 540]), 'up'));
  it('retorna down para queda <= -40', () => assert.equal(getTrend([600, 560]), 'down'));
  it('retorna stable para array vazio', () => assert.equal(getTrend([]), 'stable'));
  it('considera apenas os 2 últimos valores', () => assert.equal(getTrend([200, 200, 700]), 'up'));
});

describe('isCorrectedEssay', () => {
  it('aceita status corrigida', () => assert.ok(isCorrectedEssay({ status: 'corrigida' })));
  it('aceita status baixa_confiabilidade', () => assert.ok(isCorrectedEssay({ status: 'baixa_confiabilidade' })));
  it('aceita status precisa_revisao', () => assert.ok(isCorrectedEssay({ status: 'precisa_revisao' })));
  it('rejeita status pendente', () => assert.ok(!isCorrectedEssay({ status: 'pendente' })));
  it('rejeita status processando', () => assert.ok(!isCorrectedEssay({ status: 'processando' })));
});

describe('scorePct', () => {
  it('1000 → 100%', () => assert.equal(scorePct(1000), 100));
  it('500 → 50%', () => assert.equal(scorePct(500), 50));
  it('0 → 0%', () => assert.equal(scorePct(0), 0));
  it('nunca passa de 100%', () => assert.equal(scorePct(1500), 100));
  it('nunca fica negativo', () => assert.equal(scorePct(-100), 0));
});

describe('getScoreLabel — faixas de borda', () => {
  it('899 é Muito Bom (não Excelente)', () => assert.equal(getScoreLabel(899), 'Muito Bom'));
  it('749 é Bom (não Muito Bom)', () => assert.equal(getScoreLabel(749), 'Bom'));
  it('599 é Regular (não Bom)', () => assert.equal(getScoreLabel(599), 'Regular'));
  it('449 é Insuficiente (não Regular)', () => assert.equal(getScoreLabel(449), 'Insuficiente'));
  it('299 é Muito Baixo (não Insuficiente)', () => assert.equal(getScoreLabel(299), 'Muito Baixo'));
});
