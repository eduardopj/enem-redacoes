import { Router } from 'express';
import { correctEssayWithOpenAI } from '../services/openai.service.js';

const router = Router();

const MAX_BASE64_CHARS = Number(process.env.MAX_IMAGE_BASE64_CHARS ?? 24_000_000);
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function sendError(res, status, code, message) {
  return res.status(status).json({
    success: false,
    requestId: res.req?.requestId,
    error: { code, message },
  });
}

function log(level, message, meta = {}) {
  console[level === 'error' ? 'error' : 'log'](
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    })
  );
}

function validateCorrectionPayload(body) {
  const themeTitle = String(body?.themeTitle ?? '').trim();
  const essayText = String(body?.essayText ?? '').trim();
  const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64.trim() : '';
  const mimeType = String(body?.mimeType ?? '').trim().toLowerCase();

  if (!themeTitle) {
    return { error: ['MISSING_THEME', 'Informe o tema da redação.'] };
  }

  if (!essayText && !imageBase64) {
    return { error: ['MISSING_CONTENT', 'Envie uma imagem da redação ou o texto digitado.'] };
  }

  if (imageBase64) {
    if (!mimeType) {
      return { error: ['MISSING_MIME_TYPE', 'Informe o tipo da imagem enviada.'] };
    }

    if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
      return { error: ['UNSUPPORTED_MIME_TYPE', 'Use uma imagem JPG, PNG ou WEBP.'] };
    }

    if (imageBase64.length > MAX_BASE64_CHARS) {
      return { error: ['IMAGE_TOO_LARGE', 'A imagem é muito grande. Tire uma nova foto ou reduza o arquivo.'] };
    }
  }

  return {
    data: {
      themeTitle,
      essayText: essayText || undefined,
      imageBase64: imageBase64 || undefined,
      mimeType: mimeType || undefined,
    },
  };
}

router.post('/correct-essay', async (req, res) => {
  log('info', 'correction_request_received', {
    requestId: req.requestId,
    hasImage: Boolean(req.body?.imageBase64),
    hasText: Boolean(req.body?.essayText),
    mimeType: req.body?.mimeType,
    themeTitle: req.body?.themeTitle,
  });

  const validation = validateCorrectionPayload(req.body);
  if (validation.error) {
    const [code, message] = validation.error;
    return sendError(res, 400, code, message);
  }

  try {
    const result = await correctEssayWithOpenAI(validation.data);

    return res.json({
      success: true,
      requestId: req.requestId,
      data: result,
    });
  } catch (error) {
    log('error', 'correction_failed', {
      requestId: req.requestId,
      error: error?.message ?? String(error),
      providerStatus: error?.status,
    });

    const isTimeout = error?.message?.toLowerCase?.().includes('timeout');
    const isOpenAI = error?.name === 'OpenAIError' || error?.status;

    return sendError(
      res,
      isTimeout ? 504 : 500,
      isTimeout ? 'AI_TIMEOUT' : isOpenAI ? 'AI_PROVIDER_ERROR' : 'CORRECTION_FAILED',
      isTimeout
        ? 'A correção demorou mais que o esperado. Tente novamente em instantes.'
        : 'Não foi possível concluir a correção agora. Tente novamente.'
    );
  }
});

export { router as openAiRoutes, validateCorrectionPayload };
