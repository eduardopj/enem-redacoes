import { pushTeacherEvalToBackend } from '@/services/sync/sync-essays';
import type { Atividade } from '@/types/app';
import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import { mapCorrectionJsonToEssayFields } from '../utils/essay-helpers';
import type { AppState, EssaysSlice } from '../store.types';

export const createEssaysSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], EssaysSlice> =
  (set, get) => ({
    essays: [],
    atividades: [],

    addEssay: (input) => {
      const teacher = get().currentTeacher;
      const student = get().currentStudent;
      const teacherId = teacher?.id ?? student?.teacherId;
      const studentId = input.studentId ?? student?.studentId;
      if (!teacherId || !studentId) return null;

      const submittedByStudent = !teacher && !!student;
      const essayId = `essay-${generateId()}`;
      set((state) => ({
        essays: [
          {
            id: essayId,
            teacherId,
            studentId,
            themeTitle: input.themeTitle,
            inputMode: input.inputMode ?? 'manuscrita',
            essayText: input.essayText,
            imageName: input.imageName,
            imageUri: input.imageUri,
            imageMimeType: input.imageMimeType,
            documentName: input.documentName,
            documentUri: input.documentUri,
            status: 'pendente',
            sourceType: input.imageUri ? 'image' : 'document',
            confidenceLevel: 'media',
            reviewRequired: false,
            submittedByStudent,
            correctionAttempts: 0,
            strengths: [],
            weaknesses: [],
            improvements: [],
            transcription: '',
            transcriptionNotes: '',
            generalObservation: '',
            congratulations: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          ...state.essays,
        ],
      }));
      return essayId;
    },

    deleteEssay: (essayId) =>
      set((state) => ({
        essays: state.essays.filter((e) => e.id !== essayId),
        retryQueue: state.retryQueue.filter((id) => id !== essayId),
      })),

    updateEssayStatus: (essayId, status, totalScore) =>
      set((state) => ({
        essays: state.essays.map((essay) =>
          essay.id === essayId ? { ...essay, status, totalScore } : essay
        ),
      })),

    updateEssayCorrection: (essayId, data) =>
      set((state) => ({
        essays: state.essays.map((e) =>
          e.id === essayId ? { ...e, ...mapCorrectionJsonToEssayFields(data) } : e
        ),
      })),

    updateEssayTeacherEval: (essayId, teacherScore, teacherNote) => {
      const reviewedAt =
        teacherScore != null || teacherNote.trim() ? new Date().toISOString() : undefined;
      set((state) => ({
        essays: state.essays.map((essay) =>
          essay.id === essayId
            ? {
                ...essay,
                teacherScore,
                teacherNote,
                teacherReviewedAt: reviewedAt,
                reviewRequired: reviewedAt ? false : essay.reviewRequired,
                updatedAt: new Date().toISOString(),
              }
            : essay
        ),
      }));
      pushTeacherEvalToBackend(essayId, teacherScore, teacherNote, get().backendToken ?? undefined).catch(() => {});
    },

    markEssayTeacherViewed: (essayId) =>
      set((state) => ({
        essays: state.essays.map((essay) =>
          essay.id === essayId && !essay.teacherReviewedAt
            ? { ...essay, teacherReviewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
            : essay
        ),
      })),

    addAtividade: (input) => {
      const teacher = get().currentTeacher;
      if (!teacher) return null;
      const id = `atividade-${generateId()}`;
      const nova: Atividade = {
        id,
        turmaId: input.turmaId,
        teacherId: teacher.id,
        themeTitle: input.themeTitle.trim(),
        description: input.description?.trim() || undefined,
        dueDate: input.dueDate || undefined,
        createdAt: new Date().toISOString(),
        status: 'ativa',
      };
      set((state) => ({ atividades: [...state.atividades, nova] }));
      return id;
    },

    encerrarAtividade: (id) =>
      set((state) => ({
        atividades: state.atividades.map((a) =>
          a.id === id ? { ...a, status: 'encerrada' } : a
        ),
      })),
  });
