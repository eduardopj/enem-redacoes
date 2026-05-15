import { OPENAI_CONFIG } from '@/constants/openai';

const base = () => OPENAI_CONFIG.backendUrl;

export type TurmaJoinInfo = {
  joinCode: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  turmaId: string;
  turmaName: string;
};

export async function pushTurmaToBackend(data: TurmaJoinInfo, token?: string): Promise<void> {
  await fetch(`${base()}/v1/sync/turmas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
}

export async function lookupTurmaByCode(code: string): Promise<TurmaJoinInfo | null> {
  try {
    // Uses v1 route (backend also serves old /sync/... for backward compat)
    const res = await fetch(`${base()}/v1/sync/turmas/by-code/${encodeURIComponent(code.trim().toUpperCase())}`);
    if (!res.ok) return null;
    const body = await res.json();
    return body?.data ?? body ?? null;
  } catch {
    return null;
  }
}
