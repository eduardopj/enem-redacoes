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
