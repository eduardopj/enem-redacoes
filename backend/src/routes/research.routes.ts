import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { saveEssayRecord } from '../services/research.service.js';

const router: RouterType = Router();

router.post('/save-essay', async (req: Request, res: Response) => {
  try {
    const { themeTitle, className, state, correction, imageBase64, mimeType } = req.body as {
      themeTitle?: string | null;
      className?: string | null;
      state?: string | null;
      correction?: Record<string, unknown> | null;
      imageBase64?: string | null;
      mimeType?: string | null;
    };
    const id = await saveEssayRecord({ themeTitle, className, state, correction, imageBase64, mimeType });
    return res.json({ success: true, id });
  } catch (error) {
    console.error('[research] Erro ao salvar redação:', error);
    return res.status(500).json({ error: (error as Error)?.message ?? 'Erro ao salvar registro de pesquisa.' });
  }
});

export { router as researchRoutes };
