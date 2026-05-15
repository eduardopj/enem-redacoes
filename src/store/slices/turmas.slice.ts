import { pushTurmaToBackend } from '@/services/sync/sync-turmas';
import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import { generateCode } from './auth.slice';
import type { AppState, TurmasSlice } from '../store.types';

export const createTurmasSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], TurmasSlice> =
  (set, get) => ({
    turmas: [],

    addTurma: (input) => {
      const teacher = get().currentTeacher;
      if (!teacher) return null;
      const turmaId = `turma-${generateId()}`;
      set((state) => ({
        turmas: [
          {
            id: turmaId,
            teacherId: teacher.id,
            name: input.name,
            period: input.period,
            year: input.year,
            subject: input.subject,
            createdAt: new Date().toISOString(),
          },
          ...state.turmas,
        ],
      }));
      return turmaId;
    },

    deleteTurma: (turmaId) =>
      set((state) => ({
        turmas: state.turmas.filter((t) => t.id !== turmaId),
        students: state.students.map((s) =>
          s.turmaId === turmaId ? { ...s, turmaId: undefined } : s
        ),
      })),

    generateTurmaJoinCode: (turmaId) => {
      const teacher = get().currentTeacher;
      if (!teacher) return null;
      const turma = get().turmas.find((t) => t.id === turmaId);
      if (!turma || turma.teacherId !== teacher.id) return null;

      const existingCode = turma.joinCode ?? generateCode(8);
      set((state) => ({
        turmas: state.turmas.map((t) =>
          t.id === turmaId ? { ...t, joinCode: existingCode } : t
        ),
      }));
      pushTurmaToBackend({
        joinCode: existingCode,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherEmail: teacher.email,
        turmaId: turma.id,
        turmaName: turma.name,
      }, get().backendToken ?? undefined).catch(() => {});
      return existingCode;
    },
  });
