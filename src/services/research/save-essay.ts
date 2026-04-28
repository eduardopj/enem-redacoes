import { OPENAI_CONFIG } from '@/constants/openai';
import * as FileSystem from 'expo-file-system';

type SaveEssayPayload = {
  themeTitle: string;
  className: string;
  state?: string;
  correction: Record<string, unknown>;
  imageUri?: string;
};

export async function saveEssayForResearch(payload: SaveEssayPayload): Promise<void> {
  try {
    const url = `${OPENAI_CONFIG.backendUrl}/research/save-essay`;

    let imageBase64: string | undefined;
    let mimeType: string | undefined;

    if (payload.imageUri) {
      imageBase64 = await FileSystem.readAsStringAsync(payload.imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const lower = payload.imageUri.toLowerCase();
      mimeType = lower.includes('.png') ? 'image/png' : lower.includes('.webp') ? 'image/webp' : 'image/jpeg';
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        themeTitle: payload.themeTitle,
        className: payload.className,
        state: payload.state ?? null,
        correction: payload.correction,
        imageBase64: imageBase64 ?? null,
        mimeType: mimeType ?? null,
      }),
    });
  } catch {
    // Fire-and-forget: never block the main flow
  }
}
