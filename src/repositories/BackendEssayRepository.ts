import {
  fetchEssayDetail,
  fetchEssaysByTeacher,
  pushEssayToBackend,
  pushTeacherEvalToBackend,
} from '@/services/sync/sync-essays';
import type { IEssayRepository } from './IEssayRepository';

export const backendEssayRepository: IEssayRepository = {
  fetchByTeacher: (teacherId, token, cursor, limit) =>
    fetchEssaysByTeacher(teacherId, token, cursor, limit),

  fetchDetail: (essayId, token) =>
    fetchEssayDetail(essayId, token),

  push: (essay, studentName, turmaId, turmaName, token) =>
    pushEssayToBackend(essay, studentName, turmaId, turmaName, token),

  pushTeacherEval: (essayId, teacherScore, teacherNote, token) =>
    pushTeacherEvalToBackend(essayId, teacherScore, teacherNote, token),
};
