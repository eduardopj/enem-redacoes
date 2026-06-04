/**
 * Testes unitários de analytics.ts — importa as funções reais do módulo.
 * Execute com: npx jest analytics.test
 */

import {
  formatRelativeDate,
  getClassStats,
  getLowConfidenceCorrections,
  getScoreColor,
  getScoreLabel,
  getScoreTier,
  getStudentStats,
  getThemePerformance,
  getTopImprovingStudents,
  getStudentsNeedingAttention,
  getTrend,
  getTrendColor,
  getTrendIcon,
  isCorrectedEssay,
} from '@/utils/analytics';
import type { Essay, Student } from '@/types/app';

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

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    id: `s-${Math.random()}`,
    teacherId: 't1',
    name: 'Aluno Teste',
    className: '3A',
    ...overrides,
  };
}

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

// ─── getClassStats ────────────────────────────────────────────────────────────

describe('getClassStats', () => {
  it('retorna nulls com lista vazia', () => {
    const stats = getClassStats([], []);
    expect(stats.classAverage).toBeNull();
    expect(stats.classHighest).toBeNull();
    expect(stats.classLowest).toBeNull();
    expect(stats.totalEssays).toBe(0);
    expect(stats.totalStudents).toBe(0);
  });

  it('calcula média da turma corretamente', () => {
    const essays = [
      makeEssay({ studentId: 's1', totalScore: 600 }),
      makeEssay({ studentId: 's2', totalScore: 800 }),
    ];
    const stats = getClassStats(essays, [makeStudent({ id: 's1' }), makeStudent({ id: 's2' })]);
    expect(stats.classAverage).toBe(700);
    expect(stats.classHighest).toBe(800);
    expect(stats.classLowest).toBe(600);
    expect(stats.correctedEssays).toBe(2);
    expect(stats.totalStudents).toBe(2);
  });

  it('distribui redações nas bandas de pontuação', () => {
    const essays = [
      makeEssay({ totalScore: 200 }),  // 0–299
      makeEssay({ totalScore: 650 }),  // 600–749
      makeEssay({ totalScore: 950 }),  // 900–1000
    ];
    const stats = getClassStats(essays, []);
    const band0 = stats.distributionBands.find((b) => b.label === '0–299')!;
    const band600 = stats.distributionBands.find((b) => b.label === '600–749')!;
    const band900 = stats.distributionBands.find((b) => b.label === '900–1000')!;
    expect(band0.count).toBe(1);
    expect(band600.count).toBe(1);
    expect(band900.count).toBe(1);
  });

  it('identifica competência mais fraca da turma', () => {
    const essays = [
      makeEssay({ competencies: { c1: 200, c2: 160, c3: 180, c4: 180, c5: 180 } }),
    ];
    const stats = getClassStats(essays, []);
    expect(stats.weakestClassCompetency).toBe('c2');
    expect(stats.strongestClassCompetency).toBe('c1');
  });

  it('lista top alunos por média', () => {
    const s1 = makeStudent({ id: 's1' });
    const s2 = makeStudent({ id: 's2' });
    const essays = [
      makeEssay({ studentId: 's1', totalScore: 800 }),
      makeEssay({ studentId: 's2', totalScore: 600 }),
    ];
    const stats = getClassStats(essays, [s1, s2]);
    expect(stats.topStudents[0].studentId).toBe('s1');
    expect(stats.topStudents[0].averageScore).toBe(800);
  });
});

// ─── getLowConfidenceCorrections ──────────────────────────────────────────────

describe('getLowConfidenceCorrections', () => {
  it('retorna vazio sem redações de baixa confiança', () => {
    expect(getLowConfidenceCorrections([makeEssay()])).toHaveLength(0);
  });

  it('captura status baixa_confiabilidade', () => {
    const essay = makeEssay({ status: 'baixa_confiabilidade' });
    expect(getLowConfidenceCorrections([essay])).toContain(essay);
  });

  it('captura reviewRequired = true', () => {
    const essay = makeEssay({ reviewRequired: true });
    expect(getLowConfidenceCorrections([essay])).toContain(essay);
  });

  it('captura confidenceLevel baixa', () => {
    const essay = makeEssay({ confidenceLevel: 'baixa' } as any);
    expect(getLowConfidenceCorrections([essay])).toContain(essay);
  });

  it('captura transcriptionConfidence baixa', () => {
    const essay = makeEssay({ transcriptionConfidence: 'baixa' } as any);
    expect(getLowConfidenceCorrections([essay])).toContain(essay);
  });

  it('não captura redação normal corrigida', () => {
    const essay = makeEssay({ status: 'corrigida', reviewRequired: false });
    expect(getLowConfidenceCorrections([essay])).toHaveLength(0);
  });
});

// ─── getTopImprovingStudents ──────────────────────────────────────────────────

