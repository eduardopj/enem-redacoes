import React from 'react';
import { act, create } from 'react-test-renderer';
import { StatusBadge } from '../StatusBadge';

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

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// PulsingDot uses Animated.loop which leaks timers — suppress with fake timers
beforeEach(() => jest.useFakeTimers());
afterEach(() => { jest.runOnlyPendingTimers(); jest.useRealTimers(); });

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
  return { json, texts: getAllText(json) };
}

describe('StatusBadge', () => {
  it('mostra "Pendente" para status pendente', async () => {
    const { texts } = await render(<StatusBadge status="pendente" />);
    expect(texts).toContain('Pendente');
  });

  it('mostra "Em análise" para status processando', async () => {
    const { texts } = await render(<StatusBadge status="processando" />);
    expect(texts).toContain('Em análise');
  });

  it('mostra "Corrigida" para status corrigida', async () => {
    const { texts } = await render(<StatusBadge status="corrigida" />);
    expect(texts).toContain('Corrigida');
  });

  it('mostra "Revisar" para status precisa_revisao', async () => {
    const { texts } = await render(<StatusBadge status="precisa_revisao" />);
    expect(texts).toContain('Revisar');
  });

  it('mostra "Baixa confiança" para status baixa_confiabilidade', async () => {
    const { texts } = await render(<StatusBadge status="baixa_confiabilidade" />);
    expect(texts).toContain('Baixa confiança');
  });

  it('usa cor de sucesso para corrigida', async () => {
    const { json } = await render(<StatusBadge status="corrigida" />);
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.success);
  });

  it('usa cor de aviso para pendente', async () => {
    const { json } = await render(<StatusBadge status="pendente" />);
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.warning);
  });

  it('usa cor de perigo para baixa_confiabilidade', async () => {
    const { json } = await render(<StatusBadge status="baixa_confiabilidade" />);
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.danger);
  });

  it('usa cor de info para processando', async () => {
    const { json } = await render(<StatusBadge status="processando" />);
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.info);
  });
});
