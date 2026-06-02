/**
 * Testes unitários de analytics.ts — importa as funções reais do módulo.
 * Execute com: npx jest analytics.test
 */

import {
  formatRelativeDate,
  getScoreColor,
  getScoreLabel,
  getScoreTier,
  getStudentStats,
  getTrend,
  getTrendColor,
  getTrendIcon,
  isCorrectedEssay,
} from '@/utils/analytics';
import type { Essay } from '@/types/app';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const COLORS = {
  success: '#58CC02',
  accent: '#7C3AED',
  warning: '#FF9600',
  danger: '#FF4B4B',
  mutedText: '#777777',
};

function makeEssay(overrides: Partial<Essay> = {}): Essay {
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
    inputMode: 'digitada',
    ...overrides,
  } as Essay;
}

// ─── getScoreLabel ─────────────────────────────────────────────────────────────

describe('getScoreLabel', () => {
  it('classifica 1000 como Excelente', () => expect(getScoreLabel(1000)).toBe('Excelente'));
  it('classifica 900 como Excelente', () => expect(getScoreLabel(900)).toBe('Excelente'));
  it('classifica 899 como Muito Bom', () => expect(getScoreLabel(899)).toBe('Muito Bom'));
  it('classifica 750 como Muito Bom', () => expect(getScoreLabel(750)).toBe('Muito Bom'));
  it('classifica 749 como Bom', () => expect(getScoreLabel(749)).toBe('Bom'));
  it('classifica 600 como Bom', () => expect(getScoreLabel(600)).toBe('Bom'));
  it('classifica 599 como Regular', () => expect(getScoreLabel(599)).toBe('Regular'));
  it('classifica 450 como Regular', () => expect(getScoreLabel(450)).toBe('Regular'));
  it('classifica 449 como Insuficiente', () => expect(getScoreLabel(449)).toBe('Insuficiente'));
  it('classifica 300 como Insuficiente', () => expect(getScoreLabel(300)).toBe('Insuficiente'));
  it('classifica 299 como Muito Baixo', () => expect(getScoreLabel(299)).toBe('Muito Baixo'));
  it('classifica 0 como Muito Baixo', () => expect(getScoreLabel(0)).toBe('Muito Baixo'));
});

// ─── getScoreTier ──────────────────────────────────────────────────────────────

describe('getScoreTier', () => {
  it('750+ → excellent', () => expect(getScoreTier(750)).toBe('excellent'));
  it('600-749 → good', () => expect(getScoreTier(600)).toBe('good'));
  it('450-599 → regular', () => expect(getScoreTier(450)).toBe('regular'));
  it('300-449 → weak', () => expect(getScoreTier(300)).toBe('weak'));
  it('< 300 → poor', () => expect(getScoreTier(200)).toBe('poor'));
});

// ─── getScoreColor ─────────────────────────────────────────────────────────────

describe('getScoreColor', () => {
  it('900+ → success', () => expect(getScoreColor(900, COLORS)).toBe(COLORS.success));
  it('550-899 → accent', () => expect(getScoreColor(700, COLORS)).toBe(COLORS.accent));
  it('380-549 → warning', () => expect(getScoreColor(400, COLORS)).toBe(COLORS.warning));
  it('< 380 → danger', () => expect(getScoreColor(200, COLORS)).toBe(COLORS.danger));
  it('borda exata 550 → accent', () => expect(getScoreColor(550, COLORS)).toBe(COLORS.accent));
  it('borda exata 380 → warning', () => expect(getScoreColor(380, COLORS)).toBe(COLORS.warning));
});

// ─── getTrend ─────────────────────────────────────────────────────────────────

describe('getTrend', () => {
  it('retorna stable para array vazio', () => expect(getTrend([])).toBe('stable'));
  it('retorna stable para 1 elemento', () => expect(getTrend([600])).toBe('stable'));
  it('retorna up para ganho >= 40', () => expect(getTrend([500, 540])).toBe('up'));
  it('retorna up para ganho exato de 40', () => expect(getTrend([500, 540])).toBe('up'));
  it('retorna down para queda <= -40', () => expect(getTrend([600, 560])).toBe('down'));
  it('retorna stable para diferença < 40', () => expect(getTrend([600, 630])).toBe('stable'));
  it('considera apenas os 2 últimos valores', () => expect(getTrend([200, 200, 700])).toBe('up'));
  it('borda exata -40 → down', () => expect(getTrend([640, 600])).toBe('down'));
  it('diferença 39 → stable', () => expect(getTrend([500, 539])).toBe('stable'));
});

