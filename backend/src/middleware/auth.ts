import type { Request, Response, NextFunction } from 'express';
import { validateToken } from '../services/auth.service.js';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token de autenticação ausente.' },
    });
    return;
  }

  const token = header.slice(7).trim();
  const teacher = validateToken(token);
  if (!teacher) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido. Faça login novamente.' },
    });
    return;
  }

  req.teacherId = teacher.teacherId;
  req.teacherEmail = teacher.teacherEmail;
  next();
}
