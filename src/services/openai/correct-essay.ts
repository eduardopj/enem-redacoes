import { OPENAI_CONFIG } from '@/constants/openai';
import { OpenAICorrectionResult, OpenAIServiceInput } from '@/types/openai';
import * as FileSystem from 'expo-file-system/legacy';

function getMimeTypeFromUri(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function correctEssayWithOpenAI(
  input: OpenAIServiceInput
): Promise<OpenAICorrectionResult> {
  if (!OPENAI_CONFIG.backendUrl) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL não configurada no .env do app.');
  }

  const endpoint = `${OPENAI_CONFIG.backendUrl}/openai/correct-essay`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120_000);

  let body: Record<string, unknown>;

  if (input.essayText) {
    body = { themeTitle: input.themeTitle, essayText: input.essayText };
  } else if (input.imageUri) {
    const imageBase64 = await FileSystem.readAsStringAsync(input.imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    body = {
      themeTitle: input.themeTitle,
      imageBase64,
      mimeType: getMimeTypeFromUri(input.imageUri),
    };
  } else {
    throw new Error('Forneça uma imagem (imageUri) ou texto (essayText).');
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro backend: ${response.status} - ${errorBody}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('A correção demorou mais que o esperado (120s). Verifique sua conexão e tente novamente.');
    }

    const message = error instanceof Error ? error.message : 'Falha desconhecida ao conectar com o backend.';

    if (
      message.includes('Network request failed') ||
      message.includes('fetch') ||
      message.includes('network')
    ) {
      throw new Error('Não foi possível conectar ao servidor de correção. Verifique sua conexão com a internet e tente novamente.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
