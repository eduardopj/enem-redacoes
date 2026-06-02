import { createTestStore } from './test-store';

const mockRegister = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockDeleteAccount = jest.fn();
const mockHashPassword = jest.fn();
const mockVerifyPassword = jest.fn();
const mockLookupTurma = jest.fn();
const mockRegisterPushToken = jest.fn();

jest.mock('@/services/auth/backend-auth', () => ({
  registerWithBackend: (...args: unknown[]) => mockRegister(...args),
  loginWithBackend: (...args: unknown[]) => mockLogin(...args),
  logoutFromBackend: (...args: unknown[]) => mockLogout(...args),
  deleteBackendAccount: (...args: unknown[]) => mockDeleteAccount(...args),
}));
jest.mock('@/services/sync/sync-essays', () => ({
  pushTeacherEvalToBackend: jest.fn().mockResolvedValue(undefined),
  pushEssayToBackend: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/sync/sync-turmas', () => ({
  lookupTurmaByCode: (...args: unknown[]) => mockLookupTurma(...args),
  pushTurmaToBackend: jest.fn(),
}));
jest.mock('@/services/research/save-essay', () => ({ saveEssayForResearch: jest.fn() }));
jest.mock('@/services/notifications/push-notifications', () => ({
  registerPushToken: (...args: unknown[]) => mockRegisterPushToken(...args),
}));
jest.mock('@/services/openai/correct-essay', () => ({ correctEssayWithOpenAI: jest.fn() }));
jest.mock('@/utils/crypto', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));
jest.mock('@/utils/id', () => ({ generateId: jest.fn(() => 'gen-id') }));
jest.mock('@/constants/openai', () => ({ OPENAI_CONFIG: { backendUrl: 'http://localhost:3333' } }));

beforeEach(() => {
  mockHashPassword.mockResolvedValue('hash-abc');
  mockVerifyPassword.mockResolvedValue(true);
  mockRegister.mockResolvedValue('backend-token');
  mockLogin.mockResolvedValue({ token: 'backend-token', teacherId: 'teacher-gen-id' });
  mockLogout.mockResolvedValue(undefined);
  mockDeleteAccount.mockResolvedValue(undefined);
  mockLookupTurma.mockResolvedValue(null);
  mockRegisterPushToken.mockResolvedValue(undefined);
});

afterEach(() => jest.clearAllMocks());

describe('auth.slice — signup', () => {
  it('cria usuário, define currentTeacher e registra no backend', async () => {
    const store = createTestStore();
    const result = await store.getState().signup('Ana Silva', 'ana@test.com', 'senha123');
    expect(result).toEqual({ success: true });
    expect(store.getState().users).toHaveLength(1);
    expect(store.getState().users[0].email).toBe('ana@test.com');
    expect(store.getState().currentTeacher?.name).toBe('Ana Silva');
    expect(store.getState().backendToken).toBe('backend-token');
    expect(mockRegisterPushToken).toHaveBeenCalledWith('backend-token');
  });

  it('normaliza email para minúsculo', async () => {
    const store = createTestStore();
    await store.getState().signup('Ana', 'ANA@TEST.COM', 'senha');
    expect(store.getState().users[0].email).toBe('ana@test.com');
  });

  it('rejeita email duplicado', async () => {
    const store = createTestStore();
    await store.getState().signup('Ana', 'ana@test.com', 'senha');
    const result = await store.getState().signup('Ana 2', 'ana@test.com', 'outra');
    expect(result).toMatchObject({ success: false });
    expect(store.getState().users).toHaveLength(1);
  });
});

