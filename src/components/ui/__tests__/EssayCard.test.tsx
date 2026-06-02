import React from 'react';
import { act, create } from 'react-test-renderer';
import { EssayCard } from '../EssayCard';

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

describe('EssayCard', () => {
  it('renderiza título do tema e nome do aluno', async () => {
    const { texts } = await render(
      <EssayCard
        studentName="Ana Lima"
        themeTitle="Tecnologia e Privacidade"
        status="corrigida"
        totalScore={720}
      />
    );
    expect(texts).toContain('Tecnologia e Privacidade');
    expect(texts.join(' ')).toContain('Ana Lima');
  });

  it('gera iniciais a partir do nome do aluno', async () => {
    const { texts } = await render(
      <EssayCard studentName="Carlos Eduardo" themeTitle="Tema" status="pendente" />
    );
    expect(texts).toContain('CE');
  });

  it('exibe nota quando status=corrigida e totalScore fornecido', async () => {
    const { texts } = await render(
      <EssayCard studentName="Maria" themeTitle="Saúde Mental" status="corrigida" totalScore={840} />
    );
    expect(texts).toContain('840');
  });

  it('exibe "Erro" quando hasError=true', async () => {
    const { texts } = await render(
      <EssayCard studentName="João" themeTitle="Meio Ambiente" status="pendente" hasError />
    );
    expect(texts).toContain('Erro');
  });

  it('não exibe "Erro" sem hasError', async () => {
    const { texts } = await render(
      <EssayCard studentName="Pedro" themeTitle="Violência" status="pendente" />
    );
    expect(texts).not.toContain('Erro');
  });

  it('renderiza botão Excluir quando onDelete fornecido', async () => {
    const { texts } = await render(
      <EssayCard
        studentName="Bia" themeTitle="Tema" status="corrigida"
        totalScore={600} onDelete={jest.fn()}
      />
    );
    expect(texts).toContain('Excluir');
  });

  it('não renderiza botão Excluir sem onDelete', async () => {
    const { texts } = await render(
      <EssayCard studentName="Bia" themeTitle="Tema" status="corrigida" totalScore={600} />
    );
    expect(texts).not.toContain('Excluir');
  });

  it('usa cor de perigo na pill de erro', async () => {
    const { json } = await render(
      <EssayCard studentName="João" themeTitle="Tema" status="pendente" hasError />
    );
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.danger);
  });

  it('exibe data relativa quando correctedAt fornecido', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { texts } = await render(
      <EssayCard
        studentName="Maria" themeTitle="Tema" status="corrigida"
        totalScore={700} correctedAt={yesterday.toISOString()}
      />
    );
    expect(texts.join(' ')).toContain('ontem');
  });

  it('StatusBadge mostra "Em análise" para status processando', async () => {
    const { texts } = await render(
      <EssayCard studentName="Lucas" themeTitle="Tema" status="processando" />
    );
    expect(texts).toContain('Em análise');
  });

  it('StatusBadge mostra "Pendente" para status pendente', async () => {
    const { texts } = await render(
      <EssayCard studentName="Ana" themeTitle="Tema" status="pendente" />
    );
    expect(texts).toContain('Pendente');
  });
});
