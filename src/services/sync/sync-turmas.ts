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

export async function pushTurmaToBackend(data: TurmaJoinInfo): Promise<void> {
  await fetch(`${base()}/sync/turmas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function lookupTurmaByCode(code: string): Promise<TurmaJoinInfo | null> {
  try {
    const res = await fetch(`${base()}/sync/turmas/by-code/${encodeURIComponent(code.trim().toUpperCase())}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
