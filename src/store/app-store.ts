import { correctEssayWithOpenAI } from '@/services/openai/correct-essay';
import { saveEssayForResearch } from '@/services/research/save-essay';
import { BackendEssay, fetchEssaysByTeacher, pushEssayToBackend, pushTeacherEvalToBackend } from '@/services/sync/sync-essays';
import { lookupTurmaByCode, pushTurmaToBackend } from '@/services/sync/sync-turmas';
import { Essay, EssayInputMode, EssayStatus, QRJoinPayload, Student, StudentSession, Teacher, ThemeItem, Turma } from '@/types/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─── Tipos ─────────────────────────────────────────────────────────────────

type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

type AuthResult = { success: true } | { success: false; error: string };

type CreateTurmaInput = {
  name: string;
  period?: 'manhã' | 'tarde' | 'noite' | 'integral';
  year?: string;
  subject?: string;
};

type CreateStudentInput = {
  name: string;
  turmaId?: string;
  className: string;
  state?: string;
};

type CreateThemeInput = {
  title: string;
  category: string;
};

type CreateEssayInput = {
  studentId?: string;
  themeTitle: string;
  inputMode?: EssayInputMode;
  essayText?: string;
  imageName?: string;
  imageUri?: string;
  documentName?: string;
  documentUri?: string;
};

function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

type AppState = {
  hasHydrated: boolean;
  users: RegisteredUser[];
  currentTeacher: Teacher | null;
  currentStudent: StudentSession | null;
  turmas: Turma[];
  students: Student[];
  themes: ThemeItem[];
  essays: Essay[];
  retryQueue: string[];

  // Auth — professor
  signup: (name: string, email: string, password: string) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  logout: () => void;

  // Auth — aluno
  loginAsStudent: (teacherEmail: string, accessCode: string) => AuthResult;
  joinTurmaByQR: (payload: QRJoinPayload, studentName: string) => AuthResult;
  joinTurmaByCode: (code: string, studentName: string) => Promise<AuthResult>;
  generateTurmaJoinCode: (turmaId: string) => string | null;
  logoutStudent: () => void;

  // Dados
  addTurma: (input: CreateTurmaInput) => string | null;
  deleteTurma: (turmaId: string) => void;
  addStudent: (input: CreateStudentInput) => void;
  addTheme: (input: CreateThemeInput) => string | null;
  addEssay: (input: CreateEssayInput) => string | null;
  deleteStudent: (studentId: string) => void;
  deleteTheme: (themeId: string) => void;
  deleteEssay: (essayId: string) => void;
  updateEssayStatus: (essayId: string, status: EssayStatus, totalScore?: number) => void;
  updateEssayTeacherEval: (essayId: string, teacherScore: number | undefined, teacherNote: string) => void;
  generateStudentCode: (studentId: string) => string | null;
  evaluateEssayWithOpenAI: (essayId: string) => Promise<void>;
  addToRetryQueue: (essayId: string) => void;
  removeFromRetryQueue: (essayId: string) => void;
  processRetryQueue: () => Promise<void>;
  fetchStudentEssaysFromBackend: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
};

