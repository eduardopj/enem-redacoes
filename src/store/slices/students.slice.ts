import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import { generateCode } from './auth.slice';
import type { AppState, StudentsSlice } from '../store.types';

export const createStudentsSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], StudentsSlice> =
  (set, get) => ({
    students: [],

    addStudent: (input) => {
      const teacher = get().currentTeacher;
      if (!teacher) return;
      const className = input.turmaId
        ? (get().turmas.find((t) => t.id === input.turmaId)?.name ?? input.className)
        : input.className;
      set((state) => ({
        students: [
          {
            id: generateId(),
            teacherId: teacher.id,
            turmaId: input.turmaId,
            name: input.name,
            className,
            state: input.state,
          },
          ...state.students,
        ],
      }));
    },

    updateStudent: (studentId, data) => {
      set((state) => ({
        students: state.students.map((s) => {
          if (s.id !== studentId) return s;
          const turmaId = data.turmaId === null ? undefined : (data.turmaId ?? s.turmaId);
          const className =
            data.className ??
            (data.turmaId != null
              ? (state.turmas.find((t) => t.id === data.turmaId)?.name ?? s.className)
              : s.className);
          return { ...s, name: data.name ?? s.name, turmaId, className };
        }),
      }));
    },

    deleteStudent: (studentId) =>
      set((state) => ({
        students: state.students.filter((s) => s.id !== studentId),
        essays: state.essays.filter((e) => e.studentId !== studentId),
      })),

    generateStudentCode: (studentId) => {
      const code = generateCode(6);
      set((state) => ({
        students: state.students.map((s) =>
          s.id === studentId ? { ...s, accessCode: code } : s
        ),
      }));
      return code;
    },
  });
