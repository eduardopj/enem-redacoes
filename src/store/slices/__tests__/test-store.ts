/**
 * Helper para criar um store de teste sem o middleware persist.
 * Os slices funcionam identicamente sem persist — o middleware só adiciona
 * persistência no AsyncStorage, que não queremos em testes.
 */
import { createStore } from 'zustand/vanilla';
import { createAuthSlice } from '../auth.slice';
import { createCorrectionSlice } from '../correction.slice';
import { createEssaysSlice } from '../essays.slice';
import { createStudentsSlice } from '../students.slice';
import { createSyncSlice } from '../sync.slice';
import { createThemesSlice } from '../themes.slice';
import { createTurmasSlice } from '../turmas.slice';
import type { AppState } from '../../store.types';

export function createTestStore() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createStore<AppState>()((set: any, get: any, api: any) => ({
    ...createAuthSlice(set, get, api),
    ...createTurmasSlice(set, get, api),
    ...createStudentsSlice(set, get, api),
    ...createThemesSlice(set, get, api),
    ...createEssaysSlice(set, get, api),
    ...createCorrectionSlice(set, get, api),
    ...createSyncSlice(set, get, api),
  }));
}

export type TestStore = ReturnType<typeof createTestStore>;
