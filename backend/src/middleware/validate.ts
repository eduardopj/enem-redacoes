import { z } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';

/**
 * Middleware reutilizável de validação Zod para corpo (body) das requisições.
 * Retorna 400 com detalhes dos erros de validação padronizados.
 *
 * Uso:
 *   router.post('/rota', validateBody(MinhaSchema), handler);
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        success: false,
        requestId: req.requestId,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Os dados enviados são inválidos.',
          details: errors,
        },
      });
      return;
    }
    // Substitui req.body pelo valor validado e parseado pelo Zod (sem campos extras)
    req.body = result.data;
    next();
  };
}

/**
 * Middleware reutilizável de validação Zod para query params.
 *
 * Uso:
 *   router.get('/rota', validateQuery(MinhaSchema), handler);
 */
export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({
        success: false,
        requestId: req.requestId,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parâmetros de consulta inválidos.',
          details: errors,
        },
      });
      return;
    }
    req.query = result.data;
    next();
  };
}

export { z };
