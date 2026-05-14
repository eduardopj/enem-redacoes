import { OPENAI_CONFIG } from '@/constants/openai';
import { registerWithBackend } from '@/services/auth/backend-auth';
import { correctEssayWithOpenAI } from '@/services/openai/correct-essay';
import { saveEssayForResearch } from '@/services/research/save-essay';
import { fetchEssaysByTeacher, pushEssayToBackend, pushTeacherEvalToBackend } from '@/services/sync/sync-essays';
import type { BackendCorrectionJson, BackendEssay } from '@/types/api';
import { Atividade, Essay, EssayStatus, Student } from '@/types/app';
import { generateId } from '@/utils/id';
import { StateCreator } from 'zustand';
import type { AppState, EssaysSlice } from '../store.types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isNetworkError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('network request failed') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('connect') ||
    lower.includes('conectar') ||
    lower.includes('servidor') ||
    lower.includes('timeout') ||
    lower.includes('econnrefused')
  );
}

function mapCorrectionJsonToEssayFields(c: BackendCorrectionJson): Partial<Essay> {
  return {
    transcription: c.transcription,
    transcriptionNotes: c.transcriptionNotes,
    transcriptionConfidence: c.transcriptionConfidence,
    writingMode: c.writingMode,
    legibility: c.legibility,
    themeAdequacy: c.themeAdequacy,
    scoreReliability: c.scoreReliability,
    competencies: c.competencies,
    competencyFeedbacks: c.competencyFeedbacks,
    strengths: c.strengths ?? [],
    weaknesses: c.weaknesses ?? [],
    improvements: c.improvements ?? [],
    generalObservation: c.generalObservation,
    congratulations: c.congratulations,
    feedback: c.feedback,
    studentDirectMessage: c.studentDirectMessage,
    improvementPotential: c.improvementPotential,
    vocabularyAnalysis: c.vocabularyAnalysis,
  };
}

/**
 * Pure helper: merges a page of remote essays into local state arrays.
 * Returns null if nothing changed (skips unnecessary re-renders).
 */
function mergeRemoteEssays(
  remote: BackendEssay[],
  existingEssays: Essay[],
  existingStudents: Student[],
): { essays: Essay[]; students: Student[] } | null {
  const existingIds = new Set(existingEssays.map((e) => e.id));
  const existingStudentIds = new Set(existingStudents.map((s) => s.id));
  const toAdd: Essay[] = [];
  const studentsToAdd: Student[] = [];

  for (const r of remote) {
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
      const c: BackendCorrectionJson = r.correctionJson ?? {};
      toAdd.push({
        id: r.id,
        teacherId: r.teacherId,
        studentId: r.studentId,
        themeTitle: r.themeTitle ?? '',
        inputMode: (r.inputMode as Essay['inputMode']) ?? 'manuscrita',
        essayText: r.essayText ?? undefined,
        status: (r.status as EssayStatus) ?? 'corrigida',
        totalScore: r.totalScore ?? undefined,
        teacherScore: r.teacherScore ?? undefined,
        teacherNote: r.teacherNote ?? undefined,
        ...mapCorrectionJsonToEssayFields(c),
        createdAt: r.createdAt ?? undefined,
        correctedAt: r.correctedAt ?? undefined,
        updatedAt: r.updatedAt ?? undefined,
      });
      existingIds.add(r.id);
    }
  }

  if (!toAdd.length && !studentsToAdd.length) return null;
  return {
    essays: toAdd.length ? [...toAdd, ...existingEssays] : existingEssays,
    students: studentsToAdd.length ? [...studentsToAdd, ...existingStudents] : existingStudents,
  };
}

