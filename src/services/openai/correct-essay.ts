import { OPENAI_CONFIG } from '@/constants/openai';
import { OpenAICorrectionResult, OpenAIServiceInput } from '@/types/openai';
import * as FileSystem from 'expo-file-system/legacy';

function getMimeTypeFromUri(uri: string) {
  const lower = uri.toLowerCase();

  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';

  return 'image/jpeg';
}

export async function correctEssayWithOpenAI(
  input: OpenAIServiceInput
): Promise<OpenAICorrectionResult> {
  if (!OPENAI_CONFIG.backendUrl) {
    throw new Error('EXPO_PUBLIC_BACKEND_URL não configurada no .env do app.');
  }

  const imageBase64 = await FileSystem.readAsStringAsync(input.imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mimeType = getMimeTypeFromUri(input.imageUri);
  const endpoint = `${OPENAI_CONFIG.backendUrl}/openai/correct-essay`;

  console.log('Enviando para endpoint:', endpoint);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        themeTitle: input.themeTitle,
        imageBase64,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro backend: ${response.status} - ${errorBody}`);
    }

    return response.json();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha desconhecida ao conectar com o backend.';

    if (
      message.includes('Network request failed') ||
      message.includes('fetch') ||
      message.includes('network')
    ) {
      throw new Error(
        `Não foi possível conectar ao backend em ${endpoint}. Verifique o .env, reinicie o Expo com -c e confirme se o app leu a URL correta.`
      );
    }

    throw error;
  }
}