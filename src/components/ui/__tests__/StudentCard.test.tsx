import React from 'react';
import { act, create } from 'react-test-renderer';
import { StudentCard } from '../StudentCard';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const MOCK_COLORS = {
  text: '#1C1C1C', softText: '#4B4B4B', mutedText: '#777777',
  border: '#E5E5E5', borderStrong: '#CECECE', input: '#F7F7F7',
  surface: '#FFFFFF', accent: '#7C3AED', accentSoft: '#F3E8FF',
  success: '#58CC02', successSoft: '#F0FFF0',
  warning: '#FF9600', warningSoft: '#FFF3E0',
  danger: '#FF4B4B', dangerSoft: '#FFF0F0',
  info: '#1CB0F6', infoSoft: '#E8F7FF', black: '#1C1C1C',
};

jest.mock('@/theme/ThemeContext', () => ({
  useAppTheme: () => ({ colors: MOCK_COLORS, isDark: false }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function getAllText(node: any): string[] {
  if (!node) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(getAllText);
  return node.children ? getAllText(node.children) : [];
}

async function render(element: React.ReactElement) {
  let tree: ReturnType<typeof create>;
  await act(async () => { tree = create(element); });
  const json = tree!.toJSON();
  const texts = getAllText(json);
  return { tree: tree!, json, texts };
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('StudentCard', () => {
  it('renderiza nome e turma', async () => {
    const { texts } = await render(
      <StudentCard name="Ana Silva" className="3B" />
    );
    expect(texts).toContain('Ana Silva');
    expect(texts).toContain('3B');
  });

  it('gera iniciais das 2 primeiras palavras do nome', async () => {
    const { texts } = await render(
      <StudentCard name="João Pedro Santos" className="2A" />
    );
    expect(texts).toContain('JP');
  });

  it('gera inicial corretamente para nome único', async () => {
    const { texts } = await render(
      <StudentCard name="Carlos" className="1A" />
    );
    expect(texts).toContain('C');
  });

  it('exibe nota quando avgScore fornecido', async () => {
    const { texts } = await render(
      <StudentCard name="Maria" className="3A" avgScore={750} essayCount={3} />
    );
    expect(texts).toContain('750');
    expect(texts).toContain('pts');
  });

  it('exibe "sem notas" quando essayCount=0 e sem score', async () => {
    const { texts } = await render(
      <StudentCard name="Pedro" className="2B" essayCount={0} />
    );
    expect(texts).toContain('sem notas');
  });

  it('exibe contagem de redações no pill', async () => {
    const { texts } = await render(
      <StudentCard name="Lucas" className="1C" essayCount={5} />
    );
    expect(texts.join(' ')).toContain('5');
    expect(texts.join(' ')).toContain('redações');
  });

  it('usa "redação" (singular) para 1 redação', async () => {
    const { texts } = await render(
      <StudentCard name="Bia" className="3A" essayCount={1} />
    );
    expect(texts.join('')).toMatch(/1\s*redação/);
  });

  it('renderiza botão Editar quando onEdit fornecido', async () => {
    const { texts } = await render(
      <StudentCard name="Ana" className="3A" onEdit={jest.fn()} />
    );
    expect(texts).toContain('Editar');
  });

  it('renderiza botão Excluir quando onDelete fornecido', async () => {
    const { texts } = await render(
      <StudentCard name="Ana" className="3A" onDelete={jest.fn()} />
    );
    expect(texts).toContain('Excluir');
  });

  it('não renderiza ações quando sem callbacks', async () => {
    const { texts } = await render(
      <StudentCard name="Ana" className="3A" />
    );
    expect(texts).not.toContain('Editar');
    expect(texts).not.toContain('Excluir');
  });

  it('score >= 700 usa cor de sucesso no avatar', async () => {
    const { json } = await render(
      <StudentCard name="Ana" className="3A" avgScore={700} />
    );
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.success);
  });

  it('score 500-699 usa cor de aviso no avatar', async () => {
    const { json } = await render(
      <StudentCard name="Ana" className="3A" avgScore={550} />
    );
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.warning);
  });

  it('score < 500 usa cor de perigo no avatar', async () => {
    const { json } = await render(
      <StudentCard name="Ana" className="3A" avgScore={350} />
    );
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.danger);
  });
});
