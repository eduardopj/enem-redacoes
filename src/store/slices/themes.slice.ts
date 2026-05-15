import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import type { AppState, ThemesSlice } from '../store.types';

export const createThemesSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], ThemesSlice> =
  (set, get) => ({
    themes: [],

    addTheme: (input) => {
      const teacher = get().currentTeacher;
      if (!teacher) return null;
      const themeId = `theme-${generateId()}`;
      set((state) => ({
        themes: [
          { id: themeId, teacherId: teacher.id, title: input.title, category: input.category },
          ...state.themes,
        ],
      }));
      return themeId;
    },

    deleteTheme: (themeId) =>
      set((state) => ({
        themes: state.themes.filter((t) => t.id !== themeId),
      })),
  });
