/**
 * Store principal — combina os 5 slices via padrão Zustand Slice.
 * A API pública (useAppStore) é 100% backward-compatible.
 *
 * Slices:
 *   auth     → sessão professor/aluno, signup, login
 *   turmas   → CRUD de turmas e joinCode
 *   students → CRUD de alunos e accessCode
 *   themes   → CRUD de temas
 *   essays   → CRUD de redações, correção IA, retry queue, atividades
 *
 * Schema version history:
 *   v1 / v2  → initial versions (no explicit migration needed)
 *   v3       → added backendToken to persisted state
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createAuthSlice, DEFAULT_TEACHER } from './slices/auth.slice';
import { createCorrectionSlice } from './slices/correction.slice';
import { createEssaysSlice } from './slices/essays.slice';
import { createStudentsSlice } from './slices/students.slice';
import { createSyncSlice } from './slices/sync.slice';
import { createThemesSlice } from './slices/themes.slice';
import { createTurmasSlice } from './slices/turmas.slice';
import type { AppState } from './store.types';

export { DEFAULT_TEACHER };
export type { AppState };

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createTurmasSlice(...args),
      ...createStudentsSlice(...args),
      ...createThemesSlice(...args),
      ...createEssaysSlice(...args),
      ...createCorrectionSlice(...args),
      ...createSyncSlice(...args),
    }),
    {
      name: 'enem-redacoes-v2',
      storage: createJSONStorage(() => AsyncStorage),
      version: 4,
      migrate: (persisted: unknown, version: number) => {
        const state = persisted as Record<string, unknown>;
        if (version < 3) {
          state.backendToken = state.backendToken ?? null;
        }
        if (version < 4) {
          // Strip heavy correction text fields from stored essays to free AsyncStorage space.
          // Correction details are lazy-loaded from the backend on the resultado screen.
          const essays = state.essays as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(essays)) {
            state.essays = essays.map(({
              transcription, transcriptionNotes, competencyFeedbacks,
              strengths, weaknesses, improvements, generalObservation,
              congratulations, feedback, studentDirectMessage,
              improvementPotential, vocabularyAnalysis,
              ...lightweight
            }) => lightweight);
          }
        }
        return state as AppState;
      },
      partialize: (state) => ({
        users: state.users,
        currentTeacher: state.currentTeacher,
        currentStudent: state.currentStudent,
        backendToken: state.backendToken,
        turmas: state.turmas,
        students: state.students,
        themes: state.themes,
        essays: state.essays.map(({
          transcription, transcriptionNotes, competencyFeedbacks,
          strengths, weaknesses, improvements, generalObservation,
          congratulations, feedback, studentDirectMessage,
          improvementPotential, vocabularyAnalysis,
          ...lightweight
        }) => lightweight) as typeof state.essays,
        atividades: state.atividades,
        retryQueue: state.retryQueue,
        sentryConsent: state.sentryConsent,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset any essays stuck in "processando" state (app was killed mid-correction)
          state.essays = state.essays.map((essay) =>
            essay.status === 'processando'
              ? { ...essay, status: 'pendente', feedback: undefined }
              : essay
          );
          // Guarantee a default teacher session for offline-first mode
          if (!state.currentTeacher) {
            state.currentTeacher = DEFAULT_TEACHER;
          }
          state.setHasHydrated(true);
        }
      },
    }
  )
);
