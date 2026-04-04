import { Router } from 'express';
import { correctEssayWithOpenAI } from '../services/openai.service.js';

const router = Router();

router.post('/correct-essay', async (req, res) => {
  console.log('POST /openai/correct-essay chegou');
  console.log(req.body);

  try {
    const { themeTitle, imageBase64, mimeType } = req.body;

    if (!themeTitle || !imageBase64 || !mimeType) {
      return res.status(400).json({
        error: 'Campos obrigatórios: themeTitle, imageBase64, mimeType',
      });
    }

    const result = await correctEssayWithOpenAI({
      themeTitle,
      imageBase64,
      mimeType,
    });

    return res.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno ao corrigir redação';

    return res.status(500).json({
      error: message,
    });
  }
});

export { router as openAiRoutes };