export const createEssaysSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], EssaysSlice> =
  (set, get) => ({
    essays: [],
    atividades: [],
    retryQueue: [],
    backendSyncCursor: null,
    backendSyncHasMore: false,

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
      if (!isTextMode && !essay.imageUri)
        throw new Error('Para corrigir com IA, envie uma imagem da redação.');

      const updateFeedback = (feedback: string) =>
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? { ...item, status: 'processando', feedback, updatedAt: new Date().toISOString() }
              : item
          ),
        }));

      set((state) => ({
        essays: state.essays.map((item) =>
          item.id === essayId
            ? {
                ...item,
                status: 'processando',
                errorMessage: undefined,
                correctionAttempts: (item.correctionAttempts ?? 0) + 1,
                updatedAt: new Date().toISOString(),
                feedback: 'ETAPA 1/4 - lendo a imagem',
              }
            : item
        ),
      }));

      await wait(450);

      // Auto-register if no token (e.g. default teacher session, or token lost)
      let backendToken = get().backendToken;
      if (!backendToken) {
        const teacher = get().currentTeacher;
        if (teacher) {
          const newToken = await registerWithBackend(teacher.id, teacher.email ?? '', teacher.name ?? '');
          if (newToken) {
            set({ backendToken: newToken });
            backendToken = newToken;
          }
        }
      }

      try {
        const result = await correctEssayWithOpenAI(
          isTextMode
            ? { themeTitle: essay.themeTitle, essayText: essay.essayText, token: backendToken ?? undefined }
            : { themeTitle: essay.themeTitle, imageUri: essay.imageUri, imageMimeType: essay.imageMimeType, token: backendToken ?? undefined }
        );

        updateFeedback('ETAPA 2/4 - transcrevendo texto');
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  transcription: result.transcription,
                  transcriptionNotes: result.transcriptionNotes,
                  transcriptionConfidence: result.transcriptionConfidence,
                  writingMode: result.writingMode,
                  legibility: result.legibility,
                  themeAdequacy: result.themeAdequacy,
                  scoreReliability: result.scoreReliability,
                  confidenceLevel: result.scoreReliability.level,
                  reviewRequired:
                    result.scoreReliability.level === 'baixa' ||
                    result.transcriptionConfidence === 'baixa',
                }
              : item
          ),
        }));
        await wait(450);

        updateFeedback('ETAPA 3/4 - analisando competências');
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? { ...item, competencies: result.competencies, competencyFeedbacks: result.competencyFeedbacks, totalScore: result.totalScore }
              : item
          ),
        }));
        await wait(450);

        updateFeedback('ETAPA 4/4 - preparando devolutiva');
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  strengths: result.strengths,
                  weaknesses: result.weaknesses,
                  improvements: result.improvements,
                  generalObservation: result.generalObservation,
                  congratulations: result.congratulations,
                }
              : item
          ),
        }));
        await wait(450);

        // Final update — mark as corrigida
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  status: 'corrigida',
                  correctedAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  themeTitle:
                    item.themeTitle === 'Tema Livre' && result.detectedTheme
                      ? result.detectedTheme
                      : item.themeTitle,
                  errorMessage: undefined,
                  totalScore: result.totalScore,
                  competencies: result.competencies,
                  competencyFeedbacks: result.competencyFeedbacks,
                  strengths: result.strengths,
                  weaknesses: result.weaknesses,
                  improvements: result.improvements,
                  transcription: result.transcription,
                  transcriptionNotes: result.transcriptionNotes,
                  transcriptionConfidence: result.transcriptionConfidence,
                  writingMode: result.writingMode,
                  legibility: result.legibility,
                  themeAdequacy: result.themeAdequacy,
                  scoreReliability: result.scoreReliability,
                  confidenceLevel: result.scoreReliability.level,
                  reviewRequired:
                    result.scoreReliability.level === 'baixa' ||
                    result.transcriptionConfidence === 'baixa',
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
          pushEssayToBackend(updatedEssay, student.name, student.turmaId, turma?.name, get().backendToken ?? undefined)
            .then(() => {
              // Record the backend image URL so resultado can display it after the local file is gone
              set((state) => ({
                essays: state.essays.map((e) =>
                  e.id === essayId && !e.imageRemoteUrl
                    ? { ...e, imageRemoteUrl: `${OPENAI_CONFIG.backendUrl}/v1/sync/images/${essayId}` }
                    : e
                ),
              }));
            })
            .catch(() => {});
        }
      } catch (error) {
        console.error('[correctEssay] falha na correção:', error);
        const message =
          error instanceof Error ? error.message : 'Falha ao corrigir a redação com IA.';

        // Detect rate limiting (429) for better UX feedback
        const isRateLimited =
          message.includes('429') ||
          message.toLowerCase().includes('rate') ||
          message.toLowerCase().includes('limite');

        const userMessage = isRateLimited
          ? 'Limite de correções atingido. Aguarde alguns minutos e tente novamente.'
          : message;

        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  status: 'pendente',
                  errorMessage: userMessage,
                  updatedAt: new Date().toISOString(),
                  feedback: `Erro: ${userMessage}`,
                }
              : item
          ),
        }));

        if (isNetworkError(message)) {
          get().addToRetryQueue(essayId);
        }

        throw error;
      }
    },

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
