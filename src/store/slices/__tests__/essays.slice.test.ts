import { AtividadeStatus, ConfidenceLevel, EssayInputMode, EssaySourceType, EssayStatus } from '@/types/enums';
import { createTestStore } from './test-store';

jest.mock('@/services/auth/backend-auth', () => ({
  registerWithBackend: jest.fn().mockResolvedValue('token-123'),
  loginWithBackend: jest.fn().mockResolvedValue({ token: 'token-123', teacherId: 'teacher-1' }),
  logoutFromBackend: jest.fn().mockResolvedValue(undefined),
  deleteBackendAccount: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/sync/sync-essays', () => ({
  pushTeacherEvalToBackend: jest.fn().mockResolvedValue(undefined),
  pushEssayToBackend: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/sync/sync-turmas', () => ({
  lookupTurmaByCode: jest.fn().mockResolvedValue(null),
  pushTurmaToBackend: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/research/save-essay', () => ({ saveEssayForResearch: jest.fn() }));
jest.mock('@/services/notifications/push-notifications', () => ({ registerPushToken: jest.fn() }));
jest.mock('@/services/openai/correct-essay', () => ({ correctEssayWithOpenAI: jest.fn() }));
jest.mock('@/utils/crypto', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed'),
  verifyPassword: jest.fn().mockResolvedValue(true),
}));
jest.mock('@/utils/id', () => ({ generateId: jest.fn(() => 'test-id') }));
jest.mock('@/constants/openai', () => ({ OPENAI_CONFIG: { backendUrl: 'http://localhost:3333' } }));

const TEACHER = { id: 'teacher-1', name: 'Prof Ana', email: 'ana@test.com' };
const STUDENT_ID = 'student-1';

function storeWithTeacher() {
  const store = createTestStore();
  store.setState({ currentTeacher: TEACHER });
  return store;
}

describe('essays.slice — addEssay', () => {
  it('cria redação com inputMode padrão manuscrita', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema A', studentId: STUDENT_ID });
    expect(id).toBeTruthy();
    const essay = store.getState().essays.find((e) => e.id === id)!;
    expect(essay.inputMode).toBe(EssayInputMode.Manuscrita);
    expect(essay.status).toBe(EssayStatus.Pendente);
    expect(essay.confidenceLevel).toBe(ConfidenceLevel.Media);
    expect(essay.correctionAttempts).toBe(0);
  });

  it('usa sourceType Image quando imageUri está presente', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema B', studentId: STUDENT_ID, imageUri: 'file://img.jpg' });
    const essay = store.getState().essays.find((e) => e.id === id)!;
    expect(essay.sourceType).toBe(EssaySourceType.Image);
  });

  it('usa sourceType Document quando sem imageUri', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema C', studentId: STUDENT_ID });
    const essay = store.getState().essays.find((e) => e.id === id)!;
    expect(essay.sourceType).toBe(EssaySourceType.Document);
  });

  it('retorna null sem teacher nem student', () => {
    const store = createTestStore();
    const id = store.getState().addEssay({ themeTitle: 'Tema', studentId: STUDENT_ID });
    expect(id).toBeNull();
    expect(store.getState().essays).toHaveLength(0);
  });

  it('marca submittedByStudent quando sessão é de aluno', () => {
    const store = createTestStore();
    store.setState({
      currentStudent: {
        studentId: 'aluno-1', teacherId: 'teacher-1',
        studentName: 'João', className: '3A',
      },
    });
    const id = store.getState().addEssay({ themeTitle: 'Tema D' });
    const essay = store.getState().essays.find((e) => e.id === id)!;
    expect(essay.submittedByStudent).toBe(true);
  });
});

describe('essays.slice — deleteEssay', () => {
  it('remove a redação e limpa retryQueue', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema', studentId: STUDENT_ID })!;
    store.setState({ retryQueue: [id, 'outro-id'] });
    store.getState().deleteEssay(id);
    expect(store.getState().essays.find((e) => e.id === id)).toBeUndefined();
    expect(store.getState().retryQueue).toEqual(['outro-id']);
  });
});

describe('essays.slice — updateEssayStatus', () => {
  it('atualiza status e totalScore', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema', studentId: STUDENT_ID })!;
    store.getState().updateEssayStatus(id, EssayStatus.Corrigida, 840);
    const essay = store.getState().essays.find((e) => e.id === id)!;
    expect(essay.status).toBe(EssayStatus.Corrigida);
    expect(essay.totalScore).toBe(840);
  });
});

describe('essays.slice — markEssayTeacherViewed', () => {
  it('define teacherReviewedAt na primeira chamada', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema', studentId: STUDENT_ID })!;
    store.getState().markEssayTeacherViewed(id);
    expect(store.getState().essays.find((e) => e.id === id)!.teacherReviewedAt).toBeTruthy();
  });

  it('não sobrescreve teacherReviewedAt existente', () => {
    const store = storeWithTeacher();
    const id = store.getState().addEssay({ themeTitle: 'Tema', studentId: STUDENT_ID })!;
    const firstTime = '2026-01-01T00:00:00.000Z';
    store.setState((s) => ({
      essays: s.essays.map((e) => e.id === id ? { ...e, teacherReviewedAt: firstTime } : e),
    }));
    store.getState().markEssayTeacherViewed(id);
    expect(store.getState().essays.find((e) => e.id === id)!.teacherReviewedAt).toBe(firstTime);
  });
});

describe('essays.slice — recoverStuckEssays', () => {
  it('reseta essays processando para pendente', () => {
    const store = createTestStore();
    store.setState({
      essays: [
        { id: 'e1', status: EssayStatus.Processando } as never,
        { id: 'e2', status: EssayStatus.Corrigida } as never,
      ],
    });
    store.getState().recoverStuckEssays();
    const { essays } = store.getState();
    expect(essays.find((e) => e.id === 'e1')!.status).toBe(EssayStatus.Pendente);
    expect(essays.find((e) => e.id === 'e2')!.status).toBe(EssayStatus.Corrigida);
  });

  it('é no-op quando não há essays processando', () => {
    const store = createTestStore();
    const initial = [{ id: 'e1', status: EssayStatus.Corrigida } as never];
    store.setState({ essays: initial });
    store.getState().recoverStuckEssays();
    expect(store.getState().essays).toBe(initial); // mesma referência = sem re-render
  });
});

describe('essays.slice — addAtividade / encerrarAtividade', () => {
  it('cria atividade com status ativa', () => {
    const store = storeWithTeacher();
    const id = store.getState().addAtividade({ turmaId: 'turma-1', themeTitle: 'Redação ENEM' });
    expect(id).toBeTruthy();
    const at = store.getState().atividades.find((a) => a.id === id)!;
    expect(at.status).toBe(AtividadeStatus.Ativa);
    expect(at.teacherId).toBe(TEACHER.id);
  });

  it('retorna null sem teacher', () => {
    const store = createTestStore();
    const id = store.getState().addAtividade({ turmaId: 'turma-1', themeTitle: 'Tema' });
    expect(id).toBeNull();
  });

  it('encerra atividade corretamente', () => {
    const store = storeWithTeacher();
    const id = store.getState().addAtividade({ turmaId: 'turma-1', themeTitle: 'Tema' })!;
    store.getState().encerrarAtividade(id);
    expect(store.getState().atividades.find((a) => a.id === id)!.status).toBe(AtividadeStatus.Encerrada);
  });
});
