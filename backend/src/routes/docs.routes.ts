import { Router } from 'express';
import type { Request, Response, Router as RouterType } from 'express';
import { openApiSpec } from '../docs/openapi.js';
import { flags } from '../utils/flags.js';

const router: RouterType = Router();

const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'API docs disabled.' } });
};

// Raw OpenAPI JSON spec
router.get('/openapi.json', flags.enableApiDocs
  ? (_req: Request, res: Response) => {
      res.set('Cache-Control', 'public, max-age=300');
      res.json(openApiSpec);
    }
  : notFound,
);

// Swagger UI via CDN — zero npm dependency
const SWAGGER_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ENEM IA — API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      tryItOutEnabled: true,
    });
  </script>
</body>
</html>`;

router.get('/docs', flags.enableApiDocs
  ? (_req: Request, res: Response) => {
      res.set('Cache-Control', 'no-store');
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(SWAGGER_HTML);
    }
  : notFound,
);

export { router as docsRoutes };
