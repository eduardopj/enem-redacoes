import { Router } from 'express';
import { saveEssayRecord } from '../services/research.service.js';

const router = Router();

router.post('/save-essay', async (req, res) => {
  try {
    const { themeTitle, className, state, correction, imageBase64, mimeType } = req.body;
    const id = await saveEssayRecord({ themeTitle, className, state, correction, imageBase64, mimeType });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('[research] Erro ao salvar redação:', error);
    return res.status(500).json({ error: error?.message ?? 'Erro ao salvar registro de pesquisa.' });
  }
});

export { router as researchRoutes };
