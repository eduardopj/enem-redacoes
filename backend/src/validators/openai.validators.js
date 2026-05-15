import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BASE64_CHARS = Number(process.env.MAX_IMAGE_BASE64_CHARS ?? 24_000_000);
const MAX_ESSAY_TEXT_CHARS = 20_000;

/**
 * Schema para POST /openai/correct-essay
 * Modo imagem: themeTitle + imageBase64 + mimeType
 * Modo texto:  themeTitle + essayText
 */
export const CorrectEssaySchema = z
  .object({
    themeTitle: z
      .string({ required_error: 'Informe o tema da redação.' })
      .trim()
      .min(1, 'Informe o tema da redação.')
      .max(300, 'O tema não pode ter mais de 300 caracteres.'),

    essayText: z
      .string()
      .trim()
      .max(MAX_ESSAY_TEXT_CHARS, `O texto da redação não pode ter mais de ${MAX_ESSAY_TEXT_CHARS} caracteres.`)
      .optional(),

    imageBase64: z
      .string()
      .max(MAX_BASE64_CHARS, 'A imagem é muito grande. Tire uma nova foto ou reduza o arquivo.')
      .optional(),

    mimeType: z
      .enum(ALLOWED_MIME_TYPES, {
        errorMap: () => ({ message: 'Use uma imagem JPG, PNG ou WEBP.' }),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Deve ter imagem OU texto — nunca os dois, nunca nenhum
    const hasImage = Boolean(data.imageBase64);
    const hasText = Boolean(data.essayText);

    if (!hasImage && !hasText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imageBase64'],
        message: 'Envie uma imagem da redação ou o texto digitado.',
      });
    }

    // Se enviou imagem, mimeType é obrigatório
    if (hasImage && !data.mimeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mimeType'],
        message: 'Informe o tipo da imagem enviada (mimeType).',
      });
    }
  });
