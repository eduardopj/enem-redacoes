import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { validateBody } from '../middleware/validate.js';
import { correctEssayWithOpenAI } from '../services/openai.service.js';
import { enqueueCorrection } from '../utils/correction-queue.js';
import { validateAndOptimizeImage } from '../utils/image.js';
import { writeLog } from '../utils/logger.js';
import { CorrectEssaySchema } from '../validators/openai.validators.js';

type AuthenticatedRequest = Request & { teacherId: string; requestId: string };

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

interface CorrectionPayloadRaw {
  themeTitle?: string;
  imageBase64?: string;
  mimeType?: string;
  essayText?: string;
}

interface CorrectionPayloadData {
  themeTitle: string;
  imageBase64?: string;
  mimeType?: string;
  essayText?: string;
}

/**
 * Pure validation helper — exported for unit testing.
 * Returns { data } on success or { error: [code, message] } on failure.
 */
export function validateCorrectionPayload(raw: CorrectionPayloadRaw):
  | { data: CorrectionPayloadData; error?: never }
  | { error: [string, string]; data?: never } {
  if (!raw?.themeTitle?.trim()) {
    return { error: ['MISSING_THEME', 'Informe o tema da redação.'] };
  }
  const hasImage = Boolean(raw.imageBase64);
  const hasText = Boolean(raw.essayText?.trim());
  if (!hasImage && !hasText) {
    return { error: ['MISSING_CONTENT', 'Envie a foto da redação ou digite o texto.'] };
  }
  if (hasImage && raw.mimeType && !SUPPORTED_MIME_TYPES.has(raw.mimeType)) {
    return { error: ['UNSUPPORTED_MIME_TYPE', `Tipo de imagem não suportado: ${raw.mimeType}`] };
  }
  return { data: { themeTitle: raw.themeTitle.trim(), imageBase64: raw.imageBase64, mimeType: raw.mimeType, essayText: raw.essayText } };
}

const router: RouterType = Router();

function sendError(res: Response, status: number, code: string, message: string): Response {
  return res.status(status).json({
    success: false,
    requestId: (res.req as Request & { requestId?: string })?.requestId,
    error: { code, message },
  });
}

router.post('/correct-essay', validateBody(CorrectEssaySchema), async (req: Request, res: Response) => {
  let { themeTitle, imageBase64, mimeType, essayText } = req.body as {
    themeTitle: string;
    imageBase64?: string;
    mimeType?: string;
    essayText?: string;
  };

  const authReq = req as AuthenticatedRequest;

  // ── P1: Validate magic bytes + convert to WebP before sending to OpenAI ──
  if (imageBase64) {
    try {
      const optimized = await validateAndOptimizeImage(imageBase64);
      imageBase64 = optimized.base64;
      mimeType = optimized.mimeType;
      writeLog('info', 'image_optimized', {
        requestId: authReq.requestId,
        originalMime: optimized.originalMime,
        savedBytes: optimized.savedBytes,
      });
    } catch (imgErr) {
      const imgError = imgErr as Error & { code?: string };
      if (imgError.code === 'INVALID_IMAGE') {
        return sendError(res, 422, 'INVALID_IMAGE', imgError.message);
      }
      return sendError(res, 500, 'IMAGE_PROCESSING_ERROR', 'Erro ao processar a imagem. Tente novamente.');
    }
  }

  writeLog('info', 'correction_request_received', {
    requestId: authReq.requestId,
    teacherId: authReq.teacherId,
    hasImage: Boolean(imageBase64),
    hasText: Boolean(essayText),
    mimeType,
    themeTitle,
  });

  try {
    const result = await enqueueCorrection(authReq.requestId, () =>
      correctEssayWithOpenAI({ themeTitle, imageBase64, mimeType, essayText })
    );

    writeLog('info', 'correction_succeeded', {
      requestId: authReq.requestId,
      teacherId: authReq.teacherId,
      totalScore: (result as { totalScore?: number })?.totalScore,
    });

    return res.json({
      success: true,
      requestId: authReq.requestId,
      data: result,
    });
  } catch (error) {
    const err = error as Error & { httpStatus?: number; status?: number; code?: string; name?: string };
    const httpStatus = err.httpStatus ?? (err.message?.toLowerCase?.().includes('timeout') ? 504 : 500);

    writeLog('error', 'correction_failed', {
      requestId: authReq.requestId,
      teacherId: authReq.teacherId,
      error: err?.message ?? String(error),
      providerStatus: err?.status,
      httpStatus,
    });

    if (err.code === 'QUEUE_FULL') {
      return sendError(res, 503, 'QUEUE_FULL', err.message);
    }

    const isTimeout = httpStatus === 504;
    const isOpenAI = err?.name === 'OpenAIError' || err?.status;

    return sendError(
      res,
      httpStatus,
      isTimeout ? 'AI_TIMEOUT' : isOpenAI ? 'AI_PROVIDER_ERROR' : 'CORRECTION_FAILED',
      isTimeout
        ? 'A correção demorou mais que o esperado. Tente novamente em instantes.'
        : 'Não foi possível concluir a correção agora. Tente novamente.'
    );
  }
});

export { router as openAiRoutes };