// ─── Helpers ───────────────────────────────────────────────────────────────

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isNetworkError(message: string): boolean {
  return (
    message.includes('Network request failed') ||
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('connect') ||
    message.includes('timeout') ||
    message.includes('ECONNREFUSED')
  );
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      users: [],
      currentTeacher: null,
      currentStudent: null,
      turmas: [],
      students: [],
      themes: [],
      essays: [],
      retryQueue: [],

      setHasHydrated: (value) => set({ hasHydrated: value }),

      // ── Auth — professor ─────────────────────────────────────────────────

      signup: (name, email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = get().users.find(
          (u) => u.email.toLowerCase() === normalizedEmail
        );
        if (existing) {
          return { success: false, error: 'Este e-mail já está cadastrado.' };
        }

        const id = `teacher-${Date.now()}`;
        const newUser: RegisteredUser = { id, name: name.trim(), email: normalizedEmail, password };
        const teacher: Teacher = { id, name: name.trim(), email: normalizedEmail };

        set((state) => ({
          users: [...state.users, newUser],
          currentTeacher: teacher,
        }));

        return { success: true };
      },

      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
        );

        if (!user) {
          return { success: false, error: 'E-mail ou senha incorretos.' };
        }

        const teacher: Teacher = { id: user.id, name: user.name, email: user.email };
        set({ currentTeacher: teacher });

        return { success: true };
      },

      logout: () => set({ currentTeacher: null }),

      // ── Auth — aluno ─────────────────────────────────────────────────────

      loginAsStudent: (teacherEmail, accessCode) => {
        const normalizedEmail = teacherEmail.trim().toLowerCase();
        const normalizedCode = accessCode.trim().toUpperCase();

        // Find teacher by email
        const teacher = get().users.find(
          (u) => u.email.toLowerCase() === normalizedEmail
        );
        if (!teacher) {
          return { success: false, error: 'Professor não encontrado com este e-mail.' };
        }

        // Find student by access code under this teacher
        const student = get().students.find(
          (s) => s.teacherId === teacher.id && s.accessCode === normalizedCode
        );
        if (!student) {
          return { success: false, error: 'Código de acesso inválido.' };
        }

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

      joinTurmaByQR: (payload, studentName) => {
        const trimmedName = studentName.trim();
        if (!trimmedName) return { success: false, error: 'Digite seu nome.' };

        const studentId = `student-qr-${Date.now()}`;
        set((state) => ({
          students: [
            {
              id: studentId,
              teacherId: payload.teacherId,
              turmaId: payload.turmaId,
              name: trimmedName,
              className: payload.turmaName,
            },
            ...state.students,
          ],
          currentStudent: {
            studentId,
            teacherId: payload.teacherId,
            turmaId: payload.turmaId,
            studentName: trimmedName,
            className: payload.turmaName,
          },
        }));
        return { success: true };
      },

      generateTurmaJoinCode: (turmaId) => {
        const teacher = get().currentTeacher;
        if (!teacher) return null;
        const turma = get().turmas.find((t) => t.id === turmaId);
        if (!turma || turma.teacherId !== teacher.id) return null;

        const existingCode = turma.joinCode ?? generateJoinCode();
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
        }).catch(() => {});
        return existingCode;
      },

      joinTurmaByCode: async (code, studentName) => {
        const trimmedName = studentName.trim();
        if (!trimmedName) return { success: false, error: 'Digite seu nome.' };
        const turmaData = await lookupTurmaByCode(code);
        if (!turmaData) return { success: false, error: 'Código inválido. Verifique com seu professor.' };
        const studentId = `student-code-${Date.now()}`;
        set((state) => ({
          students: [
            {
              id: studentId,
              teacherId: turmaData.teacherId,
              turmaId: turmaData.turmaId,
              name: trimmedName,
              className: turmaData.turmaName,
            },
            ...state.students,
          ],
          currentStudent: {
            studentId,
            teacherId: turmaData.teacherId,
            turmaId: turmaData.turmaId,
            studentName: trimmedName,
            className: turmaData.turmaName,
          },
        }));
        return { success: true };
      },

      logoutStudent: () => set({ currentStudent: null }),

      // ── Dados ───────────────────────────────────────────────────────────

      addTurma: (input) => {
        const teacher = get().currentTeacher;
        if (!teacher) return null;
        const turmaId = `turma-${Date.now()}`;
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

      addStudent: (input) => {
        const teacher = get().currentTeacher;
        if (!teacher) return;

        const className = input.turmaId
          ? (get().turmas.find((t) => t.id === input.turmaId)?.name ?? input.className)
          : input.className;
        set((state) => ({
          students: [
            {
              id: String(Date.now()),
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

      addTheme: (input) => {
        const teacher = get().currentTeacher;
        if (!teacher) return null;

        const themeId = String(Date.now());

        set((state) => ({
          themes: [
            {
              id: themeId,
              teacherId: teacher.id,
              title: input.title,
              category: input.category,
            },
            ...state.themes,
          ],
        }));

        return themeId;
      },

      addEssay: (input) => {
        const teacher = get().currentTeacher;
        const student = get().currentStudent;
        const teacherId = teacher?.id ?? student?.teacherId;
        const studentId = input.studentId ?? student?.studentId;
        if (!teacherId || !studentId) return null;

        const essayId = String(Date.now());

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
              documentName: input.documentName,
              documentUri: input.documentUri,
              status: 'pendente',
              strengths: [],
              weaknesses: [],
              improvements: [],
              transcription: '',
              transcriptionNotes: '',
              generalObservation: '',
              congratulations: '',
              createdAt: new Date().toISOString(),
            },
            ...state.essays,
          ],
        }));

        return essayId;
      },

      deleteStudent: (studentId) =>
        set((state) => ({
          students: state.students.filter((s) => s.id !== studentId),
          essays: state.essays.filter((e) => e.studentId !== studentId),
        })),

      deleteTheme: (themeId) =>
        set((state) => ({
          themes: state.themes.filter((t) => t.id !== themeId),
        })),

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

      updateEssayTeacherEval: (essayId, teacherScore, teacherNote) => {
        set((state) => ({
          essays: state.essays.map((essay) =>
            essay.id === essayId ? { ...essay, teacherScore, teacherNote } : essay
          ),
        }));
        pushTeacherEvalToBackend(essayId, teacherScore, teacherNote).catch(() => {});
      },

      generateStudentCode: (studentId) => {
        const code = generateAccessCode();
        set((state) => ({
          students: state.students.map((s) =>
            s.id === studentId ? { ...s, accessCode: code } : s
          ),
        }));
        return code;
      },

      addToRetryQueue: (essayId) =>
        set((state) => ({
          retryQueue: state.retryQueue.includes(essayId)
            ? state.retryQueue
            : [...state.retryQueue, essayId],
        })),

      removeFromRetryQueue: (essayId) =>
        set((state) => ({
          retryQueue: state.retryQueue.filter((id) => id !== essayId),
        })),

      fetchStudentEssaysFromBackend: async () => {
        const teacher = get().currentTeacher;
        if (!teacher) return;
        try {
          const remote: BackendEssay[] = await fetchEssaysByTeacher(teacher.id);
          if (!remote.length) return;

          set((state) => {
            const existingIds = new Set(state.essays.map((e) => e.id));
            const existingStudentIds = new Set(state.students.map((s) => s.id));
            const toAdd: Essay[] = [];
            const studentsToAdd: Student[] = [];

            for (const r of remote) {
              // Upsert student record so QR-registered students appear in turma
              if (!existingStudentIds.has(r.studentId) && r.studentName) {
                studentsToAdd.push({
                  id: r.studentId,
                  teacherId: r.teacherId,
                  turmaId: r.turmaId ?? undefined,
                  name: r.studentName,
                  className: r.turmaName ?? '',
                });
                existingStudentIds.add(r.studentId);
              }

              if (!existingIds.has(r.id)) {
                const c = r.correctionJson ?? {};
                toAdd.push({
                  id: r.id,
                  teacherId: r.teacherId,
                  studentId: r.studentId,
                  themeTitle: r.themeTitle ?? '',
                  inputMode: (r.inputMode as any) ?? 'manuscrita',
                  essayText: r.essayText ?? undefined,
                  status: (r.status as EssayStatus) ?? 'corrigida',
                  totalScore: r.totalScore ?? undefined,
                  teacherScore: r.teacherScore ?? undefined,
                  teacherNote: r.teacherNote ?? undefined,
                  transcription: (c as any).transcription,
                  transcriptionNotes: (c as any).transcriptionNotes,
                  transcriptionConfidence: (c as any).transcriptionConfidence,
                  writingMode: (c as any).writingMode,
                  legibility: (c as any).legibility,
                  themeAdequacy: (c as any).themeAdequacy,
                  scoreReliability: (c as any).scoreReliability,
                  competencies: (c as any).competencies,
                  competencyFeedbacks: (c as any).competencyFeedbacks,
                  strengths: (c as any).strengths ?? [],
                  weaknesses: (c as any).weaknesses ?? [],
                  improvements: (c as any).improvements ?? [],
                  generalObservation: (c as any).generalObservation,
                  congratulations: (c as any).congratulations,
                  feedback: (c as any).feedback,
                  studentDirectMessage: (c as any).studentDirectMessage,
                  improvementPotential: (c as any).improvementPotential,
                  vocabularyAnalysis: (c as any).vocabularyAnalysis,
                  createdAt: r.createdAt ?? undefined,
                  correctedAt: r.correctedAt ?? undefined,
                });
              }
            }

            if (!toAdd.length && !studentsToAdd.length) return state;
            return {
              essays: toAdd.length ? [...toAdd, ...state.essays] : state.essays,
              students: studentsToAdd.length ? [...studentsToAdd, ...state.students] : state.students,
            };
          });
        } catch {
          // Network failure — silently ignore, teacher will see local essays
        }
      },

      processRetryQueue: async () => {
        const { retryQueue, essays, evaluateEssayWithOpenAI, removeFromRetryQueue } = get();
        if (retryQueue.length === 0) return;

        for (const essayId of retryQueue) {
          const essay = essays.find((e) => e.id === essayId);
          if (!essay || essay.status === 'corrigida' || essay.status === 'processando') {
            removeFromRetryQueue(essayId);
            continue;
          }
          try {
            removeFromRetryQueue(essayId);
            await evaluateEssayWithOpenAI(essayId);
          } catch {
            // será re-adicionado por evaluateEssayWithOpenAI se for erro de rede
          }
        }
      },

      evaluateEssayWithOpenAI: async (essayId) => {
        const essay = get().essays.find((item) => item.id === essayId);

        if (!essay) throw new Error('Redação não encontrada.');
        const isTextMode = essay.inputMode === 'digitada' && !!essay.essayText;
        if (!isTextMode && !essay.imageUri) throw new Error('Para a correção com IA, envie uma foto, faça upload ou digite o texto da redação.');

        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? { ...item, status: 'processando', feedback: 'ETAPA 1/4 • LENDO A IMAGEM E IDENTIFICANDO O TIPO DE ESCRITA' }
              : item
          ),
        }));

        await wait(450);

        try {
          const result = await correctEssayWithOpenAI(
            isTextMode
              ? { themeTitle: essay.themeTitle, essayText: essay.essayText }
              : { themeTitle: essay.themeTitle, imageUri: essay.imageUri }
          );

          set((state) => ({
            essays: state.essays.map((item) =>
              item.id === essayId
                ? { ...item, status: 'processando', transcription: result.transcription, transcriptionNotes: result.transcriptionNotes, transcriptionConfidence: result.transcriptionConfidence, writingMode: result.writingMode, legibility: result.legibility, themeAdequacy: result.themeAdequacy, scoreReliability: result.scoreReliability, feedback: 'ETAPA 2/4 • TRANSCRIÇÃO CONCLUÍDA E LEITURA TEMÁTICA REALIZADA' }
                : item
            ),
          }));

          await wait(450);

          set((state) => ({
            essays: state.essays.map((item) =>
              item.id === essayId
                ? { ...item, status: 'processando', competencies: result.competencies, competencyFeedbacks: result.competencyFeedbacks, totalScore: result.totalScore, feedback: 'ETAPA 3/4 • PONTUANDO AS CINCO COMPETÊNCIAS' }
                : item
            ),
          }));

          await wait(450);

          set((state) => ({
            essays: state.essays.map((item) =>
              item.id === essayId
                ? { ...item, status: 'processando', strengths: result.strengths, weaknesses: result.weaknesses, improvements: result.improvements, generalObservation: result.generalObservation, congratulations: result.congratulations, feedback: 'ETAPA 4/4 • CONSOLIDANDO O PARECER PEDAGÓGICO' }
                : item
            ),
          }));

          await wait(450);

          set((state) => ({
            essays: state.essays.map((item) =>
              item.id === essayId
                ? {
                    ...item,
                    status: 'corrigida',
                    correctedAt: new Date().toISOString(),
                    themeTitle: (item.themeTitle === 'Tema Livre' && result.detectedTheme)
                      ? result.detectedTheme
                      : item.themeTitle,
                    transcription: result.transcription,
                    transcriptionNotes: result.transcriptionNotes,
                    transcriptionConfidence: result.transcriptionConfidence,
                    writingMode: result.writingMode,
                    legibility: result.legibility,
                    themeAdequacy: result.themeAdequacy,
                    scoreReliability: result.scoreReliability,
                    totalScore: result.totalScore,
                    competencies: result.competencies,
                    competencyFeedbacks: result.competencyFeedbacks,
                    strengths: result.strengths,
                    weaknesses: result.weaknesses,
                    improvements: result.improvements,
                    generalObservation: result.generalObservation,
                    congratulations: result.congratulations,
                    feedback: result.feedback,
                    studentDirectMessage: result.studentDirectMessage,
                    improvementPotential: result.improvementPotential,
                    vocabularyAnalysis: result.vocabularyAnalysis,
                  }
                : item
            ),
          }));

          // Fire-and-forget: research + backend sync
          const student = get().students.find((s) => s.id === essay.studentId);
          saveEssayForResearch({
            themeTitle: essay.themeTitle,
            className: student?.className ?? '',
            state: student?.state,
            correction: result as unknown as Record<string, unknown>,
            imageUri: essay.imageUri,
          });

          const updatedEssay = get().essays.find((e) => e.id === essayId);
          if (updatedEssay && student) {
            const turma = get().turmas.find((t) => t.id === student.turmaId);
            pushEssayToBackend(
              updatedEssay,
              student.name,
              student.turmaId,
              turma?.name,
            ).catch(() => {});
          }

        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Falha ao corrigir a redação com OpenAI.';

          set((state) => ({
            essays: state.essays.map((item) =>
              item.id === essayId
                ? { ...item, status: 'pendente', feedback: `Erro na correção: ${message}` }
                : item
            ),
          }));

          if (isNetworkError(message)) {
            get().addToRetryQueue(essayId);
          }

          throw error;
        }
      },
    }),
    {
      name: 'enem-redacoes-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        users: state.users,
        currentTeacher: state.currentTeacher,
        currentStudent: state.currentStudent,
        turmas: state.turmas,
        students: state.students,
        themes: state.themes,
        essays: state.essays,
        retryQueue: state.retryQueue,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.essays = state.essays.map((essay) =>
            essay.status === 'processando'
              ? { ...essay, status: 'pendente', feedback: undefined }
              : essay
          );
          state.setHasHydrated(true);
        }
      },
    }
  )
);