// ─── getTrendIcon ─────────────────────────────────────────────────────────────

describe('getTrendIcon', () => {
  it('up → trending-up', () => expect(getTrendIcon('up')).toBe('trending-up'));
  it('down → trending-down', () => expect(getTrendIcon('down')).toBe('trending-down'));
  it('stable → remove-outline', () => expect(getTrendIcon('stable')).toBe('remove-outline'));
});

// ─── getTrendColor ────────────────────────────────────────────────────────────

describe('getTrendColor', () => {
  it('up → success', () => expect(getTrendColor('up', COLORS)).toBe(COLORS.success));
  it('down → danger', () => expect(getTrendColor('down', COLORS)).toBe(COLORS.danger));
  it('stable → mutedText', () => expect(getTrendColor('stable', COLORS)).toBe(COLORS.mutedText));
});

// ─── isCorrectedEssay ─────────────────────────────────────────────────────────

describe('isCorrectedEssay', () => {
  it('aceita corrigida', () => expect(isCorrectedEssay(makeEssay({ status: 'corrigida' }))).toBe(true));
  it('aceita baixa_confiabilidade', () => expect(isCorrectedEssay(makeEssay({ status: 'baixa_confiabilidade' }))).toBe(true));
  it('aceita precisa_revisao', () => expect(isCorrectedEssay(makeEssay({ status: 'precisa_revisao' }))).toBe(true));
  it('rejeita pendente', () => expect(isCorrectedEssay(makeEssay({ status: 'pendente' }))).toBe(false));
  it('rejeita processando', () => expect(isCorrectedEssay(makeEssay({ status: 'processando' }))).toBe(false));
});

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  it('retorna -- para undefined', () => expect(formatRelativeDate(undefined)).toBe('--'));
  it('retorna hoje para data atual', () => {
    expect(formatRelativeDate(new Date().toISOString())).toBe('hoje');
  });
  it('retorna ontem para 1 dia atrás', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(formatRelativeDate(d.toISOString())).toBe('ontem');
  });
  it('retorna "há N dias" para 3 dias atrás', () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    expect(formatRelativeDate(d.toISOString())).toBe('há 3 dias');
  });
  it('retorna "há N semana(s)" para 10 dias atrás', () => {
    const d = new Date();
    d.setDate(d.getDate() - 10);
    expect(formatRelativeDate(d.toISOString())).toBe('há 1 semana(s)');
  });
});

// ─── getStudentStats ──────────────────────────────────────────────────────────

describe('getStudentStats', () => {
  it('retorna nulls para aluno sem redações', () => {
    const stats = getStudentStats('s1', []);
    expect(stats.averageScore).toBeNull();
    expect(stats.highestScore).toBeNull();
    expect(stats.totalEssays).toBe(0);
    expect(stats.trend).toBe('stable');
  });

  it('calcula média corretamente', () => {
    const essays = [
      makeEssay({ totalScore: 600 }),
      makeEssay({ totalScore: 800 }),
    ];
    const stats = getStudentStats('s1', essays);
    expect(stats.averageScore).toBe(700);
    expect(stats.highestScore).toBe(800);
    expect(stats.lowestScore).toBe(600);
  });

  it('detecta tendência de alta', () => {
    const base = new Date('2025-01-01').toISOString();
    const later = new Date('2025-02-01').toISOString();
    const essays = [
      makeEssay({ totalScore: 500, correctedAt: base }),
      makeEssay({ totalScore: 600, correctedAt: later }),
    ];
    const stats = getStudentStats('s1', essays);
    expect(stats.trend).toBe('up');
  });

  it('ignora redações não corrigidas no cálculo de média', () => {
    const essays = [
      makeEssay({ status: 'pendente', totalScore: 200 }),
      makeEssay({ status: 'corrigida', totalScore: 700 }),
    ];
    const stats = getStudentStats('s1', essays);
    expect(stats.averageScore).toBe(700);
    expect(stats.correctedEssays).toBe(1);
    expect(stats.pendingEssays).toBe(1);
  });
});