describe('getTopImprovingStudents', () => {
  it('retorna vazio quando nenhum aluno melhorou', () => {
    const student = makeStudent({ id: 's1' });
    const essays = [makeEssay({ studentId: 's1', totalScore: 700 })];
    expect(getTopImprovingStudents([student], essays)).toHaveLength(0);
  });

  it('ordena por delta decrescente', () => {
    const s1 = makeStudent({ id: 's1' });
    const s2 = makeStudent({ id: 's2' });
    const base = '2025-01-01T00:00:00.000Z';
    const later = '2025-02-01T00:00:00.000Z';
    const essays = [
      makeEssay({ studentId: 's1', totalScore: 500, correctedAt: base }),
      makeEssay({ studentId: 's1', totalScore: 700, correctedAt: later }), // delta +200
      makeEssay({ studentId: 's2', totalScore: 400, correctedAt: base }),
      makeEssay({ studentId: 's2', totalScore: 500, correctedAt: later }), // delta +100
    ];
    const result = getTopImprovingStudents([s1, s2], essays, 3);
    expect(result[0].student.id).toBe('s1');
    expect(result[1].student.id).toBe('s2');
  });

  it('respeita o limite', () => {
    const students = [makeStudent({ id: 's1' }), makeStudent({ id: 's2' }), makeStudent({ id: 's3' })];
    const base = '2025-01-01T00:00:00.000Z';
    const later = '2025-06-01T00:00:00.000Z';
    const essays = students.flatMap((s) => [
      makeEssay({ studentId: s.id, totalScore: 400, correctedAt: base }),
      makeEssay({ studentId: s.id, totalScore: 600, correctedAt: later }),
    ]);
    expect(getTopImprovingStudents(students, essays, 2)).toHaveLength(2);
  });
});

// ─── getStudentsNeedingAttention ──────────────────────────────────────────────

describe('getStudentsNeedingAttention', () => {
  it('inclui aluno sem redações', () => {
    const student = makeStudent({ id: 's1' });
    const result = getStudentsNeedingAttention([student], []);
    expect(result.some((r) => r.student.id === 's1')).toBe(true);
  });

  it('inclui aluno com média < 500', () => {
    const student = makeStudent({ id: 's1' });
    const essays = [makeEssay({ studentId: 's1', totalScore: 400 })];
    const result = getStudentsNeedingAttention([student], essays);
    expect(result.some((r) => r.student.id === 's1')).toBe(true);
  });

  it('inclui aluno com tendência de queda', () => {
    const student = makeStudent({ id: 's1' });
    const base = '2025-01-01T00:00:00.000Z';
    const later = '2025-06-01T00:00:00.000Z';
    const essays = [
      makeEssay({ studentId: 's1', totalScore: 700, correctedAt: base }),
      makeEssay({ studentId: 's1', totalScore: 600, correctedAt: later }),
    ];
    const result = getStudentsNeedingAttention([student], essays);
    expect(result.some((r) => r.student.id === 's1')).toBe(true);
  });

  it('não inclui aluno com boa performance', () => {
    const student = makeStudent({ id: 's1' });
    const base = '2025-01-01T00:00:00.000Z';
    const later = '2025-06-01T00:00:00.000Z';
    const essays = [
      makeEssay({ studentId: 's1', totalScore: 600, correctedAt: base }),
      makeEssay({ studentId: 's1', totalScore: 700, correctedAt: later }),
    ];
    const result = getStudentsNeedingAttention([student], essays);
    expect(result.some((r) => r.student.id === 's1')).toBe(false);
  });
});

// ─── getThemePerformance ──────────────────────────────────────────────────────

describe('getThemePerformance', () => {
  it('retorna vazio sem redações', () => {
    expect(getThemePerformance([])).toHaveLength(0);
  });

  it('agrupa redações pelo tema', () => {
    const essays = [
      makeEssay({ themeTitle: 'Tema A', totalScore: 600 }),
      makeEssay({ themeTitle: 'Tema A', totalScore: 800 }),
      makeEssay({ themeTitle: 'Tema B', totalScore: 700 }),
    ];
    const result = getThemePerformance(essays);
    const temaA = result.find((r) => r.themeTitle === 'Tema A')!;
    const temaB = result.find((r) => r.themeTitle === 'Tema B')!;
    expect(temaA.count).toBe(2);
    expect(temaA.averageScore).toBe(700);
    expect(temaB.count).toBe(1);
  });

  it('ordena por count decrescente', () => {
    const essays = [
      makeEssay({ themeTitle: 'Pouco Usado' }),
      makeEssay({ themeTitle: 'Mais Usado' }),
      makeEssay({ themeTitle: 'Mais Usado' }),
    ];
    const result = getThemePerformance(essays);
    expect(result[0].themeTitle).toBe('Mais Usado');
  });

  it('conta redações de baixa confiança por tema', () => {
    const essays = [
      makeEssay({ themeTitle: 'Tema X', status: 'baixa_confiabilidade' }),
      makeEssay({ themeTitle: 'Tema X', totalScore: 700 }),
    ];
    const result = getThemePerformance(essays);
    expect(result[0].lowConfidence).toBe(1);
  });

  it('trata themeTitle null como Tema Livre', () => {
    const essays = [makeEssay({ themeTitle: undefined as any })];
    const result = getThemePerformance(essays);
    expect(result[0].themeTitle).toBe('Tema Livre');
  });
});
