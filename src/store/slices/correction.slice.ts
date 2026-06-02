import { OPENAI_CONFIG } from '@/constants/openai';
import { registerWithBackend } from '@/services/auth/backend-auth';
import { executeCorrection } from '@/services/correction/correction-executor';
import { saveEssayForResearch } from '@/services/research/save-essay';
import { backendEssayRepository } from '@/repositories/BackendEssayRepository';
import { EssayInputMode, EssayStatus } from '@/types/enums';
import { StateCreator } from 'zustand';
import { isNetworkError, isRetriableError } from '../utils/essay-helpers';
import type { AppState, CorrectionSlice } from '../store.types';
import * as Sentry from '@sentry/react-native';

// Tentativa 1 falhou → aguarda 8s; tentativa 2 → 20s; depois desiste
const RETRY_DELAYS = [8_000, 20_000];
const MAX_ATTEMPTS = RETRY_DELAYS.length + 1;

export const createCorrectionSlice: StateCreator<AppState, [['zustand/persist', unknown]], [], CorrectionSlice> =
  (set, get) => ({
    retryQueue: [],

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
        if (!essay || essay.status === EssayStatus.Corrigida || essay.status === EssayStatus.Processando) {
          removeFromRetryQueue(essayId);
          continue;
        }
        try {
          removeFromRetryQueue(essayId);
          await evaluateEssayWithOpenAI(essayId);
        } catch {
          // re-added by evaluateEssayWithOpenAI if network error
        }
      }
    },

    evaluateEssayWithOpenAI: async (essayId) => {
      const essay = get().essays.find((item) => item.id === essayId);
      if (!essay) throw new Error('Redação não encontrada.');

      const isTextMode = essay.inputMode === EssayInputMode.Digitada && !!essay.essayText;
      if (!isTextMode && !essay.imageUri)
        throw new Error('Para corrigir com IA, envie uma imagem da redação.');

      // Mark as processing + increment attempt counter
      set((state) => ({
        essays: state.essays.map((item) =>
          item.id === essayId
            ? {
                ...item,
                status: EssayStatus.Processando,
                errorMessage: undefined,
                correctionAttempts: (item.correctionAttempts ?? 0) + 1,
                updatedAt: new Date().toISOString(),
                feedback: 'ETAPA 1/4 - lendo a imagem',
              }
            : item
        ),
      }));

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
        const result = await executeCorrection(
          {
            themeTitle: essay.themeTitle,
            imageUri: isTextMode ? undefined : essay.imageUri,
            imageMimeType: isTextMode ? undefined : essay.imageMimeType,
            essayText: isTextMode ? essay.essayText : undefined,
            token: backendToken ?? undefined,
          },
          ({ label, partial }) => {
            set((state) => ({
              essays: state.essays.map((item) =>
                item.id === essayId
                  ? { ...item, feedback: label, ...(partial ?? {}), updatedAt: new Date().toISOString() }
                  : item
              ),
            }));
          },
        );

        // Final consolidation — mark as corrigida
        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  status: EssayStatus.Corrigida,
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
                  confidenceLevel: result.confidenceLevel,
                  reviewRequired: result.reviewRequired,
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
          backendEssayRepository.push(updatedEssay, student.name, student.turmaId, turma?.name, get().backendToken ?? undefined)
            .then(() => {
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

        const isRateLimited =
          message.includes('429') ||
          message.toLowerCase().includes('rate') ||
          message.toLowerCase().includes('limite');

        const currentAttempts = get().essays.find((e) => e.id === essayId)?.correctionAttempts ?? 1;
        const canRetry = !isRateLimited && isRetriableError(error) && currentAttempts < MAX_ATTEMPTS;
        const retryDelay = RETRY_DELAYS[currentAttempts - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1];
        const retryInSec = Math.round(retryDelay / 1000);

        const userMessage = isRateLimited
          ? 'Limite de correções atingido. Aguarde alguns minutos e tente novamente.'
          : canRetry
            ? `Tentativa ${currentAttempts}/${MAX_ATTEMPTS} falhou. Tentando novamente em ${retryInSec}s...`
            : message;

        set((state) => ({
          essays: state.essays.map((item) =>
            item.id === essayId
              ? {
                  ...item,
                  status: canRetry ? EssayStatus.Processando : EssayStatus.Pendente,
                  errorMessage: canRetry ? undefined : userMessage,
                  updatedAt: new Date().toISOString(),
                  feedback: userMessage,
                }
              : item
          ),
        }));

        if (canRetry) {
          Sentry.metrics.increment('correction.retry', 1, { tags: { attempt: String(currentAttempts) } });
          setTimeout(() => {
            get().evaluateEssayWithOpenAI(essayId).catch(() => {});
          }, retryDelay);
        } else {
          if (isNetworkError(message)) get().addToRetryQueue(essayId);
          throw error;
        }
      }
    },
  });
