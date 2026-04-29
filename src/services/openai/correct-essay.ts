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

  let requestBody: Record<string, unknown>;

  if (input.essayText) {
    requestBody = { themeTitle: input.themeTitle, essayText: input.essayText };
  } else if (input.imageUri) {
    const imageBase64 = await FileSystem.readAsStringAsync(input.imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    requestBody = {
      themeTitle: input.themeTitle,
      imageBase64,
      mimeType: getMimeTypeFromUri(input.imageUri),
    };
  } else {
    throw new Error('Forneça uma imagem (imageUri) ou texto (essayText).');
  }

  try {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('A correção demorou mais que o esperado (120s). Verifique sua conexão e tente novamente.');
      }
      throw new Error('Não foi possível conectar ao servidor de correção. Verifique sua conexão com a internet e tente novamente.');
    }

    if (!response.ok) {
      let serverMessage = `Erro ${response.status} no servidor de correção.`;
      try {
        const errBody = await response.json();
        if (errBody?.error) serverMessage = errBody.error;
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(serverMessage);
    }

    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
