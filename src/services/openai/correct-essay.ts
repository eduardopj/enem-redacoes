import { OPENAI_CONFIG } from '@/constants/openai';
import { apiRequest } from '@/services/api';
import { OpenAICorrectionResult, OpenAIServiceInput } from '@/types/openai';
import * as FileSystem from 'expo-file-system/legacy';

const MAX_LOCAL_IMAGE_BYTES = 10 * 1024 * 1024;

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
    throw new Error('Configure EXPO_PUBLIC_BACKEND_URL no .env do app.');
  }

  let requestBody: Record<string, unknown>;

  if (input.essayText) {
    requestBody = { themeTitle: input.themeTitle, essayText: input.essayText };
  } else if (input.imageUri) {
    const info = await FileSystem.getInfoAsync(input.imageUri, { size: true });
    if (info.exists && 'size' in info && typeof info.size === 'number' && info.size > MAX_LOCAL_IMAGE_BYTES) {
      throw new Error(
        'A foto está muito pesada para correção. Tire uma nova foto mais próxima da folha, com boa luz, ou escolha uma imagem menor.'
      );
    }

    const imageBase64 = await FileSystem.readAsStringAsync(input.imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    requestBody = {
      themeTitle: input.themeTitle,
      imageBase64,
      mimeType: input.imageMimeType || getMimeTypeFromUri(input.imageUri),
    };
  } else {
    throw new Error('Forneça uma imagem ou texto para correção.');
  }

  return apiRequest<OpenAICorrectionResult>('/openai/correct-essay', {
    method: 'POST',
    body: requestBody,
    timeoutMs: OPENAI_CONFIG.timeoutMs,
  });
}
