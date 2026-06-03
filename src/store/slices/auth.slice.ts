import { deleteBackendAccount, loginWithBackend, logoutFromBackend, registerWithBackend } from '@/services/auth/backend-auth';
import { registerPushToken } from '@/services/notifications/push-notifications';
import { lookupTurmaByCode, pushTurmaToBackend } from '@/services/sync/sync-turmas';
import { hashPassword, verifyPassword } from '@/utils/crypto';
import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import type { AppState, AuthResult, AuthSlice, RegisteredUser } from '../store.types';

const DEFAULT_TEACHER = {
  id: 'local-teacher',
  name: 'Professor',
  email: 'professor@enemredacoes.local',
};

function generateCode(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const createAuthSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], AuthSlice> =
  (set, get) => ({
    hasHydrated: false,
    users: [],
    currentTeacher: null,
    currentStudent: null,
    backendToken: null,
    sentryConsent: null,

    setHasHydrated: (value) => set({ hasHydrated: value }),

    setSentryConsent: (value) => set({ sentryConsent: value }),

    deleteAccount: async () => {
      const token = get().backendToken;
      if (token) await deleteBackendAccount(token).catch(() => {});
      set({
        users: [],
        currentTeacher: null,
        backendToken: null,
        essays: [],
        atividades: [],
        retryQueue: [],
        turmas: [],
        students: [],
        themes: [],
      });
    },

    ensureTeacherSession: () => {
      if (get().currentTeacher) return;
      set({ currentTeacher: DEFAULT_TEACHER });
    },

    setTeacherProfile: (name, email) => {
      const current = get().currentTeacher ?? DEFAULT_TEACHER;
      set({
        currentTeacher: {
          ...current,
          id: current.id || DEFAULT_TEACHER.id,
          name: name?.trim() || current.name || DEFAULT_TEACHER.name,
          email: email?.trim().toLowerCase() || current.email || DEFAULT_TEACHER.email,
        },
      });
    },

    signup: async (name, email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      const existing = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (existing) return { success: false, error: 'Este e-mail já está cadastrado.' };

      const id = `teacher-${generateId()}`;
      const passwordHash = await hashPassword(password, normalizedEmail);
      const newUser: RegisteredUser = { id, name: name.trim(), email: normalizedEmail, passwordHash };

      set((state) => ({
        users: [...state.users, newUser],
        currentTeacher: { id, name: name.trim(), email: normalizedEmail },
      }));

      const token = await registerWithBackend(id, normalizedEmail, name.trim(), passwordHash);
      if (token) {
        set({ backendToken: token });
        registerPushToken(token);
      }

      return { success: true };
    },

    login: async (email, password) => {
      const normalizedEmail = email.trim().toLowerCase();
      const clientHash = await hashPassword(password, normalizedEmail);

      // Backend-first: authoritative check (also syncs hash after a password reset)
      const backendResult = await loginWithBackend(normalizedEmail, clientHash);

      if (backendResult === 'wrong_credentials') {
        // Server has no account for this email yet — check if local data exists.
        // If yes, auto-register on the backend with the local teacherId + this password
        // so the account is created server-side and login succeeds.
        const localUser = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (localUser) {
          const token = await registerWithBackend(localUser.id, normalizedEmail, localUser.name ?? normalizedEmail.split('@')[0], clientHash);
          if (token) {
            set((state) => ({
              users: state.users.map((u) =>
                u.email.toLowerCase() === normalizedEmail ? { ...u, passwordHash: clientHash } : u
              ),
              currentTeacher: { id: localUser.id, name: localUser.name, email: normalizedEmail },
              backendToken: token,
            }));
            registerPushToken(token);
            return { success: true };
          }
        }
        return { success: false, error: 'E-mail ou senha incorretos.' };
      }

      if (backendResult) {
        const existingUser = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
        set((state) => ({
          users: existingUser
            ? state.users.map((u) =>
                u.email.toLowerCase() === normalizedEmail ? { ...u, passwordHash: clientHash } : u
              )
            : [
                ...state.users,
                {
                  id: backendResult.teacherId,
                  name: existingUser?.name ?? normalizedEmail.split('@')[0],
                  email: normalizedEmail,
                  passwordHash: clientHash,
                },
              ],
          currentTeacher: {
            id: backendResult.teacherId,
            name: existingUser?.name ?? normalizedEmail.split('@')[0],
            email: normalizedEmail,
          },
          backendToken: backendResult.token,
        }));
        registerPushToken(backendResult.token);
        return { success: true };
      }

      // Backend unreachable — offline fallback using cached local hash
      const localUser = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (localUser) {
        const isValid = await verifyPassword(password, normalizedEmail, localUser.passwordHash);
        if (isValid) {
          set({ currentTeacher: { id: localUser.id, name: localUser.name, email: localUser.email } });
          return { success: true };
        }
      }

      return { success: false, error: 'E-mail ou senha incorretos.' };
    },

    logout: () => {
      const token = get().backendToken;
      if (token) logoutFromBackend(token); // fire-and-forget server-side revocation
      set({ currentTeacher: null, backendToken: null });
    },

    loginAsStudent: (teacherEmail, accessCode) => {
      const normalizedEmail = teacherEmail.trim().toLowerCase();
      const normalizedCode = accessCode.trim().toUpperCase();
      const teacher = get().users.find((u) => u.email.toLowerCase() === normalizedEmail);
      if (!teacher) return { success: false, error: 'Professor não encontrado com este e-mail.' };

      const student = get().students.find(
        (s) => s.teacherId === teacher.id && s.accessCode === normalizedCode
      );
      if (!student) return { success: false, error: 'Código de acesso inválido.' };

      set({
        currentStudent: {
          studentId: student.id,
          teacherId: teacher.id,
          studentName: student.name,
          className: student.className,
        },
      });
      return { success: true };
    },

    joinTurmaByQR: (payload, studentName, birthDate) => {
      const trimmedName = studentName.trim();
      if (!trimmedName) return { success: false, error: 'Digite seu nome.' };

      const studentId = `student-qr-${generateId()}`;
      set((state) => ({
        students: [
          { id: studentId, teacherId: payload.teacherId, turmaId: payload.turmaId, name: trimmedName, className: payload.turmaName, birthDate },
          ...state.students,
        ],
        currentStudent: {
          studentId,
          teacherId: payload.teacherId,
          turmaId: payload.turmaId,
          studentName: trimmedName,
          className: payload.turmaName,
          birthDate,
        },
      }));
      return { success: true };
    },

    joinTurmaByCode: async (code, studentName, birthDate) => {
      const trimmedName = studentName.trim();
      if (!trimmedName) return { success: false, error: 'Digite seu nome.' };
      const turmaData = await lookupTurmaByCode(code);
      if (!turmaData) return { success: false, error: 'Código inválido. Verifique com seu professor.' };

      const studentId = `student-code-${generateId()}`;
      set((state) => ({
        students: [
          { id: studentId, teacherId: turmaData.teacherId, turmaId: turmaData.turmaId, name: trimmedName, className: turmaData.turmaName, birthDate },
          ...state.students,
        ],
        currentStudent: {
          studentId,
          teacherId: turmaData.teacherId,
          turmaId: turmaData.turmaId,
          studentName: trimmedName,
          className: turmaData.turmaName,
          birthDate,
        },
      }));
      return { success: true };
    },

    logoutStudent: () => set({ currentStudent: null }),
  });

export { DEFAULT_TEACHER, generateCode };
