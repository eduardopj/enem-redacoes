import type { Request } from 'express';
import { validateToken } from '../services/auth.service.js';

export interface Context {
  teacherId: string | null;
  teacherEmail: string | null;
  rawToken: string | null;
  requestId: string;
}

export async function createContext({ req }: { req: Request }): Promise<Context> {
  const header = req.headers.authorization ?? '';
  const rawToken = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const teacher = rawToken ? await validateToken(rawToken) : null;
  return {
    teacherId: teacher?.teacherId ?? null,
    teacherEmail: teacher?.teacherEmail ?? null,
    rawToken,
    requestId: (req as Request & { requestId: string }).requestId,
  };
}
