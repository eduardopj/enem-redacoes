import { EssayInputMode, EssayStatus } from '@/types/enums';
import { createTestStore } from './test-store';

const mockCorrectEssay = jest.fn();
const mockPushEssay = jest.fn();
const mockRegisterWithBackend = jest.fn();

jest.mock('@/services/auth/backend-auth', () => ({
  registerWithBackend: (...args: unknown[]) => mockRegisterWithBackend(...args),
  loginWithBackend: jest.fn().mockResolvedValue(null),
  logoutFromBackend: jest.fn(),
  deleteBackendAccount: jest.fn(),
}));
jest.mock('@/services/sync/sync-essays', () => ({
  pushTeacherEvalToBackend: jest.fn().mockResolvedValue(undefined),
  pushEssayToBackend: (...args: unknown[]) => mockPushEssay(...args),
}));
jest.mock('@/services/sync/sync-turmas', () => ({
  lookupTurmaByCode: jest.fn().mockResolvedValue(null),
  pushTurmaToBackend: jest.fn(),
}));
jest.mock('@/services/research/save-essay', () => ({ saveEssayForResearch: jest.fn() }));
jest.mock('@/services/notifications/push-notifications', () => ({ registerPushToken: jest.fn() }));
jest.mock('@/services/openai/correct-essay', () => ({
  correctEssayWithOpenAI: (...args: unknown[]) => mockCorrectEssay(...args),
}));
jest.mock('@/utils/crypto', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/utils/id', () => ({ generateId: jest.fn(() => 'tid') }));
jest.mock('@/constants/openai', () => ({ OPENAI_CONFIG: { backendUrl: 'http://localhost:3333' } }));

const MOCK_RESULT = {
  transcription: 'texto transcrito',
  transcriptionNotes: '',
  transcriptionConfidence: 'alta',
  writingMode: 'dissertativo-argumentativo',
  legibility: 'legivel',
  themeAdequacy: 'adequado',
  scoreReliability: { level: 'alta', reason: '' },
  competencies: { c1: 200, c2: 200, c3: 200, c4: 200, c5: 200 },
  competencyFeedbacks: {},
  totalScore: 1000,
  strengths: ['ponto forte'],
  weaknesses: [],
  improvements: [],
  generalObservation: 'boa redação',
  congratulations: 'Parabéns!',
  feedback: 'ótimo',
  studentDirectMessage: '',
  improvementPotential: '',
  vocabularyAnalysis: '',
  detectedTheme: null,
};

function storeWithEssay(overrides: Record<string, unknown> = {}) {
  const store = createTestStore();
  store.setState({
    currentTeacher: { id: 'teacher-1', name: 'Prof', email: 'p@test.com' },
    backendToken: 'tok-abc',
    essays: [{
      id: 'essay-1',
      teacherId: 'teacher-1',
      studentId: 'student-1',
      themeTitle: 'Tema ENEM',
      inputMode: EssayInputMode.Manuscrita,
      imageUri: 'file://img.jpg',
      status: EssayStatus.Pendente,
      correctionAttempts: 0,
      ...overrides,
    } as never],
  });
  return store;
}

beforeEach(() => {
  mockCorrectEssay.mockResolvedValue(MOCK_RESULT);
  mockPushEssay.mockResolvedValue(undefined);
  mockRegisterWithBackend.mockResolvedValue('new-token');
});

afterEach(() => jest.clearAllMocks());

// ─── Retry queue ──────────────────────────────────────────────────────────────

describe('correction.slice — retry queue', () => {
  it('addToRetryQueue adiciona ID', () => {
    const store = createTestStore();
    store.getState().addToRetryQueue('essay-1');
    expect(store.getState().retryQueue).toContain('essay-1');
  });

  it('addToRetryQueue não duplica IDs', () => {
    const store = createTestStore();
    store.getState().addToRetryQueue('essay-1');
    store.getState().addToRetryQueue('essay-1');
    expect(store.getState().retryQueue).toHaveLength(1);
  });

  it('removeFromRetryQueue remove o ID', () => {
    const store = createTestStore();
    store.setState({ retryQueue: ['essay-1', 'essay-2'] });
    store.getState().removeFromRetryQueue('essay-1');
    expect(store.getState().retryQueue).toEqual(['essay-2']);
  });
});

// ─── processRetryQueue ────────────────────────────────────────────────────────

describe('correction.slice — processRetryQueue', () => {
  it('é no-op quando fila vazia', async () => {
    const store = createTestStore();
    await store.getState().processRetryQueue();
    expect(mockCorrectEssay).not.toHaveBeenCalled();
  });

  it('ignora essays já corrigidas e as remove da fila', async () => {
    const store = createTestStore();
    store.setState({
      essays: [{ id: 'e1', status: EssayStatus.Corrigida } as never],
      retryQueue: ['e1'],
    });
    await store.getState().processRetryQueue();
    expect(mockCorrectEssay).not.toHaveBeenCalled();
    expect(store.getState().retryQueue).toHaveLength(0);
  });

  it('ignora essays processando e as remove da fila', async () => {
    const store = createTestStore();
    store.setState({
      essays: [{ id: 'e1', status: EssayStatus.Processando } as never],
      retryQueue: ['e1'],
    });
    await store.getState().processRetryQueue();
    expect(mockCorrectEssay).not.toHaveBeenCalled();
    expect(store.getState().retryQueue).toHaveLength(0);
  });
});

// ─── evaluateEssayWithOpenAI ──────────────────────────────────────────────────

describe('correction.slice — evaluateEssayWithOpenAI', () => {
  it('lança erro se essay não existe', async () => {
    const store = createTestStore();
    await expect(store.getState().evaluateEssayWithOpenAI('inexistente')).rejects.toThrow('Redação não encontrada.');
  });

  it('lança erro se essay não tem imageUri e não é modo texto', async () => {
    const store = storeWithEssay({ imageUri: undefined, essayText: undefined });
    await expect(store.getState().evaluateEssayWithOpenAI('essay-1')).rejects.toThrow('envie uma imagem');
  });

  it('corrige com sucesso e marca como corrigida', async () => {
    const store = storeWithEssay();
    await store.getState().evaluateEssayWithOpenAI('essay-1');
    const essay = store.getState().essays.find((e) => e.id === 'essay-1')!;
    expect(essay.status).toBe(EssayStatus.Corrigida);
    expect(essay.totalScore).toBe(1000);
    expect(essay.transcription).toBe('texto transcrito');
  }, 10_000);

  it('usa modo texto quando inputMode=digitada e essayText presente', async () => {
    const store = storeWithEssay({
      inputMode: EssayInputMode.Digitada,
      essayText: 'Minha redação digitada...',
      imageUri: undefined,
    });
    await store.getState().evaluateEssayWithOpenAI('essay-1');
    expect(mockCorrectEssay).toHaveBeenCalledWith(
      expect.objectContaining({ essayText: 'Minha redação digitada...' })
    );
  }, 10_000);

  it('auto-registra token se backendToken está ausente', async () => {
    const store = storeWithEssay();
    store.setState({ backendToken: null });
    await store.getState().evaluateEssayWithOpenAI('essay-1');
    expect(mockRegisterWithBackend).toHaveBeenCalled();
    expect(store.getState().backendToken).toBe('new-token');
  }, 10_000);

  it('incrementa correctionAttempts a cada chamada', async () => {
    const store = storeWithEssay();
    await store.getState().evaluateEssayWithOpenAI('essay-1');
    expect(store.getState().essays.find((e) => e.id === 'essay-1')!.correctionAttempts).toBe(1);
  }, 10_000);

  it('trata erro de rate limit: não agenda retry, define mensagem', async () => {
    mockCorrectEssay.mockRejectedValue(new Error('429 rate limit exceeded'));
    const store = storeWithEssay();
    await expect(store.getState().evaluateEssayWithOpenAI('essay-1')).rejects.toThrow();
    const essay = store.getState().essays.find((e) => e.id === 'essay-1')!;
    expect(essay.status).toBe(EssayStatus.Pendente);
    expect(essay.errorMessage).toMatch(/limite/i);
    expect(store.getState().retryQueue).not.toContain('essay-1');
  }, 10_000);

  it('trata erro de rede: adiciona à retryQueue quando esgotou tentativas', async () => {
    mockCorrectEssay.mockRejectedValue(new Error('Network request failed'));
    // correctionAttempts = 3 → já ultrapassou MAX_ATTEMPTS(3), canRetry = false
    const store = storeWithEssay({ correctionAttempts: 3 });
    await expect(store.getState().evaluateEssayWithOpenAI('essay-1')).rejects.toThrow();
    expect(store.getState().retryQueue).toContain('essay-1');
  }, 10_000);
});
