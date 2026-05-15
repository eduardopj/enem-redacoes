import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { correctEssayWithOpenAI } from '../services/openai.service.js';
import { enqueueCorrection } from '../utils/correction-queue.js';
import { validateAndOptimizeImage } from '../utils/image.js';
import { writeLog } from '../utils/logger.js';
import { CorrectEssaySchema } from '../validators/openai.validators.js';

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/**
 * Pure validation helper — exported for unit testing.
 * Returns { data } on success or { error: [code, message] } on failure.
 */
export function validateCorrectionPayload(raw) {
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

const router = Router();

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    requestId: res.req?.requestId,
    error: { code, message },
  });
}

router.post('/correct-essay', validateBody(CorrectEssaySchema), async (req, res) => {
  let { themeTitle, imageBase64, mimeType, essayText } = req.body;

  // ── P1: Validate magic bytes + convert to WebP before sending to OpenAI ──
  if (imageBase64) {
    try {
      const optimized = await validateAndOptimizeImage(imageBase64);
      imageBase64 = optimized.base64;
      mimeType = optimized.mimeType;
      writeLog('info', 'image_optimized', {
        requestId: req.requestId,
        originalMime: optimized.originalMime,
        savedBytes: optimized.savedBytes,
      });
    } catch (imgErr) {
      if (imgErr.code === 'INVALID_IMAGE') {
        return sendError(res, 422, 'INVALID_IMAGE', imgErr.message);
      }
      return sendError(res, 500, 'IMAGE_PROCESSING_ERROR', 'Erro ao processar a imagem. Tente novamente.');
    }
  }

  writeLog('info', 'correction_request_received', {
    requestId: req.requestId,
    teacherId: req.teacherId,
    hasImage: Boolean(imageBase64),
    hasText: Boolean(essayText),
    mimeType,
    themeTitle,
  });

  try {
    const result = await enqueueCorrection(req.requestId, () =>
      correctEssayWithOpenAI({ themeTitle, imageBase64, mimeType, essayText })
    );

    writeLog('info', 'correction_succeeded', {
      requestId: req.requestId,
      teacherId: req.teacherId,
      totalScore: result?.totalScore,
    });

    return res.json({
      success: true,
      requestId: req.requestId,
      data: result,
    });
  } catch (error) {
    const httpStatus = error.httpStatus ?? (error.message?.toLowerCase?.().includes('timeout') ? 504 : 500);

    writeLog('error', 'correction_failed', {
      requestId: req.requestId,
      teacherId: req.teacherId,
      error: error?.message ?? String(error),
      providerStatus: error?.status,
      httpStatus,
    });

    if (error.code === 'QUEUE_FULL') {
      return sendError(res, 503, 'QUEUE_FULL', error.message);
    }

    const isTimeout = httpStatus === 504;
    const isOpenAI = error?.name === 'OpenAIError' || error?.status;

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