describe('auth.slice — login', () => {
  it('backend success: define teacher e token', async () => {
    const store = createTestStore();
    // Pré-existente local
    store.setState({
      users: [{ id: 'teacher-1', name: 'Prof', email: 'prof@test.com', passwordHash: 'old-hash' }],
    });
    mockLogin.mockResolvedValue({ token: 'tok-xyz', teacherId: 'teacher-1' });
    const result = await store.getState().login('prof@test.com', 'senha');
    expect(result).toEqual({ success: true });
    expect(store.getState().currentTeacher?.id).toBe('teacher-1');
    expect(store.getState().backendToken).toBe('tok-xyz');
    expect(mockRegisterPushToken).toHaveBeenCalledWith('tok-xyz');
  });

  it('credenciais erradas retornam erro', async () => {
    const store = createTestStore();
    mockLogin.mockResolvedValue('wrong_credentials');
    const result = await store.getState().login('x@test.com', 'errada');
    expect(result).toMatchObject({ success: false, error: expect.stringContaining('incorretos') });
    expect(store.getState().currentTeacher).toBeNull();
  });

  it('fallback offline: autentica com hash local quando backend inacessível', async () => {
    const store = createTestStore();
    store.setState({
      users: [{ id: 'local-1', name: 'Off', email: 'off@test.com', passwordHash: 'stored-hash' }],
    });
    mockLogin.mockResolvedValue(null); // backend inacessível
    mockVerifyPassword.mockResolvedValue(true);
    const result = await store.getState().login('off@test.com', 'senha');
    expect(result).toEqual({ success: true });
    expect(store.getState().currentTeacher?.id).toBe('local-1');
    expect(store.getState().backendToken).toBeNull();
  });

  it('fallback offline com senha errada retorna erro', async () => {
    const store = createTestStore();
    store.setState({
      users: [{ id: 'local-1', name: 'Off', email: 'off@test.com', passwordHash: 'stored-hash' }],
    });
    mockLogin.mockResolvedValue(null);
    mockVerifyPassword.mockResolvedValue(false);
    const result = await store.getState().login('off@test.com', 'errada');
    expect(result).toMatchObject({ success: false });
  });
});

describe('auth.slice — logout', () => {
  it('limpa teacher e token, notifica backend', () => {
    const store = createTestStore();
    store.setState({
      currentTeacher: { id: 't1', name: 'Prof', email: 'p@t.com' },
      backendToken: 'tok',
    });
    store.getState().logout();
    expect(store.getState().currentTeacher).toBeNull();
    expect(store.getState().backendToken).toBeNull();
    expect(mockLogout).toHaveBeenCalledWith('tok');
  });
});

describe('auth.slice — loginAsStudent', () => {
  const setup = () => {
    const store = createTestStore();
    store.setState({
      users: [{ id: 'teacher-1', name: 'Prof', email: 'prof@test.com', passwordHash: 'h' }],
      students: [{ id: 'aluno-1', teacherId: 'teacher-1', name: 'Maria', className: '3A', accessCode: 'ABC123' }],
    });
    return store;
  };

  it('autentica aluno com código válido', () => {
    const store = setup();
    const result = store.getState().loginAsStudent('prof@test.com', 'ABC123');
    expect(result).toEqual({ success: true });
    expect(store.getState().currentStudent?.studentId).toBe('aluno-1');
  });

  it('falha com professor inexistente', () => {
    const store = setup();
    const result = store.getState().loginAsStudent('naoexiste@test.com', 'ABC123');
    expect(result).toMatchObject({ success: false });
  });

  it('falha com código inválido', () => {
    const store = setup();
    const result = store.getState().loginAsStudent('prof@test.com', 'ERRADO');
    expect(result).toMatchObject({ success: false });
  });
});

describe('auth.slice — joinTurmaByQR', () => {
  const payload = {
    type: 'enem-ia-join-v1' as const,
    teacherId: 'teacher-1',
    teacherName: 'Prof',
    teacherEmail: 'prof@test.com',
    turmaId: 'turma-1',
    turmaName: '3º Ano A',
    joinCode: 'XYZ789',
  };

  it('cria student e inicia sessão de aluno', () => {
    const store = createTestStore();
    const result = store.getState().joinTurmaByQR(payload, 'João Silva');
    expect(result).toEqual({ success: true });
    expect(store.getState().currentStudent?.studentName).toBe('João Silva');
    expect(store.getState().currentStudent?.turmaId).toBe('turma-1');
    expect(store.getState().students).toHaveLength(1);
  });

  it('falha com nome vazio', () => {
    const store = createTestStore();
    const result = store.getState().joinTurmaByQR(payload, '   ');
    expect(result).toMatchObject({ success: false });
  });

  it('salva birthDate quando fornecida', () => {
    const store = createTestStore();
    store.getState().joinTurmaByQR(payload, 'Maria', '2007-03-15');
    expect(store.getState().currentStudent?.birthDate).toBe('2007-03-15');
  });
});

describe('auth.slice — logoutStudent', () => {
  it('limpa currentStudent', () => {
    const store = createTestStore();
    store.setState({
      currentStudent: { studentId: 'a1', teacherId: 't1', studentName: 'Maria', className: '3A' },
    });
    store.getState().logoutStudent();
    expect(store.getState().currentStudent).toBeNull();
  });
});
