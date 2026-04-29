import { Router } from 'express';
import { correctEssayWithOpenAI } from '../services/openai.service.js';

const router = Router();

router.post('/correct-essay', async (req, res) => {
  console.log('POST /openai/correct-essay chegou');

  try {
    const { themeTitle, imageBase64, mimeType, essayText } = req.body;

    if (!themeTitle) {
      return res.status(400).json({ error: 'themeTitle é obrigatório' });
    }
    if (!imageBase64 && !essayText) {
      return res.status(400).json({ error: 'Envie imageBase64 (foto) ou essayText (texto digitado)' });
    }

    const result = await correctEssayWithOpenAI({
      themeTitle,
      imageBase64,
      mimeType,
      essayText,
    });

    return res.json(result);
  } catch (error) {
    console.error('[correct-essay] Erro:', error?.message ?? error);
    console.error('[correct-essay] Stack:', error?.stack ?? '(sem stack)');

    const message =
      error instanceof Error ? error.message : 'Erro interno ao corrigir redação';

    return res.status(500).json({
      error: message,
    });
  }
});

export { router as openAiRoutes };

