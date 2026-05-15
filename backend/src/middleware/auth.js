import { validateToken } from '../services/auth.service.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Token de autenticação ausente.' },
    });
  }

  const token = header.slice(7).trim();
  const teacher = validateToken(token);
  if (!teacher) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Token inválido. Faça login novamente.' },
    });
  }

  req.teacherId = teacher.teacherId;
  req.teacherEmail = teacher.teacherEmail;
  next();
}
