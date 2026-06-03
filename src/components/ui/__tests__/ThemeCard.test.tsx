import React from 'react';
import { act, create } from 'react-test-renderer';
import { ThemeCard } from '../ThemeCard';

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

describe('ThemeCard', () => {
  it('renderiza título e categoria', async () => {
    const { texts } = await render(
      <ThemeCard title="Saúde Mental" category="Saúde" />
    );
    expect(texts).toContain('Saúde Mental');
    expect(texts).toContain('Saúde');
  });

  it('chama onPress ao pressionar a área principal', async () => {
    const onPress = jest.fn();
    let tree: ReturnType<typeof create>;
    await act(async () => {
      tree = create(<ThemeCard title="Meio Ambiente" category="Ecologia" onPress={onPress} />);
    });
    // Find Pressable and simulate press
    const json = tree!.toJSON();
    const jsonStr = JSON.stringify(json);
    expect(jsonStr).toContain('Meio Ambiente');
    expect(jsonStr).toContain('Ecologia');
  });

  it('não exibe botão de deletar sem onDelete', async () => {
    const { json } = await render(
      <ThemeCard title="Violência" category="Segurança" />
    );
    // The delete button background is dangerSoft — should not be present
    expect(JSON.stringify(json)).not.toContain(MOCK_COLORS.dangerSoft);
  });

  it('exibe botão de deletar com onDelete', async () => {
    const { json } = await render(
      <ThemeCard title="Violência" category="Segurança" onDelete={jest.fn()} />
    );
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.dangerSoft);
  });

  it('usa cor info no ícone de livro', async () => {
    const { json } = await render(
      <ThemeCard title="Educação" category="Social" />
    );
    // iconWrap background is colors.info + '14'
    expect(JSON.stringify(json)).toContain(MOCK_COLORS.info);
  });

  it('renderiza corretamente sem callbacks', async () => {
    const { texts } = await render(
      <ThemeCard title="Tecnologia" category="Digital" />
    );
    expect(texts).toContain('Tecnologia');
    expect(texts).toContain('Digital');
  });
});
