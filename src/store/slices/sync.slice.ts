import { fetchEssaysByTeacher } from '@/services/sync/sync-essays';
import { StateCreator } from 'zustand';
import { mergeRemoteEssays } from '../utils/essay-helpers';
import type { AppState, SyncSlice } from '../store.types';

export const createSyncSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], SyncSlice> =
  (set, get) => ({
    backendSyncCursor: null,
    backendSyncHasMore: false,

    fetchStudentEssaysFromBackend: async () => {
      const teacher = get().currentTeacher;
      if (!teacher) return;
      try {
        const { data, hasMore, nextCursor } = await fetchEssaysByTeacher(
          teacher.id,
          get().backendToken ?? undefined,
        );
        set({ backendSyncHasMore: hasMore, backendSyncCursor: nextCursor });
        const merged = mergeRemoteEssays(data, get().essays, get().students);
        if (merged) set(merged);
      } catch {
        // Network failure — silently ignore, teacher will see local essays
      }
    },

    fetchMoreEssaysFromBackend: async () => {
      const teacher = get().currentTeacher;
      const { backendSyncCursor, backendSyncHasMore } = get();
      if (!teacher || !backendSyncHasMore || !backendSyncCursor) return;
      try {
        const { data, hasMore, nextCursor } = await fetchEssaysByTeacher(
          teacher.id,
          get().backendToken ?? undefined,
          backendSyncCursor,
        );
        set({ backendSyncHasMore: hasMore, backendSyncCursor: nextCursor });
        const merged = mergeRemoteEssays(data, get().essays, get().students);
        if (merged) set(merged);
      } catch {
        // Network failure — silently ignore
      }
    },
  });
