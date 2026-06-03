import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Resize to at most 2048px on either side (preserving aspect ratio).
// OpenAI "high" detail mode tiles 512px patches — anything beyond 2048px
// adds cost without improving OCR accuracy on handwritten text.
const MAX_DIMENSION = 2048;

interface OptimizedImage {
  base64: string;
  mimeType: string;
  savedBytes: number;
  originalMime: string;
}

/**
 * Validates the actual file content via magic bytes and converts to WebP.
 *
 * @param base64  Raw base64 string (no data-URL prefix).
 * @returns {{ base64: string, mimeType: string, savedBytes: number }}
 * @throws  An error with `code: 'INVALID_IMAGE'` if the content is not a real image.
 */
export async function validateAndOptimizeImage(base64: string): Promise<OptimizedImage> {
  const inputBuf = Buffer.from(base64, 'base64');

  // ── Magic-bytes check ──────────────────────────────────────────────────────
  // Validates actual file content, not the client-supplied mimeType string.
  const detected = await fileTypeFromBuffer(inputBuf);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw Object.assign(
      new Error('O arquivo enviado não é uma imagem válida (JPEG, PNG ou WebP).'),
      { code: 'INVALID_IMAGE', httpStatus: 422 }
    );
  }

  // ── Resize + WebP conversion ───────────────────────────────────────────────
  // Converting to WebP typically saves 40–60 % compared to JPEG/PNG.
  // withoutEnlargement ensures small images are never upscaled.
  const outputBuf = await sharp(inputBuf)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  return {
    base64: outputBuf.toString('base64'),
    mimeType: 'image/webp',
    savedBytes: inputBuf.length - outputBuf.length,
    originalMime: detected.mime,
  };
}
