import type { Request } from 'express';
import { validateToken } from '../services/auth.service.js';

export interface Context {
  teacherId: string | null;
  teacherEmail: string | null;
  rawToken: string | null;
  requestId: string;
}

export function createContext({ req }: { req: Request }): Context {
  const header = req.headers.authorization ?? '';
  const rawToken = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  const teacher = rawToken ? (validateToken as (t: string) => { teacherId: string; teacherEmail: string } | null)(rawToken) : null;
  return {
    teacherId: teacher?.teacherId ?? null,
    teacherEmail: teacher?.teacherEmail ?? null,
    rawToken,
    requestId: (req as Request & { requestId: string }).requestId,
  };
}
