import type { BackendCorrectionJson } from '@/types/api';
import type { Atividade, Essay, EssayInputMode, EssayStatus, QRJoinPayload, Student, StudentSession, Teacher, ThemeItem, Turma } from '@/types/app';

// ─── Tipos internos do store ────────────────────────────────────────────────

export type RegisteredUser = {
  id: string;
  name: string;
  email: string;
  /** SHA-256 hash (pepper + email-salt + password). Never plaintext. */
  passwordHash: string;
};

export type AuthResult = { success: true } | { success: false; error: string };
export type AsyncAuthResult = Promise<AuthResult>;

export type CreateTurmaInput = {
  name: string;
  period?: 'manhã' | 'tarde' | 'noite' | 'integral';
  year?: string;
  subject?: string;
};

export type CreateStudentInput = {
  name: string;
  turmaId?: string;
  className: string;
  state?: string;
};

export type CreateThemeInput = {
  title: string;
  category: string;
};

export type CreateEssayInput = {
  studentId?: string;
  themeTitle: string;
  inputMode?: EssayInputMode;
  essayText?: string;
  imageName?: string;
  imageUri?: string;
  imageMimeType?: string;
  documentName?: string;
  documentUri?: string;
};

export type CreateAtividadeInput = {
  turmaId: string;
  themeTitle: string;
  description?: string;
  dueDate?: string;
};

// ─── Slice types ────────────────────────────────────────────────────────────

export type AuthSlice = {
  hasHydrated: boolean;
  users: RegisteredUser[];
  currentTeacher: Teacher | null;
  currentStudent: StudentSession | null;
  backendToken: string | null;

  setHasHydrated: (value: boolean) => void;
  ensureTeacherSession: () => void;
  setTeacherProfile: (name?: string, email?: string) => void;
  signup: (name: string, email: string, password: string) => AsyncAuthResult;
  login: (email: string, password: string) => AsyncAuthResult;
  logout: () => void;
  loginAsStudent: (teacherEmail: string, accessCode: string) => AuthResult;
  joinTurmaByQR: (payload: QRJoinPayload, studentName: string, birthDate?: string) => AuthResult;
  joinTurmaByCode: (code: string, studentName: string, birthDate?: string) => Promise<AuthResult>;
  logoutStudent: () => void;
};

export type TurmasSlice = {
  turmas: Turma[];
  addTurma: (input: CreateTurmaInput) => string | null;
  deleteTurma: (turmaId: string) => void;
  generateTurmaJoinCode: (turmaId: string) => string | null;
};

export type StudentsSlice = {
  students: Student[];
  addStudent: (input: CreateStudentInput) => void;
  deleteStudent: (studentId: string) => void;
  generateStudentCode: (studentId: string) => string | null;
};

export type ThemesSlice = {
  themes: ThemeItem[];
  addTheme: (input: CreateThemeInput) => string | null;
  deleteTheme: (themeId: string) => void;
};

export type EssaysSlice = {
  essays: Essay[];
  atividades: Atividade[];
  retryQueue: string[];
  /** Cursor opaco para a próxima página de redações do backend (null = sem mais páginas) */
  backendSyncCursor: string | null;
  backendSyncHasMore: boolean;

  addEssay: (input: CreateEssayInput) => string | null;
  deleteEssay: (essayId: string) => void;
  updateEssayStatus: (essayId: string, status: EssayStatus, totalScore?: number) => void;
  updateEssayTeacherEval: (essayId: string, teacherScore: number | undefined, teacherNote: string) => void;
  updateEssayCorrection: (essayId: string, data: BackendCorrectionJson) => void;
  evaluateEssayWithOpenAI: (essayId: string) => Promise<void>;
  addToRetryQueue: (essayId: string) => void;
  removeFromRetryQueue: (essayId: string) => void;
  processRetryQueue: () => Promise<void>;
  /** Busca a primeira página de redações do backend e reinicia o cursor */
  fetchStudentEssaysFromBackend: () => Promise<void>;
  /** Busca a próxima página usando o cursor armazenado */
  fetchMoreEssaysFromBackend: () => Promise<void>;
  markEssayTeacherViewed: (essayId: string) => void;
  addAtividade: (input: CreateAtividadeInput) => string | null;
  encerrarAtividade: (id: string) => void;
};

/** Full merged store type — used by all slices via get() */
export type AppState = AuthSlice & TurmasSlice & StudentsSlice & ThemesSlice & EssaysSlice;
