import { correctEssayWithOpenAI } from '@/services/openai/correct-essay';
import { Essay, EssayStatus, Student, Teacher, ThemeItem } from '@/types/app';
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

type CreateStudentInput = {
  name: string;
  className: string;
};

type CreateThemeInput = {
  title: string;
  category: string;
};

type CreateEssayInput = {
  studentId: string;
  themeTitle: string;
  imageName?: string;
  imageUri?: string;
  documentName?: string;
  documentUri?: string;
};

type AppState = {
  hasHydrated: boolean;
  users: RegisteredUser[];
  currentTeacher: Teacher | null;
  students: Student[];
  themes: ThemeItem[];
  essays: Essay[];
  retryQueue: string[];

  // Auth
  signup: (name: string, email: string, password: string) => AuthResult;
  login: (email: string, password: string) => AuthResult;
  logout: () => void;

  // Dados
  addStudent: (input: CreateStudentInput) => void;
  addTheme: (input: CreateThemeInput) => string | null;
  addEssay: (input: CreateEssayInput) => string | null;
  deleteStudent: (studentId: string) => void;
  deleteTheme: (themeId: string) => void;
  deleteEssay: (essayId: string) => void;
  updateEssayStatus: (essayId: string, status: EssayStatus, totalScore?: number) => void;
  evaluateEssayWithOpenAI: (essayId: string) => Promise<void>;
  addToRetryQueue: (essayId: string) => void;
  removeFromRetryQueue: (essayId: string) => void;
  processRetryQueue: () => Promise<void>;
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
      students: [],
      themes: [],
      essays: [],
      retryQueue: [],

      setHasHydrated: (value) => set({ hasHydrated: value }),

      // ── Auth ────────────────────────────────────────────────────────────

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

      // ── Dados ───────────────────────────────────────────────────────────

      addStudent: (input) => {
        const teacher = get().currentTeacher;
        if (!teacher) return;

        set((state) => ({
          students: [
            {
              id: String(Date.now()),
              teacherId: teacher.id,
              name: input.name,
              className: input.className,
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
        if (!teacher) return null;

        const essayId = String(Date.now());

        set((state) => ({
          essays: [
            {
              id: essayId,
              teacherId: teacher.id,
              studentId: input.studentId,
              themeTitle: input.themeTitle,
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
        if (!essay.imageUri) throw new Error('Para a correção com IA, envie uma foto ou imagem da redação.');

        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? { ...item, status: 'processando', feedback: 'ETAPA 1/4 • LENDO A IMAGEM E IDENTIFICANDO O TIPO DE ESCRITA' }
              : item
          ),
        }));

        await wait(450);

        try {
          const result = await correctEssayWithOpenAI({
            themeTitle: essay.themeTitle,
            imageUri: essay.imageUri,
          });

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
        students: state.students,
        themes: state.themes,
        essays: state.essays,
        retryQueue: state.retryQueue,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Se o app fechou enquanto uma redação estava processando,
          // reset para 'pendente' para que o professor possa tentar novamente.
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
