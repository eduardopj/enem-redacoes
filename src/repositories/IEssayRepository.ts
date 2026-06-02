import type { BackendEssay } from '@/types/api';
import type { Essay } from '@/types/app';

export interface FetchEssaysResult {
  data: BackendEssay[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface IEssayRepository {
  fetchByTeacher(
    teacherId: string,
    token?: string,
    cursor?: string,
    limit?: number,
  ): Promise<FetchEssaysResult>;

  fetchDetail(essayId: string, token?: string): Promise<BackendEssay | null>;

  push(
    essay: Essay,
    studentName: string,
    turmaId?: string,
    turmaName?: string,
    token?: string,
  ): Promise<void>;

  pushTeacherEval(
    essayId: string,
    teacherScore: number | undefined,
    teacherNote: string,
    token?: string,
  ): Promise<void>;
}
